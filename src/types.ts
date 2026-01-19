import type { TranslationConfig } from "./translator.ts";

/**
 * State object extended by the i18n plugin middleware.
 * This type should be extended by your app's State interface.
 *
 * @example
 * ```typescript
 * import { TranslationState } from "@xiayun/fresh-i18n";
 *
 * export interface State extends TranslationState {
 *   // Your custom state properties
 * }
 * ```
 */
export interface TranslationState extends Record<string, unknown> {
  /** Flat translation data object with dot-separated keys */
  translationData: Record<string, unknown>;
  /** Configuration for translation behavior */
  translationConfig: TranslationConfig;
  /** Current route path */
  path: string;
  /** Current locale code (e.g., "en", "es") */
  locale: string;
  /** Translation function that takes a key and returns translated text */
  t: (key: string) => string;
}

/**
 * Fresh framework context object.
 * @template State - The application state type
 */
export interface FreshContext<State> {
  /** The incoming HTTP request */
  req: Request;
  /** Shared state object passed through middleware chain */
  state: State;
  /** Function to call the next middleware in the chain */
  next: () => Promise<Response | void>;
}

/**
 * Middleware function type for Fresh framework.
 * @template State - The application state type
 */
export type MiddlewareFn<State> = (
  ctx: FreshContext<State>,
) => Response | Promise<Response | void>;

/**
 * Configuration options for the i18n plugin.
 *
 * @example
 * ```typescript
 * const options: I18nOptions = {
 *   languages: ["en", "es", "ja"],
 *   defaultLanguage: "en",
 *   localesDir: "./locales",
 * };
 * ```
 */
export interface I18nOptions {
  /** Array of supported language codes */
  languages: string[];
  /** Default language to use when no preference is detected */
  defaultLanguage: string;
  /** Path to the directory containing locale folders */
  localesDir: string;
}
