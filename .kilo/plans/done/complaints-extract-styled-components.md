# Complaints: Extract MUI Styled Components

## Goal
Refactor all components under `frontend/views/dashboard/complaints/` to extract MUI components with inline `sx` styles into top-level `styled()` components (matching the permissions pattern). After each extraction, validate with `bun tsgo`, `bun biome:check`, and `bun lint` in a loop until all pass. Add clarifying comments to main components.

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
All files under `frontend/views/dashboard/complaints/` (23 files). Do NOT modify files outside this directory.

---

## Phase 1: Identify components needing extraction

### Files with NO custom MUI styles (skip extraction, add comments only):
1. **ComplaintsTabBar.tsx** - delegates to `AdminQueueTabBar`, no styled MUI
2. **ParentComplaintsContainer.tsx** - no styled MUI
3. **AdminComplaintsContainer.tsx** - no styled MUI
4. **ParentComplaintsView.tsx** - no styled MUI
5. **AdminComplaintsView.tsx** - no styled MUI

### Files needing extraction:

#### 1. ComplaintsSearchBar.tsx
| Current | Extract To |
|---------|-----------|
| `<TextField sx={{ minWidth: 240 }}>` | `StyledSearchField = styled(TextField)({ minWidth: 240 })` |

#### 2. ComplaintsMetricsRow.tsx
| Current | Extract To |
|---------|-----------|
| `<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>` | `StyledMetricsContainer = styled(Box)(({ theme }) => ({ display: "flex", flexDirection: "column", gap: theme.spacing(2) }))` |

#### 3. ComplaintRecordCardList.tsx
| Current | Extract To |
|---------|-----------|
| Header `<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, gap: 2 }}>` | `StyledCardListHeader = styled(Box)(({ theme }) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: theme.spacing(3), gap: theme.spacing(2) }))` |
| Icon+Title `<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>` | `StyledCardListTitleGroup = styled(Box)(({ theme }) => ({ display: "flex", alignItems: "center", gap: theme.spacing(1) }))` |
| `<Chip sx={theme => ({ backgroundColor: theme.palette.surfaceContainerHigh })}>` | `StyledTotalCountChip = styled(Chip)(({ theme }) => ({ backgroundColor: theme.palette.surfaceContainerHigh }))` |
| Card list `<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>` | `StyledCardListContainer = styled(Box)(({ theme }) => ({ display: "flex", flexDirection: "column", gap: theme.spacing(2) }))` |
| Load-more `<Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>` | `StyledLoadMoreContainer = styled(Box)(({ theme }) => ({ display: "flex", justifyContent: "center", marginTop: theme.spacing(4) }))` |
| Load-more `<Button sx={theme => ({ color: ..., fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" })}>` | `StyledLoadMoreButton = styled(Button)(({ theme }) => ({ color: theme.palette.primary.main, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }))` |

#### 4. ComplaintRecordCard.tsx
| Current | Extract To |
|---------|-----------|
| Root `<Paper sx={theme => ({ borderRadius, border, bgcolor, overflow, transition, "&:hover" })}>` | `StyledRecordCardPaper = styled(Paper)(({ theme }) => ({ ... }))` |
| Content `<Box sx={{ p: 3 }}>` | `StyledRecordCardContent = styled(Box)(({ theme }) => ({ padding: theme.spacing(3) }))` |
| Header row `<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 2 }}>` | `StyledRecordCardHeader = styled(Box)(({ theme }) => ({ ... }))` |
| Regarding `<Typography sx={theme => ({ color, textTransform: "uppercase", mb: 0.5 })}>` | `StyledRecordRegardingLabel = styled(Typography)(({ theme }) => ({ ... }))` |
| Summary `<Typography sx={theme => ({ fontWeight: 600, color })}>` | `StyledRecordSummaryText = styled(Typography)(({ theme }) => ({ ... }))` |
| Response `<Box sx={theme => ({ p, borderRadius, bgcolor, position })}>` | `StyledAdminResponseBox = styled(Box)(({ theme }) => ({ ... }))` |
| Response header `<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>` | `StyledAdminResponseHeader = styled(Box)(({ theme }) => ({ ... }))` |
| Verified icon `<VerifiedUserOutlined sx={theme => ({ color, fontSize: 18 })}>` | `StyledVerifiedIcon = styled(VerifiedUserOutlined)(({ theme }) => ({ ... }))` |
| Response label `<Typography sx={theme => ({ fontWeight: 700, color })}>` | `StyledAdminResponseLabel = styled(Typography)(({ theme }) => ({ ... }))` |
| Response time `<Typography sx={theme => ({ color, ml: "auto" })}>` | `StyledAdminResponseTime = styled(Typography)(({ theme }) => ({ ... }))` |
| Response text `<Typography sx={theme => ({ fontStyle: "italic", color })}>` | `StyledAdminResponseText = styled(Typography)(({ theme }) => ({ ... }))` |
| Pending `<Box sx={theme => ({ display, alignItems, gap, color, py, borderTop, mt })}>` | `StyledPendingStatusBox = styled(Box)(({ theme }) => ({ ... }))` |

