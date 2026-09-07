"use client";

import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { type ReactElement, useState } from "react";
import { BaseCard } from "@/frontend/common/components/ui";
import type { OnlineMeetingCardProps } from "@/frontend/common/views/dashboard/classes/audit/onlineMeetingCard.types";
import { resolveProviderDisplayName, toEffectiveMeeting } from "@/frontend/common/views/dashboard/classes/audit/utils";
import { DesktopMeetingJoinAction } from "@/frontend/desktop/components/ui/display/meetingConfig";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

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

const StyledPreviewCaption = styled(Box)(({ theme }) => ({
  position: "absolute",
  insetInlineStart: theme.spacing(1.5),
  bottom: theme.spacing(1.5),
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  backgroundColor: theme.palette.surfaceContainerHighest,
  paddingInline: theme.spacing(2),
  paddingBlock: theme.spacing(0.75),
  borderRadius: theme.spacing(1),
}));

const StyledCaptionPlatformName = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurface,
  fontWeight: 700,
}));

const StyledCaptionMeetingId = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
}));

const StyledEmptyMeetingRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  backgroundColor: theme.palette.action.hover,
  paddingInline: theme.spacing(1.5),
  paddingBlock: theme.spacing(1.5),
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const StyledEmptyMeetingIcon = styled(VideocamOutlinedIcon)(({ theme }) => ({
  fontSize: 40,
  color: theme.palette.text.disabled,
}));

const StyledEmptyMeetingText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  fontWeight: 700,
  minWidth: 0,
  overflowWrap: "anywhere",
}));

const StyledMeetingInfoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.surfaceContainerLow,
  borderRadius: 2,
}));

const StyledMeetingInfoContent = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  minWidth: 0,
}));

const StyledMeetingInfoIcon = styled(VideocamOutlinedIcon)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
}));

const StyledMeetingIdLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.onSurfaceVariant,
}));

const StyledMeetingUrlText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurface,
}));

const FALLBACK_CELL = "1 / 1";

const StyledLogoMediaBox = styled(Box)({
  display: "grid",
  placeItems: "center",
  borderRadius: "50%",
  overflow: "hidden",
  flexShrink: 0,
});

const StyledLogoImage = styled("img")({
  gridArea: FALLBACK_CELL,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
});

const StyledLogoFallbackSlot = styled(Box)({
  gridArea: FALLBACK_CELL,
  display: "flex",
});

function MeetingProviderLogo({
  logoUrl,
  size,
  fallback,
}: Readonly<{ logoUrl?: string | null; size: number; fallback: ReactElement }>) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!logoUrl?.trim() || failed) return fallback;

  return (
    <StyledLogoMediaBox sx={{ width: size, height: size }}>
      <StyledLogoImage
        src={logoUrl}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        style={{ visibility: loaded ? "visible" : "hidden" }}
      />
      {loaded ? null : <StyledLogoFallbackSlot>{fallback}</StyledLogoFallbackSlot>}
    </StyledLogoMediaBox>
  );
}

function MeetingPreviewIcon({ logoUrl }: Readonly<{ logoUrl?: string | null }>) {
  return <MeetingProviderLogo logoUrl={logoUrl} size={64} fallback={<StyledDesktopVideoIcon />} />;
}

export function OnlineMeetingCardDesktop({ meetingInfo, labels, showJoin = false }: Readonly<OnlineMeetingCardProps>) {
  const locale = useAppLocale();
  const auditLabels = useAppTranslation(Translation.Dashboard.ClassAudit);
  const providerName = resolveProviderDisplayName(meetingInfo, locale);
  const meeting = toEffectiveMeeting(meetingInfo);
  const isUnknownProvider = !providerName || meetingInfo?.platform?.trim().toLowerCase() === "unknown";
  const displayProviderName = isUnknownProvider ? auditLabels.watchOnline : providerName;
  const hasMeeting = Boolean(meetingInfo?.meetingId?.trim());

  return (
    <BaseCard>
      <StyledSectionTitle variant="titleLg" sx={{ mb: 2 }}>
        {labels.title}
      </StyledSectionTitle>
      {hasMeeting ? (
        <StyledPreviewContainer
          sx={{
            aspectRatio: "16/9",
            borderRadius: 2,
            overflow: "hidden",
            mb: 2,
          }}
        >
          <MeetingPreviewIcon logoUrl={meetingInfo?.logoUrl} />
          <StyledPreviewCaption>
            {displayProviderName ? (
              <StyledCaptionPlatformName variant="bodyMd">{displayProviderName}:</StyledCaptionPlatformName>
            ) : null}
            <StyledCaptionMeetingId variant="labelMd">{meetingInfo?.meetingId ?? labels.online}</StyledCaptionMeetingId>
          </StyledPreviewCaption>
        </StyledPreviewContainer>
      ) : (
        <StyledEmptyMeetingRow>
          <MeetingProviderLogo logoUrl={meetingInfo?.logoUrl} size={40} fallback={<StyledEmptyMeetingIcon />} />
          <StyledEmptyMeetingText variant="bodyMd">{displayProviderName ?? labels.online}</StyledEmptyMeetingText>
        </StyledEmptyMeetingRow>
      )}
      <StyledMeetingInfoRow>
        <StyledMeetingInfoContent>
          <MeetingProviderLogo logoUrl={meetingInfo?.logoUrl} size={28} fallback={<StyledMeetingInfoIcon />} />
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
