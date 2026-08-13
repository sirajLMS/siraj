"use client";

import { AlternateEmailOutlined, ChatOutlined, GroupsOutlined } from "@mui/icons-material";
import { InputAdornment, Stack, TextField } from "@mui/material";
import type { Control, UseFormRegister } from "react-hook-form";
import { PhoneDisplay, SectionPanel } from "@/frontend/common/components/ui";
import { PhoneFormField } from "@/frontend/common/components/ui/input";
import type { ParentAdminEditFormData } from "@/frontend/common/views/dashboard/profile/parent/parentProfileFormTypes";
import {
  type ParentViewData,
  toDisplayValue,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { ProfileFieldRow } from "@/frontend/common/views/dashboard/profile/shared/ProfileFieldRow";
import { buildSocialLink } from "@/shared/lib/social/social-links";
import type { ProfileParentLabels } from "@/shared/locale/types/profile";

type SocialSectionProps =
  | {
      readonly mode: "view";
      readonly labels: ProfileParentLabels;
      readonly parentData: ParentViewData;
    }
  | {
      readonly mode: "edit";
      readonly labels: ProfileParentLabels;
      readonly register: UseFormRegister<ParentAdminEditFormData>;
      readonly control: Control<ParentAdminEditFormData>;
    };

const NON_PHONE_SOCIAL_FIELDS = [
  { key: "facebook", platform: "facebook", icon: GroupsOutlined },
  { key: "twitter", platform: "twitter", icon: AlternateEmailOutlined },
] as const;

const VIEW_FIELDS = [
  { key: "facebook", platform: "facebook", icon: GroupsOutlined },
  { key: "whatsapp", platform: "whatsapp", icon: ChatOutlined },
  { key: "twitter", platform: "twitter", icon: AlternateEmailOutlined },
] as const;

export function SocialSection(props: SocialSectionProps) {
  const t = props.labels;

  if (props.mode === "edit") {
    return (
      <SectionPanel title={t.sections.social}>
        <Stack spacing={2.5}>
          <PhoneFormField name="whatsapp" control={props.control} label={t.fields.whatsapp} />
          {NON_PHONE_SOCIAL_FIELDS.map(({ key, icon: Icon }) => (
            <TextField
              key={key}
              label={t.fields[key]}
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
    <SectionPanel title={t.sections.social}>
      <Stack spacing={2.5}>
        {VIEW_FIELDS.map(({ key, platform, icon: Icon }) => {
          const value = props.parentData[key];
          if (key === "whatsapp") {
            const whatsappLink = buildSocialLink("whatsapp", value);
            return (
              <ProfileFieldRow
                key={key}
                icon={Icon}
                label={t.fields[key]}
                value={<PhoneDisplay phone={value} fallback={t.notSet} />}
                href={whatsappLink?.href}
                fallback={t.notSet}
                hover
              />
            );
          }
          const link = buildSocialLink(platform, value);
          return (
            <ProfileFieldRow
              key={key}
              icon={Icon}
              label={t.fields[key]}
              value={link?.displayText ?? toDisplayValue(value, t.notSet)}
              href={link?.href}
              fallback={t.notSet}
              hover
            />
          );
        })}
      </Stack>
    </SectionPanel>
  );
}
