import { describe, expect, test } from 'vitest'
import {
  buildPreviewHTML,
  deriveAppearance,
  mapThemeVariables,
  resolveLightDark,
  resolveProbeSelector,
  resolveThemeType,
  selectVariableNames
} from './palette'

describe('buildPreviewHTML', () => {
  const baseUrl = 'file:///themes/acme/'
  const baseStyleSheetURLs = [
    'file:///pkgs/@inkdropapp/css/reset.css',
    'file:///pkgs/@inkdropapp/base-ui-theme/styles/theme.css'
  ]

  test('emits the base href so relative theme links resolve', () => {
    const html = buildPreviewHTML({ name: 'acme' }, baseUrl, [])
    expect(html).toContain(`<base href="${baseUrl}" />`)
  })

  test('links each resolved Inkdrop base stylesheet as an absolute URL', () => {
    const html = buildPreviewHTML({ name: 'acme' }, baseUrl, baseStyleSheetURLs)
    for (const href of baseStyleSheetURLs) {
      expect(html).toContain(`<link rel="stylesheet" href="${href}" />`)
    }
  })

  test('links each declared theme stylesheet under styles/', () => {
    const html = buildPreviewHTML(
      { name: 'acme', styleSheets: ['base.css', 'syntax.css'] },
      baseUrl,
      []
    )
    expect(html).toContain('<link rel="stylesheet" href="styles/base.css" />')
    expect(html).toContain('<link rel="stylesheet" href="styles/syntax.css" />')
  })

  test('omits theme stylesheet links when none are declared', () => {
    const html = buildPreviewHTML({ name: 'acme' }, baseUrl, [])
    expect(html).not.toContain('href="styles/')
  })

  test('sets the body class to the theme name', () => {
    const html = buildPreviewHTML({ name: 'acme-dark' }, baseUrl, [])
    expect(html).toContain('<body class="acme-dark">')
  })

  test('appends an appearance-mode class when an appearance is forced', () => {
    const html = buildPreviewHTML({ name: 'acme' }, baseUrl, [], 'dark')
    expect(html).toContain('<body class="acme dark-mode">')
  })

  test('adds no appearance class when appearance is omitted', () => {
    const html = buildPreviewHTML({ name: 'acme' }, baseUrl, [])
    expect(html).not.toContain('-mode')
  })

  test('renders .cm-editor and .mde-preview elements so scoped tokens can be probed off them', () => {
    const html = buildPreviewHTML({ name: 'acme' }, baseUrl, [])
    expect(html).toContain('<div class="cm-editor">')
    expect(html).toContain('<div class="mde-preview">')
  })
})

describe('deriveAppearance', () => {
  test('is dark when the name contains "dark"', () => {
    expect(deriveAppearance({ name: 'solarized-dark-ui' })).toBe('dark')
  })

  test('is dark when themeAppearance is "dark"', () => {
    expect(deriveAppearance({ name: 'acme-ui', themeAppearance: 'dark' })).toBe('dark')
  })

  test('is light otherwise', () => {
    expect(deriveAppearance({ name: 'acme-light-ui' })).toBe('light')
    expect(deriveAppearance({ name: 'acme-ui', themeAppearance: 'light' })).toBe('light')
    expect(deriveAppearance({})).toBe('light')
  })
})

describe('resolveLightDark', () => {
  test('keeps the first branch for light, the second for dark', () => {
    expect(resolveLightDark('light-dark(red, blue)', 'light')).toBe('red')
    expect(resolveLightDark('light-dark(red, blue)', 'dark')).toBe('blue')
  })

  test('leaves values without light-dark untouched', () => {
    expect(resolveLightDark('hsl(192deg 100% 5%)', 'dark')).toBe('hsl(192deg 100% 5%)')
  })

  test('ignores commas nested inside the branches', () => {
    const value = 'light-dark(hsl(215deg 14% 34%), hsl(218deg 11% 65% / 40%))'
    expect(resolveLightDark(value, 'dark')).toBe('hsl(218deg 11% 65% / 40%)')
    expect(resolveLightDark(value, 'light')).toBe('hsl(215deg 14% 34%)')
  })

  test('resolves nested light-dark within the chosen branch', () => {
    const value = 'light-dark(light-dark(a, b), c)'
    expect(resolveLightDark(value, 'light')).toBe('a')
    expect(resolveLightDark(value, 'dark')).toBe('c')
  })

  test('resolves light-dark embedded in a larger value', () => {
    const value = '0px 1px 2px 0 light-dark(rgba(0, 0, 0, 0.1), hsl(0deg 0% 0% / 20%)) inset'
    expect(resolveLightDark(value, 'dark')).toBe('0px 1px 2px 0 hsl(0deg 0% 0% / 20%) inset')
  })

  test('resolves multiple light-dark occurrences in one value', () => {
    const value = 'light-dark(a, b), light-dark(c, d)'
    expect(resolveLightDark(value, 'light')).toBe('a, c')
    expect(resolveLightDark(value, 'dark')).toBe('b, d')
  })
})

describe('selectVariableNames', () => {
  const manifest = {
    ui: ['--font-name', '--primary-color'],
    status: ['--note-status-active'],
    tags: ['--tag-red-text-color'],
    'task-progress': ['--task-progress-view-border-color'],
    markdown: ['--gfm-alert-note'],
    syntax: ['--syntax-comment-color']
  }

  test('ui covers ui, status, tags, and task-progress in declaration order', () => {
    expect(selectVariableNames(manifest, 'ui')).toEqual([
      '--font-name',
      '--primary-color',
      '--note-status-active',
      '--tag-red-text-color',
      '--task-progress-view-border-color'
    ])
  })

  test('syntax covers only the syntax category', () => {
    expect(selectVariableNames(manifest, 'syntax')).toEqual(['--syntax-comment-color'])
  })

  test('preview covers only the markdown category', () => {
    expect(selectVariableNames(manifest, 'preview')).toEqual(['--gfm-alert-note'])
  })

  test('skips categories absent from the manifest', () => {
    expect(selectVariableNames({ ui: ['--a'] }, 'ui')).toEqual(['--a'])
  })
})

describe('resolveProbeSelector', () => {
  test('reads syntax tokens off the editor element they are scoped under', () => {
    expect(resolveProbeSelector('syntax')).toBe('.cm-editor')
  })

  test('reads preview tokens off the rendered-markdown element they are scoped under', () => {
    expect(resolveProbeSelector('preview')).toBe('.mde-preview')
  })

  test('reads ui tokens off the document body', () => {
    expect(resolveProbeSelector('ui')).toBe('body')
  })
})

describe('resolveThemeType', () => {
  test('a forced type wins over the declared one', () => {
    expect(resolveThemeType('syntax', { theme: 'preview' })).toBe('syntax')
  })

  test('falls back to the declared theme field when not forced', () => {
    expect(resolveThemeType(undefined, { theme: 'syntax' })).toBe('syntax')
    expect(resolveThemeType(undefined, { theme: 'preview' })).toBe('preview')
  })

  test('throws when neither forced nor declared', () => {
    expect(() => resolveThemeType(undefined, {})).toThrow(/no "theme" field/)
  })

  test('throws on an unknown declared theme field', () => {
    expect(() => resolveThemeType(undefined, { theme: 'bogus' })).toThrow(/not a known theme type/)
  })

  test('a forced type still wins when the theme field is missing', () => {
    expect(resolveThemeType('ui', {})).toBe('ui')
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
