"use client";

import type { ReactNode } from "react";
import { BaseCard } from "@/frontend/common/components/ui";
import {
  NumberCardContent,
  type NumberCardLabels,
  type NumberCardSyncProps,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCardContent";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";

/** Props for the shared NumberCard component. */
export interface NumberCardProps extends NumberCardSyncProps {
  readonly account: WhatsappAccountRow;
  readonly labels: NumberCardLabels;
  /** Card header action area (platform-specific — icon buttons on desktop). */
  readonly action: ReactNode;
  /** Extra labelled metadata fields (desktop-only: wabaId, phoneNumberId). */
  readonly extraMetadata?: ReactNode;
}

/**
 * Desktop account card: wraps the shell-less `NumberCardContent` in the themed
 * `BaseCard` shell. Mobile hosts the same content inside `MobileCardListItem`,
 * so each tier owns its own card container.
 */
export function NumberCard({
  account,
  labels,
  action,
  extraMetadata,
  syncFailureReason,
  syncDeadlineAt,
  onRetrySetup,
}: Readonly<NumberCardProps>) {
  return (
    <BaseCard>
      <NumberCardContent
        account={account}
        labels={labels}
        action={action}
        extraMetadata={extraMetadata}
        syncFailureReason={syncFailureReason}
        syncDeadlineAt={syncDeadlineAt}
        onRetrySetup={onRetrySetup}
      />
    </BaseCard>
  );
}
