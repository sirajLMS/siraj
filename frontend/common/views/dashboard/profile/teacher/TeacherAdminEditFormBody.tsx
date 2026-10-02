"use client";

import type { UseFormReturn } from "react-hook-form";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import { TeacherExtensionProfileSection } from "@/frontend/common/views/dashboard/profile/shared/sections/extensions/TeacherExtensionProfileSection";
import { AccountSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/AccountSection";
import { AdminOnlySection } from "@/frontend/common/views/dashboard/profile/teacher/sections/AdminOnlySection";
import { CompensationSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/CompensationSection";
import { ContactSection } from "@/frontend/common/views/dashboard/profile/teacher/sections/ContactSection";
import {
  toTeacherPersonalFieldLabels,
  toTeacherSectionLabels,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileLabelUtils";
import type { TeacherProfileViewLabels } from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import type {
  TeacherAdminEditFormData,
  TeacherEditData,
} from "@/frontend/common/views/dashboard/profile/teacher/teacherProfileFormTypes";
import type { ProfileScope } from "@/shared/constants/profile.enum";
import type { ProfileFieldGroupKey } from "@/shared/constants/profile-field-groups";

type TeacherAdminEditFormBodyProps = {
  readonly labels: TeacherProfileViewLabels;
  readonly teacherData: TeacherEditData;
  readonly targetUserId: string;
  readonly scope: ProfileScope;
  readonly canEdit: (groupKey: ProfileFieldGroupKey) => boolean;
  readonly form: UseFormReturn<TeacherAdminEditFormData>;
};

export function TeacherAdminEditFormBody({
  labels,
  teacherData,
  targetUserId,
  scope,
  canEdit,
  form,
}: Readonly<TeacherAdminEditFormBodyProps>) {
  const sectionLabels = toTeacherSectionLabels(labels);
  const personalFieldLabels = toTeacherPersonalFieldLabels(labels);

  return (
    <>
      {canEdit("core_identity") ? (
        <AccountSection
          labels={sectionLabels}
          mode="edit"
          scope={scope}
          teacherData={{ name: teacherData.name ?? null, email: teacherData.email ?? null }}
          register={form.register}
          control={form.control}
        />
      ) : null}
      {canEdit("core_contact") || canEdit("teacher_identity") ? (
        <ContactSection
          labels={sectionLabels}
          scope={scope}
          isAdminScope
          register={form.register}
          control={form.control}
        />
      ) : null}
      <DisplayCurrencyHint mode="subject" subjectUserId={targetUserId} />
      {canEdit("teacher_professional") ? (
        <CompensationSection labels={labels} mode="edit" register={form.register} control={form.control} />
      ) : null}
      {canEdit("teacher_identity") || canEdit("teacher_professional") ? (
        <TeacherExtensionProfileSection
          mode="edit"
          scope={scope}
          labels={{
            teacher: labels.teacher,
            personalFieldLabels,
            baseLabels: sectionLabels.baseLabels,
          }}
          sectionTitle={labels.teacher.sections.identity}
          register={form.register}
          control={form.control}
        />
      ) : null}
      {canEdit("teacher_identity") ? (
        <AdminOnlySection labels={sectionLabels} mode="edit" control={form.control} register={form.register} />
      ) : null}
    </>
  );
}
