import { BadgeOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { useTranslations } from "next-intl";
import { SectionHeader } from "./SectionHeader";
import { AddressField, EmailField, FullNameField, GenderField, PhoneField, TimezoneField } from "./TeacherInfoFields";

export function TeacherInfoSection() {
  const t = useTranslations("dashboard.teacherProfile");

  return (
    <Box component="section">
      <SectionHeader title={t("sections.teacherInfo")} icon={BadgeOutlined} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
        <FullNameField />
        <EmailField />
        <PhoneField />
        <GenderField />
        <TimezoneField />
        <AddressField />
      </Box>
    </Box>
  );
}
