# Palette's Journal - Critical Learnings

## 2026-09-03 - Parity for Menu Trigger IconButtons Across Tiers
**Learning:** In responsive data grids and card lists, action menu trigger `IconButton` components must include `aria-label`, `aria-haspopup="true"`, and `aria-expanded={open}` so screen reader users know the button controls an expandable menu and whether it is open. Desktop tier components sometimes omit these attributes compared to mobile card equivalents.
**Action:** When inspecting tier components, ensure all row/card action `IconButton` triggers have proper ARIA attributes (`aria-label`, `aria-haspopup="true"`, `aria-expanded`).
