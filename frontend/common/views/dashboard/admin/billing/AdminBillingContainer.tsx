"use client";

import { Typography } from "@mui/material";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { AdminBillingView } from "@/frontend/common/views/dashboard/admin/billing/AdminBillingView";
import { BillingImpersonationNotice } from "@/frontend/common/views/dashboard/billing/components/BillingImpersonationNotice";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import { FxConversionNote } from "@/frontend/common/views/dashboard/components/FxConversionNote";
import { Translation, useAppTranslation } from "@/shared/locale";

interface AdminBillingContainerProps {
  readonly parentId?: string;
}

export function AdminBillingContainer(_props: AdminBillingContainerProps) {
  const t = useAppTranslation(Translation.Dashboard.Billing);
  const viewerDisplayCurrency = useUserStore(state => state.displayCurrency);

  return (
    <>
      <DisplayCurrencyHint />
      <FxConversionNote />
      {viewerDisplayCurrency ? (
        <Typography variant="caption" sx={theme => ({ display: "block", mb: 1, color: theme.palette.text.secondary })}>
          {t.adminBillingFxNote}
        </Typography>
      ) : null}
      <BillingImpersonationNotice />
      <AdminBillingView />
    </>
  );
}
