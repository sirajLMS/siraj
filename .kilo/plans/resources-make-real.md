# Plan: Make Resources Page Components Real

## Scope
**Route**: `app/[locale]/(dashboard)/resources`  
**View files**: `frontend/views/dashboard/resources/`  
**Store file**: `frontend/stores/learningResourcesStore.ts`  
**Do NOT edit files outside this scope** (backend, shared/lib, other routes, etc.)

---

## Issue 1: Inline Types in Non-.types Files

**Rule**: All types must be defined in `.types.ts` files only. Re-exporting types from non-.types files is also prohibited.

### Files with inline interface definitions to move:

| File | Inline Type | Move To |
|------|------------|---------|
| `components/ResourceLibraryCard.tsx` | `ResourceLibraryCardProps` | `types/resourcesTypes.ts` |
| `components/ResourceUploadForm.tsx` | `ResourceUploadFormProps` | `types/resourcesTypes.ts` |
| `components/ResourceUploadDropzone.tsx` | `ResourceUploadDropzoneProps` | `types/resourcesTypes.ts` |
| `components/ResourceUploadGuidelines.tsx` | `ResourceUploadGuidelinesProps` | `types/resourcesTypes.ts` |
| `components/ResourceLibraryHeader.tsx` | `ResourceLibraryHeaderProps` | `types/resourcesTypes.ts` |
| `components/ResourceLibraryGrid.tsx` | `ResourceLibraryGridProps` | `types/resourcesTypes.ts` |
| `components/ResourceLibraryList.tsx` | `ResourceLibraryListProps` | `types/resourcesTypes.ts` |
| `components/ResourceFileTypeIcon.tsx` | `ResourceFileTypeIconProps` | `types/resourcesTypes.ts` |
| `components/ResourceGovernancePanel.tsx` | `ResourceGovernancePanelProps` | `types/resourcesTypes.ts` |
| `components/ResourceDeleteDialog.tsx` | `ResourceDeleteDialogProps` | `types/resourcesTypes.ts` |
| `ResourcesDesktopView.tsx` | `ResourcesDesktopViewProps` | `types/resourcesViewTypes.ts` |
| `ResourcesMobileView.tsx` | `ResourcesMobileViewProps` | `types/resourcesViewTypes.ts` |

**Action**: 
1. Move all inline interface definitions to the appropriate `.types.ts` file
2. Export them from the `.types.ts` file
3. Update all imports in consuming components
4. Remove inline interface definitions from component files

---

## Issue 2: Replace SubmissionSuccessBanner with useNotifications

**Current**: `ResourcesContainer` uses `showUploadSuccess`/`resetUploadSuccess` store state + `SubmissionSuccessBanner` component to show a success banner after upload. This is essentially a snackbar/notification pattern.

**Action**: 
1. In `ResourcesContainer.tsx`: Add `useNotifications()`, call `notifications.show(labels.upload.successMessage, { severity: "success", autoHideDuration: 4000 })` after successful upload
2. Remove `showUploadSuccess`/`setShowUploadSuccess`/`resetUploadSuccess` from the store (`learningResourcesStore.ts`)
3. Remove `showUploadSuccess` and `onDismissSuccess` from `ResourcesViewProps` in `resourcesViewTypes.ts`
4. Remove the `useEffect` that auto-dismisses after 4s in `ResourcesView.tsx`
5. Remove `<SubmissionSuccessBanner>` from `ResourcesDesktopView.tsx` and `ResourcesMobileView.tsx`
6. Remove `showUploadSuccess` and `onDismissSuccess` from theStories file prop threading

Also add `useNotifications` for delete success/error:
7. In `ResourcesContainer.tsx`: Call `notifications.show(...)` on successful delete and on error

---

## Issue 3: Mock Data in handleUpload + Incorrect Upload Flow

**Current** (ResourcesContainer.tsx:88-90):
```tsx
const isMockStoryFile = formData.fileName === "new-doc.pdf";
const fileId = isMockStoryFile ? "file-new-1" : `file-${Date.now()}`;
const filePath = isMockStoryFile ? "/resources/new-doc.pdf" : `/resources/${formData.fileName}`;
```

