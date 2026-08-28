"use client";

import {
  AdminSectionShared,
  EditResetPasswordSlot,
} from "@/frontend/common/views/dashboard/profile/components/__shared__/adminSectionShared";
import type { AdminResetPasswordSectionRef } from "@/frontend/common/views/dashboard/profile/shared/AdminResetPasswordSection";
import {
  getStudentStatusColor,
  getStudentStatusLabel,
  STUDENT_STATUS_OPTIONS,
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
      editStatusOptions={STUDENT_STATUS_OPTIONS.map(status => ({
        value: status,
        label: tStatus.statusOptions[status],
      }))}
      editStatusDefaultValue={studentData.status}
      canEditStatus={canEditStatus()}
      targetUserId={targetUserId}
      userName={studentName}
      userEmail={studentEmail}
      renderEditResetPassword={editResetPassword}
      resetPasswordRef={resetPasswordRef}
    />
  );
}
