import { describe, expect, test } from "bun:test";
import { isAppPermission } from "@/backend/enum";
import { STUDENT_FIELD_GROUP_BY_KEY, STUDENT_FIELD_GROUPS } from "@/backend/services/student/student-field-manifest";
import type { StudentFieldGroupKey } from "@/backend/types";

describe("STUDENT_FIELD_GROUPS integrity", () => {
  test("defines non-empty student field groups with valid structure", () => {
    expect(STUDENT_FIELD_GROUPS.length).toBeGreaterThan(0);

    const groupKeys = new Set<string>();

    for (const group of STUDENT_FIELD_GROUPS) {
      expect(typeof group.groupKey).toBe("string");
      expect(group.groupKey.length).toBeGreaterThan(0);
      expect(groupKeys.has(group.groupKey)).toBe(false);
      groupKeys.add(group.groupKey);

      expect(Array.isArray(group.paths)).toBe(true);
      expect(group.paths).not.toHaveLength(0);
      for (const path of group.paths) {
        expect(typeof path).toBe("string");
        expect(path.length).toBeGreaterThan(0);
      }

      expect(isAppPermission(group.viewOwn)).toBe(true);
      expect(isAppPermission(group.viewOther)).toBe(true);
      expect(isAppPermission(group.editOwn)).toBe(true);
      expect(isAppPermission(group.editOther)).toBe(true);

      expect(String(group.viewOwn)).toBe(`student.${group.groupKey}.view_own`);
      expect(String(group.viewOther)).toBe(`student.${group.groupKey}.view_other`);
      expect(String(group.editOwn)).toBe(`student.${group.groupKey}.edit_own`);
      expect(String(group.editOther)).toBe(`student.${group.groupKey}.edit_other`);
    }
  });

  test("maps every group correctly in STUDENT_FIELD_GROUP_BY_KEY", () => {
    const mapKeys = Object.keys(STUDENT_FIELD_GROUP_BY_KEY);
    expect(mapKeys).toHaveLength(STUDENT_FIELD_GROUPS.length);

    for (const group of STUDENT_FIELD_GROUPS) {
      const key = group.groupKey as StudentFieldGroupKey;
      expect(STUDENT_FIELD_GROUP_BY_KEY[key]).toBe(group);
    }
  });

  test("defines correct paths for each expected student field group", () => {
    expect(STUDENT_FIELD_GROUP_BY_KEY.student_identity.paths).toEqual([
      "name",
      "avatarUrl",
      "dateOfBirth",
      "gender",
      "language",
    ]);

    expect(STUDENT_FIELD_GROUP_BY_KEY.student_academic.paths).toEqual([
      "status",
      "hoursPerWeek",
      "classesRemaining",
      "classesTotal",
      "version",
    ]);

    expect(STUDENT_FIELD_GROUP_BY_KEY.student_teacher.paths).toEqual([
      "primaryTeacherId",
      "teacherName",
      "teacherUserId",
    ]);

    expect(STUDENT_FIELD_GROUP_BY_KEY.student_parent.paths).toEqual(["parentId", "parentName", "parentUserId"]);

    expect(STUDENT_FIELD_GROUP_BY_KEY.student_schedule.paths).toEqual(["upcomingClasses"]);

    expect(STUDENT_FIELD_GROUP_BY_KEY.student_history.paths).toEqual(["classHistory"]);

    expect(STUDENT_FIELD_GROUP_BY_KEY.student_quota_edit.paths).toEqual(["classesRemaining"]);
  });
});
