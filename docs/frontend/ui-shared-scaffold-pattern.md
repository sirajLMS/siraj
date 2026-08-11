# UI Shared Scaffold Pattern (*Shared.tsx)

The `*Shared.tsx` scaffold pattern eliminates code duplication across common/desktop/mobile component tiers by extracting shared presentation logic into a single scaffold component with slot props for tier-specific variations.

## Why This Pattern Exists

The siraj frontend has three parallel component tiers (`common/`, `desktop/`, `mobile/`) that often implement the same UI component with minor visual variations. Before this pattern, these tiers contained near-identical code (199 lines / 1224 tokens for StatusBadge, 156 lines / 970 tokens for PaymentMethodTypeFields).

The pattern was successfully used in the duplications plan (Phase 2) to eliminate triplication for: StatusBadge, BaseDeleteDialog, PaymentMethodTypeFields, CreateRecurringClassDialog.

## The Pattern

### Structure

```
frontend/common/components/ui/<category>/<ComponentName>/
  <ComponentName>Shared.tsx    # Scaffold with slot props
  <ComponentName>.tsx          # Common tier variant
frontend/desktop/components/ui/<category>/<componentName>/
  <componentName>.desktop.tsx  # Desktop tier variant
frontend/mobile/components/ui/<category>/<componentName>/
  <componentName>.mobile.tsx   # Mobile tier variant
```

### Scaffold Component

The scaffold component:
1. Contains ALL shared presentation logic (layout, styling, behavior)
2. Accepts `slotProps` for tier-specific customization
3. Uses MUI v9 `sx` prop for ALL styling (NEVER direct style props)
4. Exports a typed `SlotProps` interface

### Tier Variants

Each tier variant:
1. Imports the shared scaffold from `common/`
2. Passes tier-specific `slotProps`
3. Does NOT import from other tier-specific paths

## Rules

- MUST name the scaffold `<ComponentName>Shared.tsx`
- MUST place scaffold in `frontend/common/components/ui/<category>/`
- MUST use MUI v9 `sx` prop for ALL styling; NEVER direct style props
- MUST use `*Outlined` icon naming
- MUST export typed `SlotProps` interface
- MUST NOT import tier-specific paths from other tiers
- SHOULD keep slot props minimal

## What NOT to Do

- DO NOT create re-export barrels instead of scaffolds
- DO NOT put business logic in scaffolds
- DO NOT create scaffold for <50 lines of shared code
- DO NOT use direct style props

## View Component Scaffold Pattern (Phase 2-3 Extension)

View component scaffolds follow the same principles but live in `__shared__/` directories alongside the view variants:

```
frontend/common/views/dashboard/<domain>/components/__shared__/
  <ComponentName>Shared.tsx     # Scaffold with slot props
  <ComponentName>Shared.types.ts # (optional) shared types
frontend/desktop/views/dashboard/<domain>/components/
  <componentName>.desktop.tsx   # Desktop tier variant (thin wrapper)
frontend/mobile/views/dashboard/<domain>/components/
  <componentName>.mobile.tsx    # Mobile tier variant (thin wrapper)
```

### Key differences from UI component scaffolds:
1. **Location**: `__shared__/` directory instead of alongside the common component
2. **Slot types**: View scaffolds often use render functions instead of `ComponentType<P>` to avoid TypeScript contravariance issues (e.g., when desktop uses `UiTypographyVariant` and mobile uses `UiTypographyVariantLoose`)
3. **Config objects**: Many view scaffolds use options objects (`DESKTOP_OPTIONS`, `MOBILE_OPTIONS`) for purely visual differences instead of component slots

### Rollout Summary (Phases 1-3)

#### Phase 1: UI Component Scaffolds (11 components)
| Component | Clone Elimination |
|-----------|-------------------|
| CurrencyAutocomplete | ~400 tokens |
| PhoneInput | ~350 tokens |
| PaymentMethodDisplay | ~500 tokens |
| UserPaymentMethodAutocomplete | ~300 tokens |
| EditableTypography | ~200 tokens |
| TagInput | ~250 tokens |
| CountryAutocomplete | ~350 tokens |
| MeetingJoinAction | ~200 tokens |
| MeetingConfigDisplay | ~250 tokens |
| PaymentMethodAutocomplete | ~300 tokens |
| PaginationControls | ~200 tokens |

