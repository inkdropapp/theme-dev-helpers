/**
 * Pure helpers for palette extraction, kept free of puppeteer / fs / process
 * so they can be unit-tested directly. The orchestration that drives a headless
 * browser lives in `generate-palette.ts`.
 */

export type ThemeAppearance = 'light' | 'dark'

/** Theme metadata read from a theme package's `package.json`. */
export interface ThemePackage {
  name?: string
  /** Explicit appearance declared by the theme (`"light"` | `"dark"`). */
  themeAppearance?: ThemeAppearance
  styleSheets?: string[]
  /**
   * Marks the package as a unified theme. A theme styles the UI, the editor,
   * and the Markdown preview at once, so this is a boolean flag rather than the
   * old per-surface `"ui"` | `"syntax"` | `"preview"` string.
   */
  theme?: boolean
}

/**
 * Derives a theme's appearance the way Inkdrop's desktop app does (see
 * `ThemePackage#getAppearance`): dark when the package name contains "dark" or
 * `themeAppearance` is "dark", otherwise light. Used to pick which branch of a
 * `light-dark()` value to keep.
 *
 * @param theme - The theme package's metadata.
 * @returns The resolved appearance.
 */
export function deriveAppearance(theme: ThemePackage): ThemeAppearance {
  return theme.name?.includes('dark') || theme.themeAppearance === 'dark' ? 'dark' : 'light'
}

/**
 * Builds the standalone HTML document that is loaded into a headless browser to
 * compute a theme's CSS custom properties.
 *
 * It pulls in Inkdrop's base CSS plus the theme's own stylesheets so that the
 * computed style of the probed element (see {@link THEME_TYPE_PROBE_SELECTORS})
 * resolves every themed variable. Inkdrop's base stylesheets are passed in as
 * already-resolved absolute URLs (they live in this package's own dependencies,
 * not the theme's), while the theme's own `styles/` links stay relative and
 * resolve against the `<base href>` — i.e. the theme project root.
 *
 * The body holds a `.cm-editor` and a `.mde-preview` element so that syntax and
 * preview extraction can read their scoped tokens off the matching element:
 * Inkdrop scopes the editor's design tokens under `.cm-editor` and the rendered
 * markdown's under `.mde-preview`, and a theme may override them there (e.g.
 * Solarized re-maps the `--hsl-*` ramp under `.cm-editor, .mde-preview
 * .codeblock`), so those variables resolve to the theme's values inside the
 * matching element. See {@link THEME_TYPE_PROBE_SELECTORS}.
 *
 * @param theme - The theme package's metadata (`name`, `styleSheets`).
 * @param baseUrl - File URL used as the document `<base href>`; the theme's own
 *   `styles/` links resolve against it.
 * @param baseStyleSheetURLs - Absolute URLs of Inkdrop's base stylesheets,
 *   resolved from this package's dependency graph by the caller.
 * @param appearance - Optional forced appearance; adds a `<appearance>-mode`
 *   body class when provided.
 * @returns The full HTML document as a string.
 */
export function buildPreviewHTML(
  theme: ThemePackage,
  baseUrl: string,
  baseStyleSheetURLs: string[],
  appearance?: ThemeAppearance
): string {
  const baseCSSLinks = baseStyleSheetURLs
    .map((href) => `<link rel="stylesheet" href="${href}" />`)
    .join('\n')

  const themeCSSLinks = (theme.styleSheets ?? [])
    .map((filePath) => `<link rel="stylesheet" href="styles/${filePath}" />`)
    .join('\n')

  const bodyClass = [theme.name, appearance && `${appearance}-mode`].filter(Boolean).join(' ')

  return `<!DOCTYPE html>
  <html>
    <head>
      <base href="${baseUrl}" />
      ${baseCSSLinks}
      ${themeCSSLinks}
    </head>
    <body class="${bodyClass}">
      <div class="cm-editor"></div>
      <div class="mde-preview"></div>
    </body>
  </html>
  `
}

/**
 * The categorised CSS variable manifest shipped by `@inkdropapp/css` as
 * `variables.json`: an object keyed by category (`ui`, `status`, `tags`,
 * `task-progress`, `markdown`, `syntax`), each mapping to its variable names.
 */
export type ThemeVariableManifest = Record<string, string[]>

/**
 * The surfaces a unified theme styles. `generate-palette` extracts every
 * surface's variables in a single run and merges them into one palette.
 */
export const THEME_TYPES = ['ui', 'syntax', 'preview'] as const

export type ThemeType = (typeof THEME_TYPES)[number]

