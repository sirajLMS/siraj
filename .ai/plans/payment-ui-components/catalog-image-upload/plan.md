# Catalog Image Upload — Plan

See [spec.md](./spec.md).

## Architecture

```
CatalogImageUpload (presentational + client validation)
        │
        ├── optional onUploadAction → parent/container → API (later)
        └── optional allowUrlFallback → TextField for logoUrl
```

## Phase pipeline

| Phase | Work | Gate |
|-------|------|------|
| 1 | Component + internal state (preview, file input, validation) | `bun tsgo` |
| 2 | Stories with mock upload | Storybook |
| 3 | i18n `ui.catalogImageUpload` | — |
| 4 | Export + lint | sub-loop |

## Patterns to copy

| From | Copy |
|------|------|
| `AvatarUploadDialog.tsx` | ACCEPTED_TYPES, MAX_FILE_SIZE, FileReader preview, file input ref |
| `ResourceUploadDropzone.tsx` | Optional dashed border click area variant |

## File list

| File | Action |
|------|--------|
| `frontend/components/ui/input/CatalogImageUpload.tsx` | Create |
| `frontend/components/ui/input/CatalogImageUpload.stories.tsx` | Create |
| `frontend/components/ui/input/index.ts` | Update |
| `shared/messages/types/ui/catalog-image-upload.ts` | Create |
| `shared/messages/ar/ui/catalog-image-upload.ts` | Create |
| `shared/messages/en.ts` | Update |

## Notes for payment integration (later)

Container `SupportedMobileWalletEditDialog` passes:

```ts
onUploadAction={async (file) => {
  const result = await uploadCatalogLogo({ variables: { file } });
  return { url: result.url, filePath: result.filePath };
}}
```

Upload mutation is **not** part of this plan.
