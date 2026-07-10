"use client";

import { Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { PaymentMethodsView } from "@/frontend/views/dashboard/profile/teacher/payment-methods/PaymentMethodsView";

type PaymentMethodsTabProps = {
  readonly targetUserId: string;
};

export function PaymentMethodsTab({ targetUserId }: PaymentMethodsTabProps) {
  const t = useTranslations("profile.banking");

  return (
    <PageContainer>
      <Stack spacing={3}>
        <PageHeader title={t("title")} />
        <PaymentMethodsView targetUserId={targetUserId} />
      </Stack>
    </PageContainer>
  );
}
