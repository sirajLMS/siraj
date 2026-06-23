### Task C — Service: Learning Resource Deletion

**Objective:** Implement the `deleteResource` method in `LearningResourceService`. This method orchestrates the full deletion lifecycle: checking permissions, deleting the physical file from storage, and deleting the database record.

**Dependencies:** Depends on Task B — requires `LearningResourceRepository.deleteResource` method. Requires existing `StorageRepository.deleteFile` method.

**Layer-Specific Rules (Backend Services - Flattened from backend/services/AGENTS.md):**
- **Business logic centralization** - All orchestration, validation, and permission checks reside in services, NOT repositories or resolvers.
- **🚫 Services MUST NOT import from DB/Drizzle** - Services can ONLY depend on the repository layer (`backend/db/repo/`). Importing from `drizzle-orm` or `backend/db/schema` is **strictly forbidden**.
- Throw localized errors if a permission check fails.

**Target Files:**
- `backend/services/resource/learning-resource.service.ts`

**Detailed Implementation Steps:**

*Step 1: Write `deleteResource` method in `LearningResourceService`*

Open `backend/services/resource/learning-resource.service.ts`.
Add a new method `deleteResource` to the `LearningResourceService` namespace.

```typescript
// backend/services/resource/learning-resource.service.ts
import { LearningResourceRepository } from "../../db/repo/learning-resource.repository";
import { StorageRepository } from "../../db/repo/storage.repository";
import { PermissionsService } from "../auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";
import { logger } from "../../lib/logger";

export namespace LearningResourceService {
  // ... existing methods ...

  /**
   * Orchestrates the deletion of a learning resource.
   * Checks permissions, drops the physical file from storage, and removes the DB record.
   * 
   * @param resourceId - The ID of the resource to delete.
   * @param actorUserId - The user ID attempting the deletion.
   * @returns true if successfully deleted.
   */
  export const deleteResource = async (resourceId: string, actorUserId: string): Promise<boolean> => {
    try {
      // 1. Permission Check
      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.RESOURCES_DELETE);
      if (!hasPermission) {
        throw new Error("unauthorized"); // Must map to a localized key in resolvers
      }

      // 2. Fetch the resource to get the filePath
      const resource = await LearningResourceRepository.getById(resourceId);
      if (!resource) {
        throw new Error("Resource not found");
      }

      // 3. Delete from Physical Storage
      // If the file deletion fails, we intentionally throw to abort the database deletion.
      // This prevents "orphaned files" on the server.
      await StorageRepository.deleteFile(resource.filePath);

      // 4. Delete from Database
      await LearningResourceRepository.deleteResource(resourceId);

      return true;
    } catch (error) {
      logger.error(`[LearningResourceService.deleteResource] Failed to delete resource ${resourceId}:`, error);
      throw error;
    }
  };
}
```
*Note: Make sure `LearningResourceRepository.getById` exists. If it doesn't, implement a quick fetch method in `Task B` to retrieve the `filePath`.*

**Test Execution Requirements:**
- **Run the database and service tests** to ensure no compilation errors. Testing of this service logic specifically will occur in Task D.

**Success Criteria / Check Progress Points:**
- [ ] `deleteResource` method is fully implemented in `LearningResourceService`.
- [ ] Permissions (`RESOURCES_DELETE`) are checked correctly.
- [ ] Storage file is deleted prior to DB record deletion to prevent orphans.
- [ ] The service contains NO imports from `drizzle-orm` or `backend/db/schema`.

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
