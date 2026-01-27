import { join, relative } from "@std/path";
import { type Middleware } from "fresh";
import { translate } from "./translator.ts";
import type { ClientLoadConfig, TranslationState } from "./types.ts";

export interface FallbackConfig {
  /**
   * Enable fallback to default language when translations are missing.
   * @default false
   */
  enabled?: boolean;
  /**
   * Show an indicator when displaying fallback content.
   * @default false
   */
  showIndicator?: boolean;
  /**
   * Custom function to format the fallback text with indicator.
   * @default (text, locale) => `${text} [${locale}]`
   */
  indicatorFormat?: (text: string, defaultLocale: string) => string;
  /**
   * Function to determine if a specific fallback text should show an indicator.
   * Allows conditional indicator display based on text length or other criteria.
   * If not provided, indicator will always show when showIndicator is enabled.
   * @param text - The fallback text content
   * @param locale - The default locale being used for fallback
   * @returns true to show indicator, false to hide it
   * @example
   * shouldShowIndicator: (text, locale) => {
   *   const wordCount = text.split(/\\s+/).filter(w => w).length;
   *   const letterCount = text.replace(/\\s/g, '').length;
   *   return wordCount >= 2 && letterCount > 10;
   * }
   */
  shouldShowIndicator?: (text: string, locale: string) => boolean;
  /**
   * Apply fallback behavior in development mode too.
   * If false (default), dev mode always shows [key] for visibility.
   * @default false
   */
  applyOnDev?: boolean;
}

/**
 * Configuration options for the i18n plugin.
 * Extends the basic I18nOptions with additional features.
 */
export interface I18nOptions {
  /** Array of supported language codes (e.g., ["en", "es", "ja"]) */
  languages: string[];
  /** Default language code to use when no preference is detected */
  defaultLanguage: string;
  /** Path to the directory containing locale folders */
  localesDir: string;
  /**
   * Custom function to determine if running in production.
   * If not provided, uses Vite's import.meta.env.DEV and VITE_SIMULATE_PROD.
   * Useful for custom deployment environments or testing scenarios.
   * @example
   * isProduction: () => !import.meta.env?.DEV || import.meta.env?.VITE_SIMULATE_PROD === "true",
   * @default undefined
   */
  isProduction?: () => boolean;
  /**
   * Fallback configuration for missing translations.
   *
   * @property {boolean} [enabled=false] - Enable fallback to default language when translations are missing.
   * @property {boolean} [showIndicator=false] - Show an indicator when displaying fallback content.
   * @property {function} [indicatorFormat] - Custom function to format the fallback text with indicator. Default: `(text, locale) => ${text} [${locale}]`
   * @property {function} [shouldShowIndicator] - Function to determine if indicator should be shown for specific text. If not provided, always shows indicator when enabled.
   * @property {boolean} [applyOnDev=false] - Apply fallback behavior in development mode too. If false (default), dev mode always shows [key] for visibility.
   *
   * @example
   * fallback: {
   *   enabled: true,
   *   showIndicator: true,
   *   indicatorFormat: (text, locale) => `${text} · ${locale.toUpperCase()}`,
   *   shouldShowIndicator: (text, locale) => {
   *     const wordCount = text.split(/\\s+/).filter(w => w).length;
   *     const letterCount = text.replace(/\\s/g, '').length;
   *     return wordCount >= 2 && letterCount > 10;
   *   },
   *   applyOnDev: false
   * }
   */
  fallback?: FallbackConfig;
  /**
   * If true, show translation keys [key] in production when no translation exists.
   * Takes precedence over fallback - useful for identifying missing translations.
   * @default false
   */
  showKeysInProd?: boolean;
  /**
   * Client-side translation loading configuration.
   * When enabled, injects only matched namespaces into the client instead of passing all translations via props.
   *
   * NOTE: This is about ROUTE MATCHING, not file structure.
   * A pattern like "/indicators/*" loads "features.indicators.*" which should include
   * granular files: list.json, edit.json, form.json, validations.json, etc.
   * Keep translation files fragmented regardless of route patterns!
   *
   * @example
   * clientLoad: {
   *   always: ["common"],
   *   routes: {
   *     "/indicators/*": ["features.indicators"],
   *     "/admin/*": ["features.admin", "features.users"],
   *   },
   *   fallback: "always-only",
   * }
   */
  clientLoad?: ClientLoadConfig;
}