### Upload Flow Analysis
The project uses a **signed URL pattern** for uploads, supporting multiple storage providers (GCP, Vercel, Local). The upload flow is:

1. **Client-side flow**
   - User selects a **file** (not just a name — actual `File` object)
   - Client calls `prepareUpload(` **{path, fileSize, contentType, contentHash}** `)` 
   - Server returns **{id, url, uploadType}** (`UploadPreparationResult`)
   - Client uploads file directly to `url` via:
     - **SIGNED_URL**: PUT request with `Content-Type` and `Content-MD5` headers
     - **VERCEL_BLOB_CLIENT**: Vercel Client SDK upload
   - Client calls `uploadLearningResource({displayName, filePath, fileId})` to create the learning resource record

2. **Backend upload logic**
   - `prepareUpload` creates a record in `signed_urls` table with metadata
   - File is uploaded via signed URL/Vercel SDK
   - `PUT /api/storage/upload/[id]` completes the upload and stores the file path and file ID
   - `uploadLearningResource` mutation creates record in `learning_resources` table with provided `displayName`, `filePath`, `fileId`

### Issues
| # | Issue | Details |
|---|-------|---------|
| A | **Fake `fileId` and `filePath`** | Currently generates fake `file-${Date.now()}` and `/resources/${formData.fileName}` values instead of real storage-provided values |
| B | **Only stores file name string** | `ResourceUploadDropzone` only stores `fileName: string` instead of actual `File` object, so `fileSize`/`contentType`/`contentHash` cannot be computed |
| C | **No `prepareUpload` call** | Missing the critical first step that generates a signed URL and obtains a real `fileId` |
| D | **No file upload via signed URL** | Skips the actual file upload step via the signed URL or Vercel SDK |

### Required Changes
**ResourcesContainer.tsx**:
1. In `handleUpload`: Remove all mock logic
2. Before calling `uploadResourceMutation`:
   - Call `prepareUploadMutation` to get `UploadPreparationResult`
   - Upload file to the signed URL or via Vercel Client SDK based on `uploadType`
   - On successful upload completion, call `uploadResourceMutation` with real `fileId` and `filePath`

**ResourceUploadDropzone.tsx**:
3. Replace `selectedFileName: string` with `selectedFile: File | null` state and prop
4. Pass actual `File` object up to parent on selection

**GraphQL Documents**:
5. Add missing `prepareUploadMutationDocument` (already exists but not imported)

### Client Upload Implementation Strategies
| Approach | Pros | Cons | Selected |
|----------|------|------|---------|
| **Signed URL PUT** | Works for all providers (GCP, Local) | Requires computing MD5 hash | ✅ Recommended |
| **Vercel Client SDK** | Clean Vercel integration | Only works with Vercel provider | ✅ Alternative |

---

## Issue 4: ResourceLibraryCard Has No Real Navigation Action

**Current**: Clicking a resource card does nothing. There is no `onClick` handler.

**Action**: Add an `onCardClick` prop that navigates to a resource detail/download page. Since there's no `/resources/[id]` route currently, there are two options:
- **Option A**: Navigate to `/resources/[id]` (requires creating the route — out of scope for this plan)
- **Option B** (Recommended): Make the card title a clickable link that triggers the file download/open. Since the `LearningResourceRow` has a `filePath` field, we can open the file in a new tab using the storage URL pattern, or trigger a download.

**Suggested**: Add `onCardClick: (id: string) => void` prop. In `ResourcesContainer`, implement it using the `filePath` from the query data to open/navigate to the resource file. The simplest approach: `window.open(resource.filePath, '_blank')` or use the storage service URL pattern if available.

---

## Issue 5: BooksAndBagsClient Has a Fake Delete (Client-Side Only)

**Current** (`BooksAndBagsClient.tsx:35-37`):
```tsx
const handleDelete = (bookId: string) => {
  setBooks(prev => prev.filter(b => b.id !== bookId));
};
```
This only removes from local state — it doesn't call the real `deleteBook` mutation.