/**
 * Manifest categories contributed by each theme type. A `ui` theme covers the
 * app chrome (`ui`) plus the note `status`, `tags`, and `task-progress`
 * palettes; a `syntax` theme covers the editor `syntax` tokens; a `preview`
 * theme covers the rendered `markdown` preview plus its `mermaid` diagram
 * colours.
 */
const THEME_TYPE_CATEGORIES: Record<ThemeType, string[]> = {
  ui: ['ui', 'status', 'tags', 'task-progress'],
  syntax: ['syntax'],
  preview: ['markdown', 'mermaid']
}

/**
 * Selects the CSS variable names a given theme type contributes, in
 * declaration order, from the categorised manifest shipped by `@inkdropapp/css`
 * 0.7.0+ (which keys `variables.json` by category). Categories missing from the
 * manifest are skipped so it degrades gracefully across `@inkdropapp/css`
 * versions.
 *
 * @param manifest - The categorised manifest (category -> variable names).
 * @param type - The theme type whose variables to extract.
 * @returns The variable names belonging to the type's categories.
 */
export function selectVariableNames(manifest: ThemeVariableManifest, type: ThemeType): string[] {
  return THEME_TYPE_CATEGORIES[type].flatMap((category) => manifest[category] ?? [])
}

/**
 * The DOM selector whose computed style carries each theme type's CSS
 * variables. The `ui` tokens live on the document root, so `<body>` resolves
 * them. The editor (`syntax`) and rendered-markdown (`preview`) tokens are
 * scoped by Inkdrop under `.cm-editor` and `.mde-preview` respectively, and a
 * theme can override them there — so they resolve to the theme's values only
 * inside the matching element.
 */
const THEME_TYPE_PROBE_SELECTORS: Record<ThemeType, string> = {
  ui: 'body',
  syntax: '.cm-editor',
  preview: '.mde-preview'
}

/** A surface's variable names paired with the element to read them off. */
export interface ProbeGroup {
  /** The surface (theme type) this group covers. */
  type: ThemeType
  /** The selector whose computed style carries this group's variables. */
  probeSelector: string
  /** The group's CSS variable names, in declaration order. */
  variableNames: string[]
}

/**
 * Builds the extraction plan for a unified theme: each surface's variable names
 * paired with the element they must be read off. A unified theme styles the UI,
 * the editor, and the preview at once, and each surface's tokens are scoped
 * under a different element (see {@link THEME_TYPE_PROBE_SELECTORS}), so every group
 * is extracted from its own probe element and the results are merged into a
 * single palette.
 *
 * @param manifest - The categorised manifest shipped by `@inkdropapp/css`.
 * @returns One {@link ProbeGroup} per surface, in `ui`, `syntax`, `preview`
 *   order — the merge order of the final palette.
 */
export function buildProbeGroups(manifest: ThemeVariableManifest): ProbeGroup[] {
  return THEME_TYPES.map((type) => ({
    type,
    probeSelector: THEME_TYPE_PROBE_SELECTORS[type],
    variableNames: selectVariableNames(manifest, type)
  }))
}

/**
 * Projects the raw computed CSS variables onto the theme's declared variable
 * names, preserving their declaration order. Names absent from `computed` map
 * to `undefined` (and are therefore dropped by `JSON.stringify`).
 *
 * @param variableNames - The theme's declared CSS variable names.
 * @param computed - All `--*` custom properties read from the rendered body.
 * @returns A record of `variableName -> computed value`.
 */
export function mapThemeVariables(
  variableNames: string[],
  computed: Record<string, string>
): Record<string, string> {
  return variableNames.reduce(
    (acc, name) => {
      acc[name] = computed[name]
      return acc
    },
    {} as Record<string, string>
  )
}

/** Index of the `)` matching the `(` at `openIndex`, or -1 when unbalanced. */
function matchingParen(value: string, openIndex: number): number {
  let depth = 0
  for (let i = openIndex; i < value.length; i++) {
    if (value[i] === '(') depth++
    else if (value[i] === ')' && --depth === 0) return i
  }
  return -1
}

/**
 * Splits `value` at its first top-level (paren-depth-zero) comma into
 * `[before, after]`. Commas inside nested function calls (e.g. `hsl(…)`) are
 * ignored. Returns `[value, '']` when there is no top-level comma.
 */
function splitTopLevelComma(value: string): [string, string] {
  let depth = 0
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (ch === ',' && depth === 0) return [value.slice(0, i), value.slice(i + 1)]
  }
  return [value, '']
}