async function readJsonFile(filePath: string): Promise<Record<string, string>> {
  try {
    const content = await Deno.readTextFile(filePath);

    // Skip empty files
    if (content.trim() === "") {
      return {};
    }

    const data = JSON.parse(content) as Record<string, string>;
    return data;
  } catch {
    return {}; // Silently fail for missing files
  }
}

/**
 * Converts kebab-case or snake_case strings to camelCase.
 * @param str - The string to convert
 * @returns The camelCased string
 * @example
 * kebabToCamel("pdi-modals") // "pdiModals"
 * kebabToCamel("user_settings") // "userSettings"
 */
function kebabToCamel(str: string): string {
  return str.replace(/[-_]([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Recursively discovers all JSON translation files in a locale directory.
 * Builds namespace keys from folder/file paths.
 * 
 * @param localeDir - The locale directory to scan (e.g., "locales/en")
 * @param basePath - The base path for relative path calculation (used internally for recursion)
 * @returns Map of namespace -> file path
 * @example
 * // Directory structure:
 * // locales/en/common.json
 * // locales/en/common/actions.json
 * // locales/en/features/navigator/dashboard.json
 * 
 * // Returns:
 * // {
 * //   "common": "locales/en/common.json",
 * //   "common.actions": "locales/en/common/actions.json",
 * //   "features.navigator.dashboard": "locales/en/features/navigator/dashboard.json"
 * // }
 */
async function discoverTranslationFiles(
  localeDir: string,
  basePath: string = localeDir,
): Promise<Map<string, string>> {
  const files = new Map<string, string>();

  try {
    for await (const entry of Deno.readDir(localeDir)) {
      const fullPath = join(localeDir, entry.name);

      if (entry.isFile && entry.name.endsWith(".json")) {
        // Build namespace from relative path
        const relativePath = relative(basePath, fullPath);
        // Remove .json extension and convert path separators to dots
        const namespace = relativePath
          .replace(/\.json$/, "")
          .split("/")
          .map(kebabToCamel)
          .join(".");

        files.set(namespace, fullPath);
      } else if (entry.isDirectory) {
        // Recursively scan subdirectories
        const subFiles = await discoverTranslationFiles(fullPath, basePath);
        for (const [namespace, path] of subFiles) {
          files.set(namespace, path);
        }
      }
    }
  } catch (error) {
    console.error(`Error discovering translation files in ${localeDir}:`, error);
  }

  return files;
}

/**
 * Normalizes a URL path by removing trailing slashes (except for root "/").
 * @param path - The URL path to normalize
 * @returns The normalized path
 */
function normalizeUrlPath(path: string): string {
  if (path === "/" || !path.endsWith("/")) return path;
  return path.slice(0, -1);
}

/**
 * Matches a URL path against a route pattern with greedy wildcard support.
 * Pattern wildcards (*) match any remaining path segments.
 * 
 * @param urlPath - The URL path to match (e.g., "/indicators/123/edit")
 * @param pattern - The route pattern (e.g., "/indicators/*")
 * @returns true if the URL matches the pattern
 * 
 * @example
 * matchRoutePattern("/indicators/123", "/indicators/*") // true
 * matchRoutePattern("/indicators/123/edit", "/indicators/*") // true
 * matchRoutePattern("/matrix/indicators/456", "/indicators/*") // false
 * matchRoutePattern("/matrix/indicators/456", "/matrix/indicators/*") // true
 */
function matchRoutePattern(urlPath: string, pattern: string): boolean {
  // Exact match
  if (urlPath === pattern) return true;

  // If pattern has wildcard
  if (pattern.includes("*")) {
    // Get the static prefix (before the *)
    const prefix = pattern.substring(0, pattern.indexOf("*"));
    
    // URL must start with the prefix
    if (!urlPath.startsWith(prefix)) return false;
    
    // Greedy match - everything after prefix matches
    // Also matches the base path if it ends with / (e.g. /derived/ matches /derived/*)
    // Or if urlPath is exactly one char shorter than prefix (removing the trailing slash)
    if (urlPath.length >= prefix.length - 1) return true;
    
    return false;
  }

  // No wildcard, exact match only
  return false;
}

/**
 * Determines which translation namespaces to load based on clientLoad configuration.
 * @param pathname - The current URL pathname
 * @param config - The clientLoad configuration
 * @param isDev - Whether running in development mode
 * @returns Array of namespace prefixes to load
 */
function getClientLoadNamespaces(
  pathname: string,
  config: ClientLoadConfig | undefined,
  isDev: boolean,
): string[] {
  if (!config) return []; // No client loading configured

  const normalizedPath = config.ignoreTrailingSlash
    ? normalizeUrlPath(pathname)
    : pathname;

  const matchedNamespaces: string[] = [...config.always];
  const matchedPatterns: string[] = [];

  // Check each route pattern
  for (const [pattern, namespaces] of Object.entries(config.routes)) {
    const normalizedPattern = config.ignoreTrailingSlash
      ? normalizeUrlPath(pattern)
      : pattern;

    if (matchRoutePattern(normalizedPath, normalizedPattern)) {
      matchedNamespaces.push(...namespaces);
      matchedPatterns.push(pattern);
    }
  }

  // Warn on overlap in dev mode
  if (
    isDev &&
    config.warnOnOverlap !== false &&
    matchedPatterns.length > 1
  ) {
    console.warn(
      `⚠️  Multiple clientLoad route patterns matched ${pathname}:`,
      matchedPatterns,
    );
  }

  // If no routes matched, handle fallback
  if (matchedPatterns.length === 0) {
    const fallback = config.fallback ?? "always-only";
    if (fallback === "all") {
      return []; // Empty array signals "load everything"
    } else if (fallback === "none") {
      return ["__SKIP_INJECTION__"]; // Special signal to skip injection entirely
    }
    // "always-only" - return only the always namespaces (already in array)
  }

  return matchedNamespaces;
}

/**
 * Extracts translation data for specific namespaces (with prefix matching).
 * @param allTranslations - Complete translation data object
 * @param namespaces - Array of namespace prefixes to extract (e.g., ["common", "features.indicators"])
 * @returns Filtered translation object containing only matched namespaces
 * 
 * @example
 * extractNamespaces(
 *   { "common.save": "Save", "features.indicators.title": "Indicators" },
 *   ["common", "features.indicators"]
 * )
 * // Returns: { "common.save": "Save", "features.indicators.title": "Indicators" }
 */
function extractNamespaces(
  allTranslations: Record<string, unknown>,
  namespaces: string[],
): Record<string, unknown> {
  if (namespaces.length === 0) {
    // Empty array means load everything (fallback="all")
    return allTranslations;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(allTranslations)) {
    // Check if key starts with any of the target namespaces
    const matches = namespaces.some((ns) =>
      key === ns || key.startsWith(`${ns}.`)
    );

    if (matches) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Injects client-side translation data into HTML response.
 * @param html - The HTML response body
 * @param translationData - Translation data to inject
 * @param locale - Current locale
 * @param defaultLocale - Default locale
 * @returns Modified HTML with injected script tag
 */
function injectClientTranslations(
  html: string,
  translationData: Record<string, unknown>,
  locale: string,
  defaultLocale: string,
): string {
  // Escape JSON for safe injection (prevent XSS)
  const jsonString = JSON.stringify({
    translations: translationData,
    locale,
    defaultLocale,
  }).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");

  const scriptTag = `<script>window.__I18N__=${jsonString};</script>`;

  // Inject before closing </head> tag or at start of <body> if no </head>
  if (html.includes("</head>")) {
    return html.replace("</head>", `${scriptTag}</head>`);
  } else if (html.includes("<body")) {
    return html.replace(/<body([^>]*)>/, `<body$1>${scriptTag}`);
  }

  // Fallback: prepend to HTML
  return scriptTag + html;
}

function getPreferredLanguage(
  acceptLanguage: string,
  supportedLanguages: string[],
  defaultLanguage: string,
): string {
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, qValue] = lang.trim().split(";q=");
      return {
        code: code.toLowerCase(),
        q: qValue ? parseFloat(qValue) : 1.0,
      };
    })
    .sort((a, b) => b.q - a.q);

  for (const lang of languages) {
    const code = lang.code.split("-")[0];
    if (supportedLanguages.includes(code)) {
      return code;
    }
  }

  return defaultLanguage;
}

/**
 * Creates the i18n middleware plugin for Fresh framework.
 * Automatically detects locale from URL paths and Accept-Language headers,
 * loads translations, and provides them through context state.
 *
 * @template State - Application state type that extends TranslationState
 * @param options - Configuration options for the plugin
 * @returns Fresh middleware function that adds translation functionality to context state
 *
 * @example
 * ```typescript
 * import { App } from "fresh";
 * import { i18nPlugin } from "@xiayun/fresh-i18n";
 *
 * const app = new App();
 * app.use(i18nPlugin({
 *   languages: ["en", "es"],
 *   defaultLanguage: "en",
 *   localesDir: "./locales",
 * }));
 * ```
 */
export const i18nPlugin = <State extends TranslationState = TranslationState>(
  {
    languages,
    defaultLanguage,
    localesDir,
    isProduction,
    fallback,
    showKeysInProd = false,    clientLoad,  }: I18nOptions,
): Middleware<State> => {
  const fallbackConfig: FallbackConfig = {
    enabled: fallback?.enabled ?? false,
    showIndicator: fallback?.showIndicator ?? false,
    indicatorFormat: fallback?.indicatorFormat ??
      ((text: string, locale: string) => `${text} [${locale}]`),
    shouldShowIndicator: fallback?.shouldShowIndicator,
    applyOnDev: fallback?.applyOnDev ?? false,
  };

  return async (ctx) => {
    // Final verification
    try {
      const finalStat = await Deno.stat(localesDir);
      if (!finalStat.isDirectory) {
        throw new Error("Locales directory not found");
      }
    } catch {
      console.error("❌ Could not find locales directory at:", localesDir);
      return await ctx.next() as Response; // Skip i18n if locales not found
    }

    const url = new URL(ctx.req.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);

    // Detect the language from the first path segment
    let lang = languages.includes(pathSegments[0]) ? pathSegments[0] : null;

    // If no language is detected in the URL, determine the user's preferred language
    if (!lang) {
      const acceptLanguage = ctx.req.headers.get("Accept-Language") || "";
      lang = getPreferredLanguage(acceptLanguage, languages, defaultLanguage);
    }

    // Continue processing with the detected language
    const rootPath = "/" + pathSegments.slice(1).join("/");

    ctx.state.path = rootPath;
    ctx.state.locale = lang || defaultLanguage;

    // Use a flat structure for translation data to match what the translate function expects
    const translationData: Record<string, unknown> = {};

    // Helper function to flatten nested objects
    function flattenObject(
      obj: Record<string, unknown>,
      prefix = "",
    ): Record<string, unknown> {
      const flattened: Record<string, unknown> = {};

      for (const key in obj) {
        if (
          obj[key] !== null && typeof obj[key] === "object" &&
          !Array.isArray(obj[key])
        ) {
          Object.assign(
            flattened,
            flattenObject(
              obj[key] as Record<string, unknown>,
              `${prefix}${key}.`,
            ),
          );
        } else if (typeof obj[key] === "string") {
          flattened[`${prefix}${key}`] = obj[key];
        }
      }

      return flattened;
    }

    const loadTranslation = async (
      namespace: string,
      filePath: string,
      targetData: Record<string, unknown>,
      fallbackKeysSet: Set<string>,
      isDefaultLanguage: boolean,
      trackFallbacks: boolean,
    ) => {
      const data = await readJsonFile(filePath);
      if (Object.keys(data).length > 0) {
        const flattenedData = flattenObject(data);

        // Add namespace prefix to all flattened keys
        for (const [key, value] of Object.entries(flattenedData)) {
          const fullKey = `${namespace}.${key}`;
          const existedBefore = fullKey in targetData;

          targetData[fullKey] = value;

          // Track fallback keys inline during merge (only if fallback enabled)
          if (trackFallbacks) {
            if (isDefaultLanguage && !existedBefore) {
              // This is a new key from default language - mark as fallback
              fallbackKeysSet.add(fullKey);
            } else if (!isDefaultLanguage && existedBefore) {
              // Current language is overwriting a key - no longer fallback
              fallbackKeysSet.delete(fullKey);
            }
          }
        }
      }
    };

    // Track which keys are using fallback (for indicator)
    const fallbackKeys = new Set<string>();

    // Discover all translation files in the current locale directory
    const currentLocaleDir = join(localesDir, lang || defaultLanguage);
    const translationFiles = await discoverTranslationFiles(currentLocaleDir);

    // If fallback enabled and not default language, load default language first as base
    if (fallbackConfig.enabled && lang !== defaultLanguage) {
      const defaultLocaleDir = join(localesDir, defaultLanguage);
      const defaultTranslationFiles = await discoverTranslationFiles(defaultLocaleDir);

      for (const [namespace, filePath] of defaultTranslationFiles) {
        await loadTranslation(
          namespace,
          filePath,
          translationData,
          fallbackKeys,
          true,
          true,
        );
      }
    }

    // Load current language translations (overwrites defaults if any)
    for (const [namespace, filePath] of translationFiles) {
      await loadTranslation(
        namespace,
        filePath,
        translationData,
        fallbackKeys,
        false,
        fallbackConfig.enabled ?? false,
      );
    }

    // Store translation data and config in state
    ctx.state.translationData = translationData;
    ctx.state.locale = lang || defaultLanguage;

    // Create pre-configured translate function and store in state
    ctx.state.t = translate(translationData, {
      locale: lang || defaultLanguage,
      defaultLocale: defaultLanguage,
      fallbackKeys: fallbackKeys,
      showKeysInProd: showKeysInProd,
      showFallbackIndicator: fallbackConfig.showIndicator &&
        fallbackConfig.enabled,
      fallbackIndicatorFormat: fallbackConfig.indicatorFormat,
      shouldShowFallbackIndicator: fallbackConfig.shouldShowIndicator,
      applyFallbackOnDev: fallbackConfig.applyOnDev,
      isProduction: isProduction,
    });

    const response = await ctx.next() as Response;

    // If clientLoad is configured, inject translations into HTML
    if (clientLoad && response) {
      const contentType = response.headers.get("content-type");
      
      // Only inject into HTML responses
      if (contentType?.includes("text/html")) {
        const isDev = isProduction ? !isProduction() : true;
        
        // Determine which namespaces to load
        const namespacesToLoad = getClientLoadNamespaces(
          ctx.state.path,
          clientLoad,
          isDev,
        );

        // Skip injection if fallback is "none" and no routes matched
        if (
          namespacesToLoad.length === 1 &&
          namespacesToLoad[0] === "__SKIP_INJECTION__"
        ) {
          return response; // Return response unchanged
        }

        // Extract only the needed translations
        const clientTranslations = extractNamespaces(
          translationData,
          namespacesToLoad,
        );

        // Read response body
        const html = await response.text();
        
        // Inject script tag with translations
        const modifiedHtml = injectClientTranslations(
          html,
          clientTranslations,
          lang || defaultLanguage,
          defaultLanguage,
        );

        // Return modified response
        return new Response(modifiedHtml, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      }
    }

    return response;
  };
};