**Action**: The `BookItemCard` component already calls `deleteBookMutationDocument` and then calls `onDelete(book.id)` on success. So `handleDelete` in `BooksAndBagsClient` is actually a post-mutation cache update (removing from local list). This is fine — the mutation is already real in `BookItemCard`. However, after the mutation succeeds, we should also refetch or update Apollo cache instead of just filtering local state.

**Suggested**: Use Apollo cache `evict` or `refetchQueries` to update the list after deletion rather than local state filtering. Alternatively, since the `BooksAndBagsClient` receives data from a server component (not Apollo), the local state approach is acceptable — but we should verify the `BookItemCard` delete mutation actually works.

**Status**: Already real (mutation is called in `BookItemCard.tsx`). The local state update after is a valid optimistic update pattern. No change needed.

---

## Issue 6: Convert String Union Types to Enums

**Current** (`types/resourcesTypes.ts`):
```tsx
export type ResourceFileType = "pdf" | "pptx" | "xlsx" | "docx";
export type ResourceSortBy = "date" | "name";
export type ResourceFilterType = ResourceFileType | "all";
```

These are UI-only types (derived from file extensions, not stored in the DB). There is no DB enum for resource file type. `ResourceSortBy` is also UI-only.

**Action**: 
- **`ResourceFileType`**: This is a display-only type derived from file naming conventions, not persisted in the DB. Creating a shared enum would add it to the DB enum file unnecessarily. **Keep as string unions** — they are not good candidates for enums because they don't map to a DB column.
- **`ResourceSortBy`**: Similarly UI-only. **Keep as string union.**
- **`ResourceFilterType`**: Composed from `ResourceFileType`. **Keep as string union.**

**Verdict**: No enum conversion needed — these types are purely UI concerns with no DB representation.

---

## Issue 7: ResourceFileTypeIcon Has Inline Interface

Already covered under **Issue 1**.

---

## Issue 8: Stores AGENTS.md Compliance

The store imports types from `frontend/views/dashboard/resources/types/resourcesTypes` — this is a cross-layer dependency. Per store rules, it should use GraphQL generated types.

**Suggested**: Acceptable for now since `ResourceFilterType` and `ResourceSortBy` are UI-only types that don't exist in the GraphQL schema. No change needed.

---

## Execution Order

### Phase 1: Move all inline types to .types files
1. Add all component prop interfaces to `types/resourcesTypes.ts` and `types/resourcesViewTypes.ts`
2. Update all component files to import from the .types files
3. Run `bun tsgo` to verify
4. Run `bun biome:check` to verify
5. Run `bun lint` to verify

### Phase 2: Replace SubmissionSuccessBanner with useNotifications
1. Add `useNotifications` to `ResourcesContainer.tsx`
2. Remove `showUploadSuccess`/`setShowUploadSuccess`/`resetUploadSuccess` from the store
3. Thread out `showUploadSuccess` and `onDismissSuccess` from all view props
4. Remove `<SubmissionSuccessBanner>` usage
5. Add success/error notifications for upload and delete
6. Run quality checks

### Phase 3: Fix mock data in handleUpload
1. Refactor upload flow to use `prepareUpload` mutation
2. Store actual `File` object in state
3. Pass real fileId/filePath to `uploadLearningResource`
4. Run quality checks

### Phase 4: Add navigation to ResourceLibraryCard
1. Add `onCardClick` prop to card component
2. Implement navigation in `ResourcesContainer`
3. Run quality checks

### Phase 5: Update Storybook stories
1. Remove `showUploadSuccess` prop from stories
2. Update mock handlers
3. Run quality checks

### Phase 6: Update GraphQL Documents
1. Add import for `prepareUploadMutationDocument` to learning resource documents

### Execution Order
- Run quality checks after each phase:
  - `bun tsgo` 
  - `bun biome:check`  
  - `bun lint`

### Final: Run test suite for resources layer
- Only run tests related to the changes:
  ```bash
  bun test frontend/views/dashboard/resources
  ```
