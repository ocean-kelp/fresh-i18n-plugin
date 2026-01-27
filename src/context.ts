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
export const i18nContext = new AsyncLocalStorage<I18nContextData>();

/**
 * Helper to get i18n data from the current async context.
 * Only works server-side.
 */
export function getI18nContext(): I18nContextData | undefined {
  return i18nContext.getStore();
}
