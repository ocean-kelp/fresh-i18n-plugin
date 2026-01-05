import { createDefine } from "fresh";
import type { TranslationState } from "@xingshuu-denofresh/fresh-i18n-plugin";

// This specifies the type of "ctx.state" which is used to share
// data among middlewares, layouts and routes.
export interface State extends TranslationState {
  // Add your custom state properties here
}

export const define = createDefine<State>();
