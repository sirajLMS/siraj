"use client";

import { Box, Paper, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";

interface UserBillingProfileViewProps {
  readonly userId: string;
}

export function UserBillingProfileView({ userId }: Readonly<UserBillingProfileViewProps>) {
  const t = useTranslations("dashboard.billing");

  if (!userId) {
    return (
      <PageContainer>
        <Typography sx={theme => ({ color: theme.palette.error.main })}>{t("invalidUserId")}</Typography>
      </PageContainer>
    );
  }

  return (
    <RequirePermission permissions={[AppPermission.UserViewProfile]}>
      <PageContainer>
        <PageHeader title={t("billingProfileTitle")} />

        <Box sx={{ mt: 3 }}>
          <Paper
            elevation={0}
            sx={theme => ({
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.outlineVariant}`,
            })}
          >
            <Typography variant="body1">{t("profileForUser", { userId })}</Typography>
          </Paper>
        </Box>
      </PageContainer>
    </RequirePermission>
  );
}
