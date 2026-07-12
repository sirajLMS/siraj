"use client";

import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import { Avatar, Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useLocale } from "next-intl";
import { BaseCard } from "@/frontend/components/ui";
import { MeetingJoinAction } from "@/frontend/components/ui/display/meetingConfig/MeetingJoinAction";
import type { OnlineMeetingInfo } from "@/frontend/graphql/generated/gql/graphql-types";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/graphql/types/meeting-class-config.operations";
import { resolveLocalizedString } from "@/frontend/lib/localized-string";

export interface OnlineMeetingCardDesktopProps {
  readonly meetingInfo: OnlineMeetingInfo | null | undefined;
  readonly showJoin?: boolean;
  readonly labels: {
    readonly title: string;
    readonly joinMeeting: string;
    readonly capacityBadge: string;
    readonly capacity: string;
    readonly meetingIdLabel: string;
    readonly online: string;
    readonly meetingIdNA: string;
  };
}

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const StyledPreviewContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover,
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledDesktopVideoIcon = styled(VideocamOutlinedIcon)(({ theme }) => ({
  fontSize: 64,
  color: theme.palette.text.disabled,
  opacity: 0.3,
}));

const StyledDesktopScrimOverlay = styled(Box)(({ theme }) => ({
  position: "absolute",
  inset: 0,
  background: `linear-gradient(to top, ${theme.palette.scrim}, transparent)`,
  display: "flex",
  alignItems: "flex-end",
  padding: theme.spacing(2),
}));

const StyledOverlayPlatformName = styled(Typography)(({ theme }) => ({
  color: theme.palette.onPrimary,
  fontWeight: 700,
}));

const StyledOverlayMeetingId = styled(Typography)(({ theme }) => ({
  color: theme.palette.onPrimary,
}));

const StyledMeetingInfoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.primaryContainer,
  borderRadius: 2,
}));

const StyledMeetingInfoContent = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  minWidth: 0,
}));

const StyledMeetingInfoIcon = styled(VideocamOutlinedIcon)(({ theme }) => ({
  color: theme.palette.onPrimaryContainer,
}));

const StyledMeetingIdLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.onPrimaryContainer,
}));

const StyledMeetingUrlText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onPrimaryContainer,
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
    return <Avatar src={logoUrl} alt="" sx={{ width: 64, height: 64 }} />;
  }
  return <StyledDesktopVideoIcon />;
}

export function OnlineMeetingCardDesktop({
  meetingInfo,
  labels,
  showJoin = false,
}: Readonly<OnlineMeetingCardDesktopProps>) {
  const locale = useLocale();
  const providerName = resolveProviderDisplayName(meetingInfo, locale);
  const meeting = toEffectiveMeeting(meetingInfo);

  return (
    <BaseCard>
      <StyledSectionTitle variant="titleLg" sx={{ mb: 2 }}>
        {labels.title}
      </StyledSectionTitle>
      <StyledPreviewContainer
        sx={{
          aspectRatio: "16/9",
          borderRadius: 2,
          overflow: "hidden",
          mb: 2,
        }}
      >
        <MeetingPreviewIcon logoUrl={meetingInfo?.logoUrl} />
        <StyledDesktopScrimOverlay>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {providerName ? (
              <StyledOverlayPlatformName variant="bodyLg">{providerName}:</StyledOverlayPlatformName>
            ) : null}
            <StyledOverlayMeetingId variant="labelMd">{meetingInfo?.meetingId ?? labels.online}</StyledOverlayMeetingId>
          </Box>
        </StyledDesktopScrimOverlay>
      </StyledPreviewContainer>
      <StyledMeetingInfoRow>
        <StyledMeetingInfoContent>
          {meetingInfo?.logoUrl ? (
            <Avatar src={meetingInfo.logoUrl} alt="" sx={{ width: 28, height: 28 }} />
          ) : (
            <StyledMeetingInfoIcon />
          )}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", minWidth: 0 }}>
            <StyledMeetingIdLabel variant="labelMd">{labels.meetingIdLabel}</StyledMeetingIdLabel>
            <StyledMeetingUrlText variant="labelUppercase">
              {meetingInfo?.meetingId ?? labels.meetingIdNA}
            </StyledMeetingUrlText>
          </Box>
        </StyledMeetingInfoContent>
        {showJoin ? (
          <MeetingJoinAction
            joinUrl={meetingInfo?.joinUrl}
            meeting={meeting}
            label={labels.joinMeeting}
            variant="button"
            id="venue-join-meeting-desktop"
          />
        ) : null}
      </StyledMeetingInfoRow>
    </BaseCard>
  );
}
