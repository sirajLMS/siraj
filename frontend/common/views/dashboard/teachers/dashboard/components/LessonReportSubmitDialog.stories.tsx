import type { Meta, StoryObj } from "@storybook/react";
import { LessonReportSubmitDialog } from "@/frontend/common/views/dashboard/teachers/dashboard/components/LessonReportSubmitDialog";
import type { LessonReportFormLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/lessonReportFormTypes";
import { useAppTranslation } from "@/shared/locale/client";
import type { LessonReportLabels } from "@/shared/locale/types/dashboard/lms/lessonReports";

function buildLabels(lessonReportI18n: LessonReportLabels): LessonReportFormLabels {
  return {
    attendanceEvaluation: lessonReportI18n.attendanceEvaluation,
    durationMinutes: lessonReportI18n.durationMinutes,
    completionPercentage: lessonReportI18n.completionPercentage,
    teacherNotes: lessonReportI18n.teacherNotes,
    present: lessonReportI18n.present,
    absent: lessonReportI18n.absent,
    late: lessonReportI18n.late,
    submit: lessonReportI18n.submit,
    dialogTitle: lessonReportI18n.dialogTitle,
    cancel: lessonReportI18n.cancel,
    submitting: lessonReportI18n.submitting,
    submitFailed: lessonReportI18n.submitFailed,
    attendanceRequired: lessonReportI18n.attendanceRequired,
    durationMin: lessonReportI18n.durationMin,
    durationMax: lessonReportI18n.durationMax,
    completionMin: lessonReportI18n.completionMin,
    completionMax: lessonReportI18n.completionMax,
  };
}

export function MockLessonReportSubmitDialog() {
  const lessonReportI18n = useAppTranslation().dashboardTranslations.lmsLessonReports;
  const labels = buildLabels(lessonReportI18n);

  return (
    <LessonReportSubmitDialog
      open={true}
      onClose={() => {}}
      classInstanceId="SLMS-4412"
      defaultDurationMinutes={60}
      labels={labels}
      onSubmit={async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }}
    />
  );
}

const meta: Meta<typeof MockLessonReportSubmitDialog> = {
  title: "Views/dashboard/teachers/dashboard/LessonReportSubmitDialog",
  component: MockLessonReportSubmitDialog,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof MockLessonReportSubmitDialog>;

export const Default: Story = {};

export const NoDefaultDuration: Story = {
  render: () => <MockLessonReportSubmitDialog />,
};
