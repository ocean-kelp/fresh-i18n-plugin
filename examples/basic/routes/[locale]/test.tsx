/** @jsxImportSource preact */
import { define } from "../../utils.ts";

export default define.page(function TestPage({ state }) {
  const t = state.t;

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
          <p>Key: <code class="test-key">common.actions.save</code></p>
          <p>Result: <span class="test-result">{t("common.actions.save")}</span></p>
          
          <p>Key: <code class="test-key">common.actions.cancel</code></p>
          <p>Result: <span class="test-result">{t("common.actions.cancel")}</span></p>
          
          <p>Key: <code class="test-key">common.actions.edit</code></p>
          <p>Result: <span class="test-result">{t("common.actions.edit")}</span></p>
        </div>

        <div class="test-section">
          <h2>📊 Nested Common States</h2>
          <p>Key: <code class="test-key">common.states.loading</code></p>
          <p>Result: <span class="test-result">{t("common.states.loading")}</span></p>
          
          <p>Key: <code class="test-key">common.states.success</code></p>
          <p>Result: <span class="test-result">{t("common.states.success")}</span></p>
        </div>

        <div class="test-section">
          <h2>🎯 Features Namespace</h2>
          <p>Key: <code class="test-key">features.dashboard.title</code></p>
          <p>Result: <span class="test-result">{t("features.dashboard.title")}</span></p>
          
          <p>Key: <code class="test-key">features.dashboard.welcomeMessage</code></p>
          <p>Result: <span class="test-result">{t("features.dashboard.welcomeMessage")}</span></p>
          
          <p>Key: <code class="test-key">features.dashboard.stats.users</code></p>
          <p>Result: <span class="test-result">{t("features.dashboard.stats.users")}</span></p>
        </div>

        <div class="test-section">
          <h2>📝 Old Common.json (backwards compatibility)</h2>
          <p>Key: <code class="test-key">common.welcome</code></p>
          <p>Result: <span class="test-result">{t("common.welcome")}</span></p>
          
          <p>Key: <code class="test-key">common.hello</code></p>
          <p>Result: <span class="test-result">{t("common.hello")}</span></p>
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
