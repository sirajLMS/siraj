"use client";

import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import { useManualClassEntryStudentField } from "@/frontend/common/views/dashboard/teachers/dashboard/components/manualClassEntryStudentFieldContext";
import { StudentAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";

export function ManualClassEntryStudentSelectMobile({
  teacherId,
  open,
  studentLabel,
}: Readonly<{ readonly teacherId: string; readonly open: boolean; readonly studentLabel: string }>) {
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
      label={studentLabel}
      required
    />
  );
}
