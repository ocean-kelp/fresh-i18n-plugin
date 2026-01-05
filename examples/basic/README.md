# Basic Example

This example demonstrates the most basic usage of the Fresh i18n plugin.

## Features

- Automatic locale detection from URL
- Two languages: English (en) and Spanish (es)
- Simple translation usage in routes

## Running

```bash
cd examples/basic
deno task dev
```

Then visit:

- http://localhost:8000/en - English version
- http://localhost:8000/es - Spanish version

## File Structure

```
basic/
├── main.ts           # App setup with i18n plugin
├── utils.ts          # State type definition
├── deno.json         # Project configuration
├── locales/
│   ├── en/
│   │   └── common.json
│   └── es/
│       └── common.json
└── routes/
    └── [locale]/
        └── index.tsx
```

## Translation Keys

All translations are in `common.json`:

- `welcome` - Welcome message
- `description` - Page description
- `nav.home` - Home link
- `nav.about` - About link
- `footer` - Footer text
