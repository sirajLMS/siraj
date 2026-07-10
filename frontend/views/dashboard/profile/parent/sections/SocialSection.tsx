"use client";

import { AlternateEmailOutlined, ChatOutlined, GroupsOutlined, MeetingRoomOutlined } from "@mui/icons-material";
import { InputAdornment, Stack, TextField } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control, UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui";
import { PhoneFormField } from "@/frontend/components/ui/input";
import type { ParentAdminEditFormData } from "@/frontend/views/dashboard/profile/parent/parentProfileFormTypes";
import {
  type ParentViewData,
  toDisplayValue,
} from "@/frontend/views/dashboard/profile/parent/sections/parentProfileTypes";
import { ProfileFieldRow } from "@/frontend/views/dashboard/profile/shared/ProfileFieldRow";
import { buildSocialLink } from "@/shared/lib/social/social-links";

type SocialSectionProps =
  | {
      readonly mode: "view";
      readonly parentData: ParentViewData;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<ParentAdminEditFormData>;
      readonly control: Control<ParentAdminEditFormData>;
    };

const NON_PHONE_SOCIAL_FIELDS = [
  { key: "facebook", platform: "facebook", icon: GroupsOutlined },
  { key: "twitter", platform: "twitter", icon: AlternateEmailOutlined },
  { key: "defaultZoomLink", platform: "zoom", icon: MeetingRoomOutlined },
] as const;

const VIEW_FIELDS = [
  { key: "facebook", platform: "facebook", icon: GroupsOutlined },
  { key: "whatsapp", platform: "whatsapp", icon: ChatOutlined },
  { key: "twitter", platform: "twitter", icon: AlternateEmailOutlined },
  { key: "defaultZoomLink", platform: "zoom", icon: MeetingRoomOutlined },
] as const;

export function SocialSection(props: SocialSectionProps) {
  const t = useTranslations("profile.parent");
  const tc = useTranslations("profile");

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t("sections.social")}>
        <Stack spacing={2.5}>
          <PhoneFormField name="whatsapp" control={props.control} label={t("fields.whatsapp")} />
          {NON_PHONE_SOCIAL_FIELDS.map(({ key, icon: Icon }) => (
            <TextField
              key={key}
              label={t(`fields.${key}`)}
              fullWidth
              size="small"
              {...props.register(key)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon sx={theme => ({ color: theme.palette.primary.main, opacity: 0.4 })} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          ))}
        </Stack>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title={t("sections.social")}>
      <Stack spacing={2.5}>
        {VIEW_FIELDS.map(({ key, platform, icon: Icon }) => {
          const value = props.parentData[key];
          const link = buildSocialLink(platform, value);
          return (
            <ProfileFieldRow
              key={key}
              icon={Icon}
              label={t(`fields.${key}`)}
              value={link?.displayText ?? toDisplayValue(value, tc("notSet"))}
              href={link?.href}
              fallback={tc("notSet")}
              hover
            />
          );
        })}
      </Stack>
    </SectionPanel>
  );
}
