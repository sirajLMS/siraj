/**
 * Path, CLDR, and override constants for scripts/generate-iana-timezone-enum.ts.
 */

import { join } from "node:path";

export const ROOT = join(import.meta.dir, "..");
export const SHARED_IDS_OUTPUT = join(ROOT, "shared/constants/iana-timezones.ts");
export const SHARED_LABELS_OUTPUT = join(ROOT, "shared/constants/iana-timezone-labels.ts");
export const SHARED_TERRITORIES_OUTPUT = join(ROOT, "shared/constants/iana-timezone-territories.ts");
export const SHARED_ENUM_OUTPUT = join(ROOT, "shared/constants/iana-timezone.enum.ts");

export const CLDR_AR_TIMEZONES_PATH = join(ROOT, "node_modules/cldr-dates-full/main/ar/timeZoneNames.json");
export const CLDR_AR_TERRITORIES_PATH = join(ROOT, "node_modules/cldr-localenames-full/main/ar/territories.json");
export const CLDR_WINDOWS_ZONES_PATH = join(ROOT, "node_modules/cldr-core/supplemental/windowsZones.json");

export const REGION_LABELS_AR: Record<string, string> = {
  Africa: "أفريقيا",
  America: "أمريكا",
  Antarctica: "أنتاركتيكا",
  Arctic: "القطب الشمالي",
  Asia: "آسيا",
  Atlantic: "الأطلسي",
  Australia: "أستراليا",
  Europe: "أوروبا",
  Indian: "المحيط الهندي",
  Pacific: "المحيط الهادئ",
  Etc: "إلخ",
  UTC: "UTC",
};

/** CLDR uses legacy city keys for some renamed IANA zones. */
export const CITY_ALIASES: Record<string, string> = {
  Asmara: "Asmera",
  Nuuk: "Godthab",
  Ho_Chi_Minh: "Saigon",
  Kolkata: "Calcutta",
  Kathmandu: "Katmandu",
  Yangon: "Rangoon",
  Kyiv: "Kiev",
  Chuuk: "Truk",
  Pohnpei: "Ponape",
  Kanton: "Enderbury",
  Faroe: "Faeroe",
  Choibalsan: "Ulaanbaatar",
};

/** IANA path segments mapped to CLDR territory codes for Arabic subdivision labels. */
export const SEGMENT_TERRITORY: Record<string, string> = {
  Argentina: "AR",
};

/** Static Arabic labels for path segments without CLDR exemplarCity entries. */
export const SEGMENT_STATIC_AR: Record<string, string> = {
  Indiana: "إنديانا",
  Kentucky: "كنتاكي",
  North_Dakota: "داكوتا الشمالية",
  Atikokan: "أتيكوكان",
};

/** Manual ISO 3166-1 alpha-2 overrides for zones missing from CLDR windowsZones. */
export const EXCLUDED_TERRITORY_CODES = new Set(["IL"]);

export const TERRITORY_OVERRIDES: Record<string, string | null> = {
  "Africa/Asmara": "ER",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Argentina/Catamarca": "AR",
  "America/Argentina/Cordoba": "AR",
  "America/Argentina/Jujuy": "AR",
  "America/Argentina/Mendoza": "AR",
  "America/Atikokan": "CA",
  "America/Indiana/Indianapolis": "US",
  "America/Kentucky/Louisville": "US",
  "America/Nuuk": "GL",
  "Antarctica/Troll": "AQ",
  "Asia/Choibalsan": "MN",
  "Asia/Ho_Chi_Minh": "VN",
  "Asia/Kathmandu": "NP",
  "Asia/Kolkata": "IN",
  "Asia/Yangon": "MM",
  "Atlantic/Faroe": "FO",
  "Europe/Kyiv": "UA",
  "Pacific/Chuuk": "FM",
  "Pacific/Kanton": "KI",
  "Pacific/Pohnpei": "FM",
  UTC: null,
};

export type IanaTimezoneLabels = {
  readonly en: string;
  readonly ar: string;
};
