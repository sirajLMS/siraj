# Catalog Image Upload — Specification

**Status:** Planning  
**Blocks:** Payment catalog admin (wallet / link / online account logo fields)  
**Design:** [mobile-wallet principle](../payment/ui-design/mobile-wallet/principle.md)

---

## Problem

Payment catalog rows have `logoUrl` and `imageFilePath`. `AvatarUploadDialog` solves avatar upload for parents but is dialog-bound and profile-specific. Catalog admin needs an **inline form field**: preview, pick file, validate, upload, show errors via parent container snackbar.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Component name | `CatalogImageUpload` |
| Location | `frontend/components/ui/input/CatalogImageUpload.tsx` |
| Pattern source | `AvatarUploadDialog` + optional `ResourceUploadDropzone` click target |
| Accepted types | `image/jpeg`, `image/png`, `image/webp` |
| Max size | 2 MB (configurable prop, default 2) |
| Value model | Controlled: `imageUrl` + optional `onUploadAction(file) => Promise<{ url: string; filePath?: string }>` |
| Alternative URL | Optional `allowUrlFallback` — TextField for manual `logoUrl` when upload API unavailable in Storybook |
| Errors | Component sets local error string; parent shows `useNotifications` on upload failure |
| Preview | Current URL or `FileReader` data URL for selected-not-yet-uploaded file |

## API

```ts
export type CatalogImageUploadProps = {
  readonly imageUrl?: string | null;
  readonly onImageUrlChangeAction?: (url: string | null) => void;
  readonly onUploadAction?: (file: File) => Promise<{ url: string; filePath?: string }>;
  readonly onFilePathChangeAction?: (filePath: string | null) => void;
  readonly label?: string;
  readonly disabled?: boolean;
  readonly maxSizeMb?: number;
  readonly allowUrlFallback?: boolean;
  readonly helperText?: string;
  readonly error?: boolean;
  readonly errorMessage?: string;
};
```

## UX wireframe

```
Logo
┌────────────┐
│  [preview] │   [ Upload image ]  [ Remove ]
└────────────┘
PNG, JPG or WebP · max 2 MB

— optional —
Logo URL   [ https://cdn.example.com/logo.png ]
```

## Upload flow

1. User clicks Upload → hidden file input
2. Client validates type + size → local error if invalid
3. If `onUploadAction` provided: call it, set `imageUrl` + `filePath` from result
4. If upload throws: parent catches and `notifications.show(..., { severity: "error" })`
5. **Remove** clears preview, url, and filePath

## Storybook

- With static `imageUrl` only (no upload handler)
- With mock `onUploadAction` (delay + fake URL)
- Validation error: wrong type / oversized file
- `allowUrlFallback` enabled
- Arabic locale (RTL layout on label only; preview unchanged)

## Acceptance criteria

1. Preview renders existing `imageUrl` or selected file before upload completes
2. Rejects non-image MIME and files over `maxSizeMb`
3. Remove clears state
4. Accessible: `aria-label` on upload/remove buttons
5. Stories + export from `input/index.ts`
6. Quality gate clean on touched files

## Out of scope

- Backend upload endpoint implementation (payment phase wires real mutation)
- SVG logos
- Image cropping (v1)
