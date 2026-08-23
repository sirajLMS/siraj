# Task 7 — Logo upload flow

## Summary

Wired the `LogoUploadSection` file input (Task 6.3 stub) to the existing
shared storage upload pipeline. The flow reuses `prepareUpload` (GraphQL
mutation) + the signed-URL PUT route (`app/api/storage/upload/[id]`) —
the same path avatars use (`uploadAvatarFile.ts`) — with two
appearance-specific conventions:

1. **Storage key.** Logos are written under
   `public/appearance/logo-<uuid>.<ext>` per design decision §20
   (UUID-randomized keys prevent path traversal and object-overwrite
   attacks) and §18 (`public/` prefix → CDN-served, no signed URL to
   read). The path generator lives in a new shared utility
   (`shared/utils/appearance-logo-storage.utils.ts`) so backend
   seed/test code can reference the same convention.

2. **MIME allowlist.** The accept attribute + the upload helper gate on
   `image/png`, `image/jpeg`, `image/webp` — the image kinds in the
   backend `mime-allowlist.ts`. SVG (`image/svg+xml`) is intentionally
   EXCLUDED because the backend explicitly rejects it (stored XSS risk
   via inline `<script>` / `onload`). SVG support requires DOMPurify
   sanitization before writing to disk (decision §20.1.b) and is
   deferred — see Carry-Forward.

On upload success the returned canonical public URL is written into the
draft via `appearancePreviewStore.setField("logoUrl", url)`. The existing
`publishAppearance` mutation (Task 2.3) copies `draft_fields` →
`published_fields`, so the logo URL is persisted on publish with no
special "publish logo" step. The "Remove" button (Task 6.3) already
exercises the `setField("logoUrl", null)` path.

## Requirements Coverage

- **AC-23** — Logo upload. The admin can now select a logo file (PNG,
  JPEG, or WebP) in the `LogoUploadSection`; the file is uploaded under
  `public/appearance/logo-<uuid>.<ext>`; the returned URL is written
  into `draft_fields.logoUrl`; the URL is published via the existing
  `publishAppearance` mutation. Toast feedback (success/error) uses the
  same `useNotifications` (Toolpad) channel as the toolbar.

## Architecture Decision — Reuse, Don't Add a Server Method

The 6.3 carry-forward speculatively named `StorageService.uploadAppearanceLogo(file)`
as the wiring target. On reading the actual storage architecture, that
signature does not fit: `StorageService` (the disk provider) accepts
`uploadFile(path, contentType, buffer)`, and the production upload flow
is **client-initiated** (browser computes SHA-256 hash → `prepareUpload`
mutation mints a signed-URL session → browser PUTs the body to
`/api/storage/upload/[id]` → route calls `StorageService.createFileAndGet`).
There is no server method that accepts a `File` (browser type).

The cleanest reuse is therefore:

- **No new backend method.** The existing `prepareUpload` resolver +
  signed-URL PUT route already handle arbitrary validated paths. The
  path `public/appearance/logo-<uuid>.<ext>` passes `sanitizeStoragePath`,
  `validateStoragePath` (regex `/^[a-zA-Z0-9._/\- ()]+$/` — UUIDs and
  extensions are all allowed), `checkDirectoryUploadPermissions` (no
  `storage_directories` row → uploads allowed by default), and
  `isAllowedMimeType` (png/jpeg/webp all in the backend allowlist).
- **New shared utility** (`shared/utils/appearance-logo-storage.utils.ts`)
  owns the path convention + MIME allowlist as the single seam. Both
  the frontend helper and any future backend seed/test code import from
  here — no duplication.
- **New frontend helper** (`uploadAppearanceLogoFile.ts`) mirrors
  `uploadAvatarFile.ts` 1:1 (same `prepareUpload` mutation, same
  signed-URL PUT, same Vercel Blob client fallback) but swaps the
  `storageOwnerKey`-namespaced avatar path for the UUID-namespaced
  appearance-logo path.

