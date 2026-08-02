# Research: Existing UI Patterns & Design System

## Source
Subagent: research-ui-patterns
Elapsed: 700s, 45 tool calls

## Key Findings

### Navigation Patterns
- `SIDEBAR_NAV_GROUPS` array of NavGroup objects filtered by permissions
- WhatsApp in `grp_integrations` group (labelKey: "navGroupIntegrations", iconKey: "hub")
- WhatsApp nav item: key="whatsapp-settings", href="/settings/whatsapp"
- WhatsApp hidden on mobile for teacher/parent/supervisor/student portals
- Mobile bottom nav is condensed; WhatsApp is admin-only mobile

### Two Tab Patterns
**Pattern A — URL-synced generic tabs** (Settings, Billing, etc.):
- GenericTabNav via ResponsiveViewSwitch
- URL sync via useSearchParams + router.replace
- Tab config in config files, filtered by permission
- Per-tab React.lazy + Suspense + RequirePermission
- SettingsTabPanels with code-splitting

**Pattern B — state-only tabs** (current WhatsApp):
- useState for activeTab (NOT URL-synced)
- WhatsappConfigLayout shared MUI Tabs
- Tab constants in whatsappConfig.constants.ts
- No per-tab Suspense or permission gating

### Recommended: Migrate WhatsApp to Pattern A
1. Add whatsapp tab IDs to a whatsappTabUrl.ts helper
2. Build WhatsappTabNav via GenericTabNav
3. Resolve active tab from useSearchParams
4. If DataGrid tab added, use createTabbedPanePanels + visitedTabs Zustand store

### Shared Components (frontend/common/components/ui/)
- StatusBadge (status chips — no inline Chip with hardcoded colors)
- AppDataGrid / DesktopAppDataGrid (required paginationOptions)
- MobileCardList + MobileCardListItem
- PageContainer / MobilePageContainer (no double-padding)
- PageHeader / MobilePageHeader
- SectionPanel / MobileSectionPanel
- FormSuccessSnackbar / FormErrorSnackbar (canonical snackbar pattern)
- MetricCard (+ variants, optional animated)
- DesktopPrimaryPageAction, FilterButton, ExportButton

### Theme (Material 3)
- Standard MUI families: primary, secondary, error, warning, info, success
- M3 siblings: onPrimary, onSecondary, etc.
- Custom: tertiary, header, footer, sidebar
- Status: pending, confirmed, active, completed, cancelled, blocked
- Tokens: theme.layout.radius.card (3), button (2), badge (3); sectionGap (1.5rem), cardPadding (1.5rem)
- Rules: NO hardcoded hex/RGB, NO contrastText, NO quoted color strings, use theme callback for theme values

### MUI v9
- Style props NOT valid on Typography, Stack, Box, Grid → use sx
- Icons: *Outline → *Outlined
- No FormEvent → React.SubmitEvent
- No console.* → use logger

### Animations
- framer-motion ^12.43.0 only used by MetricCard count-up feature
- MUI theme.transitions used sparingly (anti-autofill, toggle thumb, sidebar)
- No @keyframes defined in theme
- No tab panel enter/exit transitions
- Guidance: use theme.transitions.create() for micro-interactions; don't introduce framer-motion for WhatsApp

### Storybook
- No stories exist for settings pages or WhatsApp
- Existing stories: ProfileShell, PreferencesMatrix, AssignedStudentsTab, TeacherProfileEditForm, ParentProfileEditForm, StaffProfileView, StudentHistoryContainer
- Use StoryBookPageContainer from @/frontend/common/components/ui

### Feedback Pattern
- Replace custom WhatsappSnackbarState/NumbersSnackbar with shared FormSuccessSnackbar/FormErrorSnackbar
- Theme-compliant colors, theme.palette.onPrimary, theme.palette.shadow.card

### Quality Gate
- bun quality-gate: BASIC_CHECKS (tsgo, biome, lint) → CODESCENE → SONAR_SCAN → SONAR_RESULTS
- No nested ternary (SonarJS code smell)
