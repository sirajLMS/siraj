"use client";

import { BadgeOutlined } from "@mui/icons-material";
import type { ComponentType, ElementType } from "react";
import { StudentInformationSectionShared } from "@/frontend/common/views/dashboard/students/quota/components/studentInformationSectionShared";
import type {
  StudentInfoDatePickerProps,
  StudentInformationSectionSlotProps,
} from "@/frontend/common/views/dashboard/students/quota/components/studentInformationSectionShared.types";
import { MobileLanguageDisplay } from "@/frontend/mobile/components/ui/display/language";
import { MobileAppDatePicker } from "@/frontend/mobile/components/ui/form/date";
import { GenderSelectorMobile } from "@/frontend/mobile/components/ui/input/genderSelector";
import { SectionHeaderMobile } from "@/frontend/mobile/views/dashboard/students/quota/components/sectionHeader.mobile";

function MobileSectionHeader({ title, icon }: Readonly<{ title: string; icon: ElementType }>) {
  return <SectionHeaderMobile title={title} mobileIcon={icon} />;
}

const MOBILE_SLOTS: StudentInformationSectionSlotProps = {
  DatePicker: MobileAppDatePicker as ComponentType<StudentInfoDatePickerProps>,
  LanguageDisplay: MobileLanguageDisplay,
  GenderSelector: GenderSelectorMobile,
  SectionHeader: MobileSectionHeader,
  sectionHeaderIcon: BadgeOutlined,
  rootGap: 3,
  fieldsGap: 2,
  gridTemplateColumns: "1fr",
  genderFieldPx: 0.5,
};

export function StudentInformationSectionMobile() {
  return <StudentInformationSectionShared slots={MOBILE_SLOTS} />;
}
