/** Meta template status values (reproduced from Meta Cloud API docs). */
export enum WhatsappTemplateStatus {
  APPROVED = "APPROVED",
  PENDING = "PENDING",
  REJECTED = "REJECTED",
  PAUSED = "PAUSED",
  PENDING_DELETION = "PENDING_DELETION",
  DISABLED = "DISABLED",
}

/** Meta template category values. */
export enum WhatsappTemplateCategory {
  MARKETING = "MARKETING",
  UTILITY = "UTILITY",
  AUTHENTICATION = "AUTHENTICATION",
}

/** Meta messaging limit tier values (stored verbatim per Q5). */
export enum WhatsappLimitTier {
  UNTIERED = "UNTIERED",
  TIER_50 = "TIER_50",
  TIER_250 = "TIER_250",
  TIER_1K = "TIER_1K",
  TIER_10K = "TIER_10K",
  TIER_100K = "TIER_100K",
  TIER_UNLIMITED = "TIER_UNLIMITED",
  TIER_NOT_SET = "TIER_NOT_SET",
}

/** Meta quality rating values. */
export enum WhatsappQualityRating {
  GREEN = "GREEN",
  YELLOW = "YELLOW",
  RED = "RED",
  UNKNOWN = "UNKNOWN",
}
