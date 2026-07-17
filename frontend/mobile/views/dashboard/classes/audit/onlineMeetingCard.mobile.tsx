"use client";

import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import { Avatar, Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { OnlineMeetingInfo } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/common/graphql/types/meeting-class-config.operations";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig";
import { useAppLocale, useAppTranslation } from "@/shared/locale";

export interface OnlineMeetingCardMobileProps {
  readonly meetingInfo: OnlineMeetingInfo | null | undefined;
  readonly showJoin?: boolean;
}

const StyledPreviewContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover,
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledMobileVideoIcon = styled(VideocamOutlinedIcon)(({ theme }) => ({
  fontSize: 48,
  color: theme.palette.text.disabled,
  opacity: 0.4,
}));

const StyledPlatformBadge = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 8,
  right: 8,
  backgroundColor: theme.palette.header,
  color: theme.palette.onHeader,
  paddingInline: theme.spacing(1),
  paddingBlock: theme.spacing(0.5),
  borderRadius: 1,
  typography: "labelUppercase",
  boxShadow: theme.palette.shadow.card,
}));

const StyledMobilePlatformName = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const StyledLocationText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

function resolveProviderDisplayName(meetingInfo: OnlineMeetingInfo | null | undefined, locale: string): string | null {
  if (!meetingInfo) return null;
  if (meetingInfo.providerName) {
    return resolveLocalizedString(meetingInfo.providerName, locale);
  }
  return meetingInfo.platform?.trim() || null;
}

function toEffectiveMeeting(meetingInfo: OnlineMeetingInfo | null | undefined): EffectiveMeetingFieldsFragment | null {
  if (!meetingInfo) return null;
  return {
    joinUrl: meetingInfo.joinUrl,
    logoUrl: meetingInfo.logoUrl,
    providerName: meetingInfo.providerName,
    source: meetingInfo.source,
    providerSlug: meetingInfo.platform,
    meetingId: meetingInfo.meetingId,
    configId: null,
    providerId: null,
  };
}

function MeetingPreviewIcon({ logoUrl }: Readonly<{ logoUrl?: string | null }>) {
  if (logoUrl?.trim()) {
    return <Avatar src={logoUrl} alt="" sx={{ width: 48, height: 48 }} />;
  }
  return <StyledMobileVideoIcon />;
}

export function OnlineMeetingCardMobile({ meetingInfo, showJoin = false }: Readonly<OnlineMeetingCardMobileProps>) {
  const t = useAppTranslation().dashboardTranslations.classAudit;
  const locale = useAppLocale();
  const providerName = resolveProviderDisplayName(meetingInfo, locale);
  const meeting = toEffectiveMeeting(meetingInfo);

  return (
    <MobileBaseCard sx={{ p: 0, overflow: "hidden" }}>
      <StyledPreviewContainer sx={{ height: 128 }}>
        <MeetingPreviewIcon logoUrl={meetingInfo?.logoUrl} />
        {providerName ? <StyledPlatformBadge>{providerName.toUpperCase()}</StyledPlatformBadge> : null}
      </StyledPreviewContainer>
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <StyledMobilePlatformName variant="titleLg">{t.meeting.title}</StyledMobilePlatformName>
          {meetingInfo?.meetingId ? (
            <StyledLocationText variant="bodyMd">
              {t.meetingIdLabel} {meetingInfo.meetingId}
            </StyledLocationText>
          ) : null}
        </Box>
        {showJoin ? (
          <MobileMeetingJoinAction
            joinUrl={meetingInfo?.joinUrl}
            meeting={meeting}
            label={t.meeting.joinMeeting}
            variant="button"
            id="venue-join-meeting-mobile"
          />
        ) : null}
      </Box>
    </MobileBaseCard>
  );
}
