"use client";

import { Box, CircularProgress, Grid, Link, Stack, Typography } from "@mui/material";
import { PageContainer, PhoneDisplay, SectionPanel } from "@/frontend/common/components/ui";
import { isSafeUrl } from "@/frontend/common/lib/safeRedirect";
import type { ParentSocialViewModel } from "@/frontend/common/views/dashboard/parent/social/useParentSocialViewModel";
import { DesktopPageHeader } from "@/frontend/desktop/components/ui";

function SocialLinkDesktop({ label, value }: { readonly label: string; readonly value: string | null | undefined }) {
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

function WhatsAppLinkDesktop({ label, value }: { readonly label: string; readonly value: string | null | undefined }) {
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

export function ParentSocialDesktopView({ labels, loading, error, profile }: Readonly<ParentSocialViewModel>) {
  return (
    <PageContainer>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : null}
      {error ? (
        <Typography sx={{ color: theme => theme.palette.error.main }}>{labels.errors.failedToLoad}</Typography>
      ) : null}
      {!loading && !error && profile ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <SectionPanel title={labels.sections.contact}>
              <Stack spacing={2}>
                <Stack spacing={0.5}>
                  <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.text.secondary })}>
                    {labels.fields.phone}
                  </Typography>
                  <PhoneDisplay phone={profile.phone ?? null} typographyVariant="bodyLg" />
                </Stack>
              </Stack>
            </SectionPanel>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <SectionPanel title={labels.sections.social}>
              <Stack spacing={2}>
                <SocialLinkDesktop label={labels.fields.facebook} value={profile.facebook} />
                <WhatsAppLinkDesktop label={labels.fields.whatsapp} value={profile.whatsapp} />
                <SocialLinkDesktop label={labels.fields.twitter} value={profile.twitter} />
              </Stack>
            </SectionPanel>
          </Grid>
        </Grid>
      ) : null}
    </PageContainer>
  );
}
