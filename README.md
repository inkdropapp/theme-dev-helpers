# Theme dev helpers

A helper module for creating themes for Inkdrop.

## Requirements

- [Bun](https://bun.sh/)

## Installation

You can install the `@inkdropapp/theme-dev-helpers` in your theme project:

```bash
bun i -D @inkdropapp/theme-dev-helpers
```

## Generate Palette

It extracts computed values of theme-related CSS variables from CSS files, and outputs to the specified path.

```sh
generate-palette [options] <theme-name>
```

### Parameters

You can specify the following options:

- `-a, --appearance <light/dark>`: Force the UI appearance ("light" or "dark")
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

