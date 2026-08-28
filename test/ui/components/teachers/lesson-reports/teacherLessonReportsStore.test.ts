import { afterEach, describe, expect, test } from "bun:test";
import { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  TEACHER_LESSON_REPORTS_DEFAULT_STATUS_FILTER,
  useTeacherLessonReportsStore,
} from "@/frontend/common/stores/teacherLessonReportsStore";

afterEach(() => {
  useTeacherLessonReportsStore.setState({ statusFilter: TEACHER_LESSON_REPORTS_DEFAULT_STATUS_FILTER });
});

describe("teacherLessonReportsStore", () => {
  test("defaults to the ALL status filter", () => {
    expect(useTeacherLessonReportsStore.getState().statusFilter).toBe("ALL");
  });

  test("round-trips a status filter selection", () => {
    useTeacherLessonReportsStore.getState().setStatusFilter(LessonReportStatus.Approved);
    expect(useTeacherLessonReportsStore.getState().statusFilter).toBe(LessonReportStatus.Approved);

    useTeacherLessonReportsStore.getState().setStatusFilter(LessonReportStatus.PendingReview);
    expect(useTeacherLessonReportsStore.getState().statusFilter).toBe(LessonReportStatus.PendingReview);

    useTeacherLessonReportsStore.getState().setStatusFilter("ALL");
    expect(useTeacherLessonReportsStore.getState().statusFilter).toBe("ALL");
  });
});
