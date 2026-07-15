"use client";

import { Typography } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { AdminBillingView } from "@/frontend/common/views/dashboard/admin/billing/adminBillingView";
import { BillingImpersonationNotice } from "@/frontend/common/views/dashboard/billing/components/BillingImpersonationNotice";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import { FxConversionNote } from "@/frontend/common/views/dashboard/components/FxConversionNote";
import { useAppTranslation } from "@/shared/locale/client";

interface AdminBillingContainerProps {
  readonly parentId?: string;
}

export function AdminBillingContainer(_props: AdminBillingContainerProps) {
  const t = useAppTranslation("dashboard.billing");
  const viewerDisplayCurrency = useUserStore(state => state.displayCurrency);

  return (
    <RequirePermission permissions={[AppPermission.BillingViewHistory]} fallback={null}>
      <DisplayCurrencyHint />
      <FxConversionNote />
      {viewerDisplayCurrency ? (
        <Typography variant="caption" sx={theme => ({ display: "block", mb: 1, color: theme.palette.text.secondary })}>
          {t.adminBillingFxNote}
        </Typography>
      ) : null}
      <BillingImpersonationNotice />
      <AdminBillingView />
    </RequirePermission>
  );
}
