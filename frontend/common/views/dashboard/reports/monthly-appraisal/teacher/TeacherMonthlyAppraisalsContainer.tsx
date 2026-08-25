"use client";

import { useQuery } from "@apollo/client/react";
import { useState } from "react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { teacherMonthlyAppraisalStudentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { AppraisalFormDialog } from "@/frontend/common/views/dashboard/reports/monthly-appraisal/teacher/AppraisalFormDialog";
import type {
  MonthlyAppraisalStudentRow,
  MonthlyAppraisalTeacherViewModel,
} from "@/frontend/common/views/dashboard/reports/monthly-appraisal/teacher/useTeacherMonthlyAppraisalsViewModel";
import { useAppTranslation } from "@/shared/locale/client/use-app-translation";
import { Translation } from "@/shared/locale/namespaces/translation";

const lazyViews = createLazyView<MonthlyAppraisalTeacherViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/reports/monthly-appraisal/teacherMonthlyAppraisals.mobile").then(m => ({
      default: m.TeacherMonthlyAppraisalsMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/reports/monthly-appraisal/teacherMonthlyAppraisals.desktop").then(m => ({
      default: m.TeacherMonthlyAppraisalsDesktopView,
    }))
);

function firstOfMonthISO(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
}

export function TeacherMonthlyAppraisalsContainer() {
  const labels = useAppTranslation(Translation.Dashboard.MonthlyAppraisal);
  const [selectedMonth, setSelectedMonth] = useState(firstOfMonthISO(new Date()));
  const [openFormStudentId, setOpenFormStudentId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(teacherMonthlyAppraisalStudentsQueryDocument, {
    variables: { month: selectedMonth },
    fetchPolicy: "cache-and-network",
  });

  const students: readonly MonthlyAppraisalStudentRow[] =
    data?.teacherMonthlyAppraisalStudents?.map(s => ({
      id: s.id ?? "",
      name: s.name ?? "",
      studentAvatarUrl: s.studentAvatarUrl ?? null,
      appraisalForMonth: s.appraisalForMonth
        ? {
            id: s.appraisalForMonth.id ?? "",
            month: s.appraisalForMonth.month ?? "",
            updatedAt: s.appraisalForMonth.updatedAt ?? "",
          }
        : null,
    })) ?? [];

  const viewModel: MonthlyAppraisalTeacherViewModel = {
    labels,
    students,
    loading,
    selectedMonth,
    onMonthChange: setSelectedMonth,
    onOpenForm: (studentId: string) => setOpenFormStudentId(studentId),
    error: Boolean(error),
  };

  const selectedStudent = students.find(s => s.id === openFormStudentId);
  const selectedMonthDate = new Date(selectedMonth);

  return (
    <>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
      <AppraisalFormDialog
        open={openFormStudentId !== null}
        studentId={openFormStudentId ?? ""}
        studentName={selectedStudent?.name ?? ""}
        month={selectedMonthDate.toISOString()}
        onClose={() => setOpenFormStudentId(null)}
        onSubmitted={() => {
          void refetch();
        }}
      />
    </>
  );
}
