"use client";

import { Chip, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { SectionPanel } from "@/frontend/components/ui";
import { InfoField } from "../../parent/sections/InfoField";
import { type StaffProfileData, toDisplayValue } from "./staffProfileTypes";

export function RoleSection({ staffData }: { readonly staffData: StaffProfileData }) {
  const t = useTranslations("profile.staff");
  const tc = useTranslations("profile");

  return (
    <SectionPanel title={t("sections.role")}>
      <Stack spacing={2}>
        <InfoField
          label={t("fields.roleName")}
          value={toDisplayValue(staffData.roleName ?? staffData.roleSlug, tc("notSet"))}
        />
        {staffData.roleSlug ? (
          <Stack spacing={0.25}>
            <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
              {t("fields.roleSlug")}
            </Typography>
            <Chip
              label={staffData.roleSlug}
              size="small"
              variant="outlined"
              sx={{ alignSelf: "flex-start", fontFamily: "monospace" }}
            />
          </Stack>
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
