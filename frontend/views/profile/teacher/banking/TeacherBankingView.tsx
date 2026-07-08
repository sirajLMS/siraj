"use client";

import {
  AccountBalanceOutlined,
  CheckCircleOutlined,
  EditNoteOutlined,
  LockOutlined,
  ShieldOutlined,
  VisibilityOffOutlined,
} from "@mui/icons-material";
import { Box, Button, Grid, Paper, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { ProfileByUserIdQuery } from "@/frontend/graphql/generated/gql/operations";
import { Link } from "@/shared/i18n/routing";

type BankingSummary = NonNullable<NonNullable<ProfileByUserIdQuery["profileByUserId"]>["bankingSummary"]>;

type TeacherBankingViewProps = {
  readonly banking: BankingSummary;
  readonly targetUserId: string;
  readonly mode: "view" | "edit";
};

type BankingFieldProps = {
  readonly label: string;
  readonly value: string | null | undefined;
  readonly masked?: boolean;
  readonly monospace?: boolean;
  readonly optional?: boolean;
};

function BankingField({ label, value, masked = false, monospace = false, optional = false }: BankingFieldProps) {
  const t = useTranslations("profile");
  const displayValue = value?.trim() ? value : optional ? t("banking.notProvided") : t("notSet");

  return (
    <Box>
      <Typography
        sx={{
          typography: "labelSm",
          color: theme => theme.palette.text.secondary,
          textTransform: "uppercase",
          mb: 0.75,
        }}
      >
        {label}
      </Typography>
      <Box
        sx={theme => ({
          p: 1.5,
          borderRadius: 1,
          border: `1px solid ${theme.palette.outlineVariant}`,
          bgcolor: theme.palette.surfaceContainerLow,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        })}
      >
        <Typography
          sx={{
            typography: "bodyMd",
            fontFamily: monospace ? "monospace" : undefined,
            fontStyle: optional && !value?.trim() ? "italic" : undefined,
            color: theme => (optional && !value?.trim() ? theme.palette.text.secondary : theme.palette.text.primary),
          }}
        >
          {displayValue}
        </Typography>
        {masked ? (
          <VisibilityOffOutlined sx={theme => ({ fontSize: 18, color: theme.palette.text.secondary })} />
        ) : null}
      </Box>
    </Box>
  );
}

function formatVerifiedDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function PrivacyNotice() {
  const t = useTranslations("profile.banking");

  return (
    <Box>
      <Typography sx={{ typography: "headlineMd", mb: 2 }}>{t("title")}</Typography>
      <Paper
        variant="outlined"
        sx={theme => ({
          p: 2,
          borderLeftWidth: 4,
          borderLeftStyle: "solid",
          borderLeftColor: theme.palette.primary.main,
          bgcolor: theme.palette.surfaceContainerHigh,
        })}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <LockOutlined sx={theme => ({ color: theme.palette.primary.main, mt: 0.25 })} />
          <Box>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mb: 0.5 }}>
              <ShieldOutlined sx={{ fontSize: 16, color: theme => theme.palette.primary.main }} />
              <Typography sx={{ typography: "labelMd", color: theme => theme.palette.primary.main }}>
                {t("adminOnly")}
              </Typography>
            </Stack>
            <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
              {t("encryptedNotice")}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

function BankingFieldsGrid({ banking }: { readonly banking: BankingSummary }) {
  const t = useTranslations("profile.banking");

  return (
    <Grid container spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <BankingField label={t("fields.beneficiaryName")} value={banking.beneficiaryName} masked />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <BankingField label={t("fields.bankName")} value={banking.bankName} masked />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <BankingField label={t("fields.accountNumber")} value={banking.accountNumber} masked monospace />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <BankingField label={t("fields.routingNumber")} value={banking.routingNumber} masked monospace />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <BankingField label={t("fields.swiftBic")} value={banking.swiftBic} masked monospace />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <BankingField label={t("fields.iban")} value={banking.iban} masked monospace optional />
      </Grid>
    </Grid>
  );
}

type VerificationFooterProps = {
  readonly banking: BankingSummary;
  readonly mode: "view" | "edit";
  readonly targetUserId: string;
};

function VerificationFooter({ banking, mode, targetUserId }: VerificationFooterProps) {
  const t = useTranslations("profile.banking");
  const verifiedDate = formatVerifiedDate(banking.verifiedAt);
  const isVerified = Boolean(banking.verifiedAt);
  const editHref = `/users/${targetUserId}/profile/edit?tab=banking`;

  return (
    <Box
      sx={theme => ({
        px: { xs: 2, md: 3 },
        py: 2,
        borderTop: `1px solid ${theme.palette.outlineVariant}`,
        bgcolor: theme.palette.surfaceContainer,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "stretch", md: "center" },
        justifyContent: "space-between",
        gap: 2,
      })}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <CheckCircleOutlined
          sx={theme => ({
            color: isVerified ? theme.palette.success.main : theme.palette.text.secondary,
          })}
        />
        <Box>
          <Typography sx={{ typography: "labelSm", color: theme => theme.palette.text.secondary }}>
            {isVerified ? t("verified") : t("notVerified")}
          </Typography>
          {verifiedDate ? (
            <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
              {t("fields.verifiedAt")}: {verifiedDate}
            </Typography>
          ) : null}
          {banking.verifiedByName ? (
            <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
              {t("fields.verifiedBy")}: {banking.verifiedByName}
            </Typography>
          ) : null}
        </Box>
      </Stack>

      {mode === "view" ? (
        <Button
          component={Link}
          href={editHref}
          variant="contained"
          startIcon={<EditNoteOutlined />}
          sx={{ alignSelf: { xs: "stretch", md: "center" } }}
        >
          {t("actions.manage")}
        </Button>
      ) : (
        <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
          {t("actions.editHint")}
        </Typography>
      )}
    </Box>
  );
}

export function TeacherBankingView({ banking, targetUserId, mode }: TeacherBankingViewProps) {
  const t = useTranslations("profile.banking");

  return (
    <Stack spacing={3}>
      <PrivacyNotice />

      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        <Box
          sx={theme => ({
            px: { xs: 2, md: 3 },
            py: 2,
            borderBottom: `1px solid ${theme.palette.outlineVariant}`,
            display: "flex",
            alignItems: "center",
            gap: 1,
          })}
        >
          <AccountBalanceOutlined sx={theme => ({ color: theme.palette.secondary.main })} />
          <Typography sx={{ typography: "titleLg" }}>{t("sections.banking")}</Typography>
        </Box>

        <BankingFieldsGrid banking={banking} />

        <VerificationFooter banking={banking} mode={mode} targetUserId={targetUserId} />
      </Paper>
    </Stack>
  );
}
