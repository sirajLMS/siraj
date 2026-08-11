# Cross-Layer Enum Migration Pattern

## Overview

When an enum exists in both `shared/constants/` (canonical) and `backend/enum/` (duplicate), the duplicate must be eliminated by converting the backend file to a re-export shim and repointing all importers to the canonical location.

## When to Use

- A enum is defined in `shared/constants/` (the cross-layer-canonical home for constants and enums)
- The same enum is also defined in `backend/enum/` (a duplicate)
- Importers across `backend/`, `frontend/`, and `app/` import from the backend path

## Migration Workflow

### Step 1: Verify Canonical Location

Confirm `shared/constants/` is the correct canonical home:
- `shared/` is importable by both frontend and backend (ESLint enforced)
- `shared/constants/` holds cross-layer enums and constants
- `backend/enum/` should only contain backend-only enums

### Step 2: Identify All Importers

```bash
# Find all imports of the backend enum file
grep -rn "from.*@/backend/enum/shared/<name>.enum" --include="*.ts" --include="*.tsx" .
```

### Step 3: Convert Backend File to Re-Export Shim

Replace the duplicate enum definition with a re-export:

```typescript
// backend/enum/shared/<name>.enum.ts
// Re-export from canonical location in shared/constants/
export * from "@/shared/constants/<name>.enum";
```

### Step 4: Repoint Importers (Optional)

If the backend shim exists, importers can continue using `@/backend/enum/shared/<name>.enum` — the re-export makes it transparent. However, for new code, prefer importing directly from `@/shared/constants/<name>.enum`.

### Step 5: Update Generator Scripts

If the enum was originally auto-generated (e.g., IANA timezone enum), update the generator script to write to `shared/constants/` instead of `backend/enum/`:

```typescript
// scripts/generate-iana-timezone-enum.ts
const outputPath = "shared/constants/iana-timezone.enum.ts"; // was backend/enum/shared/
```

### Step 6: Verify

- Run `bun tsgo` — no type errors
- Run `bun check:duplicates` — duplicate pair eliminated
- Run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on modified files

## Completed Migrations

| Enum | Backend File | Canonical Location | Importers Repointed | Phase |
|------|-------------|---------------------|--------------------|----|
| `IANATimezone` | `backend/enum/shared/timezone.enum.ts` | `shared/constants/iana-timezone.enum.ts` | 55 | Phase 4 Task 1.3 |
| `CurrencyCode` | `backend/enum/shared/currency.enum.ts` | `shared/constants/currency.enum.ts` | 6 | Phase 4 Task 1.1 |
| `ClassInstanceDetail` | `backend/enum/shared/class-instance-detail.enum.ts` | `shared/constants/class-instance-detail.enum.ts` | 0 (re-export only) | Phase 4 Task 1.2 |

## Key Rules

1. **Never delete the backend file** — convert it to a re-export shim. This avoids breaking existing importers that haven't been repointed yet.
2. **`shared/constants/` is the canonical home** for cross-layer enums. See `shared/AGENTS.md`.
3. **Generator scripts must write to `shared/constants/`** when the enum is cross-layer.
4. **Re-exports are not duplication** — `export * from` shims are invisible to jscpd's token-level clone detection.
