import { languages } from "@/frontend/common/lib/locale/language/languages";

const FALLBACK_LANGUAGE_EMOJI = "🌐";

const languageEmojiMap: ReadonlyMap<string, string> = new Map(
  languages.map(({ code, emoji }) => [code as string, emoji])
);

/** Look up the representative flag emoji for a known app language. */
export function getLanguageEmoji(languageCode: string): string {
  return languageEmojiMap.get(languageCode) ?? FALLBACK_LANGUAGE_EMOJI;
}
