import puppeteer from 'puppeteer'
import { writeFile } from 'fs/promises'
import path from 'path'
import { pathToFileURL } from 'url'
import { Command } from 'commander'
import packageJson from '../package.json' with { type: 'json' }
import {
  buildPreviewHTML,
  buildProbeGroups,
  deriveAppearance,
  mapThemeVariables,
  resolveLightDark,
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
  .parse(process.argv)

const options = program.opts()
const outputPath = options.output as string
const appearance = options.appearance as 'light' | 'dark' | undefined

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

/**
 * Reads every `--*` custom property off an element's computed style. This runs
 * in the page context (it is handed to `page.$eval`), so it must not reference
 * any Node-side scope.
 *
 * @param element - The element to read the computed custom properties from.
 * @returns A record of `--custom-property -> computed value`.
 */
function readCustomProperties(element: Element): Record<string, string> {
  const computedStyles = element.computedStyleMap()
  const variables: Record<string, string> = {}
  for (const [prop, val] of computedStyles) {
    if (prop.startsWith('--')) {
      variables[prop] = val.toString()
    }
  }
  return variables
}

async function extractPalette(outputPath: string) {
  const themePackageJson = (
    await import(path.join(process.cwd(), 'package.json'), { with: { type: 'json' } })
  ).default
  const themeVariableManifest: ThemeVariableManifest = (
    await import(`@inkdropapp/css/variables.json`, { with: { type: 'json' } })
  ).default
  const probeGroups = buildProbeGroups(themeVariableManifest)

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()

  page
    .on('console', (message) => {
      if (message.type() === 'error') {
        console.error(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`)
      }
    })
    .on('pageerror', (error) => console.error(error instanceof Error ? error.message : error))

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

  const groupedVariables = await Promise.all(
    probeGroups.map(async ({ probeSelector, variableNames }) => {
      const computed = await page.$eval(probeSelector, readCustomProperties)
      return mapThemeVariables(variableNames, computed)
    })
  )
  const themeCSSVariables: Record<string, string> = Object.assign({}, ...groupedVariables)
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