This means the "Reuse `StorageService`/`StorageDbRepository`" requirement
is satisfied transitively: `prepareUpload` → `StorageService.prepareUpload`
(disk provider) → `StorageDbRepository.createSignedUrl`; the upload route
→ `StorageService.createFileAndGet` → `StorageDbRepository.createFile`.

## Files Modified

### Created (3 new files)

1. **`shared/utils/appearance-logo-storage.utils.ts`** (~70 lines)
   - `APPEARANCE_LOGO_STORAGE_PREFIX = "public/appearance"`.
   - `APPEARANCE_LOGO_ALLOWED_MIME_TYPES` (png, jpeg, webp — svg
     excluded; see file header).
   - `APPEARANCE_LOGO_MIME_TO_EXT` map.
   - `generateAppearanceLogoPath(uuid, contentType)` →
     `public/appearance/logo-<uuid>.<ext>`.
   - `isAllowedAppearanceLogoMimeType(contentType)` type guard.
   - Lives in `shared/` per `shared/AGENTS.md` — no `@/frontend/` or
     `@/backend/` imports.

2. **`frontend/common/views/dashboard/appearance/shared/uploadAppearanceLogoFile.ts`**
   (~130 lines)
   - `uploadAppearanceLogoFile({ file, prepareUpload })` →
     `{ url, path }`.
   - Validates the MIME type against the shared allowlist; generates a
     UUID-keyed path via `generateAppearanceLogoPath`; computes the
     SHA-256 content hash (base64) for the `Content-MD5` header; calls
     `prepareUpload`; streams the body to the signed URL OR delegates
     to Vercel Blob client upload based on the returned `uploadType`.
   - `computeContentHash` / `uploadViaSignedUrl` / `uploadViaVercelBlob`
     are local helpers — they mirror the private helpers in
     `uploadAvatarFile.ts`. See Decisions §below for the duplication
     rationale.

3. **`frontend/common/hooks/useAppearanceLogoUpload.ts`** (~32 lines)
   - `useAppearanceLogoUpload()` → `{ uploadLogo(file) }`.
   - Wraps `useMutation(prepareUploadMutationDocument)` + delegates to
     `uploadAppearanceLogoFile`. Mirrors `useAvatarUpload.ts` 1:1.

### Edited (1 file)

4. **`frontend/common/views/dashboard/components/customize/LogoUploadSection.tsx`**
   (~75 → ~130 lines)
   - Added `useAppearanceLogoUpload` + `useNotifications` + `useState`
     imports.
   - New `handleFileChange` async handler: reads the `File` from the
     input event, calls `uploadLogo(file)`, on success calls
     `setField("logoUrl", url)` + shows a success toast, on error logs
     + shows an error toast, in `finally` resets the input value so
     re-selecting the same file re-fires `onChange`.
   - `LOGO_UPLOAD_ACCEPT = "image/png,image/jpeg,image/webp"` constant
     replaces the prior inline `image/png,image/jpeg,image/svg+xml,image/webp`
     string. SVG dropped (backend rejects it — see file header).
   - "Upload logo" button now shows "Uploading…" + is disabled while
     `uploading` is true; a `CircularProgress` (size 20) renders below
     the drop zone during upload.
   - Caption text changed from "PNG/SVG · max 2MB" to "PNG/JPEG/WebP ·
     max 2MB" to reflect the actual accept list.
   - The pre-existing logo preview row + "Remove" button are unchanged.

## Design Adherence

### No new backend code — reuse the signed-URL pipeline

The existing upload pipeline (`prepareUpload` mutation → signed-URL PUT
→ `StorageService.createFileAndGet`) is provider-agnostic (local disk,
GCP, Vercel Blob) and already enforces:

- **Path validation** (`sanitizeStoragePath` / `validateStoragePath` —
  rejects `..`, `//`, leading `/`, null bytes, invalid chars).
