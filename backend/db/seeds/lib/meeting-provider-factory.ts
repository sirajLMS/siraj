import type { MeetingProviderFieldSchema } from "@/backend/types/meeting/meeting-provider.types";
import type { LocalizedString } from "@/backend/types/shared/localized-string.types";

export type MeetingProviderCatalogSeed = {
  readonly slug: string;
  readonly name: LocalizedString;
  readonly description: LocalizedString;
  readonly instructions: LocalizedString;
  readonly urlAllowlist: readonly string[];
  readonly urlExample: string;
  readonly fieldSchema: MeetingProviderFieldSchema;
};

export const MEETING_PROVIDER_CATALOG_SEEDS: readonly MeetingProviderCatalogSeed[] = [
  {
    slug: "zoom",
    name: { en: "Zoom", ar: "زووم" },
    description: { en: "Zoom video meetings", ar: "اجتماعات فيديو عبر زووم" },
    instructions: { en: "Paste your personal Zoom meeting link.", ar: "ألصق رابط اجتماع زووم الشخصي." },
    urlAllowlist: ["zoom.us"],
    urlExample: "https://zoom.us/j/123456789",
    fieldSchema: {
      requiresMeetingUrl: true,
      supportsUsername: true,
      supportsPassword: true,
    },
  },
  {
    slug: "google_meet",
    name: { en: "Google Meet", ar: "جوجل ميت" },
    description: { en: "Google Meet video meetings", ar: "اجتماعات فيديو عبر جوجل ميت" },
    instructions: { en: "Paste your Google Meet link.", ar: "ألصق رابط جوجل ميت." },
    urlAllowlist: ["meet.google.com"],
    urlExample: "https://meet.google.com/abc-defg-hij",
    fieldSchema: {
      requiresMeetingUrl: true,
    },
  },
  {
    slug: "microsoft_teams",
    name: { en: "Microsoft Teams", ar: "مايكروسوفت تيمز" },
    description: { en: "Microsoft Teams meetings", ar: "اجتماعات مايكروسوفت تيمز" },
    instructions: { en: "Paste your Teams meeting link.", ar: "ألصق رابط اجتماع تيمز." },
    urlAllowlist: ["teams.microsoft.com"],
    urlExample: "https://teams.microsoft.com/l/meetup-join/...",
    fieldSchema: {
      requiresMeetingUrl: true,
      supportsTenantId: true,
    },
  },
] as const;
