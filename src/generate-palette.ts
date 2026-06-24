import puppeteer from 'puppeteer'
import { writeFile } from 'fs/promises'
import path from 'path'
import { pathToFileURL } from 'url'
import { Command, Option } from 'commander'
import packageJson from '../package.json' with { type: 'json' }
import {
  buildPreviewHTML,
  deriveAppearance,
  mapThemeVariables,
  resolveLightDark,
  resolveThemeType,
  selectVariableNames,
  THEME_TYPES,
  type ThemeType,
  type ThemeVariableManifest
} from './palette.ts'

const program = new Command()

program
  .name('generate-palette')
  .description('CLI tool for extracting CSS variables from a theme package for Inkdrop')
  .version(packageJson.version)
  .option(
    '-a, --appearance <light/dark>',
    'Force the UI appearance ("light" or "dark"); defaults to the theme\'s declared appearance'
  )
  .option('-o, --output <path>', 'Output file path (default: ./palette.json)', './palette.json')
  .addOption(
    new Option(
      '-t, --type <type>',
      'Force the theme type whose variables to extract; defaults to the theme package\'s "theme" field'
    ).choices([...THEME_TYPES])
  )
  .parse(process.argv)

const options = program.opts()
const outputPath = options.output as string
const appearance = options.appearance as 'light' | 'dark' | undefined
const type = options.type as ThemeType | undefined

const baseStyleSheetSpecifiers = [
  '@inkdropapp/css/reset.css',
  '@inkdropapp/css/tokens.css',
  '@inkdropapp/css/ui.css',
  '@inkdropapp/css/tags.css',
  '@inkdropapp/css/status.css',
  '@inkdropapp/css/task-progress.css',
  '@inkdropapp/css/syntax.css',
  '@inkdropapp/css/markdown.css',
  '@inkdropapp/base-ui-theme/styles/theme.css'
]

async function extractPalette(outputPath: string) {
  const themePackageJson = (
    await import(path.join(process.cwd(), 'package.json'), { with: { type: 'json' } })
  ).default
  const themeVariableManifest: ThemeVariableManifest = (
    await import(`@inkdropapp/css/variables.json`, { with: { type: 'json' } })
  ).default
  const resolvedType = resolveThemeType(type, themePackageJson)
  const themeVariableNames = selectVariableNames(themeVariableManifest, resolvedType)

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()

  page
    .on('console', (message) => {
      if (message.type() === 'error') {
        console.error(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`)
      }
    })
    .on('pageerror', (error) => console.error(error instanceof Error ? error.message : error))

  // Fall back to the theme's declared appearance so `light-dark()` resolves to
  // the branch the theme actually ships, even when no --appearance is forced.
  const resolvedAppearance = appearance ?? deriveAppearance(themePackageJson)

  const baseUrl = pathToFileURL(process.cwd()).toString() + '/'
  const baseStyleSheetURLs = baseStyleSheetSpecifiers.map((spec) => import.meta.resolve(spec))
  const content = buildPreviewHTML(
    themePackageJson,
    baseUrl,
    baseStyleSheetURLs,
    resolvedAppearance
  )

  await page.goto(baseUrl)
  await page.setContent(content)

  const computedCSSVariables = await page.$eval('body', (body) => {
    const computedStyles = body.computedStyleMap()
    const variables: Record<string, string> = {}
    for (const [prop, val] of computedStyles) {
      if (prop.startsWith('--')) {
        variables[prop] = val.toString()
      }
    }
    return variables
  })

  const themeCSSVariables = mapThemeVariables(themeVariableNames, computedCSSVariables)

  // Resolve `light-dark()` to raw values so non-CSS consumers (e.g. the mobile
  // app's React Native renderer) don't have to evaluate it themselves.
  const resolvedVariables = Object.fromEntries(
    Object.entries(themeCSSVariables).map(([name, value]) => [
      name,
      typeof value === 'string' ? resolveLightDark(value, resolvedAppearance) : value
    ])
  )

  const outputFilePath = path.resolve(outputPath)
  await writeFile(outputFilePath, JSON.stringify(resolvedVariables, null, 2))

  await browser.close()
}

extractPalette(outputPath)
  .then(() => console.log('Palette extraction complete!'))
  .catch((err) => {
    console.error('Error extracting palette:', err)
    process.exitCode = 1
  })