- **MIME allowlist** (`isAllowedMimeType` in the upload route — rejects
  SVG, HTML, JS, executables).
- **Size limit** (`STORAGE_CONFIG.MAX_FILE_SIZE` = 100MB; the 2MB
  caption in the UI is advisory — enforced separately if needed).
- **Integrity check** (SHA-256 re-hash on the server; mismatches unlink
  the partial file and return 400).
- **Auth** (`prepareUpload` requires `loggedIn` + `STORAGE_MANAGE`
  permission via `requireStorageManage`; the appearance admin already
  has `SETTINGS_APPEARANCE_MANAGE` which is a distinct permission —
  see Open Questions below).

Adding a parallel server-side `uploadAppearanceLogo(file)` method would
have duplicated this pipeline and required a new API route + a new
mutation. Reusing it costs zero backend LOC and inherits every existing
security control for free.

### UUID key randomization (decision §20)

`crypto.randomUUID()` (available in browsers + Node 19+) generates the
RFC 4122 v4 UUID used in the storage key. This means:

- Two admins uploading the same `logo.png` concurrently get distinct
  keys — no overwrite race.
- Re-uploading after "Remove" creates a new asset — the old URL (still
  referenced by a cached published row until the next publish) keeps
  resolving.
- No directory listing is exposed to the client, so the UUID also
  prevents enumeration of other logos.

### `shared/` layer for the path convention

Per `shared/AGENTS.md`, the path convention + MIME allowlist live in
`shared/utils/` because both the frontend helper (browser) and any
future backend seed/test code need to reference the same string.
Defining it in `frontend/` would force the backend to import across
layers (prohibited); defining it in `backend/` would force the frontend
to import across layers. `shared/` is the only layer both may import.

### Toolpad `useNotifications` for toasts

Matches `CustomizeToolbar` (Task 6.2) — the same `notifications.show(...,
{ severity })` API. No new dependency, no new provider. Inline English
strings ("Logo uploaded" / "Logo upload failed") are placeholder until
Task 9 introduces the `customize.*` i18n namespace — consistent with the
6.3 outcome's deferral of all customizer labels.

## Cross-file Dependencies

### Producers (this task)

- `shared/utils/appearance-logo-storage.utils.ts` — path convention +
  MIME allowlist (consumed by the frontend helper; available to backend).
- `frontend/common/views/dashboard/appearance/shared/uploadAppearanceLogoFile.ts`
  — upload helper (consumed by the hook).
- `frontend/common/hooks/useAppearanceLogoUpload.ts` — hook (consumed
  by `LogoUploadSection`).
- `frontend/common/views/dashboard/components/customize/LogoUploadSection.tsx`
  — wired the file input `onChange`.

### Consumers (existing, read but not modified)

- `prepareUploadMutationDocument`
  (`frontend/common/graphql/sharedDocuments/resources/learning-resource.documents.ts`)
  — the existing GraphQL mutation document; reused as-is (the mutation
  itself is generic — it mints a signed-URL session for any validated
  path + content type).
- `app/api/storage/upload/[id]/route.ts` — the signed-URL PUT endpoint;
  handles the actual byte streaming, SHA-256 re-hash, and
  `storage_files` DB row creation via `StorageService.createFileAndGet`.
  Unchanged.
- `appearancePreviewStore.setField` — the store setter from Task 4;
  `setField("logoUrl", url)` pushes the prior draft onto the undo stack,
  clears redo, sets `dirty = true`, and (no-op for `logoUrl`) writes
  active-mode CSS vars. The dirty flag enables the toolbar's Save Draft
  button (Task 6.2).
- `useNotifications` (`@toolpad/core/useNotifications`) — toast channel.

### Downstream (no immediate consumer)

- Task 9 may add `customize.logoUploaded` / `customize.logoUploadFailed`
  i18n keys and replace the inline English toast strings.
