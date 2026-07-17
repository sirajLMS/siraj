"use client";

import { Box, CircularProgress, Link, Stack, Typography } from "@mui/material";
import { PhoneDisplay, SectionPanel } from "@/frontend/common/components/ui";
import { isSafeUrl } from "@/frontend/common/lib/safeRedirect";
import type { ParentSocialViewModel } from "@/frontend/common/views/dashboard/parent/social/useParentSocialViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

function SocialLinkMobile({ label, value }: { readonly label: string; readonly value: string | null | undefined }) {
  if (!value) return null;
  const safeUrl = isSafeUrl(value.startsWith("http") ? value : `https://${value}`);

  return (
    <Stack spacing={0.5} sx={{ width: "100%" }}>
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
            typography: "bodyMd",
            wordBreak: "break-all",
          })}
        >
          {value}
        </Link>
      ) : (
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.primary, fontWeight: 500 })}>
          {value}
        </Typography>
      )}
    </Stack>
  );
}

function WhatsAppLinkMobile({ label, value }: { readonly label: string; readonly value: string | null | undefined }) {
  if (!value) return null;
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;

  return (
    <Stack spacing={0.5} sx={{ width: "100%" }}>
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
          typography: "bodyMd",
        })}
      >
        <PhoneDisplay phone={value} typographyVariant="bodyMd" />
      </Link>
    </Stack>
  );
}

export function ParentSocialMobileView({ labels, loading, error, profile }: Readonly<ParentSocialViewModel>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : null}
      {error ? (
        <Typography sx={{ color: theme => theme.palette.error.main }}>{labels.errors.failedToLoad}</Typography>
      ) : null}
      {!loading && !error && profile ? (
        <Stack spacing={2}>
          <SectionPanel title={labels.sections.contact}>
            <Stack spacing={2}>
              <Stack spacing={0.5} sx={{ width: "100%" }}>
                <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.text.secondary })}>
                  {labels.fields.phone}
                </Typography>
                <PhoneDisplay phone={profile.phone ?? null} typographyVariant="bodyMd" />
              </Stack>
            </Stack>
          </SectionPanel>
          <SectionPanel title={labels.sections.social}>
            <Stack spacing={2}>
              <SocialLinkMobile label={labels.fields.facebook} value={profile.facebook} />
              <WhatsAppLinkMobile label={labels.fields.whatsapp} value={profile.whatsapp} />
              <SocialLinkMobile label={labels.fields.twitter} value={profile.twitter} />
            </Stack>
          </SectionPanel>
        </Stack>
      ) : null}
    </MobilePageContainer>
  );
}
