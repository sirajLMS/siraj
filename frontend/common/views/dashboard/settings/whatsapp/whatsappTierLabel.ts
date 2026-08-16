import { WhatsappLimitTier } from "@/shared/constants/whatsapp-templates.enum";

const TIER_LABEL_KEYS: Readonly<Record<string, string>> = {
  [WhatsappLimitTier.TIER_50]: "tier50",
  [WhatsappLimitTier.TIER_250]: "tier250",
  [WhatsappLimitTier.TIER_1K]: "tier1K",
  [WhatsappLimitTier.TIER_10K]: "tier10K",
  [WhatsappLimitTier.TIER_100K]: "tier100K",
  [WhatsappLimitTier.TIER_UNLIMITED]: "tierUnlimited",
  [WhatsappLimitTier.UNTIERED]: "tierUnknown",
  [WhatsappLimitTier.TIER_NOT_SET]: "tierUnknown",
} as const;

export function getTierLabelKey(tier: string): string {
  return TIER_LABEL_KEYS[tier?.toUpperCase() ?? ""] ?? "tierUnknown";
}
