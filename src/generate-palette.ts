import puppeteer from 'puppeteer'
import { writeFile } from 'fs/promises'
import path from 'path'
import { pathToFileURL } from 'url'
import { Command } from 'commander'
import packageJson from '../package.json'
import { buildPreviewHTML, deriveAppearance, mapThemeVariables, resolveLightDark } from './palette'

const program = new Command()

// Define CLI options and help using commander
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

// Parse options
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
  '@inkdropapp/base-ui-theme/styles/theme.css'
]

// Function to extract theme CSS variables
async function extractPalette(outputPath: string) {
  const themePackageJson = await import(path.join(process.cwd(), 'package.json'))
  const themeVariableNames: string[] = (await import(`@inkdropapp/css/variables.json`)).default

  const browser = await puppeteer.launch()
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

  // Extract CSS variables
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

  // Write to the output file
  const outputFilePath = path.resolve(outputPath)
  await writeFile(outputFilePath, JSON.stringify(resolvedVariables, null, 2))

  await browser.close()
}

extractPalette(outputPath)
  .then(() => console.log('Palette extraction complete!'))
  .catch((err) => console.error('Error extracting palette:', err))
