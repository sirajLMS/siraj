# Task 12: Shared Form Body — Outcome

## Summary

Created the shared form body component `GeneralUserCreateShared` that renders the general user creation form. This component is used by both mobile and desktop tier views, which inject tier-specific UI components (SectionPanel, PrimaryPageAction, snackbars) via the `options` prop.

## File Created

`frontend/common/views/dashboard/users/createUser/__shared__/generalUserCreateShared.tsx`

## Export Name & Component Name

- **Export**: `GeneralUserCreateShared` (function component)
- **Options interface**: `GeneralUserCreateSharedOptions`

## Props Interface

```typescript
Readonly<
  Pick<
    UseGeneralUserCreateViewModel,
    | "form"
    | "control"
    | "errors"
    | "handleSubmit"
    | "isSubmitting"
    | "showSuccess"
    | "submitError"
    | "labels"
    | "onSubmit"
    | "onDismissSuccess"
    | "onDismissError"
  > & {
    readonly options: GeneralUserCreateSharedOptions;
  }
>
```

### `GeneralUserCreateSharedOptions`

```typescript
interface GeneralUserCreateSharedOptions {
  readonly SectionPanel: ComponentType<{ title: string; children: ReactNode }>;
  readonly PrimaryPageAction: ComponentType<PrimaryPageActionProps>;
  readonly FormSuccessSnackbar: ComponentType<SnackbarProps>;
  readonly FormErrorSnackbar?: ComponentType<SnackbarProps>;
  readonly footerPadding: number;
  readonly buttonFullWidth?: boolean;
  readonly buttonSx: SxProps<Theme>;
  readonly formGap: number;
}
```

- `PrimaryPageActionProps`: `{ type?, variant?, disabled?, fullWidth?, sx?, children, onClick? }`
- `SnackbarProps`: `{ open, message, onClose }`

## Form Field Components Used

The codebase does NOT have `TextFormField`, `SelectFormField`, or `AutocompleteFormField` components. Following the existing pattern (from `UserEntityFieldsSection`), all fields use raw MUI components with `Controller` from `react-hook-form`:

| Field | Component | Type |
|-------|-----------|------|
| Name | `TextField` + `Controller` | text |
| Email | `TextField` + `Controller` | email |
| Password | `TextField` + `Controller` | password |
| Phone | `PhoneFormField` (from `@/frontend/common/components/ui/input`) | phone |
| Permission Group | `Autocomplete` + `Controller` | autocomplete (fetches from `permissionGroupsQueryDocument`) |
| Account Status | `TextField select` + `Controller` with `MenuItem` | select (ACTIVATED / DEACTIVATED) |

All text fields use `outlinedInputSx` from `@/frontend/common/components/ui/form/field` for consistent styling.

## Form Structure

1. **FormProvider** wraps the entire form (from `react-hook-form`)
2. **Box component="form"** with `onSubmit={handleSubmit(onSubmit)}`
3. **Section 1: User Details** (`labels.sections.userDetails`) — Grid with Name, Email, Phone, Password
4. **Section 2: Permissions** (`labels.sections.permissions`) — Grid with Permission Group autocomplete + Account Status select
5. **Form Actions** — Cancel button (navigates to `/users`) + Create submit button (disabled when `isSubmitting`)
6. **FormSuccessSnackbar** and optional **FormErrorSnackbar** at the end

## How Specialized Groups Are Filtered

Permission groups are fetched via `useQuery(permissionGroupsQueryDocument)` inside the shared component. The results are filtered using `SPECIALIZED_GROUP_SLUG_SET` from `@/shared/constants/specialized-groups.constants`:

```typescript
const permissionGroupOptions = (groupsData?.permissionGroups ?? []).flatMap(group => {
  const slug = group?.slug;
  if (!slug) return [];
  if (SPECIALIZED_GROUP_SLUG_SET.has(slug)) return [];  // filter out STUDENT_DEFAULT, TEACHER_DEFAULT, PARENT_DEFAULT
  return [{ slug, name: resolveLocalizedString(group.name, locale) }];
});
```

Group names are localized using `resolveLocalizedString()` from `@/shared/lib/localized-string` with the current locale from `useAppLocale()`.

## Key Implementation Details

- **`useRouter`** from `@/shared/i18n/navigation` — locale-aware navigation for the cancel button
- **`useAppLocale`** from `@/frontend/common/providers/localeContext` — current locale for resolving localized permission group names
- **`AccountStatus` enum** imported from `@/frontend/common/graphql/generated/gql/graphql-types` — values `Activated` and `Deactivated`
- All text comes from the `labels` prop (type `CreateUserLabels`) — no hardcoded strings
- MUI v9: `sx` prop used for all styling, no style props
- Validation error messages resolved via a `validationMessage` helper that maps error message keys to label keys

## Carry-Forward Knowledge for Tasks 13 (Mobile/Desktop Views) and 14 (Container)

### Import and Usage

```typescript
import { GeneralUserCreateShared, type GeneralUserCreateSharedOptions } from
  "@/frontend/common/views/dashboard/users/createUser/__shared__/generalUserCreateShared";
```

### Tier View Pattern (Task 13)

Each tier view (mobile/desktop) should:

1. **Call the ViewModel**: `const vm = useGeneralUserCreateViewModel();`
2. **Construct `options`** with tier-specific components:
   - `SectionPanel` → `DesktopSectionPanel` or `MobileSectionPanel`
   - `PrimaryPageAction` → `DesktopPrimaryPageAction` or `MobilePrimaryPageAction`
   - `FormSuccessSnackbar` → desktop/mobile snackbar component
   - `FormErrorSnackbar` → optional desktop/mobile error snackbar
   - `footerPadding` → tier-specific padding value
   - `buttonFullWidth` → `true` for mobile, `false`/omitted for desktop
   - `buttonSx` → tier-specific button styling
   - `formGap` → tier-specific gap between sections
3. **Render**: `<GeneralUserCreateShared {...vm} options={options} />`

**Note**: The shared component already wraps in `FormProvider`, so the tier views do NOT need to add their own `FormProvider`.

### Container Pattern (Task 14)

The container should:
1. Render the appropriate tier view based on device detection
2. The tier view calls `useGeneralUserCreateViewModel()` and passes the result + `options` to `GeneralUserCreateShared`

### Components to Import for Tier Views

- `DesktopSectionPanel` / `MobileSectionPanel` — from `@/frontend/desktop/components/ui/...` / `@/frontend/mobile/components/ui/...`
- `DesktopPrimaryPageAction` / `MobilePrimaryPageAction` — from `@/frontend/desktop/components/ui/button/DesktopActionButtons` / `@/frontend/mobile/components/ui/button/MobileActionButtons`
- `FormSuccessSnackbar` / `FormErrorSnackbar` — from `@/frontend/common/components/ui/form/snackbar/...` (shared snackbar components can be used directly, or tier-specific wrappers can be provided)

## Verification Results

```
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
```

All checks passed in `sub-loop.ts --lifecycle codescene` with exit code 0.
