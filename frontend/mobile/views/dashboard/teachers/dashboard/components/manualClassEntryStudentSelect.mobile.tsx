"use client";

import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import {
  ManualClassEntryDialog,
  useManualClassEntryStudentField,
} from "@/frontend/common/views/dashboard/teachers/dashboard/components/ManualClassEntryDialog";
import { StudentAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { useAppTranslation } from "@/shared/locale";

export function ManualClassEntryStudentSelectMobile({
  teacherId,
  open,
}: Readonly<{ readonly teacherId: string; readonly open: boolean }>) {
  const t = useAppTranslation().dashboardTranslations.teacherDashboard;
  const { studentId, setStudentId, disabled } = useManualClassEntryStudentField();

  return (
    <StudentAutocompleteMobile
      value={studentId ? ({ id: studentId, name: "" } satisfies PersonOption) : null}
      onChange={option => {
        setStudentId(option?.id ?? "");
      }}
      scope={{ primaryTeacherId: teacherId }}
      skip={!open || !teacherId}
      disabled={disabled}
      label={t.manualClassEntry.studentLabel}
      required
    />
  );
}

export { ManualClassEntryDialog };
