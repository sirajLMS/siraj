import type { StatusBadgeCategory } from "@/frontend/common/components/ui/badge/StatusBadge";
import { WhatsappTemplateStatus } from "@/shared/constants/whatsapp-templates.enum";

/**
 * Status badge configuration for WhatsApp template statuses.
 *
 * Maps each `WhatsappTemplateStatus` value to a `StatusBadgeCategory` + semantic
 * status key that `StatusBadge` / `resolveStatusPaletteKey` understands. The
 * `label` field carries the raw enum value; presentation layers are expected
 * to override it with the localized template-status label.
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
   * Display label. Carries the raw enum/status value; callers that have the
   * whatsapp locale labels should pass a localized label instead.
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
 * `label` falls back to a display-safe placeholder; callers overlay the
 * localized active/inactive label from the whatsapp namespace.
 */
export function getWhatsappAccountStatusBadgeConfig(isActive: boolean | null): WhatsappStatusBadgeConfig {
  const active = isActive ?? false;
  return {
    category: SYNC_STATUS,
    status: active ? "success" : "failed",
    label: "—",
  };
}

/**
 * Coexistence sync lifecycle (`WhatsappSyncStatus`) → badge config:
 * - NOT_STARTED → unknown (grey)
 * - REQUESTED / SYNCING → running (amber)
 * - COMPLETE → success (green)
 * - FAILED → failed (red)
 */
const WHATSAPP_SYNC_STATUS_BADGE: Readonly<Record<string, string>> = {
  NOT_STARTED: "unknown",
  REQUESTED: "running",
  SYNCING: "running",
  COMPLETE: "success",
  FAILED: "failed",
};

/**
 * Badge config for an account's coexistence sync status. The `label` is the
 * raw status value — callers overlay the localized label via the sync-status
 * label-key helpers.
 */
export function getWhatsappSyncStatusBadgeConfig(syncStatus: string | null): WhatsappStatusBadgeConfig {
  return {
    category: SYNC_STATUS,
    status: (syncStatus ? WHATSAPP_SYNC_STATUS_BADGE[syncStatus] : undefined) ?? "unknown",
    label: syncStatus ?? "—",
  };
}

/** MUI `Alert` severities supported by the coexistence sync-state panels. */
export type WhatsappSyncAlertSeverity = "info" | "success" | "error";

/**
 * Coexistence sync lifecycle → alert severity for the sync-state detail
 * panels, kept in step with the badge mapping above:
 * - REQUESTED / SYNCING → info (in-flight)
 * - COMPLETE → success
 * - FAILED → error
 */
const WHATSAPP_SYNC_STATUS_ALERT_SEVERITY: Readonly<Record<string, WhatsappSyncAlertSeverity>> = {
  REQUESTED: "info",
  SYNCING: "info",
  COMPLETE: "success",
  FAILED: "error",
};

/**
 * Alert severity for a sync-state detail panel, or `null` when the status
 * has no panel (NOT_STARTED or unknown) — the badge row alone covers those.
 */
export function getWhatsappSyncStatusAlertSeverity(syncStatus: string | null): WhatsappSyncAlertSeverity | null {
  return (syncStatus ? WHATSAPP_SYNC_STATUS_ALERT_SEVERITY[syncStatus] : undefined) ?? null;
}

/**
 * Routing purpose → badge config. Purpose is an attribute (not a lifecycle),
 * so it maps onto the neutral-to-affirmative span of the sync category:
 * - GENERAL → unknown (neutral grey)
 * - STUDENTS → partial (teal)
 * - ADVERTISING → success (green)
 */
const WHATSAPP_PURPOSE_BADGE: Readonly<Record<string, string>> = {
  GENERAL: "unknown",
  STUDENTS: "partial",
  ADVERTISING: "success",
};

/**
 * Badge config for an account's routing purpose. The `label` is the raw
 * purpose value — callers overlay the localized label via the purpose
 * label-key helpers.
 */
export function getWhatsappPurposeBadgeConfig(purpose: string | null): WhatsappStatusBadgeConfig {
  return {
    category: SYNC_STATUS,
    status: (purpose ? WHATSAPP_PURPOSE_BADGE[purpose] : undefined) ?? "unknown",
    label: purpose ?? "—",
  };
}