#### 5. ComplaintQueueCardList.tsx
| Current | Extract To |
|---------|-----------|
| Empty state `<Typography sx={theme => ({ color, py: 4, textAlign: "center" })}>` | `StyledEmptyStateMessage = styled(Typography)(({ theme }) => ({ color: theme.palette.text.secondary, paddingTop: theme.spacing(4), paddingBottom: theme.spacing(4), textAlign: "center" }))` |
| List `<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>` | `StyledQueueCardContainer = styled(Box)(({ theme }) => ({ display: "flex", flexDirection: "column", gap: theme.spacing(2) }))` |

#### 6. ComplaintQueueCard.tsx (largest file, most extractions)
| Current | Extract To |
|---------|-----------|
| **ComplaintResponseSection:** Answered `<Box sx={theme => ({ p, borderRadius, bgcolor, border })}>` | `StyledAnsweredResponseBox = styled(Box)(({ theme }) => ({ ... }))` |
| Answered header `<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>` | `StyledAnsweredResponseHeader = styled(Box)(({ theme }) => ({ ... }))` |
| Check icon `<CheckCircleOutlined sx={theme => ({ color, fontSize: 18 })}>` | `StyledAnsweredIcon = styled(CheckCircleOutlined)(({ theme }) => ({ ... }))` |
| Answered label `<Typography sx={theme => ({ fontWeight: 700, color })}>` | `StyledAnsweredResponseLabel = styled(Typography)(({ theme }) => ({ ... }))` |
| Answered time `<Typography sx={theme => ({ color, ml: "auto" })}>` | `StyledAnsweredResponseTime = styled(Typography)(({ theme }) => ({ ... }))` |
| Response label (unanswered) `<Typography sx={{ fontWeight: 700, mb: 1, textTransform: "uppercase" }}>` | `StyledResponseInputLabel = styled(Typography)({ ... })` |
| Actions `<Box sx={{ mt: 2, display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "flex-end", gap: 1.5 }}>` | `StyledResponseActionsBox = styled(Box)(({ theme }) => ({ ... }))` |
| Email button `<FilterButton sx={theme => ({ bgcolor, color, borderColor, "&:hover" })}>` | `StyledEmailActionButton = styled(FilterButton)(({ theme }) => ({ ... }))` |
| **ComplaintQueueCard:** Root `<Paper sx={theme => ({ p, borderRadius, border, bgcolor (conditional), transition })}>` | `StyledQueueCardPaper = styled(Paper, { shouldForwardProp: p => p !== "isUnanswered" })<{ isUnanswered: boolean }>(({ theme, isUnanswered }) => ({ ... }))` |
| Header `<Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: ..., gap: 2, mb: 2 }}>` | `StyledQueueCardHeader = styled(Box)(({ theme }) => ({ ... }))` |
| Avatar+Name `<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>` | `StyledSubmitterInfoBox = styled(Box)(({ theme }) => ({ ... }))` |
| Avatar `<Avatar sx={{ width: 48, height: 48, typography: "labelMd" }}>` | `StyledSubmitterAvatar = styled(Avatar)(({ theme }) => ({ ... }))` |
| Name `<Typography sx={{ fontWeight: 700 }}>` | `StyledSubmitterName = styled(Typography)({ fontWeight: 700 })` |
| Role `<Typography sx={theme => ({ color, textTransform: "uppercase" })}>` | `StyledSubmitterRole = styled(Typography)(({ theme }) => ({ ... }))` |
| Status+Time `<Box sx={{ textAlign: { xs: "left", sm: "right" } }}>` | `StyledQueueCardStatusBox = styled(Box)(({ theme }) => ({ ... }))` |
| Received time `<Typography sx={theme => ({ color, mt: 1 })}>` | `StyledReceivedTimeLabel = styled(Typography)(({ theme }) => ({ ... }))` |
| Complaint text `<Box sx={theme => ({ mb (conditional), p, bgcolor, borderRadius, borderLeft })}>` | `StyledComplaintTextBox = styled(Box, { shouldForwardProp: p => p !== "isUnanswered" })<{ isUnanswered: boolean }>(({ theme, isUnanswered }) => ({ ... }))` |

