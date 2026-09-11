import { describe, expect, test } from "bun:test";
import { AppLanguage, Gender, StudentStatus } from "@/backend/enum";
import type { StudentSelectType } from "@/backend/types";
import { StudentUtils } from "@/backend/utils/student.utilts";

const CREATED_AT = new Date("2024-01-01T00:00:00Z");
const UPDATED_AT = new Date("2024-01-02T00:00:00Z");

const createStudent = (overrides: Partial<StudentSelectType> = {}): StudentSelectType => ({
  id: "student-123",
  name: "John Doe",
  userId: "user-456",
  parentId: "parent-456",
  primaryTeacherId: "teacher-789",
  avatarUrl: null,
  dateOfBirth: new Date("2010-05-15"),
  gender: Gender.MALE,
  language: AppLanguage.en,
  timezoneOverride: null,
  status: StudentStatus.REGULAR,
  classesTotal: 20,
  classesRemaining: 15,
  creditHoursTotal: "0.00",
  creditHoursRemaining: "0.00",
  version: 0,
  hoursPerWeek: "12.5",
  idempotencyKey: "idem-student-123",
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
  ...overrides,
});

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
      const mockEntity = createStudent();

      const result = StudentUtils.mapEntityToDto(mockEntity);

      expect(result).toEqual({
        ...mockEntity,
        gender: Gender.MALE,
        language: AppLanguage.en,
        status: StudentStatus.REGULAR,
        hoursPerWeek: 12.5,
      });
    });

    test("falls back status to StudentStatus.REGULAR when status is invalid or null", () => {
      const mockEntity = createStudent({
        id: "student-124",
        name: "Alice",
        gender: Gender.FEMALE,
        language: AppLanguage.ar,
        // Force an out-of-domain value to exercise the REGULAR fallback branch.
        status: "INVALID_STATUS",
        hoursPerWeek: "5",
      });

      const result = StudentUtils.mapEntityToDto(mockEntity);

      expect(result?.status).toBe(StudentStatus.REGULAR);
    });

    test("defaults hoursPerWeek to 0 when hoursPerWeek is missing, null, or empty string", () => {
      // Force a null to exercise the falsy hoursPerWeek branch (column is NOT NULL in the schema).
      const mockEntityNullHours = Object.assign(createStudent({ id: "student-125", name: "Bob" }), {
        hoursPerWeek: null,
      });

      const mockEntityEmptyHours = createStudent({
        id: "student-126",
        name: "Charlie",
        hoursPerWeek: "",
      });

      const resultNull = StudentUtils.mapEntityToDto(mockEntityNullHours);
      const resultEmpty = StudentUtils.mapEntityToDto(mockEntityEmptyHours);

      expect(resultNull?.hoursPerWeek).toBe(0);
      expect(resultEmpty?.hoursPerWeek).toBe(0);
    });
  });
});
