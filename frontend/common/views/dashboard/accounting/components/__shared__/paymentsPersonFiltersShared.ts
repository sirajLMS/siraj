"use client";

import { useMemo, useState } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import type { PaymentsListViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentsListViewModel";

type PaymentsPersonFilterFields = Pick<
  PaymentsListViewModel,
  "rows" | "studentId" | "parentId" | "setStudentId" | "setParentId"
>;

export interface PaymentsPersonFilterSelection {
  readonly studentValue: PersonOption | null;
  readonly parentValue: PersonOption | null;
  readonly handleStudentChange: (next: PersonOption | null) => void;
  readonly handleParentChange: (next: PersonOption | null) => void;
}

/**
 * Display facades for the student/parent autocomplete filters. The store
 * persists only ids; the displayed options are derived from the active ids so
 * an externally cleared filter (e.g. resetFilters) can never show a stale
 * name. Rows provide the student label fallback after a reload.
 */
export function usePaymentsPersonFilterSelection(props: PaymentsPersonFilterFields): PaymentsPersonFilterSelection {
  const { rows, studentId, parentId, setStudentId, setParentId } = props;

  const [studentOption, setStudentOption] = useState<PersonOption | null>(null);
  const [parentOption, setParentOption] = useState<PersonOption | null>(null);

  const studentValue = useMemo<PersonOption | null>(() => {
    if (studentId === null || studentId === "") return null;
    if (studentOption?.id === studentId) return studentOption;
    const match = rows.find(row => row.studentId === studentId);
    return match ? { id: studentId, name: match.studentName ?? "" } : null;
  }, [rows, studentId, studentOption]);

  const parentValue = parentId !== null && parentOption?.id === parentId ? parentOption : null;

  const handleStudentChange = (next: PersonOption | null) => {
    setStudentOption(next);
    setStudentId(next?.id ?? null);
  };

  const handleParentChange = (next: PersonOption | null) => {
    setParentOption(next);
    setParentId(next?.id ?? null);
  };

  return { studentValue, parentValue, handleStudentChange, handleParentChange };
}
