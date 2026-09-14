"use client";

import { useMemo, useState } from "react";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { ProfileByUserIdQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import type { AssignedStudentsRow } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsRowTypes";
import type { AssignedStudentsTabViewModel } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsTabTypes";
import { type ProfileStudentsLabels, Translation, useAppTranslation } from "@/shared/locale";

type AssignedStudentsResult = NonNullable<ProfileByUserIdQuery["profileByUserId"]>["assignedStudents"];
type AssignedStudentsItem = NonNullable<NonNullable<AssignedStudentsResult>["rows"]>[number];

export type UseAssignedStudentsTabViewModelProps = {
  readonly assignedStudents: AssignedStudentsResult | null | undefined;
  readonly loading: boolean;
  readonly hasError: boolean;
  readonly onRetry: () => void;
};

function toViewRow(student: AssignedStudentsItem, t: ProfileStudentsLabels): AssignedStudentsRow {
  const classesTotal = student.classesTotal ?? 0;
  const classesRemaining = student.classesRemaining ?? 0;
  const hoursPerWeek = student.hoursPerWeek ?? 0;

  return {
    id: student.id ?? "",
    studentName: student.name ?? "",
    studentAvatarUrl: student.studentAvatarUrl ?? null,
    parentName: student.parentName?.trim() ?? t.parentUnknown,
    parentAvatarUrl: student.parentAvatarUrl ?? null,
    parentId: student.parentId ?? null,
    parentUserId: student.parentUserId ?? null,
    className: student.className?.trim() ?? t.classUnknown,
    status: student.status ?? "UNKNOWN",
    hoursPerWeek,
    classesRemaining,
    classesTotal,
  };
}

function buildRows(
  assignedStudents: AssignedStudentsResult | null | undefined,
  t: ProfileStudentsLabels
): AssignedStudentsRow[] {
  const sourceRows = assignedStudents?.rows ?? [];
  return sourceRows
    .filter((student): student is AssignedStudentsItem => Boolean(student?.id && student?.name))
    .map(student => toViewRow(student, t));
}

function buildClassOptions(rows: readonly AssignedStudentsRow[], t: ProfileStudentsLabels): string[] {
  const options = Array.from(
    new Set(
      rows
        .map(row => row.className)
        .filter(className => className !== t.classUnknown)
        .toSorted((a, b) => a.localeCompare(b))
    )
  );
  return [t.allClasses, ...options];
}

function filterRowsByClass(rows: readonly AssignedStudentsRow[], selectedClass: string): AssignedStudentsRow[] {
  if (selectedClass === "all") {
    return [...rows];
  }
  return rows.filter(row => row.className === selectedClass);
}

function handleClassChangeHandler(
  className: string,
  t: ProfileStudentsLabels,
  setSelectedClass: React.Dispatch<React.SetStateAction<string>>
): void {
  setSelectedClass(className === t.allClasses ? "all" : className);
}

function buildLabelsBySection(t: ProfileStudentsLabels) {
  return {
    columns: t.columns,
    list: {
      mobileEmptyMessage: t.mobileListLabel,
      desktopEmptyMessage: t.noRows,
    },
  };
}

function buildEmptyState(t: ProfileStudentsLabels) {
  return { title: t.empty.title, description: t.empty.description };
}

function buildClassFilter(
  classOptions: string[],
  selectedClass: string,
  handleClassChange: (className: string) => void,
  t: ProfileStudentsLabels
) {
  return {
    options: classOptions,
    selected: selectedClass,
    onSelect: handleClassChange,
    allClassesLabel: t.allClasses,
  };
}

const CLIENT_PAGINATION_OPTIONS: ListPaginationOptions = {
  mode: "client",
  pageSize: 10,
  pageSizeOptions: [5, 10, 25],
};

export function useAssignedStudentsTabViewModel(
  props: Readonly<UseAssignedStudentsTabViewModelProps>
): AssignedStudentsTabViewModel {
  const { assignedStudents, loading, hasError, onRetry } = props;
  const t = useAppTranslation(Translation.Profile.Base).students;
  const [selectedClass, setSelectedClass] = useState<string>("all");

  const rows = useMemo(() => buildRows(assignedStudents, t), [assignedStudents, t]);

  const classOptions = useMemo(() => buildClassOptions(rows, t), [rows, t]);

  const filteredRows = useMemo(() => filterRowsByClass(rows, selectedClass), [rows, selectedClass]);

  const handleClassChange = (className: string) => handleClassChangeHandler(className, t, setSelectedClass);

  return {
    labelsBySection: buildLabelsBySection(t),
    title: t.title,
    description: t.description,
    rows: filteredRows,
    loading,
    hasError,
    retryLabel: t.errors.retry,
    errorLabel: t.errors.failedToLoad,
    onRetry,
    empty: buildEmptyState(t),
    classFilter: buildClassFilter(classOptions, selectedClass, handleClassChange, t),
    pagination: CLIENT_PAGINATION_OPTIONS,
  };
}
