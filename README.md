# Fresh i18n Plugin

A powerful internationalization (i18n) plugin for [Fresh](https://fresh.deno.dev) with automatic locale detection, fallback support, and comprehensive translation validation.

## Features

- 🌍 **Automatic locale detection** from URL paths and Accept-Language headers
- 🔄 **Fallback system** with configurable indicators for missing translations
- ✅ **Development validation** with detailed error messages and warnings
- 🎯 **Namespace support** for organizing translations by feature
- 🚀 **Production optimized** with silent failures and optional key display
- 📦 **TypeScript native** with full type safety
- 🔍 **Smart locale discovery** - automatically finds your locales directory
- 🎨 **Flexible configuration** - customize every aspect of translation behavior

## Installation

```bash
deno add @xingshuu-denofresh/fresh-i18n-plugin
```

Or add to your `deno.json`:

```json
{
  "imports": {
    "@xingshuu-denofresh/fresh-i18n-plugin": "jsr:@xingshuu-denofresh/fresh-i18n-plugin@^1.0.0"
  }
}
```

## Quick Start

### 1. Create locale files

Organize your translations in a `locales` directory:

```
locales/
├── en/
│   ├── common.json
│   ├── error.json
│   └── metadata.json
└── es/
    ├── common.json
    ├── error.json
    └── metadata.json
```

**Example `locales/en/common.json`:**

```json
{
  "welcome": "Welcome to Fresh",
  "nav": {
    "home": "Home",
    "about": "About"
  }
}
```

### 2. Define your state type in `utils.ts`

Extend the `TranslationState` interface to include translation functionality in your app state:

```typescript
import { createDefine } from "fresh";
import type { TranslationState } from "@xingshuu-denofresh/fresh-i18n-plugin";

export interface State extends TranslationState {
  // Add your custom state properties here
}

export const define = createDefine<State>();
```

### 3. Configure the plugin in `main.ts`

```typescript
import { App } from "fresh";
import { i18nPlugin } from "@xingshuu-denofresh/fresh-i18n-plugin";
import { type State } from "./utils.ts";

export const app = new App<State>();

app.use(i18nPlugin({
  languages: ["en", "es"],
  defaultLanguage: "en",
  localesDir: "./locales",
}));

await app.listen();
```

### 4. Use translations in your routes

```typescript
import { PageProps } from "fresh";
import type { State } from "../utils.ts";

export default function HomePage({ state }: PageProps<unknown, State>) {
  return (
    <div>
      <h1>{state.t("common.welcome")}</h1>
      <nav>
        <a href={`/${state.locale}/about`}>{state.t("common.nav.about")}</a>
      </nav>
    </div>
  );
}
```

## Configuration

### Basic Options

```typescript
i18nPlugin({
  languages: ["en", "es", "fr"],
  defaultLanguage: "en",
  localesDir: "./locales",
});
```

### Advanced Configuration

```typescript
i18nPlugin({
  languages: ["en", "es"],
  defaultLanguage: "en",
  localesDir: "./locales",

  // Custom production detection
  isProduction: () => Deno.env.get("ENVIRONMENT") === "production",

  // Show translation keys in production for debugging
  showKeysInProd: false,

  // Fallback configuration
  fallback: {
    enabled: true,
    showIndicator: true,
    indicatorFormat: (text, locale) => `${text} · ${locale.toUpperCase()}`,
    shouldShowIndicator: (text, locale) => {
      const wordCount = text.split(/\s+/).filter((w) => w).length;
      return wordCount >= 2; // Only show indicator for multi-word translations
    },
    applyOnDev: false,
  },
});
```

## Translation File Structure

### Namespaces

The plugin automatically loads these namespaces:

- `common.json` - Shared translations across all pages
- `error.json` - Error messages
- `metadata.json` - SEO metadata
- Route-specific namespaces based on URL segments

### Key Format

All translation keys use dot notation with the namespace prefix:

```json
{
  "title": "Welcome",
  "nav": {
    "home": "Home",
    "about": "About"
  }
}
```

Access as: `t("common.title")` or `t("common.nav.home")`

## Usage in Islands

Islands (client-side components) need translation data passed as props:

### In your route handler:

```typescript
export const handler = define.handlers({
  GET(ctx) {
    return {
      data: {
        items: getItems(),
        translationData: ctx.state.translationData,
      },
    };
  },
});
```

### In your route component:

```typescript
export default function MyRoute({ data, state }: PageProps) {
  return (
    <div>
      <h1>{state.t("common.title")}</h1>
      <MyIsland translationData={data.translationData} />
    </div>
  );
}
```

### In your island:

```typescript
import { translate } from "@yourorg/fresh-i18n";

export default function MyIsland({
  translationData,
}: {
  translationData: Record<string, unknown>;
}) {
  const t = translate(translationData);

  return <button>{t("common.submit")}</button>;
}
```

## Locale Detection

The plugin detects the user's language in this order:

1. **URL Path**: `/es/about` → Spanish (`es`)
2. **Accept-Language Header**: Falls back to browser preference
3. **Default Language**: Uses your configured default

## Development vs Production

### Development Mode

- Shows `[key.name]` for missing translations
- Logs detailed warnings to console
- Validates translation keys and structure
- Helps identify missing or incorrect translations

### Production Mode

- Returns empty string for missing translations
- Silent failures (no console warnings)
- Optional: Show keys with `showKeysInProd: true`
- Optimized performance

## Fallback System

When enabled, the fallback system loads your default language as a base and overlays the requested language:

```typescript
fallback: {
  enabled: true,           // Enable fallback
  showIndicator: true,     // Show indicator for fallback text
  indicatorFormat: (text, locale) => `${text} [${locale}]`,
  applyOnDev: false,       // Don't apply in development (show keys instead)
}
```

**Example**: If Spanish translation is missing for `common.welcome`, it shows the English version (optionally with an indicator).

## API Reference

### `i18nPlugin(options)`

Creates the i18n middleware.

**Options:**

- `languages` (string[]): Supported language codes
- `defaultLanguage` (string): Default language code
- `localesDir` (string): Path to locales directory
- `isProduction` (() => boolean): Custom production detection
- `showKeysInProd` (boolean): Show keys in production (default: false)
- `fallback` (FallbackConfig): Fallback configuration

### `translate(translationData, config?)`

Creates a translation function.

**Parameters:**

- `translationData` (Record<string, unknown>): Flat translation object
- `config` (TranslationConfig): Optional configuration

**Returns:** `(key: string) => string`

### State Interface

The plugin adds these properties to Fresh's context state:

```typescript
interface State {
  t: (key: string) => string; // Translation function
  locale: string; // Current locale
  translationData: Record<string, unknown>; // Raw translation data
  path: string; // URL path without locale
}
```

## Best Practices

1. **Use namespaces**: Organize translations by feature (`common.json`, `auth.json`, etc.)
2. **Keep keys descriptive**: Use `common.nav.home` instead of `common.h1`
3. **Enable fallback in production**: Prevent blank UI when translations are missing
4. **Test in development**: Development mode shows all issues
5. **Use TypeScript**: Get autocomplete and type safety for your state

## Examples

See the `/examples` directory for complete working examples:

- Basic setup
- With fallback indicators
- Islands integration
- Multi-language navigation

## Migration Guide

### From other i18n solutions

Most i18n libraries use similar patterns. Key differences:

1. **No React context**: Uses Fresh's built-in state
2. **Flat key structure**: Access as `t("namespace.key.path")`
3. **Automatic namespace loading**: Based on URL path
4. **Server-first**: Translations loaded server-side for better performance

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

## License

MIT License - see [LICENSE](LICENSE) for details

## Support

- Report issues: [GitHub Issues](https://github.com/yourorg/fresh-i18n-plugin/issues)
- Discussions: [GitHub Discussions](https://github.com/yourorg/fresh-i18n-plugin/discussions)
