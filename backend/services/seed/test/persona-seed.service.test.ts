import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { ParentRepository } from "@/backend/db/repo/parents";
import { TeacherRepository } from "@/backend/db/repo/teachers";
import { createTestParent, createTestTeacher, createTestUser } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { PersonaSeedService } from "@/backend/services/seed/persona-seed.service";
import type { ParentSelectType, TeacherSelectType } from "@/backend/types";

const mockTeacher: TeacherSelectType = {
  id: "teacher-1",
  userId: "user-teacher-1",
  nationality: null,
  nationalId: null,
  phone: null,
  dateOfBirth: null,
  gender: null,
  address: null,
  qualifications: null,
  countryCode: null,
  hourlyRate: null,
  rateCurrency: null,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const mockParent: ParentSelectType = {
  id: "parent-1",
  userId: "user-parent-1",
  status: "REGULAR",
  nationality: null,
  address: null,
  facebook: null,
  whatsapp: null,
  twitter: null,
  invoiceType: null,
  feeAmount: null,
  currency: null,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

afterEach(() => {
  spyOn(TeacherRepository, "listByUserIds").mockRestore();
  spyOn(TeacherRepository, "findByUserId").mockRestore();
  spyOn(ParentRepository, "listByUserIds").mockRestore();
  spyOn(ParentRepository, "findByUserId").mockRestore();
});

describe("PersonaSeedService batch query optimization", () => {
  describe("listTeachersByUserIds", () => {
    test("returns empty array when userIds is empty without querying DB", async () => {
      const spy = spyOn(TeacherRepository, "listByUserIds");
      const result = await PersonaSeedService.listTeachersByUserIds([]);
      expect(result).toEqual([]);
      expect(spy).toHaveBeenCalledWith([], undefined);
    });

    test("delegates to TeacherRepository.listByUserIds in a single batch call", async () => {
      const spy = spyOn(TeacherRepository, "listByUserIds").mockResolvedValue([mockTeacher]);
      const userIds = ["user-teacher-1", "user-teacher-2", "user-teacher-3"];

      const result = await PersonaSeedService.listTeachersByUserIds(userIds);

      expect(result).toEqual([mockTeacher]);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(userIds, undefined);
    });
  });

  describe("listParentsByUserIds", () => {
    test("returns empty array when userIds is empty without querying DB", async () => {
      const spy = spyOn(ParentRepository, "listByUserIds");
      const result = await PersonaSeedService.listParentsByUserIds([]);
      expect(result).toEqual([]);
      expect(spy).toHaveBeenCalledWith([], undefined);
    });

    test("delegates to ParentRepository.listByUserIds in a single batch call", async () => {
      const spy = spyOn(ParentRepository, "listByUserIds").mockResolvedValue([mockParent]);
      const userIds = ["user-parent-1", "user-parent-2", "user-parent-3"];

      const result = await PersonaSeedService.listParentsByUserIds(userIds);

      expect(result).toEqual([mockParent]);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(userIds, undefined);
    });
  });

  describe("Integration & Benchmark with Database Transaction", () => {
    test("fetches multiple seeded teachers and parents correctly in single batch query", async () => {
      await runInRollback(async tx => {
        const u1 = await createTestUser(tx, { name: "Teacher One", email: "t1@example.com" });
        const t1 = await createTestTeacher(tx, u1.id);
        const u2 = await createTestUser(tx, { name: "Teacher Two", email: "t2@example.com" });
        const t2 = await createTestTeacher(tx, u2.id);

        const pu1 = await createTestUser(tx, { name: "Parent One", email: "p1@example.com" });
        const p1 = await createTestParent(tx, pu1.id);
        const pu2 = await createTestUser(tx, { name: "Parent Two", email: "p2@example.com" });
        const p2 = await createTestParent(tx, pu2.id);

        const teacherUserIds = [u1.id, u2.id];
        const parentUserIds = [pu1.id, pu2.id];

        const teachers = await PersonaSeedService.listTeachersByUserIds(teacherUserIds, tx);
        const parents = await PersonaSeedService.listParentsByUserIds(parentUserIds, tx);

        expect(teachers).toHaveLength(2);
        expect(teachers.map(t => t.id).sort()).toEqual([t1.id, t2.id].sort());

        expect(parents).toHaveLength(2);
        expect(parents.map(p => p.id).sort()).toEqual([p1.id, p2.id].sort());
      });
    });
  });
});
