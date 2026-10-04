"use client";

import {
  COMPLAINT_BUCKET_VARIANT,
  EVENT_VARIANT_CONFIG,
  type EventVariantConfig,
} from "@/frontend/common/views/dashboard/components/navbar/notifications/rows/notificationRowVariants.constants";
import type { NotificationDrawerAlert } from "@/frontend/common/views/dashboard/components/navbar/notifications/types/notificationDrawer.types";
import type { NotificationMetadata } from "@/shared/types/notification-alerts.types";

export type { EventVariantConfig } from "@/frontend/common/views/dashboard/components/navbar/notifications/rows/notificationRowVariants.constants";

export function resolveEventVariant(alert: NotificationDrawerAlert): EventVariantConfig {
  if (alert.type === "complaint" || alert.eventType == null) {
    return COMPLAINT_BUCKET_VARIANT;
  }

  return EVENT_VARIANT_CONFIG[alert.eventType] ?? COMPLAINT_BUCKET_VARIANT;
}

export function isInvoiceMetadata(
  metadata: NotificationMetadata | null | undefined
): metadata is NotificationMetadata & { readonly entityKind: "invoice" } {
  return metadata?.entityKind === "invoice";
}

export function isClassMetadata(
  metadata: NotificationMetadata | null | undefined
): metadata is NotificationMetadata & { readonly entityKind: "class" } {
  return metadata?.entityKind === "class";
}
