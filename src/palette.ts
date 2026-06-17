/**
 * Pure helpers for palette extraction, kept free of puppeteer / fs / process
 * so they can be unit-tested directly. The orchestration that drives a headless
 * browser lives in `generate-palette.ts`.
 */

/** Theme metadata read from a theme package's `package.json`. */
export interface ThemePackage {
  name?: string
  styleSheets?: string[]
}

export type ThemeAppearance = 'light' | 'dark'

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
