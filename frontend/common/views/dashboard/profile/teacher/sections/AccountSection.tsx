"use client";

import type { Control, UseFormRegister } from "react-hook-form";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { CoreIdentitySection } from "@/frontend/common/views/dashboard/profile/shared/sections/CoreIdentitySection";
import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import type {
  TeacherProfileViewLabels,
  TeacherViewData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import type { ProfileScope } from "@/shared/constants/profile.enum";

type TeacherAccountFormFields = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  displayCurrency?: CurrencyCode | null;
};

type AccountSectionProps = {
  readonly labels: Pick<TeacherProfileViewLabels, "teacher"> & { readonly baseLabels: ProfileSharedBaseLabels };
} & (
  | {
      readonly mode: "view";
      readonly teacherData: Pick<TeacherViewData, "name" | "email">;
      readonly avatarUrl?: string | null;
      readonly displayCurrency: CurrencyCode | null | undefined;
      readonly scope?: ProfileScope;
    }
  | {
      readonly mode: "edit";
      readonly teacherData: Pick<TeacherViewData, "name" | "email">;
      readonly register: UseFormRegister<TeacherAccountFormFields>;
      readonly control: Control<TeacherAccountFormFields>;
      readonly scope?: ProfileScope;
    }
);

export function AccountSection(props: AccountSectionProps) {
  const { labels } = props;
  const t = labels.teacher;

  if (props.mode === "edit") {
    return (
      <CoreIdentitySection
        mode="edit"
        scope={props.scope}
        name={props.teacherData.name}
        sectionTitle={t.sections.account}
        nameLabel={t.fields.fullName}
        emailLabel={t.fields.primaryEmail}
        currencyLabel={t.fields.displayCurrency}
        baseLabels={labels.baseLabels}
        register={props.register}
        control={props.control}
      />
    );
  }

  return (
    <CoreIdentitySection
      mode="view"
      scope={props.scope}
      name={props.teacherData.name}
      email={props.teacherData.email}
      avatarUrl={props.avatarUrl}
      displayCurrency={props.displayCurrency}
      sectionTitle={t.sections.account}
      nameLabel={t.fields.fullName}
      emailLabel={t.fields.primaryEmail}
      currencyLabel={t.fields.displayCurrency}
      baseLabels={labels.baseLabels}
    />
  );
}
