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
  /** Theme type declared by the package (`"ui"` | `"syntax"` | `"preview"`). */
  theme?: string
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
 * computed style of `<body>` resolves every themed variable. Inkdrop's base
 * stylesheets are passed in as already-resolved absolute URLs (they live in
 * this package's own dependencies, not the theme's), while the theme's own
 * `styles/` links stay relative and resolve against the `<base href>` — i.e.
 * the theme project root.
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
      <h1>Hello</h1>
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

/** The theme types `generate-palette` can extract variables for. */
export const THEME_TYPES = ['ui', 'syntax', 'preview'] as const

export type ThemeType = (typeof THEME_TYPES)[number]

/**
 * Manifest categories contributed by each theme type. A `ui` theme covers the
 * app chrome (`ui`) plus the note `status`, `tags`, and `task-progress`
 * palettes; a `syntax` theme covers the editor `syntax` tokens; a `preview`
 * theme covers the rendered `markdown` preview.
 */
const THEME_TYPE_CATEGORIES: Record<ThemeType, string[]> = {
  ui: ['ui', 'status', 'tags', 'task-progress'],
  syntax: ['syntax'],
  preview: ['markdown']
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

/** Whether `value` is one of the known theme types. */
function isThemeType(value: string): value is ThemeType {
  return (THEME_TYPES as readonly string[]).includes(value)
}

/**
 * Resolves which theme type's variables to extract. A forced type (the
 * `--type` flag) wins; otherwise the theme's declared `theme` field is used.
 *
 * @param forced - The theme type forced on the CLI, if any.
 * @param theme - The theme package's metadata.
 * @returns The resolved theme type.
 * @throws If no type is forced and the package's `theme` field is missing or
 *   not one of the known theme types.
 */
export function resolveThemeType(forced: ThemeType | undefined, theme: ThemePackage): ThemeType {
  if (forced) return forced
  if (theme.theme === undefined) {
    throw new Error(
      `The theme package has no "theme" field; pass --type to specify one of: ${THEME_TYPES.join(', ')}.`
    )
  }
  if (!isThemeType(theme.theme)) {
    throw new Error(
      `The theme package's "theme" field is "${theme.theme}", not a known theme type; pass --type to specify one of: ${THEME_TYPES.join(', ')}.`
    )
  }
  return theme.theme
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