/**
 * Replaces every `light-dark(<light>, <dark>)` in a CSS value with the branch
 * matching `appearance`, recursively and in place.
 *
 * Inkdrop's mobile app (React Native) can't evaluate the CSS `light-dark()`
 * function, so the generated palette must carry already-resolved raw values.
 * The browser leaves `light-dark()` unresolved inside custom properties, so we
 * pick the branch ourselves — mirroring how the desktop app selects light/dark
 * via the body's `color-scheme`. Nested calls (the kept branch may itself
 * contain `light-dark()`) and calls embedded in larger values (shadows,
 * gradients, borders) are handled.
 *
 * @param value - A CSS value that may contain one or more `light-dark()` calls.
 * @param appearance - Which branch to keep (`light` → first, `dark` → second).
 * @returns The value with all `light-dark()` calls resolved.
 */
export function resolveLightDark(value: string, appearance: ThemeAppearance): string {
  const marker = 'light-dark('
  const start = value.indexOf(marker)
  if (start === -1) return value

  const open = start + marker.length - 1
  const close = matchingParen(value, open)
  if (close === -1) return value // unbalanced — leave the value untouched

  const [light, dark] = splitTopLevelComma(value.slice(open + 1, close))
  const chosen = (appearance === 'dark' ? dark : light).trim()

  return (
    value.slice(0, start) +
    resolveLightDark(chosen, appearance) +
    resolveLightDark(value.slice(close + 1), appearance)
  )
}

/**
 * Finds every outermost `color-mix(…)` call in a CSS value, in source order.
 * Nested calls are part of their enclosing call and are not listed separately,
 * since the browser resolves the whole expression at once. Unbalanced calls are
 * skipped.
 *
 * @param value - A CSS value that may contain `color-mix()` calls.
 * @returns The full text of each outermost `color-mix(…)` call.
 */
export function findColorMixCalls(value: string): string[] {
  const marker = 'color-mix('
  const calls: string[] = []
  let from = 0
  for (let start = value.indexOf(marker); start !== -1; start = value.indexOf(marker, from)) {
    const close = matchingParen(value, start + marker.length - 1)
    if (close === -1) break
    calls.push(value.slice(start, close + 1))
    from = close + 1
  }
  return calls
}

/**
 * Replaces every outermost `color-mix(…)` call in a CSS value with its resolved
 * colour. Calls missing from `resolved` (e.g. ones the browser rejected) are left
 * as they are.
 *
 * Like `light-dark()`, the browser leaves `color-mix()` unevaluated inside
 * custom properties, and Inkdrop's mobile app can't evaluate it either, so the
 * palette must carry the mixed result. The mixing itself happens in the
 * headless browser (see {@link findColorMixCalls}); this only splices the
 * results back in, so mixes embedded in larger values (shadows, borders) work.
 *
 * @param value - A CSS value that may contain `color-mix()` calls.
 * @param resolved - Map of `color-mix(…)` call text to its resolved colour.
 * @returns The value with each resolvable call replaced.
 */
export function replaceColorMix(value: string, resolved: Record<string, string>): string {
  return findColorMixCalls(value).reduce(
    (acc, call) => (resolved[call] === undefined ? acc : acc.replace(call, resolved[call])),
    value
  )
}

/** Clamps `n` into `[0, 1]`. */
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/**
 * Converts a browser-computed sRGB colour — `color(srgb r g b)` or
 * `color(srgb r g b / a)`, as Chrome serialises `rgb(from <color> r g b / alpha)`
 * — into `#rrggbb`, or `rgba(r, g, b, a)` when translucent. Channels outside
 * the sRGB gamut (e.g. from an `oklch` mix) are clamped. `none` counts as 0.
 *
 * @param computed - The computed colour string.
 * @returns The formatted colour, or `undefined` if `computed` isn't an sRGB
 *   `color()` value.
 */
export function formatSRGBColor(computed: string): string | undefined {
  const match = /^color\(srgb\s+([^)]*)\)$/.exec(computed.trim())
  if (!match) return undefined
  const [channels, alphaPart] = match[1].split('/')
  const parse = (token: string) => (token === 'none' ? 0 : Number(token))
  const rgb = channels.trim().split(/\s+/).map(parse)
  const alpha = alphaPart === undefined ? 1 : parse(alphaPart.trim())
  if (rgb.length !== 3 || [...rgb, alpha].some(Number.isNaN)) return undefined

  const [r, g, b] = rgb.map((c) => Math.round(clamp01(c) * 255))
  const a = Math.round(clamp01(alpha) * 1000) / 1000
  if (a === 1) {
    return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
