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

## Rollout Summary

| Component | Clone Elimination |
|-----------|-------------------|
| StatusBadge | 199 lines / 1224 tokens |
| BaseDeleteDialog | ~180 lines |
| PaymentMethodTypeFields | 156 lines / 970 tokens |
| CreateRecurringClassDialog | 150 lines / 747 tokens |

## Related Documents

- `frontend/common/components/ui/AGENTS.md`
- `.agents/skills/refactor-mobile-desktop/SKILL.md`
- `.agents/instructions/mobile-desktop.instructions.md`
