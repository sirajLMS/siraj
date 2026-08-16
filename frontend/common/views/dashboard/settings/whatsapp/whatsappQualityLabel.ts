import { WhatsappQualityRating } from "@/shared/constants/whatsapp-templates.enum";

const QUALITY_LABEL_KEYS: Readonly<Record<string, string>> = {
  [WhatsappQualityRating.GREEN]: "qualityGreen",
  [WhatsappQualityRating.YELLOW]: "qualityYellow",
  [WhatsappQualityRating.RED]: "qualityRed",
  [WhatsappQualityRating.UNKNOWN]: "qualityUnknown",
} as const;

export function getQualityLabelKey(quality: string): string {
  return QUALITY_LABEL_KEYS[quality?.toUpperCase() ?? ""] ?? "qualityUnknown";
}
