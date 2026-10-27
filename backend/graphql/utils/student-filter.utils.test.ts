import { describe, expect, it } from "bun:test";
import { AppLanguage } from "@/backend/enum/auth/auth.enum";
import { StudentStatus } from "@/backend/enum/students/student-lifecycle.enum";
import { Gender } from "@/backend/enum/users/user.enum";
import { EMPTY_STUDENT_FILTER_ARGS, toStudentFilterArgsOrNull } from "@/backend/graphql/utils/student-filter.utils";

describe("student-filter.utils", () => {
  it("returns null when value is null or undefined", () => {
    expect(toStudentFilterArgsOrNull(null)).toBeNull();
    expect(toStudentFilterArgsOrNull(undefined)).toBeNull();
  });

  it("returns default empty filter args for non-object inputs", () => {
    expect(toStudentFilterArgsOrNull("not-an-object")).toEqual(EMPTY_STUDENT_FILTER_ARGS);
    expect(toStudentFilterArgsOrNull(123)).toEqual(EMPTY_STUDENT_FILTER_ARGS);
    expect(toStudentFilterArgsOrNull([])).toEqual(EMPTY_STUDENT_FILTER_ARGS);
  });

  it("maps valid fields and validates enum members", () => {
    const result = toStudentFilterArgsOrNull({
      name: "Ahmed",
      gender: Gender.MALE,
      language: AppLanguage.ar,
      status: StudentStatus.REGULAR,
    });

    expect(result?.name).toBe("Ahmed");
    expect(result?.gender).toBe(Gender.MALE);
    expect(result?.language).toBe(AppLanguage.ar);
    expect(result?.status).toBe(StudentStatus.REGULAR);
  });

  it("filters out invalid enum values", () => {
    const result = toStudentFilterArgsOrNull({
      gender: "INVALID_GENDER",
      language: "INVALID_LANG",
      status: "INVALID_STATUS",
    });

    expect(result?.gender).toBeUndefined();
    expect(result?.language).toBeUndefined();
    expect(result?.status).toBeUndefined();
  });
});
