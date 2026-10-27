"use client";

import {
  ManageRecipientsActionShared,
  type ManageRecipientsActionSharedProps,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__/ManageRecipientsActionShared";
import { NumberCardField } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCardContent";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export function AccountIdFields({
  labels,
  account,
}: Readonly<{ readonly labels: WhatsappLabels; readonly account: WhatsappAccountRow }>) {
  return (
    <>
      <NumberCardField label={labels.wabaId} value={account.wabaId ?? "—"} />
      <NumberCardField label={labels.phoneNumberId} value={account.phoneNumberId ?? "—"} />
    </>
  );
}

export function ManageRecipientsAction(props: Omit<ManageRecipientsActionSharedProps, "iconButtonSize">) {
  return <ManageRecipientsActionShared {...props} iconButtonSize="medium" />;
}
