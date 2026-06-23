### Task C — Repository Tests: Student Directory, Staff Profile, Learning Resource Coverage

**Objective:** Achieve 100% line + function coverage on all new repository methods from Task B. Test success paths, failure paths, IDOR protection, and transaction rollback behavior.

**Dependencies:** Depends on Task B — all repository methods are implemented.

**Layer-Specific Rules (Testing — Flattened from AGENTS_STORY_PLANNING.md Section 1.7):**
- **100% line + function coverage** on all new/modified repository methods.
- **Success AND failure paths** — valid input success, invalid input rejection, not-found handling, transaction rollback on failure.
- **IDOR protection tests** — User A cannot access User B's data, admin CAN access any user's data, unauthenticated user is rejected.
- Run `bun run test:coverage` to verify coverage.

**Target Files:**
- `backend/db/test/repo/student-directory.test.ts` — NEW (tests for `StudentRepository.getDirectoryRows()`)
- `backend/db/test/repo/staff-profile.test.ts` — NEW (tests for `StaffProfileRepository` methods)
- `backend/db/test/repo/learning-resource.test.ts` — NEW (tests for `LearningResourceRepository` methods)

---

**Detailed Implementation Steps:**

*Step 1: Create `student-directory.test.ts`*

Create `backend/db/test/repo/student-directory.test.ts`. This test file covers `StudentRepository.getDirectoryRows()`.

**Test cases to implement:**

```typescript
import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { StudentRepository } from "@/backend/db/repo/student.repository";

describe("StudentRepository.getDirectoryRows", () => {
  // Setup: Seed test data (students, parents, teachers, users)
  beforeAll(async () => {
    // Use test database setup utilities
    // Insert test parent → test user → test teacher → test students
  });

  afterAll(async () => {
    // Clean up test data
  });

  describe("Success paths", () => {
    it("returns enriched rows with parent name and teacher name", async () => {
      const result = await StudentRepository.getDirectoryRows(null);
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].parentName).toBeDefined();
      expect(result.totalCount).toBeGreaterThan(0);
    });

    it("returns correct totalCount", async () => {
      const result = await StudentRepository.getDirectoryRows(null);
      expect(result.totalCount).toBe(result.rows.length);
    });

    it("includes hoursPerWeek as string (numeric column)", async () => {
      const result = await StudentRepository.getDirectoryRows(null);
      expect(typeof result.rows[0].hoursPerWeek).toBe("string");
    });

    it("returns null teacherName for students without assigned teacher", async () => {
      // Insert student with primaryTeacherId = null
      const result = await StudentRepository.getDirectoryRows(null);
      const unassigned = result.rows.find(r => r.teacherName === null);
      expect(unassigned).toBeDefined();
    });
  });

  describe("Filter paths", () => {
    it("applies name search filter", async () => {
      const result = await StudentRepository.getDirectoryRows(
        null,
        { nameContains: "SpecificName" }
      );
      expect(result.rows.every(r => r.name.includes("SpecificName"))).toBe(true);
    });

    it("applies status filter", async () => {
      const result = await StudentRepository.getDirectoryRows(
        null,
        { status: "REGULAR" }
      );
      expect(result.rows.every(r => r.status === "REGULAR")).toBe(true);
    });
  });

  describe("Pagination paths", () => {
    it("respects perPage limit", async () => {
      const result = await StudentRepository.getDirectoryRows(
        { perPage: 2, after: null }
      );
      expect(result.rows.length).toBeLessThanOrEqual(2);
    });
  });

  describe("Ordering paths", () => {
    it("orders by createdAt DESC", async () => {
      const result = await StudentRepository.getDirectoryRows(
        null,
        null,
        [{ column: "CREATED_AT", order: "DESC" }]
      );
      for (let i = 1; i < result.rows.length; i++) {
        expect(result.rows[i].createdAt <= result.rows[i - 1].createdAt).toBe(true);
      }
    });
  });

  describe("Empty result handling", () => {
    it("returns empty array when no students match filter", async () => {
      const result = await StudentRepository.getDirectoryRows(
        null,
        { nameContains: "NonExistentName12345" }
      );
      expect(result.rows.length).toBe(0);
      expect(result.totalCount).toBe(0);
    });
  });
});
```

