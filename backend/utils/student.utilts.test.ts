import { describe, expect, test } from "bun:test";
import { Gender, StudentStatus } from "@/backend/enum";
import type { StudentSelectType } from "@/backend/types";
import { StudentUtils } from "@/backend/utils/student.utilts";
import { AppLanguage } from "@/shared/constants";

describe("StudentUtils", () => {
  describe("validateName", () => {
    test("returns 'studentNameLength' for names shorter than 3 characters", async () => {
      expect(await StudentUtils.validateName("")).toBe("studentNameLength");
      expect(await StudentUtils.validateName("a")).toBe("studentNameLength");
      expect(await StudentUtils.validateName("ab")).toBe("studentNameLength");
    });

    test("returns null for boundary length of 3 characters", async () => {
      expect(await StudentUtils.validateName("abc")).toBeNull();
    });

    test("returns null for valid names between 3 and 255 characters", async () => {
      expect(await StudentUtils.validateName("John Doe")).toBeNull();
      expect(await StudentUtils.validateName("Jane Smith", "en")).toBeNull();
    });

    test("returns null for boundary length of 255 characters", async () => {
      const maxName = "a".repeat(255);
      expect(await StudentUtils.validateName(maxName)).toBeNull();
    });

    test("returns 'studentNameLength' for names longer than 255 characters", async () => {
      const tooLongName = "a".repeat(256);
      expect(await StudentUtils.validateName(tooLongName)).toBe("studentNameLength");
    });
  });

  describe("mapEntityToDto", () => {
    test("returns null when entity is null or undefined", () => {
      expect(StudentUtils.mapEntityToDto(null)).toBeNull();
      expect(StudentUtils.mapEntityToDto(undefined)).toBeNull();
    });

    test("correctly maps a complete StudentSelectType entity to StudentReturnType", () => {
      const now = new Date();
      const mockEntity: StudentSelectType = {
        id: "student-123",
        name: "John Doe",
        parentId: "parent-456",
        primaryTeacherId: "teacher-789",
        dateOfBirth: "2010-05-15",
        gender: "MALE",
        language: "en",
        status: "REGULAR",
        notes: "Some notes",
        hoursPerWeek: "12.5",
        classesTotal: 20,
        classesRemaining: 15,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      const result = StudentUtils.mapEntityToDto(mockEntity);

      expect(result).not.toBeNull();
      expect(result).toEqual({
        ...mockEntity,
        gender: Gender.MALE,
        language: AppLanguage.en,
        status: StudentStatus.REGULAR,
        hoursPerWeek: 12.5,
      });
    });

    test("falls back status to StudentStatus.REGULAR when status is invalid or null", () => {
      const mockEntity = {
        id: "student-124",
        name: "Alice",
        gender: "FEMALE",
        language: "ar",
        status: "INVALID_STATUS",
        hoursPerWeek: "5",
      } as unknown as StudentSelectType;

      const result = StudentUtils.mapEntityToDto(mockEntity);

      expect(result?.status).toBe(StudentStatus.REGULAR);
    });

    test("defaults hoursPerWeek to 0 when hoursPerWeek is missing, null, or empty string", () => {
      const mockEntityNullHours = {
        id: "student-125",
        name: "Bob",
        gender: "MALE",
        language: "en",
        status: "REGULAR",
        hoursPerWeek: null,
      } as unknown as StudentSelectType;

      const mockEntityEmptyHours = {
        id: "student-126",
        name: "Charlie",
        gender: "MALE",
        language: "en",
        status: "REGULAR",
        hoursPerWeek: "",
      } as unknown as StudentSelectType;

      const resultNull = StudentUtils.mapEntityToDto(mockEntityNullHours);
      const resultEmpty = StudentUtils.mapEntityToDto(mockEntityEmptyHours);

      expect(resultNull?.hoursPerWeek).toBe(0);
      expect(resultEmpty?.hoursPerWeek).toBe(0);
    });
  });
});
