# Theme dev helpers

A helper module for creating themes for Inkdrop.

## Requirements

- [Node.js](https://nodejs.org/) >= 24

## Installation

You can install the `@inkdropapp/theme-dev-helpers` in your theme project:

```bash
npm install --save-dev @inkdropapp/theme-dev-helpers
```

## Generate Palette

It extracts the computed values of a theme's CSS variables and writes them to the specified path.

A theme is unified — it styles the app UI, the editor syntax, and the Markdown preview at once — so a single run extracts every surface's variables and merges them into one `palette.json`:

- the app chrome plus the note status, tags, and task-progress palettes,
- the editor syntax highlighting tokens, and
- the rendered Markdown preview.

Each surface's tokens are read off the element they are scoped under (the document body, `.cm-editor`, and `.mde-preview` respectively).

```sh
generate-palette [options] <theme-name>
```

### Parameters

You can specify the following options:

- `-a, --appearance <light/dark>`: Force the UI appearance ("light" or "dark"). Defaults to the theme's declared appearance.
- `-o, --output`: The file path where the extracted variables will be saved (default: `./palette.json`).

### Example

If your theme package name doesn't include 'dark' but it is a dark mode:

```sh
generate-palette -a dark
```

## Run dev server

It provides a simple UI to preview your theme with hot-reloading.

```sh
dev-server
```

## Development

Dependencies are managed with [pnpm](https://pnpm.io/) and the runtime is [Node.js](https://nodejs.org/) (>= 24). The `generate-palette` CLI is bundled to plain JS in `dist/` with [tsdown](https://tsdown.dev/) (Node can't run a dependency's `.ts` files from `node_modules`); `pnpm install` builds it automatically via the `prepare` script. The `dev-server` CLI is served straight from source by Vite.

```sh
pnpm install      # install dependencies (also builds dist/ via prepare)
pnpm build        # bundle the generate-palette CLI to dist/ with tsdown
pnpm format       # format with oxfmt
pnpm lint         # lint with oxlint
pnpm typecheck    # type-check with tsc
pnpm test         # run unit tests (Vitest)
```
