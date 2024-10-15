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

You can specify a different theme package name and output destination using the following options:

- `<theme-name>`: The name of the theme package to extract variables from. Required. (e.g.,: `default-light-ui`).
- `-a, --appearance <light/dark>`: Force the UI appearance ("light" or "dark")
- `-o, --output`: The file path where the extracted variables will be saved (default: `./palette.json`).

### Examples

```sh
generate-palette default-light-ui
```

```sh
generate-palette nord-ui -a dark
```
