"use client";

import { Box } from "@mui/material";
import { BaseCard } from "@/frontend/common/components/ui";
import type { OnlineMeetingCardProps } from "@/frontend/common/views/dashboard/classes/audit/onlineMeetingCard.types";
import { resolveProviderDisplayName, toEffectiveMeeting } from "@/frontend/common/views/dashboard/classes/audit/utils";
import { DesktopMeetingJoinAction } from "@/frontend/desktop/components/ui/display/meetingConfig";
import {
  MeetingPreviewIcon,
  MeetingProviderLogo,
} from "@/frontend/desktop/views/dashboard/classes/audit/onlineMeetingCardDesktop.parts";
import {
  StyledCaptionMeetingId,
  StyledCaptionPlatformName,
  StyledEmptyMeetingIcon,
  StyledEmptyMeetingRow,
  StyledEmptyMeetingText,
  StyledMeetingIdLabel,
  StyledMeetingInfoContent,
  StyledMeetingInfoIcon,
  StyledMeetingInfoRow,
  StyledMeetingUrlText,
  StyledPreviewCaption,
  StyledPreviewContainer,
  StyledSectionTitle,
} from "@/frontend/desktop/views/dashboard/classes/audit/onlineMeetingCardDesktop.styled";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

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
