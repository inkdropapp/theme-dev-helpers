import { describe, expect, test } from 'bun:test'
import { buildPreviewHTML, mapThemeVariables } from './palette'

describe('buildPreviewHTML', () => {
  const baseUrl = 'file:///themes/acme/'

  test('emits the base href so relative links resolve', () => {
    const html = buildPreviewHTML({ name: 'acme' }, baseUrl)
    expect(html).toContain(`<base href="${baseUrl}" />`)
  })

  test('always includes the Inkdrop base stylesheets', () => {
    const html = buildPreviewHTML({ name: 'acme' }, baseUrl)
    expect(html).toContain('node_modules/@inkdropapp/css/reset.css')
    expect(html).toContain('node_modules/@inkdropapp/css/tokens.css')
    expect(html).toContain('node_modules/@inkdropapp/css/tags.css')
    expect(html).toContain('node_modules/@inkdropapp/base-ui-theme/styles/theme.css')
  })

  test('links each declared theme stylesheet under styles/', () => {
    const html = buildPreviewHTML(
      { name: 'acme', styleSheets: ['base.css', 'syntax.css'] },
      baseUrl
    )
    expect(html).toContain('<link rel="stylesheet" href="styles/base.css" />')
    expect(html).toContain('<link rel="stylesheet" href="styles/syntax.css" />')
  })

  test('omits theme stylesheet links when none are declared', () => {
    const html = buildPreviewHTML({ name: 'acme' }, baseUrl)
    expect(html).not.toContain('href="styles/')
  })

  test('sets the body class to the theme name', () => {
    const html = buildPreviewHTML({ name: 'acme-dark' }, baseUrl)
    expect(html).toContain('<body class="acme-dark">')
  })

  test('appends an appearance-mode class when an appearance is forced', () => {
    const html = buildPreviewHTML({ name: 'acme' }, baseUrl, 'dark')
    expect(html).toContain('<body class="acme dark-mode">')
  })

  test('adds no appearance class when appearance is omitted', () => {
    const html = buildPreviewHTML({ name: 'acme' }, baseUrl)
    expect(html).not.toContain('-mode')
  })
})

describe('mapThemeVariables', () => {
  test('maps each declared name to its computed value, ignoring extras', () => {
    const result = mapThemeVariables(['--accent', '--bg'], {
      '--accent': '#f00',
      '--bg': '#fff',
      '--extra': '#000'
    })
    expect(result).toEqual({ '--accent': '#f00', '--bg': '#fff' })
  })

  test('preserves the declaration order of the variable names', () => {
    const result = mapThemeVariables(['--b', '--a'], { '--a': '1', '--b': '2' })
    expect(Object.keys(result)).toEqual(['--b', '--a'])
  })

  test('leaves variables absent from the computed set undefined', () => {
    const result = mapThemeVariables(['--missing'], { '--accent': '#f00' })
    expect(result['--missing']).toBeUndefined()
  })

  test('returns an empty object when no names are declared', () => {
    expect(mapThemeVariables([], { '--accent': '#f00' })).toEqual({})
  })
})
