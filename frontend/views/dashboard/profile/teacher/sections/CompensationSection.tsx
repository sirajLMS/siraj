"use client";

import { Stack } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import type { Control, UseFormRegister } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui";
import { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { buildFxDisplayMessages } from "@/frontend/lib/buildFxDisplayMessages";
import { formatCurrencyForDisplay } from "@/frontend/lib/fx-render";
import { DisplayCurrencyHint } from "@/frontend/views/dashboard/components/DisplayCurrencyHint";
import { CompensationEditFields } from "@/frontend/views/dashboard/profile/__shared__/CompensationSectionBase";
import { InfoField } from "@/frontend/views/dashboard/profile/teacher/sections/InfoField";
import type { TeacherViewData } from "@/frontend/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import type { TeacherAdminEditFormData } from "@/frontend/views/dashboard/profile/teacher/teacherProfileFormTypes";

type CompensationSectionProps =
  | {
      readonly mode: "view";
      readonly teacherData: TeacherViewData;
      readonly subjectUserId?: string;
    }
  | {
      readonly mode: "edit";
      readonly register: UseFormRegister<TeacherAdminEditFormData>;
      readonly control: Control<TeacherAdminEditFormData>;
    };

export function CompensationSection(props: CompensationSectionProps) {
  const t = useTranslations("profile.teacher");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  if (props.mode === "edit") {
    return (
      <CompensationEditFields
        register={props.register}
        control={props.control}
        translationNamespace="profile.teacher"
      />
    );
  }

  const lockedAmount = props.teacherData.hourlyRate ?? "0";
  const lockedCurrency = props.teacherData.rateCurrency ?? CurrencyCode.Usd;
  const displayAmount = props.teacherData.displayAmount;
  const salaryLabel = formatCurrencyForDisplay(
    lockedAmount,
    lockedCurrency,
    displayAmount
      ? {
          amount: displayAmount.amount,
          currency: displayAmount.currency ?? lockedCurrency,
          stale: displayAmount.stale ?? true,
        }
      : null,
    locale,
    buildFxDisplayMessages(t, tErrors)
  );

  return (
    <SectionPanel title={t("sections.compensation")}>
      {props.subjectUserId ? <DisplayCurrencyHint mode="subject" subjectUserId={props.subjectUserId} /> : null}
      <Stack spacing={2}>
        <InfoField label={t("fields.hourlyRate")} value={salaryLabel} />
      </Stack>
    </SectionPanel>
  );
}
