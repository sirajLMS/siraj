import type { StatusBadgeCategory } from "@/frontend/common/components/ui/badge/StatusBadge";
import { WhatsappTemplateStatus } from "@/shared/constants/whatsapp-templates.enum";

/**
 * Status badge configuration for WhatsApp template statuses.
 *
 * Maps each `WhatsappTemplateStatus` value to a `StatusBadgeCategory` + semantic
 * status key that `StatusBadge` / `resolveStatusPaletteKey` understands. The
 * `label` field is intentionally the raw enum value — Task 11 (Phase 3) will
 * replace it with an i18n key lookup via `getTemplateStatusLabelKey`.
 *
 * Uses the `syncStatus` category because it supports the full range of semantic
 * states (success/running/partial/failed/unknown) that map cleanly to template
 * approval lifecycle stages:
 * - APPROVED → success (green)
 * - PENDING  → running (amber)
 * - REJECTED → failed (red)
 * - PAUSED   → partial (confirmed/teal)
 * - PENDING_DELETION → unknown (grey)
 * - DISABLED         → unknown (grey)
 */
export interface WhatsappStatusBadgeConfig {
  readonly category: StatusBadgeCategory;
  readonly status: string;
  /**
   * Display label. Currently the raw enum value — Task 11 will replace this
   * with the localized string from `getTemplateStatusLabelKey(status)`.
   */
  readonly label: string;
}

const SYNC_STATUS = "syncStatus" as const satisfies StatusBadgeCategory;

/**
 * Record mapping each `WhatsappTemplateStatus` enum value to its `StatusBadge`
 * configuration. Keyed by the enum string value (e.g. `"APPROVED"`).
 */
const WHATSAPP_TEMPLATE_STATUS_BADGE: Readonly<Record<WhatsappTemplateStatus, WhatsappStatusBadgeConfig>> = {
  [WhatsappTemplateStatus.APPROVED]: {
    category: SYNC_STATUS,
    status: "success",
    label: WhatsappTemplateStatus.APPROVED,
  },
  [WhatsappTemplateStatus.PENDING]: {
    category: SYNC_STATUS,
    status: "running",
    label: WhatsappTemplateStatus.PENDING,
  },
  [WhatsappTemplateStatus.REJECTED]: {
    category: SYNC_STATUS,
    status: "failed",
    label: WhatsappTemplateStatus.REJECTED,
  },
  [WhatsappTemplateStatus.PAUSED]: {
    category: SYNC_STATUS,
    status: "partial",
    label: WhatsappTemplateStatus.PAUSED,
  },
  [WhatsappTemplateStatus.PENDING_DELETION]: {
    category: SYNC_STATUS,
    status: "unknown",
    label: WhatsappTemplateStatus.PENDING_DELETION,
  },
  [WhatsappTemplateStatus.DISABLED]: {
    category: SYNC_STATUS,
    status: "unknown",
    label: WhatsappTemplateStatus.DISABLED,
  },
};

/**
 * Type guard: narrows a string to `WhatsappTemplateStatus`.
 */
function isWhatsappTemplateStatus(value: string): value is WhatsappTemplateStatus {
  return value in WHATSAPP_TEMPLATE_STATUS_BADGE;
}

/**
 * Default config for unknown/null template statuses.
 * Falls back to a neutral grey badge with the raw status string (or "—").
 */
export function getWhatsappTemplateStatusBadgeConfig(status: string | null): WhatsappStatusBadgeConfig {
  if (status && isWhatsappTemplateStatus(status)) {
    return WHATSAPP_TEMPLATE_STATUS_BADGE[status];
  }
  return {
    category: SYNC_STATUS,
    status: "unknown",
    label: status ?? "—",
  };
}

/**
 * Status badge config for WhatsApp account active/inactive state.
 *
 * - Active   → success (green)
 * - Inactive → failed  (red/grey)
 *
 * The `label` is currently the raw boolean-derived string ("true"/"false").
 * Task 11 will replace this with localized `t.isActive` / `t.isInactive`.
 */
export function getWhatsappAccountStatusBadgeConfig(isActive: boolean | null): WhatsappStatusBadgeConfig {
  const active = isActive ?? false;
  return {
    category: SYNC_STATUS,
    status: active ? "success" : "failed",
    label: String(active),
  };
}
