"use client";

import {
  AlternateEmailOutlined,
  ChatOutlined,
  GroupsOutlined,
  MeetingRoomOutlined,
  VideoCallOutlined,
} from "@mui/icons-material";
import { Grid, Input, InputAdornment } from "@mui/material";
import { useTranslations } from "next-intl";
import type { UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui/container/SectionPanel";
import { FieldWrapper, standardInputSx } from "@/frontend/components/ui/form";
import type { ParentOnboardingFormData } from "./schemas/parentOnboardingSchema";

interface Props {
  readonly register: UseFormRegister<ParentOnboardingFormData>;
}

export function SocialCommsSection({ register }: Props) {
  const t = useTranslations("dashboard.parentOnboarding");

  return (
    <SectionPanel title={t("sections.socialComms")}>
      <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <FieldWrapper label={t("fields.whatsapp")}>
            <Input
              {...register("whatsapp")}
              placeholder={t("placeholders.whatsapp")}
              fullWidth
              sx={standardInputSx}
              startAdornment={
                <InputAdornment position="start">
                  <ChatOutlined sx={theme => ({ color: theme.palette.primary.main, opacity: 0.4 })} />
                </InputAdornment>
              }
            />
          </FieldWrapper>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <FieldWrapper label={t("fields.facebook")}>
            <Input
              {...register("facebook")}
              placeholder={t("placeholders.facebook")}
              fullWidth
              sx={standardInputSx}
              startAdornment={
                <InputAdornment position="start">
                  <GroupsOutlined sx={theme => ({ color: theme.palette.primary.main, opacity: 0.4 })} />
                </InputAdornment>
              }
            />
          </FieldWrapper>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <FieldWrapper label={t("fields.twitter")}>
            <Input
              {...register("twitter")}
              placeholder={t("placeholders.twitter")}
              fullWidth
              sx={standardInputSx}
              startAdornment={
                <InputAdornment position="start">
                  <AlternateEmailOutlined sx={theme => ({ color: theme.palette.primary.main, opacity: 0.4 })} />
                </InputAdornment>
              }
            />
          </FieldWrapper>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <FieldWrapper label={t("fields.skype")}>
            <Input
              {...register("skype")}
              placeholder={t("placeholders.skype")}
              fullWidth
              sx={standardInputSx}
              startAdornment={
                <InputAdornment position="start">
                  <VideoCallOutlined sx={theme => ({ color: theme.palette.primary.main, opacity: 0.4 })} />
                </InputAdornment>
              }
            />
          </FieldWrapper>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <FieldWrapper label={t("fields.zoomId")}>
            <Input
              {...register("defaultZoomLink")}
              placeholder={t("placeholders.zoomId")}
              fullWidth
              sx={standardInputSx}
              startAdornment={
                <InputAdornment position="start">
                  <MeetingRoomOutlined sx={theme => ({ color: theme.palette.primary.main, opacity: 0.4 })} />
                </InputAdornment>
              }
            />
          </FieldWrapper>
        </Grid>
      </Grid>
    </SectionPanel>
  );
}
