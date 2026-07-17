"use client";

import { useMemo, useState } from "react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import type { AssignedStudentsRow } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsRowTypes";
import type { AssignedStudentsTabViewModel } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsTabTypes";
import { type ProfileStudentsLabels, useAppTranslation } from "@/shared/locale";

type AssignedStudentsResult = NonNullable<Operations.ProfileByUserIdQuery["profileByUserId"]>["assignedStudents"];
type AssignedStudentsItem = NonNullable<NonNullable<AssignedStudentsResult>["rows"]>[number];

type AssignedStudentsTabProps = {
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
    parentName: student.parentName?.trim() || t.parentUnknown,
    parentAvatarUrl: student.parentAvatarUrl ?? null,
    parentId: student.parentId ?? null,
    parentUserId: student.parentUserId ?? null,
    className: student.className?.trim() || t.classUnknown,
    status: student.status ?? "UNKNOWN",
    hoursPerWeek,
    classesRemaining,
    classesTotal,
  };
}

const lazyViews = createLazyView<AssignedStudentsTabViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/profile/teacher/students/assignedStudentsTab.mobile").then(m => ({
      default: m.AssignedStudentsTabMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/profile/teacher/students/assignedStudentsTab.desktop").then(m => ({
      default: m.AssignedStudentsTabDesktopView,
    }))
);

export function AssignedStudentsTab({ assignedStudents, loading, hasError, onRetry }: AssignedStudentsTabProps) {
  const t = useAppTranslation().profileTranslations.base.students;
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const rows = useMemo(() => {
    const sourceRows = assignedStudents?.rows ?? [];
    return sourceRows
      .filter((student): student is AssignedStudentsItem => Boolean(student?.id && student?.name))
      .map(student => toViewRow(student, t));
  }, [assignedStudents?.rows, t]);

  const classOptions = useMemo(() => {
    const options = Array.from(
      new Set(
        rows
          .map(row => row.className)
          .filter(className => className !== t.classUnknown)
          .sort((a, b) => a.localeCompare(b))
      )
    );
    return [t.allClasses, ...options];
  }, [rows, t]);

  const filteredRows = useMemo(() => {
    if (selectedClass === "all") {
      return rows;
    }
    return rows.filter(row => row.className === selectedClass);
  }, [rows, selectedClass]);

  const totalCount = filteredRows.length;

  const handleClassChange = (className: string) => {
    setSelectedClass(className === t.allClasses ? "all" : className);
    setPage(0);
  };

  const viewModel: AssignedStudentsTabViewModel = {
    title: t.title,
    description: t.description,
    rows: filteredRows,
    loading,
    hasError,
    retryLabel: t.errors.retry,
    errorLabel: t.errors.failedToLoad,
    onRetry,
    empty: { title: t.empty.title, description: t.empty.description },
    classFilter: {
      options: classOptions,
      selected: selectedClass,
      onSelect: handleClassChange,
      allClassesLabel: t.allClasses,
    },
    pagination: {
      page,
      pageSize,
      totalCount,
      onPageChange: setPage,
      onPaginationModelChange: (nextPage, nextPageSize) => {
        setPage(nextPage);
        setPageSize(nextPageSize);
      },
    },
  };

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
