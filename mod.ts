/**
 * @module fresh-i18n-plugin
 *
 * A powerful internationalization (i18n) plugin for Fresh framework
 * with automatic locale detection, fallback support, and translation validation.
 */

export { i18nPlugin } from "./src/plugin.ts";
export { findLocalesDirectory, getEffectiveLocalesDir } from "./src/locales-finder.ts";
export type { ClientLoadConfig, I18nOptions, TranslationState } from "./src/types.ts";
export type { FallbackConfig } from "./src/plugin.ts";

// Re-export client utilities from client.ts to avoid bundling server-side modules
export { translate, createNamespacedTranslator } from "./src/client.ts";
export type { TranslationConfig } from "./src/translator.ts";
