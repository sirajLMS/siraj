### Task B — Repository: Learning Resource Deletion

**Objective:** Implement a repository method in `LearningResourceRepository` to remove a learning resource from the database using its ID. Note that the system leverages soft deletion (via `deleted_at`) for `learning_resources`. We will apply a hard delete here or follow the `deleteResource` pattern to physically drop the relational record, as dictated by the story: "removes the relational record from the database".

**Dependencies:** Depends on Task A — no direct dependency on the enum, but ordered after migrations. Depends on existing Drizzle schema for `learningResources`.

**Layer-Specific Rules (Database Repositories - Flattened from backend/db/repo/AGENTS.md):**
- Use Drizzle standard syntax `db.delete().from(<table>).where()`.
- Do not add business logic (e.g. storage file deletion) inside the repository layer; keep it focused strictly on the database table.

**Target Files:**
- `backend/db/repo/learning-resource.repository.ts`

**Detailed Implementation Steps:**

*Step 1: Write `deleteResource` method in `LearningResourceRepository`*

Open `backend/db/repo/learning-resource.repository.ts`.
Add a new exported function `deleteResource` inside the `LearningResourceRepository` namespace.

```typescript
// backend/db/repo/learning-resource.repository.ts
import { db } from "../index";
import { learningResources } from "../schema/communications";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger";

export namespace LearningResourceRepository {
  // ... existing methods ...

  /**
   * Hard deletes a learning resource from the database.
   * Note: The storage file must be deleted separately via the StorageService.
   * 
   * @param id - The UUID of the learning resource to delete.
   * @returns true if successful, throws an error otherwise.
   */
  export const deleteResource = async (id: string): Promise<boolean> => {
    try {
      // First verify the resource exists to provide a clean error if not
      const existing = await db
        .select({ id: learningResources.id, filePath: learningResources.filePath })
        .from(learningResources)
        .where(eq(learningResources.id, id))
        .limit(1);

      if (existing.length === 0) {
        throw new Error(`Learning resource with ID ${id} not found.`);
      }

      // Perform a hard deletion to fulfill the requirement: "removes the relational record from the database"
      await db.delete(learningResources).where(eq(learningResources.id, id));
      
      return true;
    } catch (error) {
      logger.error(`Error deleting learning resource with ID ${id}:`, error);
      throw error;
    }
  };
}
```

*Step 2: Note the usage pattern*
The repository just deletes the record. The orchestration of deleting the file from physical storage `StorageRepository.deleteFile(filePath)` will be handled entirely within the Service Layer in Task C to ensure separation of concerns.

**Test Execution Requirements:**
- **Run the whole test suite:** Run `bun run test:db` across the database folder to make sure no compilation errors occurred in the repository.
  ```bash
  bun run test:db
  ```

**Success Criteria / Check Progress Points:**
- [ ] `deleteResource` method is fully implemented in `LearningResourceRepository`.
- [ ] The method correctly validates existence and deletes the relational database record.
- [ ] No compilation errors when compiling the database repository.

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
