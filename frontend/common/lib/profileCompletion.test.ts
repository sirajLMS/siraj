import { describe, expect, test } from "bun:test";
import {
  buildTeacherProfileEditHref,
  FORCE_COMPLETE_SEARCH_PARAM,
  hasForceCompleteSearchParam,
  isTeacherNationalIdComplete,
  TEACHER_PROFILE_COMPLETION_EDIT_HREF,
  TEACHER_PROFILE_EDIT_PATH,
} from "@/frontend/common/lib/profileCompletion";

describe("isTeacherNationalIdComplete", () => {
  test("returns false for null, undefined, empty, and whitespace-only values", () => {
    expect(isTeacherNationalIdComplete(null)).toBe(false);
    expect(isTeacherNationalIdComplete(undefined)).toBe(false);
    expect(isTeacherNationalIdComplete("")).toBe(false);
    expect(isTeacherNationalIdComplete("   ")).toBe(false);
  });

  test("returns true when nationalId has non-whitespace content", () => {
    expect(isTeacherNationalIdComplete("1234567890")).toBe(true);
    expect(isTeacherNationalIdComplete(" 123 ")).toBe(true);
  });
});

describe("hasForceCompleteSearchParam", () => {
  test("detects forceComplete=1 from URLSearchParams and plain objects", () => {
    expect(hasForceCompleteSearchParam(new URLSearchParams("forceComplete=1"))).toBe(true);
    expect(hasForceCompleteSearchParam({ forceComplete: "1" })).toBe(true);
    expect(hasForceCompleteSearchParam({ forceComplete: ["1"] })).toBe(true);
  });

  test("returns false when forceComplete is absent or not 1", () => {
    expect(hasForceCompleteSearchParam(new URLSearchParams())).toBe(false);
    expect(hasForceCompleteSearchParam({ forceComplete: "0" })).toBe(false);
    expect(hasForceCompleteSearchParam({ tab: "profile" })).toBe(false);
  });
});

describe("buildTeacherProfileEditHref", () => {
  test("adds forceComplete when requested", () => {
    expect(buildTeacherProfileEditHref(true)).toBe(`${TEACHER_PROFILE_EDIT_PATH}?${FORCE_COMPLETE_SEARCH_PARAM}=1`);
    expect(TEACHER_PROFILE_COMPLETION_EDIT_HREF).toBe(
      `${TEACHER_PROFILE_EDIT_PATH}?${FORCE_COMPLETE_SEARCH_PARAM}=1`
    );
  });

  test("strips forceComplete while preserving other query params", () => {
    expect(buildTeacherProfileEditHref(false, "forceComplete=1&tab=profile")).toBe(
      `${TEACHER_PROFILE_EDIT_PATH}?tab=profile`
    );
    expect(buildTeacherProfileEditHref(true, "tab=profile")).toBe(
      `${TEACHER_PROFILE_EDIT_PATH}?tab=profile&${FORCE_COMPLETE_SEARCH_PARAM}=1`
    );
  });
});
