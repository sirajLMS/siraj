import { describe, expect, it, spyOn } from "bun:test";
import { ParentRepository } from "@/backend/db/repo/parents";
import { TeacherRepository } from "@/backend/db/repo/teachers";
import { PersonaSeedService } from "@/backend/services/seed/persona-seed.service";
import type { ParentSelectType, TeacherSelectType } from "@/backend/types";

describe("PersonaSeedService Batching Benchmark / Unit Test", () => {
  it("listTeachersByUserIds retrieves teachers", async () => {
    const mockTeachers: TeacherSelectType[] = [
      {
        id: "t1",
        userId: "u1",
        phone: null,
        nationalId: null,
        nationality: null,
        countryCode: null,
        dateOfBirth: null,
        gender: null,
        address: null,
        qualifications: null,
        hourlyRate: null,
        rateCurrency: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "t2",
        userId: "u2",
        phone: null,
        nationalId: null,
        nationality: null,
        countryCode: null,
        dateOfBirth: null,
        gender: null,
        address: null,
        qualifications: null,
        hourlyRate: null,
        rateCurrency: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const spy = spyOn(TeacherRepository, "findManyByUserIds").mockImplementation(async (userIds) => {
      return mockTeachers.filter((t) => userIds.includes(t.userId));
    });

    const userIds = Array.from({ length: 100 }, (_, i) => `u${i + 1}`);

    const start = performance.now();
    const result = await PersonaSeedService.listTeachersByUserIds(userIds);
    const duration = performance.now() - start;

    expect(result.length).toBe(2);
    // After optimization, `findManyByUserIds` is called once for all userIds (batch query)
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(userIds, undefined);
    console.log(`[Optimized] listTeachersByUserIds with 100 userIds took ${duration.toFixed(3)}ms, batch spy called ${spy.mock.calls.length} time`);

    spy.mockRestore();
  });

  it("listParentsByUserIds retrieves parents", async () => {
    const mockParents: ParentSelectType[] = [
      {
        id: "p1",
        userId: "u1",
        status: "REGULAR",
        nationality: null,
        address: null,
        facebook: null,
        whatsapp: null,
        twitter: null,
        invoiceType: null,
        feeAmount: null,
        currency: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const spy = spyOn(ParentRepository, "findManyByUserIds").mockImplementation(async (userIds) => {
      return mockParents.filter((p) => userIds.includes(p.userId));
    });

    const userIds = Array.from({ length: 100 }, (_, i) => `u${i + 1}`);

    const start = performance.now();
    const result = await PersonaSeedService.listParentsByUserIds(userIds);
    const duration = performance.now() - start;

    expect(result.length).toBe(1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(userIds, undefined);
    console.log(`[Optimized] listParentsByUserIds with 100 userIds took ${duration.toFixed(3)}ms, batch spy called ${spy.mock.calls.length} time`);

    spy.mockRestore();
  });
});
