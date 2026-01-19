/** @jsxImportSource preact */
import { define } from "../../utils.ts";
import { createNamespacedTranslator } from "@xiayun/fresh-i18n";

export default define.page(function TestPage({ state }) {
  const t = state.t;
  
  // Create namespaced translators to avoid repetition
  const tActions = createNamespacedTranslator(t, "common.actions");
  const tStates = createNamespacedTranslator(t, "common.states");
  const tDashboard = createNamespacedTranslator(t, "features.dashboard");
  const tCommon = createNamespacedTranslator(t, "common");

  return (
    <html>
      <head>
        <title>Nested i18n Test</title>
        <style>{`
          body { font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #333; }
          .test-section { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .test-key { font-family: monospace; background: #e0e0e0; padding: 2px 6px; border-radius: 3px; }
          .test-result { color: #0066cc; font-weight: bold; }
          .success { color: #00aa00; }
          .error { color: #cc0000; }
        `}</style>
      </head>
      <body>
        <h1>Nested Translation Structure Test</h1>
        <p>Current locale: <strong>{state.locale}</strong></p>
        
        <div class="test-section">
          <h2>🗂️ Nested Common Actions</h2>
          <p>Using namespaced translator: <code class="test-key">tActions("save")</code></p>
          <p>Result: <span class="test-result">{tActions("save")}</span></p>
          
          <p>Key: <code class="test-key">tActions("cancel")</code></p>
          <p>Result: <span class="test-result">{tActions("cancel")}</span></p>
          
          <p>Key: <code class="test-key">tActions("edit")</code></p>
          <p>Result: <span class="test-result">{tActions("edit")}</span></p>
        </div>

        <div class="test-section">
          <h2>📊 Nested Common States</h2>
          <p>Key: <code class="test-key">tStates("loading")</code></p>
          <p>Result: <span class="test-result">{tStates("loading")}</span></p>
          
          <p>Key: <code class="test-key">tStates("success")</code></p>
          <p>Result: <span class="test-result">{tStates("success")}</span></p>
        </div>

        <div class="test-section">
          <h2>🎯 Features Namespace</h2>
          <p>Key: <code class="test-key">tDashboard("title")</code></p>
          <p>Result: <span class="test-result">{tDashboard("title")}</span></p>
          
          <p>Key: <code class="test-key">tDashboard("welcomeMessage")</code></p>
          <p>Result: <span class="test-result">{tDashboard("welcomeMessage")}</span></p>
          
          <p>Key: <code class="test-key">tDashboard("stats.users")</code></p>
          <p>Result: <span class="test-result">{tDashboard("stats.users")}</span></p>
        </div>

        <div class="test-section">
          <h2>📝 Old Common.json (backwards compatibility)</h2>
          <p>Key: <code class="test-key">tCommon("welcome")</code></p>
          <p>Result: <span class="test-result">{tCommon("welcome")}</span></p>
          
          <p>Key: <code class="test-key">tCommon("hello")</code></p>
          <p>Result: <span class="test-result">{tCommon("hello")}</span></p>
        </div>

        <div class="test-section">
          <h2>🔗 Language Switch</h2>
          <p>
            <a href="/en/test">English</a> | <a href="/es/test">Español</a>
          </p>
        </div>
      </body>
    </html>
  );
});