#### Phase 2: View Component Scaffolds (19 components)
| Component | Clone Elimination |
|-----------|-------------------|
| localizedStringDrawer | 1,377 tokens (largest cluster) |
| managementControlsCard | 1,264 tokens |
| meetingProviderForm | 1,134 tokens |
| studentStatusHeader | 1,062 tokens |
| complaintFormFields | 1,055 tokens |
| complaintQueueCard | 1,053 tokens |
| jumpToDateHeader | 1,009 tokens |
| futureClassCard | 977 tokens |
| miniCalendar | 943 tokens |
| studentInformationSection | 923 tokens |
| searchScheduleFilterDrawer | 899 tokens |
| meetingIntegrationsTab | 829 tokens |
| courseDetailsSection | 797 tokens |
| weeklyAvailabilityGrid | 796 tokens |
| teacherAvailabilityMonthDrawer | 793 tokens |
| parentProfile | 777 tokens |
| suspensionAnalytics | 753 tokens |
| staffProfile | 750 tokens |
| editCategoryDialog | 735 tokens |

#### Phase 3: Complex Consolidation (4 tasks)
| Task | Disposition |
|------|------------|
| 3.1 CatalogImageUpload | 7 clones eliminated, desktop+mobile variants created |
| 3.2 Excel export utilities | 4 clones / 810 tokens eliminated |
| 3.3 Within-common consolidation | 9 clusters eliminated (loading skeletons, onboarding, mappers) |
| 3.4 Within-tier consolidation | 12 clusters eliminated (catalog grids, dialog forms, billing pages) |

**Total result**: 814→581 clones (28.6% reduction), 115,409→66,776 frontend tokens (42.1% reduction)

## CRITICAL: Circular Dependency Prevention

**NEVER** import through barrel `index.ts` re-exports when the importing and imported components live in the same barrel. This causes TDZ (Temporal Dead Zone) errors at runtime.

**Always use direct file paths** for scaffold imports:
```typescript
// WRONG — causes TDZ if barrel exports importing component before the imported one
import { SomeComponent } from "@/frontend/common/components/ui/display";

// RIGHT — direct path, no circular dependency
import { SomeComponent } from "@/frontend/common/components/ui/display/someComponent/SomeComponent";
```

## Related Documents

- `frontend/common/components/ui/AGENTS.md`
- `docs/frontend/duplication-elimination-patterns.md`
- `.agents/skills/refactor-mobile-desktop/SKILL.md`
- `.agents/instructions/mobile-desktop.instructions.md`

---

## Extension: View Component Scaffolds (`__shared__/` Directory)

The `*Shared.tsx` scaffold pattern extends beyond UI components (common/desktop/mobile tiers) to **view component pairs** (desktop/mobile variants of the same view).

### Placement Convention

When a desktop view (`.desktop.tsx`) and its mobile counterpart (`.mobile.tsx`) share significant presentation logic, the shared scaffold is placed in a `__shared__/` directory at the parent level:

```
frontend/common/views/dashboard/<domain>/components/
  __shared__/
    <componentName>Shared.tsx      # Scaffold with slot props
  <componentName>.desktop.tsx       # Desktop variant — delegates to scaffold
  <componentName>.mobile.tsx        # Mobile variant — delegates to scaffold
```

### When to Use `__shared__/` vs `common/`

| Scenario | Scaffold Placement |
|----------|-------------------|
| UI component triplication (common/desktop/mobile) | `frontend/common/components/ui/<group>/*Shared.tsx` |
| View component pair (desktop/mobile only) | `frontend/common/views/dashboard/<domain>/components/__shared__/*Shared.tsx` |
| Desktop-specific component pair within desktop tier | `frontend/desktop/views/.../__shared__/*Shared.tsx` |

### Slot Props for View Scaffolds

View scaffolds use the same slot props pattern as UI scaffolds — pass tier-specific components, sx styles, and configuration as props rather than hardcoding them:

```typescript
type ViewSlotProps = {
  readonly Footer: React.ComponentType<{ onClose: () => void }>;
  readonly paperSx: SxProps<Theme>;
  readonly anchor: "right" | "bottom";
};
```

### Import Rules

- Desktop variants import ONLY from `__shared__/` scaffold paths
- Mobile variants import ONLY from `__shared__/` scaffold paths
- Never import from sibling tier's `.desktop.tsx` or `.mobile.tsx` files
