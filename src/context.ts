/**
 * Server-side context for i18n data during SSR.
 * Uses AsyncLocalStorage to ensure thread-safety during concurrent requests.
 * 
 * @module
 */

import { AsyncLocalStorage } from "node:async_hooks";

export interface I18nContextData {
  translations: Record<string, unknown>;
  locale: string;
  defaultLocale: string;
}

/**
 * Global storage for i18n context during server-side rendering.
 */
// Use a global symbol to ensure we share the same storage instance
// even if the module is loaded multiple times (e.g. from different locations)
const GLOBAL_CONTEXT_KEY = Symbol.for("fresh-i18n-context");

const globalStore = (globalThis as any)[GLOBAL_CONTEXT_KEY] || new AsyncLocalStorage<I18nContextData>();

// Ensure it's registered globally
if (!(globalThis as any)[GLOBAL_CONTEXT_KEY]) {
  (globalThis as any)[GLOBAL_CONTEXT_KEY] = globalStore;
}

export const i18nContext = globalStore as AsyncLocalStorage<I18nContextData>;

/**
 * Helper to get i18n data from the current async context.
 * Only works server-side.
 */
export function getI18nContext(): I18nContextData | undefined {
  return i18nContext.getStore();
}
