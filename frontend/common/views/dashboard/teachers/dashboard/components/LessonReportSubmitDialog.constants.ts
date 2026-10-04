import { AttendanceEvaluation } from "@/frontend/common/graphql/generated/gql/graphql";
import type { AttendanceEvaluationValue } from "@/frontend/common/views/dashboard/teachers/dashboard/types/lessonReportFormTypes";

const ATTENDANCE_OPTIONS: ReadonlyArray<{
  readonly value: AttendanceEvaluationValue;
  readonly labelKey: "present" | "absent" | "late";
}> = [
  { value: AttendanceEvaluation.Present, labelKey: "present" },
  { value: AttendanceEvaluation.Absent, labelKey: "absent" },
  { value: AttendanceEvaluation.Late, labelKey: "late" },
];

export { ATTENDANCE_OPTIONS };
