"use client";

import { Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { AdminBillingView } from "@/frontend/views/dashboard/admin/billing/adminBillingView";
import { BillingImpersonationNotice } from "@/frontend/views/dashboard/billing/components/BillingImpersonationNotice";
import { DisplayCurrencyHint } from "@/frontend/views/dashboard/components/DisplayCurrencyHint";
import { FxConversionNote } from "@/frontend/views/dashboard/components/FxConversionNote";

interface AdminBillingContainerProps {
  readonly parentId?: string;
}

export function AdminBillingContainer(_props: AdminBillingContainerProps) {
  const t = useTranslations("dashboard.billing");
  const viewerDisplayCurrency = useUserStore(state => state.displayCurrency);

  return (
    <RequirePermission permissions={[AppPermission.BillingViewHistory]} fallback={null}>
      <DisplayCurrencyHint />
      <FxConversionNote />
      {viewerDisplayCurrency ? (
        <Typography variant="caption" sx={theme => ({ display: "block", mb: 1, color: theme.palette.text.secondary })}>
          {t("adminBillingFxNote")}
        </Typography>
      ) : null}
      <BillingImpersonationNotice />
      <AdminBillingView />
    </RequirePermission>
  );
}