---

*Step 2: Create `staff-profile.test.ts`*

Create `backend/db/test/repo/staff-profile.test.ts`. This test file covers all `StaffProfileRepository` methods.

**Test cases to implement:**

```typescript
import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { StaffProfileRepository } from "@/backend/db/repo/staff-profile.repository";

describe("StaffProfileRepository", () => {
  // Setup: Seed test staff profiles, users, permission groups
  beforeAll(async () => {
    // Insert test users → staff_profiles → user_permission_groups → permission_groups
  });

  afterAll(async () => {
    // Clean up test data
  });

  describe("getManagerDirectory", () => {
    it("returns all staff members with their role", async () => {
      const rows = await StaffProfileRepository.getManagerDirectory();
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].roleSlug).toBeDefined();
      expect(rows[0].email).toBeDefined();
    });

    it("includes skypeId and phone fields", async () => {
      const rows = await StaffProfileRepository.getManagerDirectory();
      // Fields exist even if null
      expect("skypeId" in rows[0]).toBe(true);
      expect("phone" in rows[0]).toBe(true);
    });

    it("returns empty array when no staff profiles exist", async () => {
      // Clean staff_profiles table temporarily
      const rows = await StaffProfileRepository.getManagerDirectory();
      // Verify structure even if empty
      expect(Array.isArray(rows)).toBe(true);
    });
  });

  describe("findByUserId", () => {
    it("returns staff profile for valid user ID", async () => {
      const result = await StaffProfileRepository.findByUserId(testUserId);
      expect(result).not.toBeNull();
      expect(result!.name).toBeDefined();
      expect(result!.staffProfileId).toBeDefined();
    });

    it("returns null for non-existent user ID", async () => {
      const result = await StaffProfileRepository.findByUserId("00000000-0000-0000-0000-000000000000");
      expect(result).toBeNull();
    });
  });

  describe("updateManagerProfile", () => {
    it("updates phone and skypeId", async () => {
      const result = await StaffProfileRepository.updateManagerProfile(
        testStaffProfileId,
        { phone: "+1234567890", skypeId: "test.skype" }
      );
      expect(result.phone).toBe("+1234567890");
      expect(result.skypeId).toBe("test.skype");
    });

    it("updates only phone when skypeId is not provided", async () => {
      const result = await StaffProfileRepository.updateManagerProfile(
        testStaffProfileId,
        { phone: "+9876543210" }
      );
      expect(result.phone).toBe("+9876543210");
    });

    it("throws error for non-existent staff profile ID", async () => {
      expect(
        StaffProfileRepository.updateManagerProfile(
          "00000000-0000-0000-0000-000000000000",
          { phone: "+1111111111" }
        )
      ).rejects.toThrow();
    });

    it("sets phone to null when explicitly passed as null", async () => {
      const result = await StaffProfileRepository.updateManagerProfile(
        testStaffProfileId,
        { phone: null }
      );
      expect(result.phone).toBeNull();
    });
  });

  describe("getUserPermissionGroupSlugs", () => {
    it("returns assigned group slugs for a user", async () => {
      const slugs = await StaffProfileRepository.getUserPermissionGroupSlugs(testUserId);
      expect(slugs.length).toBeGreaterThan(0);
      expect(slugs).toContain("super_admin"); // or whatever group is assigned
    });

    it("returns empty array for user with no groups", async () => {
      const slugs = await StaffProfileRepository.getUserPermissionGroupSlugs(
        "00000000-0000-0000-0000-000000000000"
      );
      expect(slugs).toEqual([]);
    });
  });
});
```

---

*Step 3: Create `learning-resource.test.ts`*

Create `backend/db/test/repo/learning-resource.test.ts`. This test file covers all `LearningResourceRepository` methods.

**Test cases to implement:**

