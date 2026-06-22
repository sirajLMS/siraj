# Dashboard: Extract MUI Styled Components

## Goal
Refactor all components under `frontend/views/dashboard/dashboard/` to extract MUI components with inline `sx` styles into top-level `styled()` components (matching the permissions pattern). After each extraction, validate with `bun tsgo`, `bun biome:check`, and `bun lint` in a loop until all pass. Add clarifying comments to main components.

## Pattern Reference
The `permissions` components use `styled()` from `@mui/material/styles` at the top of each file:
```tsx
import { styled } from "@mui/material/styles";
const StyledFoo = styled(Box)(({ theme }) => ({ /* styles */ }));
```
For dynamic props: use `shouldForwardProp`:
```tsx
const StyledBar = styled(Box, { shouldForwardProp: p => p !== "isActive" })<{ isActive: boolean }>(({ theme, isActive }) => ({ ... }));
```

## Scope (files in scope ONLY)
All files under `frontend/views/dashboard/dashboard/` (8 files total). Do NOT modify files outside this directory.

---

## Phase 1: Identify components needing extraction

### Files with NO custom MUI styles (skip extraction, add comments only):
1. **DashboardContainer.tsx** - Orchestrator: no styled MUI, delegates to other containers
2. **AdminDashboardContainer.tsx** - Data fetching and state container, no styled MUI
3. **DashboardView.tsx** - View layout with PageContainer and sections, no styled MUI
4. **utils.ts** - Hook utility file, no MUI components

### Files needing extraction:

#### 1. ScheduleFilters.tsx
| Current | Extract To |
|---------|-----------|
| Root `<Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, alignItems: { xs: "stretch", sm: "flex-end" } }}>` | `StyledFiltersContainer = styled(Box)(({ theme }) => ({ display: "flex", flexDirection: "column", gap: theme.spacing(2), alignItems: "stretch", [theme.breakpoints.up("sm")]: { flexDirection: "row", alignItems: "flex-end" } }))` |

#### 2. ScheduleOverviewCardList.tsx (many extractions)
| Current | Extract To |
|---------|-----------|
| Empty state `<Box sx={{ py: 4, textAlign: "center" }}>` | `StyledEmptyStateBox = styled(Box)(({ theme }) => ({ paddingTop: theme.spacing(4), paddingBottom: theme.spacing(4), textAlign: "center" }))` |
| Card `<Paper sx={theme => ({ p, borderRadius, opacity, bgcolor, border, borderLeft, boxShadow })}>` | `StyledScheduleCard = styled(Paper, { shouldForwardProp: p => p !== "status" })<{ status: ClassStatus }>(({ theme, status }) => ({ ... }))` |
| Card header row `<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>` | `StyledCardHeaderRow = styled(Box)(({ theme }) => ({ display: "flex", alignItems: "center", justifyContent: "space-between" }))` |
| Meta row `<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>` | `StyledCardMetaRow = styled(Box)(({ theme }) => ({ display: "flex", alignItems: "center", gap: theme.spacing(1), marginBottom: theme.spacing(0.5) }))` |
| ID label `<Typography sx={theme => ({ color, textTransform: "uppercase" })}>` | `StyledCardIdLabel = styled(Typography)(({ theme }) => ({ color: theme.palette.text.secondary, textTransform: "uppercase" }))` |
| Dot separator `<Box sx={theme => ({ width: 4, height: 4, borderRadius: "50%", bgcolor })}>` | `StyledDotSeparator = styled(Box)(({ theme }) => ({ width: 4, height: 4, borderRadius: "50%", backgroundColor: theme.palette.border.light }))` |
| Time `<Typography sx={theme => ({ fontWeight: 700, color (conditional) })}>` | `StyledCardTimeText = styled(Typography, { shouldForwardProp: p => p !== "isInProgress" })<{ isInProgress: boolean }>(({ theme, isInProgress }) => ({ fontWeight: 700, color: isInProgress ? theme.palette.primary.main : theme.palette.text.secondary }))` |
| Student name `<Typography sx={theme => ({ color, mb: 0.25 })}>` | `StyledStudentNameText = styled(Typography)(({ theme }) => ({ color: theme.palette.onSurface, marginBottom: theme.spacing(0.25) }))` |
| Actions column `<Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>` | `StyledCardActionsColumn = styled(Box)(({ theme }) => ({ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: theme.spacing(1) }))` |
| Details icon button `<IconButton sx={theme => ({ color, "&:hover" })}>` | `StyledDetailsIconButton = styled(IconButton)(({ theme }) => ({ color: theme.palette.text.secondary, "&:hover": { backgroundColor: "transparent", color: theme.palette.primary.main } }))` |

