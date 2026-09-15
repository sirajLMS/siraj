"use client";

import { BadgeOutlined } from "@mui/icons-material";
import type { ComponentType, ElementType } from "react";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date";
import { StudentInformationSectionShared } from "@/frontend/common/views/dashboard/students/quota/components/studentInformationSectionShared";
import type {
  StudentInfoDatePickerProps,
  StudentInformationSectionSlotProps,
} from "@/frontend/common/views/dashboard/students/quota/components/studentInformationSectionShared.types";
import { DesktopLanguageDisplay } from "@/frontend/desktop/components/ui/display/language";
import { GenderSelectorDesktop } from "@/frontend/desktop/components/ui/input/genderSelector";
import { SectionHeaderDesktop } from "@/frontend/desktop/views/dashboard/students/quota/components/sectionHeader.desktop";

function DesktopSectionHeader({ title, icon }: Readonly<{ title: string; icon: ElementType }>) {
  return <SectionHeaderDesktop title={title} desktopIcon={icon} />;
}

const DESKTOP_SLOTS: StudentInformationSectionSlotProps = {
  DatePicker: AppDatePicker as ComponentType<StudentInfoDatePickerProps>,
  LanguageDisplay: DesktopLanguageDisplay,
  GenderSelector: GenderSelectorDesktop,
  SectionHeader: DesktopSectionHeader,
  sectionHeaderIcon: BadgeOutlined,
  rootGap: 4,
  fieldsGap: 4,
  gridTemplateColumns: "1fr 1fr",
  genderFieldPx: 0,
};

export function StudentInformationSectionDesktop() {
  return <StudentInformationSectionShared slots={DESKTOP_SLOTS} />;
}
