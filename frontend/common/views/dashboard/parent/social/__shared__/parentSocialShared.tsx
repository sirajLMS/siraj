import { Link, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { LoadingState } from "@/frontend/common/components/ui";
import type { ParentSocialViewModel } from "@/frontend/common/views/dashboard/parent/social/useParentSocialViewModel";
import { isSafeUrl } from "@/shared/lib/safe-url";

export interface ParentSocialSharedOptions {
  readonly typographyVariant: "bodyLg" | "bodyMd";
  readonly linkSxWidth: boolean;
  readonly renderPhoneDisplay: (phone: string, typographyVariant: "bodyLg" | "bodyMd") => ReactNode;
  readonly renderPageContainer: (children: ReactNode) => ReactNode;
  readonly renderPageHeader: (title: string, subtitle: string) => ReactNode;
  readonly renderSectionPanel: (title: string, children: ReactNode) => ReactNode;
  readonly renderSections: (contactPanel: ReactNode, socialPanel: ReactNode) => ReactNode;
}

function SocialLinkShared({
  label,
  value,
  options,
}: {
  readonly label: string;
  readonly value: string | null | undefined;
  readonly options: ParentSocialSharedOptions;
}): ReactNode {
  if (!value) return null;
  const safeUrl = isSafeUrl(value.startsWith("http") ? value : `https://${value}`);

  return (
    <Stack spacing={0.5} sx={options.linkSxWidth ? { width: "100%" } : undefined}>
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
            typography: options.typographyVariant,
            wordBreak: "break-all",
          })}
        >
          {value}
        </Link>
      ) : (
        <Typography
          variant={options.typographyVariant}
          sx={theme => ({ color: theme.palette.text.primary, fontWeight: 500 })}
        >
          {value}
        </Typography>
      )}
    </Stack>
  );
}

function WhatsAppLinkShared({
  label,
  value,
  options,
}: {
  readonly label: string;
  readonly value: string | null | undefined;
  readonly options: ParentSocialSharedOptions;
}): ReactNode {
  if (!value) return null;
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;

  return (
    <Stack spacing={0.5} sx={options.linkSxWidth ? { width: "100%" } : undefined}>
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
          typography: options.typographyVariant,
        })}
      >
        {options.renderPhoneDisplay(value, options.typographyVariant)}
      </Link>
    </Stack>
  );
}

export function ParentSocialShared({
  labels,
  loading,
  error,
  profile,
  options,
}: Readonly<ParentSocialViewModel> & { readonly options: ParentSocialSharedOptions }): ReactNode {
  return options.renderPageContainer(
    <>
      {options.renderPageHeader(labels.pageTitle, labels.pageSubtitle)}
      {loading ? <LoadingState /> : null}
      {error ? (
        <Typography sx={{ color: theme => theme.palette.error.main }}>{labels.errors.failedToLoad}</Typography>
      ) : null}
      {!loading && !error && profile
        ? options.renderSections(
            options.renderSectionPanel(
              labels.sections.contact,
              <Stack spacing={2}>
                <Stack spacing={0.5} sx={options.linkSxWidth ? { width: "100%" } : undefined}>
                  <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.text.secondary })}>
                    {labels.fields.phone}
                  </Typography>
                  {options.renderPhoneDisplay(profile.phone ?? "", options.typographyVariant)}
                </Stack>
              </Stack>
            ),
            options.renderSectionPanel(
              labels.sections.social,
              <Stack spacing={2}>
                <SocialLinkShared label={labels.fields.facebook} value={profile.facebook} options={options} />
                <WhatsAppLinkShared label={labels.fields.whatsapp} value={profile.whatsapp} options={options} />
                <SocialLinkShared label={labels.fields.twitter} value={profile.twitter} options={options} />
              </Stack>
            )
          )
        : null}
    </>
  );
}
