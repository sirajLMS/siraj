"use client";

import { useQuery } from "@apollo/client/react";
import { Box, CircularProgress, Grid, Link, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer, PageHeader, PhoneDisplay, SectionPanel } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { parentOwnProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { isSafeUrl } from "@/frontend/common/lib/safeRedirect";

function SocialLink({ label, value }: { readonly label: string; readonly value: string | null | undefined }) {
  if (!value) return null;
  const safeUrl = isSafeUrl(value.startsWith("http") ? value : `https://${value}`);

  return (
    <Stack spacing={0.5}>
      <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.text.secondary })}>
        {label}
      </Typography>
      {safeUrl ? (
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
      ) : (
        <Typography variant="bodyLg" sx={theme => ({ color: theme.palette.text.primary, fontWeight: 500 })}>
          {value}
        </Typography>
      )}
    </Stack>
  );
}

function WhatsAppLink({ label, value }: { readonly label: string; readonly value: string | null | undefined }) {
  if (!value) return null;
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;

  return (
    <Stack spacing={0.5}>
      <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.text.secondary })}>
        {label}
      </Typography>
      <Link
        href={`https://wa.me/${digits}`}
        target="_blank"
        rel="noopener noreferrer"
        sx={theme => ({
          color: theme.palette.primary.main,
          textDecoration: "underline",
          typography: "bodyLg",
        })}
      >
        <PhoneDisplay phone={value} typographyVariant="bodyLg" />
      </Link>
    </Stack>
  );
}

export function ParentSocialContainer() {
  const t = useTranslations("dashboard.parentSocial");
  const { data, loading, error } = useQuery(parentOwnProfileQueryDocument);
  const profile = data?.parentOwnProfile;

  return (
    <RequirePermission permissions={[AppPermission.ParentViewOwnProfile]}>
      <PageContainer>
        <PageHeader title={t("pageTitle")} subtitle={t("pageSubtitle")} />
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : null}
        {error ? (
          <Typography sx={{ color: theme => theme.palette.error.main }}>{t("errors.failedToLoad")}</Typography>
        ) : null}
        {!loading && !error && profile ? (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionPanel title={t("sections.contact")}>
                <Stack spacing={2}>
                  <Stack spacing={0.5}>
                    <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.text.secondary })}>
                      {t("fields.phone")}
                    </Typography>
                    <PhoneDisplay phone={profile.phone} typographyVariant="bodyLg" />
                  </Stack>
                </Stack>
              </SectionPanel>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionPanel title={t("sections.social")}>
                <Stack spacing={2}>
                  <SocialLink label={t("fields.facebook")} value={profile.facebook} />
                  <WhatsAppLink label={t("fields.whatsapp")} value={profile.whatsapp} />
                  <SocialLink label={t("fields.twitter")} value={profile.twitter} />
                </Stack>
              </SectionPanel>
            </Grid>
          </Grid>
        ) : null}
      </PageContainer>
    </RequirePermission>
  );
}