#### 7. ComplaintPolicyPanel.tsx
| Current | Extract To |
|---------|-----------|
| Root `<Box sx={theme => ({ mt, p, borderRadius, bgcolor, border })}>` | `StyledPolicyPanelBox = styled(Box)(({ theme }) => ({ ... }))` |
| Title `<Typography sx={theme => ({ color, mb: 1 })}>` | `StyledPolicyTitle = styled(Typography)(({ theme }) => ({ ... }))` |
| Body `<Typography sx={theme => ({ color })}>` | `StyledPolicyBody = styled(Typography)(({ theme }) => ({ ... }))` |

#### 8. ComplaintFormFields.tsx
| Current | Extract To |
|---------|-----------|
| `FieldLabel` `<Typography sx={theme => ({ color, textTransform: "uppercase", fontWeight: 500 })}>` | `StyledFieldLabel = styled(Typography)(({ theme }) => ({ ... }))` |
| Form `<Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 3 : 4 }}>` | `StyledFormContainer = styled(Box, { shouldForwardProp: p => p !== "isMobile" })<{ isMobile: boolean }>(({ theme, isMobile }) => ({ ... }))` |
| Form header `<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: isMobile ? 0 : 1 }}>` | `StyledFormHeaderBox = styled(Box, { shouldForwardProp: p => p !== "isMobile" })<{ isMobile: boolean }>(({ theme, isMobile }) => ({ ... }))` |
| Error `<Typography sx={theme => ({ color: theme.palette.error.main, mt: 0.5 })}>` | `StyledFieldErrorMessage = styled(Typography)(({ theme }) => ({ ... }))` |

#### 9. ParentComplaintsDesktopView.tsx
- No custom MUI styles to extract (uses shared components)
- **Add comments** describing each child component

#### 10. ParentComplaintsMobileView.tsx
| Current | Extract To |
|---------|-----------|
| Success wrapper `<Box sx={{ px: 2, pt: 1 }}>` | `StyledMobileSuccessBannerBox = styled(Box)(({ theme }) => ({ paddingLeft: theme.spacing(2), paddingRight: theme.spacing(2), paddingTop: theme.spacing(1) }))` |
| Content `<Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 4 }}>` | `StyledMobileContentColumn = styled(Box)(({ theme }) => ({ display: "flex", flexDirection: "column", gap: theme.spacing(3), paddingBottom: theme.spacing(4) }))` |
- **Add comments** describing each child component

#### 11. AdminComplaintsDesktopView.tsx
- No custom MUI styles to extract
- **Add comments** describing each child component

#### 12. AdminComplaintsMobileView.tsx
| Current | Extract To |
|---------|-----------|
| Search wrapper `<Box sx={{ mb: 2 }}>` | `StyledMobileSearchBox = styled(Box)(({ theme }) => ({ marginBottom: theme.spacing(2) }))` |
| Queue wrapper `<Box sx={{ pt: 2 }}>` | `StyledMobileQueueContainer = styled(Box)(({ theme }) => ({ paddingTop: theme.spacing(2) }))` |
- **Add comments** describing each child component

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

Add descriptive JSX comments inside these view/container files explaining what each child component represents:
- `ParentComplaintsDesktopView.tsx`
- `ParentComplaintsMobileView.tsx`
- `AdminComplaintsDesktopView.tsx`
- `AdminComplaintsMobileView.tsx`

Example:
```tsx
{/* Complaint form card with student select, email, and details fields */}
<BaseCard>
  <ComplaintFormFields ... />
</BaseCard>

{/* Policy information panel shown below the form */}
<ComplaintPolicyPanel labels={labels} />
```

---

## Execution Order

Process files in dependency order (leaf components first):

1. `ComplaintsSearchBar.tsx` (simple, 1 extraction)
2. `ComplaintsMetricsRow.tsx` (simple, 1 extraction)
3. `ComplaintPolicyPanel.tsx` (3 extractions)
4. `ComplaintFormFields.tsx` (4 extractions)
5. `ComplaintQueueCardList.tsx` (2 extractions)
6. `ComplaintRecordCard.tsx` (many extractions)
7. `ComplaintRecordCardList.tsx` (6 extractions)
8. `ComplaintQueueCard.tsx` (most extractions, conditional props)
9. `ParentComplaintsMobileView.tsx` (2 extractions + comments)
10. `AdminComplaintsMobileView.tsx` (2 extractions + comments)
11. `ParentComplaintsDesktopView.tsx` (comments only)
12. `AdminComplaintsDesktopView.tsx` (comments only)

---

## Key Rules
- Use `import { styled } from "@mui/material/styles"` (not `import styled from ...`)
- Use `theme.spacing()` for numeric spacing values in `styled()`
- Use `shouldForwardProp` for any custom boolean props (e.g., `isUnanswered`, `isMobile`)
- Do NOT modify files outside `frontend/views/dashboard/complaints/`
- Do NOT change component behavior or props interfaces
- Preserve all existing functionality exactly
