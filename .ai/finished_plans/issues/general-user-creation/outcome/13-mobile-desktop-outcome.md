# Task 13: Mobile & Desktop Views — Outcome

## Summary

Created mobile and desktop tier view wrappers for the general user creation form. Both views are thin wrappers that call `useGeneralUserCreateViewModel()` and pass tier-specific `options` (layout components, styling) to the viewport-agnostic `GeneralUserCreateShared` component.

## Files Created

1. `frontend/mobile/views/dashboard/users/createUser/generalUserCreate.mobile.tsx`
2. `frontend/desktop/views/dashboard/users/createUser/generalUserCreate.desktop.tsx`

## Export Names

- **Mobile**: `GeneralUserCreateMobile` (function component, no props)
- **Desktop**: `GeneralUserCreateDesktop` (function component, no props)

Both views take no props — they call `useGeneralUserCreateViewModel()` internally and pass the full view model to `GeneralUserCreateShared` along with tier-specific `options`.

## Mobile-Specific Layout Components

| Option Slot | Component | Import Path |
|---|---|---|
| `SectionPanel` | `MobileSectionPanel` | `@/frontend/mobile/components/ui/container` |
| `PrimaryPageAction` | `MobilePrimaryPageAction` | `@/frontend/mobile/components/ui/button` |
| `FormSuccessSnackbar` | `FormSuccessSnackbar` | `@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar` |
| `FormErrorSnackbar` | `MobileFormErrorSnackbar` | `@/frontend/mobile/components/ui` (barrel) |
| `footerPadding` | `2` | — |
| `buttonFullWidth` | `true` | — |
| `buttonSx` | `{ py: 1.5 }` | — |
| `formGap` | `2` | — |

Page chrome: `MobilePageContainer` + `MobilePageHeader` (title from `vm.labels.pageTitle`, `edgeToEdge={false}`).

## Desktop-Specific Layout Components

| Option Slot | Component | Import Path |
|---|---|---|
| `SectionPanel` | `DesktopSectionPanel` | `@/frontend/desktop/components/ui/container` |
| `PrimaryPageAction` | `DesktopPrimaryPageAction` | `@/frontend/desktop/components/ui/button` |
| `FormSuccessSnackbar` | `FormSuccessSnackbar` | `@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar` |
| `FormErrorSnackbar` | `DesktopFormErrorSnackbar` | `@/frontend/desktop/components/ui` (barrel) |
| `footerPadding` | `2` | — |
| `buttonSx` | `{ maxWidth: 200 }` | — |
| `formGap` | `3` | — |

Page chrome: `DesktopPageContainer` + `DesktopPageHeader` (title from `vm.labels.pageTitle`).

## Options Structure

Both views construct a module-level `GeneralUserCreateSharedOptions` object:

```typescript
const mobileOptions: GeneralUserCreateSharedOptions = {
  SectionPanel: MobileSectionPanel,
  PrimaryPageAction: MobilePrimaryPageAction,
  FormSuccessSnackbar,
  FormErrorSnackbar: MobileFormErrorSnackbar,
  footerPadding: 2,
  buttonFullWidth: true,
  buttonSx: { py: 1.5 },
  formGap: 2,
};
```

```typescript
const desktopOptions: GeneralUserCreateSharedOptions = {
  SectionPanel: DesktopSectionPanel,
  PrimaryPageAction: DesktopPrimaryPageAction,
  FormSuccessSnackbar,
  FormErrorSnackbar: DesktopFormErrorSnackbar,
  footerPadding: 2,
  buttonSx: { maxWidth: 200 },
  formGap: 3,
};
```

## How the Views Work

1. Call `useGeneralUserCreateViewModel()` to get the view model
2. Wrap the shared form in tier-specific page container + page header
3. Pass the entire view model (spread) + tier-specific `options` to `GeneralUserCreateShared`
4. The shared form handles all form rendering, validation, permission group fetching, and snackbar display

## Carry-Forward Knowledge for Task 14 (Container)

### Import Paths

```typescript
import { GeneralUserCreateMobile } from "@/frontend/mobile/views/dashboard/users/createUser/generalUserCreate.mobile";
import { GeneralUserCreateDesktop } from "@/frontend/desktop/views/dashboard/users/createUser/generalUserCreate.desktop";
```

### Switcher Pattern (for `GeneralUserCreateView.tsx`)

The container/switcher should use `createLazyView` + `ResponsiveViewSwitch`:

```typescript
import { createLazyView, ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";

const lazyViews = createLazyView(
  () => import("@/frontend/mobile/views/dashboard/users/createUser/generalUserCreate.mobile").then(m => ({ default: m.GeneralUserCreateMobile })),
  () => import("@/frontend/desktop/views/dashboard/users/createUser/generalUserCreate.desktop").then(m => ({ default: m.GeneralUserCreateDesktop })),
);

export function GeneralUserCreateView() {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={{}} />;
}
```

**Key note**: Both tier views call `useGeneralUserCreateViewModel()` internally — the container/switcher does NOT need to call the hook. The tier views take no props (the ViewModel hook takes no props either: `UseGeneralUserCreateViewModelProps = Record<string, never>`).

### Alternative Container Pattern

If the container prefers to call the ViewModel and pass it down, the tier views would need to be refactored to accept the view model as props. Current implementation has the ViewModel call inside the tier views (matching the `ManagerOnboardingMobileView` / `ManagerOnboardingDesktopView` pattern where props are passed, but here the view calls the hook directly since the hook takes no arguments).

## Verification Results

```
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
```

Both files passed `sub-loop.ts --lifecycle codescene` with exit code 0.
