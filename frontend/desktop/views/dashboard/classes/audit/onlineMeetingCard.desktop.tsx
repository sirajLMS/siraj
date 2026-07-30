"use client";

import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import { Avatar, Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/common/components/ui";
import type { OnlineMeetingCardProps } from "@/frontend/common/views/dashboard/classes/audit/onlineMeetingCard.types";
import { resolveProviderDisplayName, toEffectiveMeeting } from "@/frontend/common/views/dashboard/classes/audit/utils";
import { DesktopMeetingJoinAction } from "@/frontend/desktop/components/ui/display/meetingConfig";
import { useAppLocale } from "@/shared/locale";

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

function MeetingPreviewIcon({ logoUrl }: Readonly<{ logoUrl?: string | null }>) {
  if (logoUrl?.trim()) {
    return <Avatar src={logoUrl} alt="" sx={{ width: 64, height: 64 }} />;
  }
  return <StyledDesktopVideoIcon />;
}

export function OnlineMeetingCardDesktop({ meetingInfo, labels, showJoin = false }: Readonly<OnlineMeetingCardProps>) {
  const locale = useAppLocale();
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
          <DesktopMeetingJoinAction
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
