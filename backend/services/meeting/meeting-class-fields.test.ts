import { describe, expect, test } from "bun:test";
import { MeetingClassFieldsService } from "@/backend/services/meeting/meeting-class-fields";

describe("MeetingClassFieldsService", () => {
  test("applyToInsertInput preserves explicit meetingJoinUrl", async () => {
    const input = {
      teacherId: "teacher-1",
      studentId: "student-1",
      meetingJoinUrl: "https://zoom.us/j/explicit",
    };

    const result = await MeetingClassFieldsService.applyToInsertInput(input);
    expect(result.meetingJoinUrl).toBe("https://zoom.us/j/explicit");
    expect(result.meetingConfigSnapshot).toBeNull();
  });

  test("resolveForTeacher returns null fields when explicit null meetingJoinUrl", async () => {
    const result = await MeetingClassFieldsService.resolveForTeacher("teacher-1", {
      explicitMeetingJoinUrl: null,
    });
    expect(result.meetingJoinUrl).toBeNull();
    expect(result.meetingConfigSnapshot).toBeNull();
  });
});
