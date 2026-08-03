import type { MeetingProviderFieldSchema } from "@/backend/types/meeting/meeting-provider.types";
import type { LocalizedString } from "@/shared/types";

export type MeetingProviderCatalogSeed = {
  readonly slug: string;
  readonly providerKind: "manual" | "zoom_oauth" | "google_meet_oauth" | "microsoft_teams_oauth";
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
    providerKind: "zoom_oauth",
    name: { en: "Zoom", ar: "زووم" },
    description: {
      en: "Zoom video meetings with automatic URL generation",
      ar: "اجتماعات فيديو عبر زووم مع إنشاء روابط تلقائي",
    },
    instructions: {
      en: "Meeting URLs are generated automatically. Configure Zoom credentials in Settings → Meeting Integrations.",
      ar: "تُنشأ روابط الاجتماع تلقائيًا. اضبط بيانات اعتماد زووم في الإعدادات → تكاملات الاجتماعات.",
    },
    urlAllowlist: ["zoom.us"],
    urlExample: "https://zoom.us/j/123456789",
    fieldSchema: {
      requiresMeetingUrl: false,
      supportsAutoGeneration: true,
      supportsUsername: true,
      supportsPassword: true,
    },
  },
  {
    slug: "google_meet",
    providerKind: "google_meet_oauth",
    name: { en: "Google Meet", ar: "جوجل ميت" },
    description: {
      en: "Google Meet video meetings with automatic URL generation",
      ar: "اجتماعات فيديو عبر جوجل ميت مع إنشاء روابط تلقائي",
    },
    instructions: {
      en: "Meeting URLs are generated automatically. Configure Google Meet credentials in Settings → Meeting Integrations.",
      ar: "تُنشأ روابط الاجتماع تلقائيًا. اضبط بيانات اعتماد جوجل ميت في الإعدادات → تكاملات الاجتماعات.",
    },
    urlAllowlist: ["meet.google.com"],
    urlExample: "https://meet.google.com/abc-defg-hij",
    fieldSchema: {
      requiresMeetingUrl: false,
      supportsAutoGeneration: true,
    },
  },
  {
    slug: "microsoft_teams",
    providerKind: "microsoft_teams_oauth",
    name: { en: "Microsoft Teams", ar: "مايكروسوفت تيمز" },
    description: {
      en: "Microsoft Teams meetings with automatic URL generation",
      ar: "اجتماعات مايكروسوفت تيمز مع إنشاء روابط تلقائي",
    },
    instructions: {
      en: "Meeting URLs are generated automatically. Configure Microsoft Teams credentials in Settings → Meeting Integrations.",
      ar: "تُنشأ روابط الاجتماع تلقائيًا. اضبط بيانات اعتماد مايكروسوفت تيمز في الإعدادات → تكاملات الاجتماعات.",
    },
    urlAllowlist: ["teams.microsoft.com"],
    urlExample: "https://teams.microsoft.com/l/meetup-join/...",
    fieldSchema: {
      requiresMeetingUrl: false,
      supportsAutoGeneration: true,
      supportsTenantId: true,
    },
  },
] as const;
