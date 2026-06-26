# Dashboard UI Code Review Checklist

Use this checklist when reviewing new dashboard pages or refactoring existing ones.

## Layout & Structure

- [ ] Content wrapped in `PageContainer` (imported from `@/frontend/components/ui`)
- [ ] **No extra padding** on the view component (`p: 2`, `p: 3`, `p: { xs: 2, md: 3 }` not allowed)
- [ ] Page uses `PageHeader` for title, subtitle, breadcrumbs, and actions
- [ ] Table/list sections use `SectionPanel` wrapper

## Tables & Data Grids

- [ ] Desktop list pages use `AppDataGrid` via feature-specific `*DataGrid` wrapper
- [ ] DataGrid placed in `src/views/dashboard/<feature>/components/*DataGrid.tsx`
- [ ] Mobile views use `*CardList` components (or responsive visibility)
- [ ] Pagination is functional (not decorative)
- [ ] Empty states use `emptyMessage` prop
- [ ] **Exception**: Embedded tables (e.g., RegisteredStudentsSection) may use MUI `Table`

## Cards

- [ ] Metric/stat displays use shared `MetricCard` from `@/frontend/components/ui`
- [ ] Section cards use `BaseCard` from `@/frontend/components/ui`
- [ ] **No per-feature metric card components** created

## Status Display

- [ ] Status badges use shared `StatusBadge` with correct `category` prop
- [ ] **No inline `Chip` components** with hardcoded colors for status
- [ ] Category mappings follow `palette.studentAccount.*`, `palette.status.*`, etc.

## Actions & Buttons

- [ ] Page actions use `PrimaryPageAction`, `FilterButton`, or `ExportButton` presets
- [ ] Button radius follows `theme.layout.radius.button` (not hardcoded)

## Forms

- [ ] Form field styles imported from `@/frontend/components/ui/form`
- [ ] Uses `labelSx`, `standardInputSx`, `outlinedInputSx`, etc.
- [ ] **No duplicate form styling** in component files

## Typography

- [ ] Uses theme variants (`headlineLg`, `titleLg`, `labelUppercase`, `bodyMd`)
- [ ] **Minimal hardcoded font styles** in `sx`
- [ ] Page title via `PageHeader` (not custom Typography)

## Theme & Colors

- [ ] **No hardcoded colors** (no hex, rgb/rgba, color names)
- [ ] All colors from `theme.palette.*`
- [ ] Follows theme tokens: `theme.layout.radius.card`, `theme.layout.cardPadding`, etc.

## Imports

- [ ] UI primitives imported from `@/frontend/components/ui`
- [ ] Form styles imported from `@/frontend/components/ui/form`
- [ ] Uses project alias `@/frontend/...` (not relative paths for shared components)

## i18n

- [ ] All user-facing text uses translation keys
- [ ] Empty state messages passed to DataGrid `emptyMessage`

## Mobile Responsiveness

- [ ] Desktop DataGrid hidden on mobile (`< md`)
- [ ] Mobile card list shown on mobile (if applicable)
- [ ] PageHeader adapts (`titleVariant="headlineMd"` on mobile if needed)

---

## Common Anti-Patterns

### ❌ Avoid

```tsx
// Double padding
<Box sx={{ p: 3 }}>
  <PageContainer>...</PageContainer>
</Box>

// Hand-built table for list page
<Table>...</Table>

// Hardcoded status chip
<Chip label="Active" sx={{ backgroundColor: "#4caf50", color: "#fff" }} />

// Per-feature metric card
const MyFeatureMetricCard = ({ label, value }) => ...

// Hardcoded typography
<Typography sx={{ fontSize: 24, fontWeight: 700 }}>Title</Typography>

// Form styles in component
const labelSx = { fontSize: 12, textTransform: "uppercase" };
```

### ✅ Correct

```tsx
// Use PageContainer directly
<PageContainer>
  <PageHeader title="..." />
</PageContainer>

// Use AppDataGrid
<AppDataGrid columns={...} rows={...} />

// Use shared StatusBadge
<StatusBadge category="studentAccount" status="active" label="Active" />

// Use shared MetricCard
<MetricCard icon={Icon} label="Total" value={100} />

// Use theme variants
<PageHeader title="..." titleVariant="headlineLg" />

// Import form styles
import { labelSx } from "@/frontend/components/ui/form";
```

---

## Reference Documents

- [COMPONENT_PATTERNS.md](COMPONENT_PATTERNS.md) — Full pattern documentation
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — Page rollout workflow
- [AGENTS.md](AGENTS.md) — Dashboard UI Patterns section