#### 3. ScheduleOverviewDataGrid.tsx
| Current | Extract To |
|---------|-----------|
| Actions column wrapper `<Box sx={{ display: "flex", justifyContent: "center", width: "100%", alignSelf: "center", height: "100%" }}>` | `StyledActionsCellBox = styled(Box)({ display: "flex", justifyContent: "center", width: "100%", alignSelf: "center", height: "100%" })` |
| Details button `<IconButton sx={theme => ({ color, "&:hover" })}>` | `StyledDetailsIconButton = styled(IconButton)(({ theme }) => ({ color: theme.palette.primary.main, "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.08) } }))` |
| `MonospaceLabel` function - already well-structured but uses inline sx | `StyledMonospaceLabel = styled(Typography)(({ theme }) => ({ fontFamily: "monospace", color: theme.palette.text.secondary, fontWeight: 500, alignSelf: "center" }))` |

#### 4. ScheduleOverviewSection.tsx (largest file, many extractions)
| Current | Extract To |
|---------|-----------|
| `SectionFooter` wrapper `<Box sx={theme => ({ px, py, display, justifyContent, borderTop })}>` | `StyledSectionFooter = styled(Box)(({ theme }) => ({ paddingInline: theme.spacing(3), paddingBlock: theme.spacing(1.5), display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${theme.palette.border.light}` }))` |
| `SectionFooter` text `<Typography sx={theme => ({ fontFamily, fontSize, color })}>` | `StyledSectionFooterText = styled(Typography)(({ theme }) => ({ fontFamily: '"Inter", sans-serif', fontSize: "12px", color: theme.palette.onSurfaceVariant }))` |
| `DesktopLayout` paper `<Paper sx={theme => ({ borderRadius, border, overflow })}>` | `StyledDesktopPanel = styled(Paper)(({ theme }) => ({ borderRadius: Number(theme.shape.borderRadius) * 2, border: `1px solid ${theme.palette.border.light}`, overflow: "hidden" }))` |
| `DesktopLayout` filter box `<Box sx={theme => ({ px, py, bgcolor, borderBottom })}>` | `StyledFilterContainer = styled(Box)(({ theme }) => ({ paddingInline: theme.spacing(3), paddingBlock: theme.spacing(2.5), backgroundColor: theme.palette.background.default, borderBottom: `1px solid ${theme.palette.border.light}` }))` |
| Search icon `<SearchOutlined sx={theme => ({ fontSize: 18, color })}>` | `StyledSearchIcon = styled(SearchOutlined)(({ theme }) => ({ fontSize: 18, color: theme.palette.onSurfaceVariant }))` |
| `MobileLayout` title `<Typography sx={theme => ({ color })}>` | `StyledMobileSectionTitle = styled(Typography)(({ theme }) => ({ color: theme.palette.primary.main }))` |
| Pagination footer `<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1 }}>` | `StyledPaginationFooter = styled(Box)(({ theme }) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", paddingInline: theme.spacing(1) }))` |
| Page nav button `<IconButton sx={theme => ({ border, borderRadius, bgcolor, "&.Mui-disabled" })}>` | `StyledPageNavButton = styled(IconButton)(({ theme }) => ({ border: `1px solid ${theme.palette.border.light}`, borderRadius: Number(theme.shape.borderRadius), backgroundColor: theme.palette.surfaceContainerLowest, "&.Mui-disabled": { opacity: 0.5 } }))` |
| Page count label `<Typography sx={theme => ({ color })}>` | `StyledPageCountLabel = styled(Typography)(({ theme }) => ({ color: theme.palette.text.secondary }))` |

#### 5. TodayClassesSection.tsx
| Current | Extract To |
|---------|-----------|
| Section wrapper `<Box sx={{ mb: 4 }}>` | `StyledSectionWrapper = styled(Box)(({ theme }) => ({ marginBottom: theme.spacing(4) }))` |
| Header row `<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>` | `StyledSectionHeader = styled(Box)(({ theme }) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: theme.spacing(3) }))` |
| Title `<Typography sx={theme => ({ color, fontFamily, fontWeight })}>` | `StyledSectionTitle = styled(Typography)(({ theme }) => ({ color: theme.palette.text.primary, fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 600 }))` |
| Last updated wrapper `<Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>` | `StyledLastUpdatedBox = styled(Box)(({ theme }) => ({ display: "flex", alignItems: "center", gap: theme.spacing(0.75) }))` |
| Clock icon `<AccessTimeOutlined sx={theme => ({ fontSize: 16, color })}>` | `StyledClockIcon = styled(AccessTimeOutlined)(({ theme }) => ({ fontSize: 16, color: theme.palette.text.secondary }))` |
| Last updated text `<Typography sx={theme => ({ fontFamily, fontSize, color, fontWeight })}>` | `StyledLastUpdatedText = styled(Typography)(({ theme }) => ({ fontFamily: '"Inter", sans-serif', fontSize: "12px", color: theme.palette.text.secondary, fontWeight: 400 }))` |

#### 6. TodayClassesMobileScroll.tsx
- **Already uses `styled()` pattern throughout** - no extraction needed
- Add clarifying comments to describe the component and its styled parts

---

## Phase 2: Quality Validation Loop

For each file after extraction:
1. Run `bun tsgo <file>` — fix type errors
2. Run `bun biome:check <file>` — fix formatting/lint
3. Run `bun lint <file>` — fix eslint
4. If ANY check reports issues, fix and re-run the full loop
5. Only proceed to next file after all 3 pass cleanly in one round

---

## Phase 3: Add Comments to Main Components

Add descriptive JSX comments inside these files explaining what each child component represents:
- `DashboardContainer.tsx`
- `AdminDashboardContainer.tsx`
- `DashboardView.tsx`
- `components/ScheduleOverviewSection.tsx`
- `components/TodayClassesSection.tsx`

Example:
```tsx
{/* Permission-gated metrics section showing today's class statistics */}
<TodayClassesSection ... />

{/* Permission-gated schedule table with filters, pagination, and search */}
<ScheduleOverviewSection ... />
```

---

## Execution Order

Process files in dependency order (leaf components first, then consumers):

1. `ScheduleFilters.tsx` (1 extraction - simple)
2. `TodayClassesSection.tsx` (6 extractions)
3. `ScheduleOverviewCardList.tsx` (10 extractions)
4. `ScheduleOverviewDataGrid.tsx` (3 extractions)
5. `ScheduleOverviewSection.tsx` (9 extractions - largest)
6. `TodayClassesMobileScroll.tsx` (comments only - already refactored)
7. `DashboardView.tsx` (comments only)
8. `AdminDashboardContainer.tsx` (comments only)
9. `DashboardContainer.tsx` (comments only)

---

## Key Rules
- Use `import { styled } from "@mui/material/styles"` (not `import styled from ...`)
- Use `theme.spacing()` for numeric spacing values in `styled()`
- Use `shouldForwardProp` for any custom props (e.g., `status`, `isInProgress`)
- Do NOT modify files outside `frontend/views/dashboard/dashboard/`
- Do NOT change component behavior or props interfaces
- Preserve all existing functionality exactly
- Ignore errors in files outside the scope (other files may be in active development)
- Use `bun biome:check` (not `bun biome check`)
