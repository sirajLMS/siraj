import { ContactPageOutlined, PaymentsOutlined, ShareOutlined } from "@mui/icons-material";
import { Box, Grid, Link, Stack, Typography, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { SectionPanel } from "@/frontend/components/ui";
import { PhoneDisplay } from "@/frontend/components/ui/display";
import { isSafeUrl } from "@/frontend/lib/safeRedirect";
import type { ParentProfileData } from "@/frontend/views/dashboard/parent/types/profile";

interface ParentProfileDetailsProps {
  readonly parent: ParentProfileData;
}

function DetailItem({
  label,
  value,
  isLink,
}: {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly isLink?: boolean;
}) {
  const stringValue = typeof value === "string" ? value : null;
  const safeUrl = stringValue ? isSafeUrl(`https://${stringValue}`) : null;
  return (
    <Stack spacing={0.5}>
      <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.text.secondary })}>
        {label}
      </Typography>
      {isLink && safeUrl ? (
        <Link
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={theme => ({
            color: theme.palette.primary.main,
            textDecoration: "underline",
            typography: "bodyLg",
            wordBreak: "break-all",
          })}
        >
          {value}
        </Link>
      ) : typeof value === "string" || typeof value === "number" ? (
        <Typography variant="bodyLg" sx={theme => ({ color: theme.palette.text.primary, fontWeight: 500 })}>
          {value}
        </Typography>
      ) : (
        value
      )}
    </Stack>
  );
}

function ParentProfileDetails({ parent }: ParentProfileDetailsProps) {
  const t = useTranslations("dashboard.parentProfile");
  const theme = useTheme();

  return (
    <Stack spacing={theme.layout.sectionGap}>
      <SectionPanel>
        <Box
          sx={theme => ({
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 3,
            py: 1.5,
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
          })}
        >
          <ContactPageOutlined />
          <Typography variant="titleLg">{t("sections.parentInfo")}</Typography>
        </Box>
        <Grid container spacing={4} sx={{ p: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DetailItem label={t("fields.nationality")} value={parent.nationality} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DetailItem label={t("fields.email")} value={parent.email} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DetailItem
              label={t("fields.phone")}
              value={<PhoneDisplay phone={parent.phone} typographyVariant="bodyLg" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DetailItem label={t("fields.address")} value={parent.address} />
          </Grid>
        </Grid>
      </SectionPanel>

      <SectionPanel>
        <Box
          sx={theme => ({
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 3,
            py: 1.5,
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
          })}
        >
          <ShareOutlined />
          <Typography variant="titleLg">{t("sections.socialMedia")}</Typography>
        </Box>
        <Grid container spacing={4} sx={{ p: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DetailItem label={t("fields.facebook")} value={parent.facebook || "-"} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DetailItem
              label={t("fields.whatsapp")}
              value={<PhoneDisplay phone={parent.whatsapp ?? null} fallback="-" typographyVariant="bodyLg" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DetailItem label={t("fields.zoomLink")} value={parent.zoomLink || "-"} isLink={!!parent.zoomLink} />
          </Grid>
        </Grid>
      </SectionPanel>

      <SectionPanel>
        <Box
          sx={theme => ({
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 3,
            py: 1.5,
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
          })}
        >
          <PaymentsOutlined />
          <Typography variant="titleLg">{t("sections.feesDetails")}</Typography>
        </Box>
        <Grid container spacing={4} sx={{ p: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DetailItem label={t("fields.invoiceType")} value={parent.invoiceType} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DetailItem label={t("fields.feeAmount")} value={parent.feeAmount.toFixed(2)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DetailItem label={t("fields.paymentMethod")} value={parent.paymentMethod} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DetailItem label={t("fields.currency")} value={parent.currency} />
          </Grid>
        </Grid>
      </SectionPanel>
    </Stack>
  );
}

export default ParentProfileDetails;
