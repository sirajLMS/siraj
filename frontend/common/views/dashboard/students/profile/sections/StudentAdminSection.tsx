"use client";

import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  AdminSectionShared,
  EditResetPasswordSlot,
} from "@/frontend/common/views/dashboard/profile/components/__shared__/adminSectionShared";
import type { AdminResetPasswordSectionRef } from "@/frontend/common/views/dashboard/profile/shared/AdminResetPasswordSection";
import {
  getStudentStatusColor,
  getStudentStatusLabel,
  toAccountStatusDefaultValue,
} from "@/frontend/common/views/dashboard/profile/shared/studentStatusHelpers";
import { useProfileFieldAccess } from "@/frontend/common/views/dashboard/profile/shared/useProfileFieldAccess";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";
import { Translation, useAppTranslation } from "@/shared/locale";

type StudentAdminSectionProps = {
  readonly labels: { readonly baseLabels: { readonly actions: { readonly manageLifecycle: string } } };
  readonly resetPasswordRef?: React.RefObject<AdminResetPasswordSectionRef | null>;
} & (
  | {
      readonly mode: "view";
      readonly studentData: StudentProfileRow;
    }
  | {
      readonly mode: "edit";
      readonly studentData: StudentProfileRow;
    }
);

export function StudentAdminSection(props: StudentAdminSectionProps) {
  const t = useAppTranslation(Translation.Dashboard.StudentPortalProfile);
  const tStatus = useAppTranslation(Translation.Dashboard.StudentStatus);
  const tBase = useAppTranslation(Translation.Profile.Base);
  const { canEditStatus, canAdminResetPassword } = useProfileFieldAccess({ scope: undefined });

  const { studentData, resetPasswordRef } = props;
  const targetUserId = studentData.parentUserId ?? studentData.id;
  const studentName = studentData.name;
  const studentEmail = studentData.email ?? "";

  const editResetPassword =
    props.mode === "edit" && canAdminResetPassword() && targetUserId ? (
      <EditResetPasswordSlot
        targetUserId={targetUserId}
        userName={studentName}
        userEmail={studentEmail}
        ref={resetPasswordRef}
      />
    ) : null;

  return (
    <AdminSectionShared
      mode={props.mode}
      sectionTitle={t.accountStatus}
      accountStatusLabel={t.accountStatus}
      resetPasswordSuccess={tBase.adminResetPassword.success}
      resetPasswordError={tBase.adminResetPassword.error}
      statusBadgeCategory="studentAccount"
      statusColor={getStudentStatusColor(studentData.status)}
      statusLabel={getStudentStatusLabel(studentData.status, tStatus)}
      editStatusOptions={[
        { value: AccountStatus.Activated, label: tBase.adminResetPassword.statusActivated },
        { value: AccountStatus.Deactivated, label: tBase.adminResetPassword.statusDeactivated },
      ]}
      editStatusDefaultValue={toAccountStatusDefaultValue(studentData.status)}
      canEditStatus={canEditStatus()}
      targetUserId={targetUserId}
      userName={studentName}
      userEmail={studentEmail}
      renderEditResetPassword={editResetPassword}
      resetPasswordRef={resetPasswordRef}
    />
  );
}