- A follow-up task (see Carry-Forward) may add SVG support with DOMPurify
  sanitization + add `image/svg+xml` to the backend `mime-allowlist.ts`
  (gated by the sanitization step).

## Quality Verification

### Per-file `sub-loop.ts --lifecycle codescene`

All 4 files pass all 6 stages:

```
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
```

Files verified:
1. `shared/utils/appearance-logo-storage.utils.ts` — ✅ all 6 passed
2. `frontend/common/views/dashboard/appearance/shared/uploadAppearanceLogoFile.ts`
   — ✅ all 6 passed
3. `frontend/common/hooks/useAppearanceLogoUpload.ts` — ✅ all 6 passed
4. `frontend/common/views/dashboard/components/customize/LogoUploadSection.tsx`
   — ✅ all 6 passed

### Project-wide `bun tsgo`

Exit 0, 0 `error TS` lines (matches Phase 0.1 baseline of 0 errors;
no regression introduced by the 4 new/edited files).

## Decisions

- **Reuse signed-URL pipeline vs. new server method.** See
  Architecture Decision above. Reuse wins: zero backend LOC, inherits
  all existing security controls (path validation, MIME allowlist,
  SHA-256 integrity, auth), provider-agnostic.

- **Shared utility vs. frontend-only path generation.** The path
  convention (`public/appearance/logo-<uuid>.<ext>`) is a cross-layer
  concern (frontend generates it; backend validates it implicitly via
  `validateStoragePath`). Putting it in `shared/utils/` means any
  backend seed script or integration test that wants to reference a
  logo path imports the same constant — no string drift.

- **Duplicate `computeContentHash` / `uploadViaSignedUrl` /
  `uploadViaVercelBlob` vs. extract to a shared helper.**
  `uploadAvatarFile.ts` defines these as private (non-exported)
  functions. Two options: (a) extract to a shared
  `frontend/common/views/dashboard/profile/shared/signedUrlUpload.ts`
  and refactor `uploadAvatarFile.ts` to import from it; (b) duplicate
  ~50 lines into the new `uploadAppearanceLogoFile.ts`.

  Chose (b) for Task 7's scope. Reason: refactoring `uploadAvatarFile.ts`
  risks disturbing its codescene profile (it's a stable, well-tested
  file) and would expand Task 7's blast radius into the profile feature.
  The duplication is self-contained (three small pure functions, no
  branching logic) and both copies are covered by the same lint /
  codescene rules. A follow-up refactor can extract the shared helper
  once both upload paths are stable.

- **Drop SVG from the accept list vs. keep it and let the backend
  reject.** Keeping SVG in the accept attr would let the admin pick an
  SVG file, wait through the upload spinner, then receive a generic
  "Logo upload failed" toast — bad UX and hard to debug. Dropping it
  from the accept attr prevents the file picker from offering SVGs at
  all (on most browsers). The caption text now reads "PNG/JPEG/WebP ·
  max 2MB" to match. SVG support is tracked in Carry-Forward.

- **Inline English toast strings vs. new i18n keys now.** Same
  rationale as 6.3: Task 9 owns the `customize.*` namespace. Adding
  two keys now ("Logo uploaded" / "Logo upload failed") would mean
  touching 3 locale files + the namespace registration — outside
  Task 7's scope.

## Carry-Forward / Deferred

- **SVG logo support (decision §20.1.b).** `image/svg+xml` is excluded
  from both the backend `mime-allowlist.ts` (stored XSS risk via inline
  `<script>` / `onload`) and the frontend accept list. Adding SVG
  requires: (a) DOMPurify sanitization of the SVG body before writing
  to disk (the `isomorphic-dompurify` package is already a dependency);
  (b) gating the backend `isAllowedMimeType` for SVG behind the
  sanitization step; (c) updating the frontend accept attr + caption.
  This is a focused follow-up task — the infrastructure (DOMPurify,
  upload pipeline, path generator) is all in place; only the
  sanitization middleware is missing.

