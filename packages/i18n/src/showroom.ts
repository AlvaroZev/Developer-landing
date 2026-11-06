import type { Locale } from "@triunder/domain";
import { en, type MessageTree } from "./locales/en.js";
import { es } from "./locales/es.js";

const catalogs: Record<Locale, MessageTree> = { en, es };

export type { MessageTree };
export { en, es };

export function getMessages(locale: Locale): MessageTree {
  return catalogs[locale] ?? catalogs.en;
}

export function t(messages: MessageTree, path: string): string {
  const parts = path.split(".");
  let node: unknown = messages;
  for (const part of parts) {
    if (node && typeof node === "object" && part in node) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof node === "string" ? node : path;
}
