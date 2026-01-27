/**
 * Client-side utilities for accessing injected translation data.
 * 
 * These utilities work with the clientLoad feature to access translations
 * that have been injected into the HTML by the i18n plugin middleware.
 * 
 * @module
 */

import {
  createNamespacedTranslator,
  translate,
  type TranslationConfig,
} from "./translator.ts";
import { getI18nContext } from "./context.ts";

/**
 * Interface for i18n data injected into global scope.
 */
interface I18nGlobalData {
  translations: Record<string, unknown>;
  locale: string;
  defaultLocale: string;
}

/**
 * Internal helper to access global i18n data with type safety.
 */
function getGlobalData(): I18nGlobalData | undefined {
  // 1. Try server-side context (AsyncLocalStorage)
  const contextData = getI18nContext();
  if (contextData) {
    return contextData;
  }

  // 2. Fallback to client-side global (window.__I18N__)
  if (typeof globalThis === "undefined") {
    return undefined;
  }
  return (globalThis as unknown as { __I18N__?: I18nGlobalData }).__I18N__;
}

/**
 * Hook to access translations in client-side islands.
 * Must be used with the clientLoad configuration in the i18n plugin.
 * 
 * @returns Translation function (same API as server-side `state.t`)
 * @throws Error if called server-side or if translation data is not available
 * 
 * @example
 * ```tsx
 * // In an island component
 * import { useTranslation } from "@xiayun/fresh-i18n/client";
 * 
 * export default function MyIsland() {
 *   const t = useTranslation();
 *   
 *   return (
 *     <div>
 *       <h1>{t("features.indicators.title")}</h1>
 *       <button>{t("common.actions.save")}</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTranslation(): (key: string) => string {
  if (typeof globalThis === "undefined") {
    throw new Error(
      "useTranslation() can only be used client-side (in islands). " +
        "For server-side routes, use state.t instead.",
    );
  }

  const data = getGlobalData();

  if (!data) {
    throw new Error(
      "Translation data not found. " +
        "Make sure you have configured clientLoad in your i18n plugin options. " +
        "Check the plugin documentation for setup instructions.",
    );
  }

  const config: TranslationConfig = {
    locale: data.locale,
    defaultLocale: data.defaultLocale,
  };

  return translate(data.translations, config);
}

/**
 * Gets the current locale from injected translation data.
 * 
 * @returns Current locale string (e.g., "en", "es")
 * @throws Error if called server-side or if translation data is not available
 * 
 * @example
 * ```tsx
 * import { useLocale } from "@xiayun/fresh-i18n/client";
 * 
 * export default function LanguageDisplay() {
 *   const locale = useLocale();
 *   return <span>Current language: {locale}</span>;
 * }
 * ```
 */
export function useLocale(): string {
  if (typeof globalThis === "undefined") {
    throw new Error(
      "useLocale() can only be used client-side (in islands). " +
        "For server-side routes, use state.locale instead.",
    );
  }

  const data = getGlobalData();

  if (!data) {
    throw new Error(
      "Translation data not found. " +
        "Make sure you have configured clientLoad in your i18n plugin options.",
    );
  }

  return data.locale;
}

/**
 * Advanced: Access raw translation data object.
 * Useful for creating custom translation utilities or debugging.
 * 
 * @returns Complete injected translation data, or undefined if not available
 * 
 * @example
 * ```tsx
 * import { getTranslationData } from "@xiayun/fresh-i18n/client";
 * 
 * const data = getTranslationData();
 * if (data) {
 *   console.log("Available keys:", Object.keys(data.translations));
 * }
 * ```
 */
export function getTranslationData(): I18nGlobalData | undefined {
  return getGlobalData();
}

export { createNamespacedTranslator };
