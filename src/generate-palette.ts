import puppeteer from 'puppeteer';
import { writeFile } from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url'
import { Command } from 'commander';
import packageJson from '../package.json';

const program = new Command();

// Define CLI options and help using commander
program
  .name('generate-palette')
  .description('CLI tool for extracting CSS variables from a theme package for Inkdrop')
  .version(packageJson.version)
  .option('-a, --appearance <light/dark>', 'Force the UI appearance ("light" or "dark")')
  .option('-o, --output <path>', 'Output file path (default: ./palette.json)', './palette.json')
  .parse(process.argv);

// Parse options
const options = program.opts();
const outputPath = options.output as string;
const appearance = options.appearance as 'light' | 'dark' | undefined;

// Function to extract theme CSS variables
async function extractPalette(outputPath: string) {
  const themePackageJson = (await import(path.join(process.cwd(), 'package.json')))
  const themeVariableNames = (await import(`@inkdropapp/base-ui-theme/lib/variable-names.json`)).default;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page
    .on('console', message =>
      console.error(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
    .on('pageerror', ({ message }) => console.error(message));

  const baseUrl = pathToFileURL(process.cwd()).toString() + '/';
  const content = `<!DOCTYPE html>
  <html>
    <head>
      <base href="${baseUrl}" />
      <link rel="stylesheet" href="node_modules/@inkdropapp/css/reset.css" />
      <link rel="stylesheet" href="node_modules/@inkdropapp/css/tokens.css" />
      <link rel="stylesheet" href="node_modules/@inkdropapp/css/tags.css" />
      <link rel="stylesheet" href="node_modules/@inkdropapp/base-ui-theme/styles/theme.css" />
      <link rel="stylesheet" href="styles/theme.css" />
    </head>
    <body class="${themePackageJson.name} ${typeof appearance !== 'undefined' ? appearance + '-mode' : ''}">
      <h1>Hello</h1>
    </body>
  </html>
  `;

  await page.goto(baseUrl);
  await page.setContent(content);

  // Extract CSS variables
  const computedCSSVariables = await page.$eval('body', (body) => {
    const computedStyles = body.computedStyleMap();
    const variables = {};
    for (const [prop, val] of computedStyles) {
      if (prop.startsWith('--')) {
        variables[prop] = val.toString();
      }
    }
    return variables;
  });

  const themeCSSVariables = themeVariableNames.reduce((variables, name) => {
    variables[name] = computedCSSVariables[name];
    return variables;
  }, {});

  // Write to the output file
  const outputFilePath = path.resolve(outputPath);
  await writeFile(outputFilePath, JSON.stringify(themeCSSVariables, null, 2));

  await browser.close();
}

extractPalette(outputPath)
  .then(() => console.log('Palette extraction complete!'))
  .catch(err => console.error('Error extracting palette:', err));