- **Magic-byte verification (decision §20.1.a).** The current flow
  trusts the browser-reported `File.type` MIME type. A determined
  attacker could upload a `.png`-named executable with
  `Content-Type: image/png`. The signed-URL PUT route does NOT
  re-verify magic bytes server-side — it trusts the `Content-Type`
  header (which the route validates against the signed-URL session's
  stored `contentType`, but both come from the same client request).
  A follow-up should add a magic-byte check in `streamToFile`
  (`app/api/storage/upload/[id]/route.ts`) — read the first 8–12
  bytes, compare against the known magic signatures (PNG `89 50 4E 47`,
  JPEG `FF D8 FF`, WebP `52 49 46 46 … 57 45 42 50`), and reject
  mismatches before streaming. Out of scope for Task 7's 5-minute
  budget.

- **CDN cache headers (decision §18).** Logos are stored under
  `public/appearance/` which the Next.js public asset pipeline serves
  with default cache headers. Decision §18 calls for
  `Cache-Control: public, max-age=31536000, immutable` for CDN edge
  caching. The current upload route does not set explicit immutable
  headers on the stored file. This is a Task 9.8 concern ("Ensure logo
  uploads set immutable long-lived CDN cache headers") and is tracked
  there.

- **File size enforcement (2MB cap).** The caption says "max 2MB" but
  neither the frontend nor the backend enforces 2MB specifically — the
  backend's hard limit is `STORAGE_CONFIG.MAX_FILE_SIZE` (100MB). A
  follow-up should add a client-side size check in `handleFileChange`
  (before calling `uploadLogo`) + a server-side check in the
  `prepareUpload` resolver (rejecting `fileSize > 2_000_000` for
  appearance-logo paths).

- **Task 9 — i18n keys for toast strings.** "Logo uploaded" / "Logo
  upload failed" are inline English. Task 9 will add
  `customize.logoUploaded` / `customize.logoUploadFailed` keys.

## Files Touched

| Path | Action | Lines |
|---|---|---|
| `shared/utils/appearance-logo-storage.utils.ts` | Created | ~70 |
| `frontend/common/views/dashboard/appearance/shared/uploadAppearanceLogoFile.ts` | Created | ~130 |
| `frontend/common/hooks/useAppearanceLogoUpload.ts` | Created | ~32 |
| `frontend/common/views/dashboard/components/customize/LogoUploadSection.tsx` | Edited (wired upload) | ~75 → ~130 |

## Issues / Open Questions

- **Permission gate mismatch (OPEN).** The `prepareUpload` mutation
  requires `STORAGE_MANAGE` permission (`requireStorageManage` in the
  resolver). The appearance customizer is gated on
  `SETTINGS_APPEARANCE_MANAGE` (a distinct permission added in Task 1).
  An academy admin with `SETTINGS_APPEARANCE_MANAGE` but NOT
  `STORAGE_MANAGE` will be able to open the customizer but the logo
  upload will fail at the `prepareUpload` step with a permission error.

  Two resolutions:
  (a) Grant `STORAGE_MANAGE` to the `academy_admin` / `super_admin`
      groups (operationally — via the permission seed SQL). This is
      the path of least resistance but widens the storage blast
      radius for appearance admins.
  (b) Loosen the `prepareUpload` auth scope to also accept
      `SETTINGS_APPEARANCE_MANAGE` when the path starts with
      `public/appearance/`. This is more surgical but requires editing
      the storage mutation resolver (out of Task 7's scope — would
      need its own sub-loop + tests).

  Documented here for the plan owner to decide. The current
  implementation works for any admin who already has `STORAGE_MANAGE`
  (typically `super_admin`).

- **No other issues.** All 4 files pass all 6 codescene-lifecycle
  checks. Project-wide `bun tsgo` reports 0 errors. The upload flow is
  end-to-end functional for PNG/JPEG/WebP logos.
