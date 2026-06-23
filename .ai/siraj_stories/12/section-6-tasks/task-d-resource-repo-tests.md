### Task D — Testing: Learning Resource Deletion

**Objective:** Write repository and service integration tests for learning resource deletion. This ensures the database accurately deletes records, and the service properly respects the `resources.delete` permission while orchestrating file cleanup.

**Dependencies:** Depends on Task C — requires `LearningResourceService.deleteResource` and `LearningResourceRepository.deleteResource`.

**Layer-Specific Rules (Testing Requirements - Flattened from section-1-core-principles.md):**
- **100% line + function coverage** on all new/modified repository methods.
- **Success AND failure paths** — Every repo method must have tests for valid input success, invalid input rejection, and not-found handling.
- **Authorized success + unauthorized denial** at the service level logic.

**Target Files:**
- `backend/db/test/repo/learning-resource.repository.test.ts`
- `backend/services/resource/test/learning-resource.service.test.ts`

**Detailed Implementation Steps:**

*Step 1: Write Repository Tests*

Open `backend/db/test/repo/learning-resource.repository.test.ts`. Create a suite for `deleteResource`.

```typescript
// backend/db/test/repo/learning-resource.repository.test.ts
import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { LearningResourceRepository } from "../../../repo/learning-resource.repository";
import { db } from "../../../index";
import { learningResources } from "../../../schema/communications";
import { eq } from "drizzle-orm";
// ... setup helpers for creating dummy users/resources ...

describe("LearningResourceRepository", () => {
  describe("deleteResource()", () => {
    test("successfully deletes an existing resource", async () => {
      // 1. Arrange - Seed dummy user and resource
      // const resource = await seedDummyResource();
      
      // 2. Act
      // const result = await LearningResourceRepository.deleteResource(resource.id);

      // 3. Assert
      // expect(result).toBe(true);
      // const check = await db.select().from(learningResources).where(eq(learningResources.id, resource.id));
      // expect(check.length).toBe(0);
    });

    test("throws an error when resource ID does not exist", async () => {
      // 1. Act & Assert
      // expect(LearningResourceRepository.deleteResource("non-existent-id")).rejects.toThrow();
    });
  });
});
```
*(Expand test with real seed utility calls based on existing patterns in the file)*

*Step 2: Write Service Tests*

Open (or create) `backend/services/resource/test/learning-resource.service.test.ts`.

```typescript
// backend/services/resource/test/learning-resource.service.test.ts
import { expect, test, describe, spyOn } from "bun:test";
import { LearningResourceService } from "../learning-resource.service";
import { PermissionsService } from "../../auth/permissions.service";
import { StorageRepository } from "../../../db/repo/storage.repository";
import { LearningResourceRepository } from "../../../db/repo/learning-resource.repository";

describe("LearningResourceService.deleteResource()", () => {
  test("throws unauthorized error if actor lacks permissions", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(false);
    
    expect(LearningResourceService.deleteResource("resource-1", "user-1")).rejects.toThrow("unauthorized");
    
    hasPermissionSpy.mockRestore();
  });

  test("deletes physical file and DB record if permitted", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const getByIdSpy = spyOn(LearningResourceRepository, "getById").mockResolvedValue({ id: "resource-1", filePath: "/test.pdf" } as any);
    const deleteFileSpy = spyOn(StorageRepository, "deleteFile").mockResolvedValue(true);
    const deleteDbSpy = spyOn(LearningResourceRepository, "deleteResource").mockResolvedValue(true);

    const result = await LearningResourceService.deleteResource("resource-1", "user-1");

    expect(result).toBe(true);
    expect(deleteFileSpy).toHaveBeenCalledWith("/test.pdf");
    expect(deleteDbSpy).toHaveBeenCalledWith("resource-1");

    hasPermissionSpy.mockRestore();
    getByIdSpy.mockRestore();
    deleteFileSpy.mockRestore();
    deleteDbSpy.mockRestore();
  });

  test("does not delete DB record if physical file deletion fails", async () => {
    spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    spyOn(LearningResourceRepository, "getById").mockResolvedValue({ id: "resource-1", filePath: "/test.pdf" } as any);
    
    const deleteFileSpy = spyOn(StorageRepository, "deleteFile").mockRejectedValue(new Error("Storage offline"));
    const deleteDbSpy = spyOn(LearningResourceRepository, "deleteResource");

    expect(LearningResourceService.deleteResource("resource-1", "user-1")).rejects.toThrow("Storage offline");
    expect(deleteDbSpy).not.toHaveBeenCalled();
  });
});
```

**Test Execution Requirements:**
- **Run the coverage verification:**
  ```bash
  bun run test:coverage backend/db/test/repo/learning-resource.repository.test.ts
  bun test backend/services/resource/test/learning-resource.service.test.ts
  ```

**Success Criteria / Check Progress Points:**
- [ ] Line coverage for `deleteResource` method in repo is 100%.
- [ ] Service logic is verified to correctly gate via `resources.delete`.
- [ ] Service logic is verified to abort DB deletion if storage deletion fails.

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
