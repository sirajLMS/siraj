"use client";

import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import { Avatar, Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useLocale } from "next-intl";
import { BaseCard } from "@/frontend/components/ui";
import { MeetingJoinAction } from "@/frontend/components/ui/display/meetingConfig/MeetingJoinAction";
import type { OnlineMeetingInfo } from "@/frontend/graphql/generated/gql/graphql-types";
import type { EffectiveMeetingFieldsFragment } from "@/frontend/graphql/types/meeting-class-config.operations";
import { resolveLocalizedString } from "@/frontend/lib/localized-string";

interface OnlineMeetingCardProps {
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

function MeetingPreviewIcon({
  logoUrl,
  variant,
}: Readonly<{ logoUrl?: string | null; variant: "mobile" | "desktop" }>) {
  if (logoUrl?.trim()) {
    return (
      <Avatar
        src={logoUrl}
        alt=""
        sx={{ width: variant === "mobile" ? 48 : 64, height: variant === "mobile" ? 48 : 64 }}
      />
    );
  }
  return variant === "mobile" ? <StyledMobileVideoIcon /> : <StyledDesktopVideoIcon />;
}

const MobileMeetingCard = ({ meetingInfo, labels, showJoin = false }: OnlineMeetingCardProps) => {
  const locale = useLocale();
  const providerName = resolveProviderDisplayName(meetingInfo, locale);
  const meeting = toEffectiveMeeting(meetingInfo);

  return (
    <BaseCard sx={{ p: 0, overflow: "hidden" }}>
      <StyledPreviewContainer sx={{ height: 128 }}>
        <MeetingPreviewIcon logoUrl={meetingInfo?.logoUrl} variant="mobile" />
        {providerName ? <StyledPlatformBadge>{providerName.toUpperCase()}</StyledPlatformBadge> : null}
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
        {showJoin ? (
          <MeetingJoinAction
            joinUrl={meetingInfo?.joinUrl}
            meeting={meeting}
            label={labels.joinMeeting}
            variant="button"
            id="venue-join-meeting-mobile"
          />
        ) : null}
      </Box>
    </BaseCard>
  );
};

const DesktopMeetingCard = ({ meetingInfo, labels, showJoin = false }: OnlineMeetingCardProps) => {
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
        <MeetingPreviewIcon logoUrl={meetingInfo?.logoUrl} variant="desktop" />
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
};

export function OnlineMeetingCard(props: OnlineMeetingCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <MobileMeetingCard {...props} />;
  }

  return <DesktopMeetingCard {...props} />;
}
