import { assertEquals, assertExists } from "jsr:@std/assert@^1.0.0";
import { i18nContext, getI18nContext } from "../src/context.ts";

Deno.test("context - AsyncLocalStorage is singleton", () => {
  // Import the context module multiple times to simulate different resolution paths
  // In a real scenario, this would happen if the module is loaded from different URLs
  const GLOBAL_CONTEXT_KEY = Symbol.for("fresh-i18n-context");
  
  // Verify that the singleton is registered globally
  assertExists((globalThis as any)[GLOBAL_CONTEXT_KEY]);
  assertEquals((globalThis as any)[GLOBAL_CONTEXT_KEY], i18nContext);
});

Deno.test("context - AsyncLocalStorage stores and retrieves data", async () => {
  const testData = {
    translations: { "test.key": "Test Value" },
    locale: "en",
    defaultLocale: "en",
  };

  // Store data in the context
  await i18nContext.run(testData, () => {
    const retrieved = getI18nContext();
    assertExists(retrieved);
    assertEquals(retrieved.locale, "en");
    assertEquals(retrieved.translations["test.key"], "Test Value");
  });

  // Verify data is not available outside the run context
  const outsideContext = getI18nContext();
  assertEquals(outsideContext, undefined);
});

Deno.test("context - nested contexts work correctly", async () => {
  const outerData = {
    translations: { "outer.key": "Outer Value" },
    locale: "en",
    defaultLocale: "en",
  };

  const innerData = {
    translations: { "inner.key": "Inner Value" },
    locale: "es",
    defaultLocale: "en",
  };

  await i18nContext.run(outerData, async () => {
    const outerContext = getI18nContext();
    assertExists(outerContext);
    assertEquals(outerContext.locale, "en");

    // Run inner context
    await i18nContext.run(innerData, () => {
      const innerContext = getI18nContext();
      assertExists(innerContext);
      assertEquals(innerContext.locale, "es");
      assertEquals(innerContext.translations["inner.key"], "Inner Value");
    });

    // Verify outer context is still intact
    const restoredOuter = getI18nContext();
    assertExists(restoredOuter);
    assertEquals(restoredOuter.locale, "en");
  });
});

Deno.test("context - concurrent contexts are isolated", async () => {
  const promises = [];

  for (let i = 0; i < 5; i++) {
    const testData = {
      translations: { [`key${i}`]: `Value ${i}` },
      locale: `locale${i}`,
      defaultLocale: "en",
    };

    promises.push(
      i18nContext.run(testData, async () => {
        // Simulate async delay
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
        
        const context = getI18nContext();
        assertExists(context);
        assertEquals(context.locale, `locale${i}`);
        assertEquals(context.translations[`key${i}`], `Value ${i}`);
        
        return context.locale;
      })
    );
  }

  const results = await Promise.all(promises);
  
  // Verify all contexts maintained their isolation
  for (let i = 0; i < 5; i++) {
    assertEquals(results[i], `locale${i}`);
  }
});

Deno.test("context - getI18nContext returns undefined when not in run context", () => {
  const context = getI18nContext();
  assertEquals(context, undefined);
});

Deno.test("context - multiple imports reference same singleton", async () => {
  // Dynamically import the context module to simulate multiple loads
  const module1 = await import("../src/context.ts");
  const module2 = await import("../src/context.ts");
  
  // Both imports should reference the exact same AsyncLocalStorage instance
  assertEquals(module1.i18nContext, module2.i18nContext);
  assertEquals(module1.getI18nContext, module2.getI18nContext);
});
