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
import type { ProfileMode } from "@/backend/types/profile/profile.types";
import type { ProfileByUserIdQuery } from "@/frontend/graphql/generated/gql/operations";
import { profileHrefForUser } from "@/frontend/utils/profileHref";
import { Link as NextIntlLink } from "@/shared/i18n/routing";

type BankingSummary = NonNullable<NonNullable<ProfileByUserIdQuery["profileByUserId"]>["bankingSummary"]>;

type TeacherBankingViewProps = {
  readonly banking: BankingSummary;
  readonly targetUserId: string;
  readonly mode: ProfileMode;
};

type BankingFieldProps = {
  readonly label: string;
  readonly value: string | null | undefined;
  readonly masked?: boolean;
  readonly monospace?: boolean;
  readonly optional?: boolean;
};

function MaskedIcon() {
  return <VisibilityOffOutlined sx={theme => ({ fontSize: 18, color: theme.palette.text.secondary })} />;
}

function FieldValueDisplay({
  value,
  monospace = false,
  optional = false,
  notProvidedText,
  notSetText,
}: {
  readonly value: string | null | undefined;
  readonly monospace?: boolean;
  readonly optional?: boolean;
  readonly notProvidedText: string;
  readonly notSetText: string;
}) {
  function resolveDisplayValue(): string {
    if (value?.trim()) {
      return value;
    }
    return optional ? notProvidedText : notSetText;
  }

  const displayValue = resolveDisplayValue();

  return (
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
  );
}

function BankingField({ label, value, masked = false, monospace = false, optional = false }: BankingFieldProps) {
  const t = useTranslations("profile");

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
        <FieldValueDisplay
          value={value}
          monospace={monospace}
          optional={optional}
          notProvidedText={t("banking.notProvided")}
          notSetText={t("notSet")}
        />
        {masked ? <MaskedIcon /> : null}
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

function PrivacyNoticeContent({ t }: { readonly t: ReturnType<typeof useTranslations> }) {
  return (
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
  );
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
        <PrivacyNoticeContent t={t} />
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
  readonly mode: ProfileMode;
  readonly targetUserId: string;
};

function VerificationStatus({
  isVerified,
  verifiedDate,
  verifiedByName,
  t,
}: {
  readonly isVerified: boolean;
  readonly verifiedDate: string | null;
  readonly verifiedByName: string | null | undefined;
  readonly t: ReturnType<typeof useTranslations>;
}) {
  return (
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
        {verifiedByName ? (
          <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
            {t("fields.verifiedBy")}: {verifiedByName}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );
}

function EditAction({
  mode,
  editHref,
  t,
}: {
  readonly mode: ProfileMode;
  readonly editHref: string;
  readonly t: ReturnType<typeof useTranslations>;
}) {
  if (mode === "view") {
    return (
      <Button
        component={NextIntlLink}
        href={editHref}
        variant="contained"
        startIcon={<EditNoteOutlined />}
        sx={{ alignSelf: { xs: "stretch", md: "center" } }}
      >
        {t("actions.manage")}
      </Button>
    );
  }

  return (
    <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
      {t("actions.editHint")}
    </Typography>
  );
}

function VerificationFooter({ banking, mode, targetUserId }: VerificationFooterProps) {
  const t = useTranslations("profile.banking");
  const verifiedDate = formatVerifiedDate(banking.verifiedAt);
  const isVerified = Boolean(banking.verifiedAt);
  const editHref = `${profileHrefForUser(targetUserId)}/edit?tab=banking`;

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
      <VerificationStatus
        isVerified={isVerified}
        verifiedDate={verifiedDate}
        verifiedByName={banking.verifiedByName}
        t={t}
      />
      <EditAction mode={mode} editHref={editHref} t={t} />
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
