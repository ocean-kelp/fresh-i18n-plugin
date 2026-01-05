import { App } from "fresh";
import { i18nPlugin } from "@xingshuu-denofresh/fresh-i18n-plugin";
import { type State } from "./utils.ts";

export const app = new App<State>();

// Configure i18n plugin
app.use(i18nPlugin({
  languages: ["en", "es"],
  defaultLanguage: "en",
  localesDir: "./locales",
}));

await app.listen();
