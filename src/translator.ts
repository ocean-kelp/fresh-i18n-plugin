/**
 * Configuration options for the translate function.
 * All properties are optional.
 */
export interface TranslationConfig {
  /** Current locale code */
  locale?: string;
  /** Default locale for fallback translations */
  defaultLocale?: string;
  /** Set of translation keys that are using fallback values */
  fallbackKeys?: Set<string>;
  /** Whether to show translation keys in production mode */
  showKeysInProd?: boolean;
  /** Whether to show indicators on fallback translations */
  showFallbackIndicator?: boolean;
  /** Custom function to format fallback indicators */
  fallbackIndicatorFormat?: (text: string, defaultLocale: string) => string;
  /** Function to determine if indicator should be shown for specific text */
  shouldShowFallbackIndicator?: (text: string, locale: string) => boolean;
  /** Apply fallback behavior in development mode */
  applyFallbackOnDev?: boolean;
  /** Custom function to check if running in production */
  isProduction?: () => boolean;
}

/**
 * Creates a translator function for flat key structure.
 * @param translationData - The flat translation object with dot-separated keys.
 * @param config - Translation configuration (all optional).
 * @returns A function that takes a translation key and returns the translated string.
 */
export function translate(
  translationData: Record<string, unknown>,
  config?: TranslationConfig,
): (key: string) => string {
  const {
    locale,
    defaultLocale,
    fallbackKeys,
    showKeysInProd = false,
    showFallbackIndicator = false,
    fallbackIndicatorFormat,
    shouldShowFallbackIndicator,
    applyFallbackOnDev = false,
    isProduction,
  } = config ?? {};

  const localeInfo = locale ? ` [locale: ${locale}]` : "";

  // Check if running in production mode
  // Use custom function if provided, otherwise default to false (development mode)
  const isProd = isProduction ? isProduction() : false;

  // Determine if we should use production behavior
  const useProductionBehavior = isProd || applyFallbackOnDev;

  return (key: string): string => {
    // First, try to find the key directly (for flat key structure)
    if (key in translationData) {
      const value = translationData[key];
      if (typeof value === "string") {
        // If showing fallback indicator and this key is a fallback
        if (
          useProductionBehavior &&
          showFallbackIndicator &&
          fallbackKeys?.has(key) &&
          defaultLocale &&
          fallbackIndicatorFormat
        ) {
          // If shouldShowFallbackIndicator function is provided, check if we should show
          // Otherwise, always show the indicator
          if (!shouldShowFallbackIndicator || shouldShowFallbackIndicator(value, defaultLocale)) {
            return fallbackIndicatorFormat(value, defaultLocale);
          }
        }
        return value;
      } else {
        // Show warnings in development (both server and client side)
        if (!useProductionBehavior) {
          console.warn(
            `❌ Translation key "${key}" exists but is not a string value${localeInfo}`,
          );
          console.warn(`   Expected: string, Got:`, typeof value, value);
          console.warn(
            `   📁 Root keys in translation data:`,
            Object.keys(translationData),
          );
        }

        // Development: show key in UI, Production: return empty string
        return useProductionBehavior ? "" : `[${key}]`;
      }
    }

    // Key not found - show warnings in development
    if (!useProductionBehavior) {
      console.warn(`❌ Missing translation key: "${key}"${localeInfo}`);
    }

    // Production behavior: show key if showKeysInProd is enabled, otherwise empty string
    if (useProductionBehavior && showKeysInProd) {
      return `[${key}]`;
    }

    // Development: show key in UI, Production: return empty string
    return useProductionBehavior ? "" : `[${key}]`;
  };
}
