"use client";

import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/components/ui";
import { MeetingJoinAction } from "@/frontend/components/ui/display/meetingConfig/MeetingJoinAction";
import type { OnlineMeetingInfo } from "@/frontend/graphql/generated/gql/graphql-types";

interface OnlineMeetingCardProps {
  readonly meetingInfo: OnlineMeetingInfo | null | undefined;
  readonly labels: {
    readonly title: string;
    readonly joinMeeting: string;
    readonly capacityBadge: string;
    readonly capacity: string;
    readonly meetingIdLabel: string;
    readonly online: string;
    readonly meetingIdNA: string;
  };
  readonly onJoinMeeting: () => void;
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

const StyledMobileVideoIcon = styled(VideocamOutlinedIcon)(({ theme }) => ({
  fontSize: 48,
  color: theme.palette.text.disabled,
  opacity: 0.4,
}));

const StyledDesktopVideoIcon = styled(VideocamOutlinedIcon)(({ theme }) => ({
  fontSize: 64,
  color: theme.palette.text.disabled,
  opacity: 0.3,
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
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.primaryContainer,
  borderRadius: 2,
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

const MobileMeetingCard = ({ meetingInfo, labels, onJoinMeeting }: OnlineMeetingCardProps) => {
  const platform = meetingInfo?.platform?.trim();

  return (
    <BaseCard sx={{ p: 0, overflow: "hidden" }}>
      <StyledPreviewContainer sx={{ height: 128 }}>
        <StyledMobileVideoIcon />
        {platform ? <StyledPlatformBadge>{platform.toUpperCase()}</StyledPlatformBadge> : null}
      </StyledPreviewContainer>
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <StyledMobilePlatformName variant="titleLg">{labels.title}</StyledMobilePlatformName>
          {meetingInfo?.meetingId ? (
            <StyledLocationText variant="bodyMd">
              {labels.meetingIdLabel} {meetingInfo.meetingId}
            </StyledLocationText>
          ) : null}
        </Box>
        <MeetingJoinAction
          joinUrl={meetingInfo?.joinUrl}
          label={labels.joinMeeting}
          variant="button"
          id="venue-join-meeting-mobile"
          onJoinAction={onJoinMeeting}
        />
      </Box>
    </BaseCard>
  );
};

const DesktopMeetingCard = ({ meetingInfo, labels }: Omit<OnlineMeetingCardProps, "onJoinMeeting">) => {
  const platform = meetingInfo?.platform?.trim();

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
        <StyledDesktopVideoIcon />
        <StyledDesktopScrimOverlay>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {platform ? <StyledOverlayPlatformName variant="bodyLg">{platform}:</StyledOverlayPlatformName> : null}
            <StyledOverlayMeetingId variant="labelMd">{meetingInfo?.meetingId ?? labels.online}</StyledOverlayMeetingId>
          </Box>
        </StyledDesktopScrimOverlay>
      </StyledPreviewContainer>
      <StyledMeetingInfoRow>
        <StyledMeetingInfoIcon />
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <StyledMeetingIdLabel variant="labelMd">{labels.meetingIdLabel}</StyledMeetingIdLabel>
          <StyledMeetingUrlText variant="labelUppercase">
            {meetingInfo?.meetingId ?? labels.meetingIdNA}
          </StyledMeetingUrlText>
        </Box>
      </StyledMeetingInfoRow>
    </BaseCard>
  );
};

export function OnlineMeetingCard(props: OnlineMeetingCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <MobileMeetingCard {...props} />;
  }

  return <DesktopMeetingCard {...props} />;
}
