"use client";

import { Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { PageContainer, PageHeader } from "@/frontend/common/components/ui";
import { AppPermission, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { PaymentMethodsManager } from "@/frontend/common/views/dashboard/profile/shared/payment-methods";

type PaymentMethodsTabProps = {
  readonly targetUserId: string;
  readonly scope: ProfileScope;
  readonly slot: "payin" | "payout";
};

export function PaymentMethodsTab({ targetUserId, scope, slot }: PaymentMethodsTabProps) {
  const t = useTranslations("profile.shell.tabs");
  const { user, hasPermission } = useUserStore();

  const canManage =
    scope === ProfileScope.Own ? user?.id === targetUserId : hasPermission(AppPermission.UserEditProfile);

  return (
    <PageContainer>
      <Stack spacing={3}>
        <PageHeader title={t("paymentMethods")} />
        <PaymentMethodsManager targetUserId={targetUserId} slot={slot} canManage={canManage} />
      </Stack>
    </PageContainer>
  );
}
