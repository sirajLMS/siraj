# Plan: Refactor TodayClassesMobileScroll from Box to Grid

## Goal
Refactor `TodayClassesMobileScroll.tsx` to use MUI Grid as the container instead of Box, and restructure sub-components using proper MUI Grid patterns.

## Current Structure Analysis
- **ScrollContainer**: Custom styled `div` with flex row, horizontal scroll, gap: 16
- **MetricContainer**: Styled `Box` with flex row, used for each metric card (minWidth: 180, flexShrink: 0)
- **MetricIconContainer**: Styled `Box` for icon display (circular, 40x40)
- **MetricCount**: Styled `Typography` for count display
- **MetricLabel**: Styled `Typography` for label display
- **Inner Box**: Wraps MetricCount and MetricLabel (line 95)

Current layout: Outer Grid container → Grid item xs={12} → ScrollContainer (div) → multiple MetricContainer (Box) → [MetricIconContainer, Box(MetricCount, MetricLabel)]

## Proposed Changes

### 1. Replace ScrollContainer
- Convert from styled `div` to styled `Grid` with `container` prop
- Keep horizontal scroll behavior but use Grid's flex capabilities
- Use `wrap="nowrap"` to prevent wrapping
- Maintain gap via Grid's `spacing` or `columnSpacing` prop

### 2. Replace MetricContainer
- Convert from styled `Box` to styled `Grid` item
- Use `size="auto"` for variable width content (each card auto-sizes to content)
- Keep all existing styling (border, bgcolor, borderRadius, etc.)
- Maintain flex row layout for icon + text side-by-side

### 3. Replace MetricIconContainer
- Convert from styled `Box` to styled `Grid` item
- Keep circular styling and dimensions

### 4. Replace inner Box (line 95)
- Convert to styled `Grid` container with `direction="column"` or use `Stack`
- Wraps MetricCount and MetricLabel vertically

### 5. Restructure component hierarchy
```
Grid container (ScrollContainer replacement)
  └─ Grid item (MetricContainer) - for each metric
       ├─ Grid item (MetricIconContainer)
       └─ Grid container/item (text wrapper)
            ├─ MetricCount (Typography)
            └─ MetricLabel (Typography)
```

## New Styled Components

### StyledScrollGrid
```tsx
const StyledScrollGrid = styled(Grid)(() => ({
  overflowX: "auto",
  scrollbarWidth: "none",
  minHeight: 128,
  "&::-webkit-scrollbar": { display: "none" },
  flexWrap: "nowrap",
}));
```
- Used as: `<StyledScrollGrid container columnSpacing={2}>`

### StyledMetricCard
```tsx
const StyledMetricCard = styled(Grid, {
  shouldForwardProp: prop => prop !== "isSelected",
})<{ isSelected: boolean }>(({ theme, isSelected }) => ({
  // Same styles as current MetricContainer
}));
```
- Used as: `<StyledMetricCard size="auto" isSelected={isSelected}>`

### StyledIconWrapper
```tsx
const StyledIconWrapper = styled(Grid, {
  shouldForwardProp: prop => prop !== "isError",
})<{ isError: boolean }>(({ theme, isError }) => ({
  // Same styles as current MetricIconContainer
}));
```
- Used as: `<StyledIconWrapper size="auto" isError={isError}>`

### StyledTextContainer
```tsx
const StyledTextContainer = styled(Grid)(({ theme }) => ({
  // Minimal wrapper, mainly for layout
}));
```
- Used as: `<StyledTextContainer container direction="column">`

## Files to Modify
- `frontend/views/dashboard/dashboard/components/TodayClassesMobileScroll.tsx`

## Implementation Steps
1. Import `Grid` (already imported) and remove `Box` from imports
2. Create `StyledScrollGrid` replacing `ScrollContainer`
3. Create `StyledMetricCard` replacing `MetricContainer`
4. Create `StyledIconWrapper` replacing `MetricIconContainer`
5. Create `StyledTextContainer` replacing inner Box
6. Update component JSX to use new Grid-based structure
7. Remove outer Grid wrapper (lines 78-79, 105-106) since StyledScrollGrid IS the container
8. Run quality gate to verify

## Key Considerations
- Grid v2 uses `size` prop instead of `xs/sm/md` for column widths
- `size="auto"` for content-based width (perfect for metric cards)
- Use `columnSpacing` for horizontal gap between cards
- `direction="row"` is default, `direction="column"` for text wrapper
- Keep all theme-based styling intact
- Maintain click handler and selection logic
- Horizontal scroll must work on mobile

## Testing
- Verify horizontal scroll works on mobile viewport
- Verify cards don't wrap to next line
- Verify selection styling works correctly
- Verify spacing between cards matches current (16px gap)
- Run `bun quality-gate` after changes