```typescript
import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { LearningResourceRepository } from "@/backend/db/repo/learning-resource.repository";

describe("LearningResourceRepository", () => {
  let testUserId: string;
  let testFileId: string;
  let createdResourceId: string;

  beforeAll(async () => {
    // Insert test user, test storage_file
    // testUserId = ...; testFileId = ...;
  });

  afterAll(async () => {
    // Clean up test data (resources, files, users)
  });

  describe("listResources", () => {
    it("returns non-deleted resources ordered by createdAt DESC", async () => {
      const result = await LearningResourceRepository.listResources();
      expect(result.rows.length).toBeGreaterThanOrEqual(0);
      expect(result.totalCount).toBe(result.rows.length);

      // Verify ordering
      for (let i = 1; i < result.rows.length; i++) {
        expect(result.rows[i].createdAt <= result.rows[i - 1].createdAt).toBe(true);
      }
    });

    it("excludes soft-deleted resources", async () => {
      // Create and soft-delete a resource
      const result = await LearningResourceRepository.listResources();
      const deletedIds = result.rows.filter(r => /* check deleted */);
      expect(deletedIds.length).toBe(0);
    });

    it("returns correct totalCount", async () => {
      const result = await LearningResourceRepository.listResources();
      expect(typeof result.totalCount).toBe("number");
    });
  });

  describe("createResource", () => {
    it("creates resource and file association atomically", async () => {
      const resource = await LearningResourceRepository.createResource({
        displayName: "Test PDF Document",
        filePath: "/resources/test-document.pdf",
        uploadedByUserId: testUserId,
        fileId: testFileId,
      });

      expect(resource.id).toBeDefined();
      expect(resource.displayName).toBe("Test PDF Document");
      expect(resource.filePath).toBe("/resources/test-document.pdf");
      createdResourceId = resource.id;
    });

    it("creates resource within a transaction", async () => {
      const resource = await LearningResourceRepository.createResource({
        displayName: "Transaction Test Doc",
        filePath: "/resources/tx-test.pdf",
        uploadedByUserId: testUserId,
        fileId: testFileId,
      });
      expect(resource.id).toBeDefined();
    });

    it("newly created resource appears in listResources", async () => {
      const result = await LearningResourceRepository.listResources();
      const found = result.rows.find(r => r.id === createdResourceId);
      expect(found).toBeDefined();
      expect(found!.displayName).toBe("Test PDF Document");
    });
  });

  describe("findById", () => {
    it("returns existing non-deleted resource", async () => {
      const resource = await LearningResourceRepository.findById(createdResourceId);
      expect(resource).not.toBeNull();
      expect(resource!.displayName).toBe("Test PDF Document");
    });

    it("returns null for non-existent resource ID", async () => {
      const resource = await LearningResourceRepository.findById(
        "00000000-0000-0000-0000-000000000000"
      );
      expect(resource).toBeNull();
    });

    it("returns null for soft-deleted resource", async () => {
      // Soft-delete the resource
      // Then verify findById returns null
    });
  });
});
```

---

**Test Execution Requirements:**
- **Run repository tests with coverage:**
  ```bash
  bun run test:coverage backend/db/test/repo/student-directory.test.ts
  bun run test:coverage backend/db/test/repo/staff-profile.test.ts
  bun run test:coverage backend/db/test/repo/learning-resource.test.ts
  ```
  Output must show 100% line + function coverage on all new repository methods.

- **Run the whole test suite:** Run `bun run test:db` to ensure no regressions.
  ```bash
  bun run test:db
  ```

**Success Criteria / Check Progress Points:**
- [ ] `student-directory.test.ts` achieves 100% coverage on `StudentRepository.getDirectoryRows()`.
- [ ] `staff-profile.test.ts` achieves 100% coverage on all `StaffProfileRepository` methods.
- [ ] `learning-resource.test.ts` achieves 100% coverage on all `LearningResourceRepository` methods.
- [ ] All success paths tested (valid inputs, expected outputs).
- [ ] All failure paths tested (invalid inputs, not-found, empty results).
- [ ] Transaction atomicity verified (createResource creates both records or neither).
- [ ] `bun run test:db` passes with 0 failures (no regressions).
- [ ] `bun run test:coverage` shows 100% line + function coverage for each new file.

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps