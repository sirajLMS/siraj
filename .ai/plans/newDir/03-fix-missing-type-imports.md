---
name: "03: Fix missing type imports (GenderSelectorLabels, etc.)"
overview: "Fix incorrect import paths for UI label types"
todos:
  - id: "1"
    content: Fix GenderSelector.tsx import - GenderSelectorLabels from @/shared/locale/types/ui
    status: "pending"
  - id: "2"
    content: Fix LocalizedStringInput.tsx - t.localeRequiredEntry usage
    status: "pending"
  - id: "3"
    content: Fix other missing type imports across frontend
    status: "pending"
isProject: false
---

# Plan 03: Fix Missing Type Imports

## Files to Modify
1. `frontend/common/components/ui/input/genderSelector/GenderSelector.tsx` - Line 7: import from `@/shared/locale/types/ui/gender-selector` doesn't exist, should be `@/shared/locale/types/ui`
2. `frontend/common/components/ui/input/localizedString/LocalizedStringInput.tsx` - Line 226: `t.localeRequiredEntry({ localeName: t.locale[...] })` - `t.locale` doesn't exist in LocalizedStringLabels

## Key Fixes
- All UI label types are exported from `@/shared/locale/types/ui` (the index.ts barrel file)
- No individual files like `gender-selector.ts` exist in types/ui/
- LocalizedStringLabels interface doesn't have `locale` property - need to fix the localeRequiredEntry call
