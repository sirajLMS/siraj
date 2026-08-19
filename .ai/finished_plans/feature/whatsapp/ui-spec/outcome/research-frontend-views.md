# Research: WhatsApp Frontend Views Inventory

## Source
Subagent: research-frontend-views
Elapsed: 762s, 39 tool calls

## Key Findings

### Architecture (4-tier)
```
Next page (SSR, server permission gate)
  └─ WhatsappSettingsContainer (client, RequirePermission gate)
      └─ WhatsappConfigView (holds activeTab state, lazy loads platform view)
          ├─ WhatsappConfigMobileView  ─┐
          └─ WhatsappConfigDesktopView  ─┴─ WhatsappConfigLayout (shared Tabs bar)
                                              └─ NumbersTab / TemplatesTab / OptInTab (per-platform)
```

### 20 Files Total
- **Common (12)**: WhatsappSettingsContainer, WhatsappConfigView, WhatsappConfigLayout, useWhatsappSettingsViewModel, whatsappConfig.constants, types/whatsappSettingsTypes, tabs/whatsappTabSharedProps, tabs/shared/NumberCard, tabs/shared/OptInTabContent, tabs/shared/TemplatesTabContent, tabs/shared/statusChipColor, tabs/components/NumbersSnackbar
- **Desktop (4)**: whatsappConfig.desktop, tabs/NumbersTab.desktop, tabs/OptInTab.desktop, tabs/TemplatesTab.desktop
- **Mobile (4)**: whatsappConfig.mobile, tabs/NumbersTab.mobile, tabs/OptInTab.mobile, tabs/TemplatesTab.mobile

### Production-Quality Gaps (severity-ranked)

| Severity | Finding |
|---|---|
| HIGH | No Create/Edit account form despite GraphQL docs, types, and labels being ready |
| HIGH | Templates not persisted — vanish after remount (only from sync mutation result) |
| HIGH | ~25 i18n labels defined but never rendered — chips show raw enum values |
| HIGH | No input validation on credential dialogs (PIN length, token shape) |
| HIGH | `WhatsappLimitTier.TIER_100K` exists but no matching i18n key |
| MEDIUM | DeleteConfirmDialog ALREADY EXISTS in NumbersTab.desktop.tsx:48-85, wired at :290-296, but is buggy — it doesn't render the account name. Must be repaired, not re-created. Mobile does not have one. |
| MEDIUM | statusChipColor (at tabs/shared/statusChipColor.ts) only handles TEMPLATE statuses (APPROVED/PENDING/REJECTED) — PAUSED/PENDING_DELETION/DISABLED template statuses fall to default. Account-level statuses (quality rating, tier, throughput) are rendered as raw enum values in NumberCard.tsx without any status chip mapping. |
| MEDIUM | Mobile delete has no confirmation dialog (desktop does) |
| MEDIUM | Snackbar severity limited to success/error |
| MEDIUM | displayName?.en hardcoded — no RTL/localized fallback |
| MEDIUM | No per-row delete/sync loading indicator; no optimistic updates |
| MEDIUM | No deep-linking of active tab to URL query |
| MEDIUM | Only 1 test file (VM Q3.1–Q3.6) — no component-render tests, no mutation tests |
| LOWER | No animations/transitions for tab switch, sync, delete, opt-in toggle |
| LOWER | Coexistence/unverified warning labels defined but unreferenced |
| LOWER | Menu only exposes Edit Token/Edit Pin — no toggle active/inactive |
| LOWER | Permission fallback={null} silent hide — no "unauthorized" UI |
| LOWER | Dead types: WhatsappAccountFormValues/ApiFormValues/CredentialFormValues declared but unused |
| LOWER | Snackbar bottom-center may overlap mobile bottom nav |

### What's Complete
- Clean navigationConfig integration (grp_integrations, whatsapp-settings item)
- Server-side page mount with permission gate + metadata
- ResponsiveViewSwitch + createLazyView with ssr:false
- Shared layout, tab contents, NumberCard, NumbersSnackbar
- whatsappConfig.constants.ts single source of truth
- ViewModel with typed contract + useCallback memoized handlers
- Apollo refetch + structured error logging
- Snackbar feedback on all mutation paths
- Empty states for accounts and templates
- Loading states (query spinner, syncing button, opt-in loading, dialog submitting)
- Full EN + AR locale translations (~76/~76 keys)
- Baseline ViewModel unit tests
