import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { translate } from "../src/translator.ts";

Deno.test("translate - basic key lookup", () => {
  const translationData = {
    "common.hello": "Hello",
    "common.goodbye": "Goodbye",
  };

  const t = translate(translationData);
  assertEquals(t("common.hello"), "Hello");
  assertEquals(t("common.goodbye"), "Goodbye");
});

Deno.test("translate - nested key lookup", () => {
  const translationData = {
    "common.nav.home": "Home",
    "common.nav.about": "About",
  };

  const t = translate(translationData);
  assertEquals(t("common.nav.home"), "Home");
  assertEquals(t("common.nav.about"), "About");
});

Deno.test("translate - missing key in development mode", () => {
  const translationData = { "common.hello": "Hello" };

  const t = translate(translationData, {
    isProduction: () => false,
  });

  assertEquals(t("missing.key"), "[missing.key]");
});

Deno.test("translate - missing key in production mode (empty string)", () => {
  const translationData = { "common.hello": "Hello" };

  const t = translate(translationData, {
    isProduction: () => true,
    showKeysInProd: false,
  });

  assertEquals(t("missing.key"), "");
});

Deno.test("translate - missing key in production with showKeysInProd", () => {
  const translationData = { "common.hello": "Hello" };

  const t = translate(translationData, {
    isProduction: () => true,
    showKeysInProd: true,
  });

  assertEquals(t("missing.key"), "[missing.key]");
});

Deno.test("translate - fallback indicator without condition", () => {
  const fallbackKeys = new Set(["common.hello"]);
  const translationData = {
    "common.hello": "Hello from default language",
  };

  const t = translate(translationData, {
    locale: "es",
    defaultLocale: "en",
    fallbackKeys,
    showFallbackIndicator: true,
    fallbackIndicatorFormat: (text, locale) => `${text} [${locale}]`,
    isProduction: () => true,
  });

  assertEquals(t("common.hello"), "Hello from default language [en]");
});

Deno.test("translate - fallback indicator with condition (show)", () => {
  const fallbackKeys = new Set(["common.welcome"]);
  const translationData = {
    "common.welcome": "Welcome to our application",
  };

  const t = translate(translationData, {
    locale: "es",
    defaultLocale: "en",
    fallbackKeys,
    showFallbackIndicator: true,
    fallbackIndicatorFormat: (text, locale) => `${text} [${locale}]`,
    shouldShowFallbackIndicator: (text) => text.split(/\s+/).length >= 3,
    isProduction: () => true,
  });

  assertEquals(t("common.welcome"), "Welcome to our application [en]");
});

Deno.test("translate - fallback indicator with condition (hide)", () => {
  const fallbackKeys = new Set(["common.hi"]);
  const translationData = {
    "common.hi": "Hi",
  };

  const t = translate(translationData, {
    locale: "es",
    defaultLocale: "en",
    fallbackKeys,
    showFallbackIndicator: true,
    fallbackIndicatorFormat: (text, locale) => `${text} [${locale}]`,
    shouldShowFallbackIndicator: (text) => text.split(/\s+/).length >= 3,
    isProduction: () => true,
  });

  // Should not show indicator because text is too short
  assertEquals(t("common.hi"), "Hi");
});

Deno.test("translate - non-fallback key with indicator config", () => {
  const fallbackKeys = new Set(["common.other"]);
  const translationData = {
    "common.hello": "Hello",
  };

  const t = translate(translationData, {
    locale: "es",
    defaultLocale: "en",
    fallbackKeys,
    showFallbackIndicator: true,
    fallbackIndicatorFormat: (text, locale) => `${text} [${locale}]`,
    isProduction: () => true,
  });

  // Should not show indicator because this key is not a fallback
  assertEquals(t("common.hello"), "Hello");
});

Deno.test("translate - invalid value type returns empty in production", () => {
  const translationData = {
    "common.invalid": 123, // Not a string
  };

  const t = translate(translationData, {
    isProduction: () => true,
  });

  assertEquals(t("common.invalid"), "");
});

Deno.test("translate - invalid value type shows key in development", () => {
  const translationData = {
    "common.invalid": 123, // Not a string
  };

  const t = translate(translationData, {
    isProduction: () => false,
  });

  assertEquals(t("common.invalid"), "[common.invalid]");
});

Deno.test("translate - empty translation data", () => {
  const t = translate({}, {
    isProduction: () => false,
  });

  assertEquals(t("any.key"), "[any.key]");
});

Deno.test("translate - custom indicator format", () => {
  const fallbackKeys = new Set(["common.title"]);
  const translationData = {
    "common.title": "Welcome",
  };

  const t = translate(translationData, {
    locale: "fr",
    defaultLocale: "en",
    fallbackKeys,
    showFallbackIndicator: true,
    fallbackIndicatorFormat: (text, locale) => `${text} · ${locale.toUpperCase()}`,
    isProduction: () => true,
  });

  assertEquals(t("common.title"), "Welcome · EN");
});

// ========== Namespaced Translator Tests ==========

import { createNamespacedTranslator } from "../src/translator.ts";

Deno.test("createNamespacedTranslator - basic usage", () => {
  const translationData = {
    "common.actions.save": "Save",
    "common.actions.cancel": "Cancel",
    "common.states.loading": "Loading...",
  };

  const t = translate(translationData);
  const tActions = createNamespacedTranslator(t, "common.actions");
  
  assertEquals(tActions("save"), "Save");
  assertEquals(tActions("cancel"), "Cancel");
});

Deno.test("createNamespacedTranslator - nested namespaces", () => {
  const translationData = {
    "indicatorsPage.form.save": "Save Indicator",
    "indicatorsPage.form.cancel": "Cancel",
  };

  const t = translate(translationData);
  const tIndicators = createNamespacedTranslator(t, "indicatorsPage");
  const tForm = createNamespacedTranslator(tIndicators, "form");
  
  assertEquals(tForm("save"), "Save Indicator");
  assertEquals(tForm("cancel"), "Cancel");
});

Deno.test("createNamespacedTranslator - multiple namespaced translators", () => {
  const translationData = {
    "common.actions.edit": "Edit",
    "common.actions.delete": "Delete",
    "common.states.loading": "Loading...",
    "common.states.success": "Success!",
  };

  const t = translate(translationData);
  const tActions = createNamespacedTranslator(t, "common.actions");
  const tStates = createNamespacedTranslator(t, "common.states");
  
  assertEquals(tActions("edit"), "Edit");
  assertEquals(tActions("delete"), "Delete");
  assertEquals(tStates("loading"), "Loading...");
  assertEquals(tStates("success"), "Success!");
});

Deno.test("createNamespacedTranslator - missing key shows full path in dev", () => {
  const translationData = {
    "common.actions.save": "Save",
  };

  const t = translate(translationData, { isProduction: () => false });
  const tActions = createNamespacedTranslator(t, "common.actions");
  
  // Should show full namespaced key when missing
  assertEquals(tActions("nonexistent"), "[common.actions.nonexistent]");
});

Deno.test("createNamespacedTranslator - empty key uses namespace itself", () => {
  const translationData = {
    "common.actions": "Actions Menu",
  };

  const t = translate(translationData);
  const tActions = createNamespacedTranslator(t, "common.actions");
  
  assertEquals(tActions(""), "Actions Menu");
});
