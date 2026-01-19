/**
 * @module fresh-i18n-plugin
 *
 * A powerful internationalization (i18n) plugin for Fresh framework
 * with automatic locale detection, fallback support, and translation validation.
 */

export { i18nPlugin } from "./src/plugin.ts";
export { translate, createNamespacedTranslator } from "./src/translator.ts";
export { findLocalesDirectory, getEffectiveLocalesDir } from "./src/locales-finder.ts";
export type { I18nOptions, TranslationState } from "./src/types.ts";
export type { FallbackConfig } from "./src/plugin.ts";
export type { TranslationConfig } from "./src/translator.ts";
