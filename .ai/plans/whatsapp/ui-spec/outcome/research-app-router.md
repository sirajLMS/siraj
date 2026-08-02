# Research: Next.js App Router Patterns for Settings

## Source
Subagent: research-app-router
Elapsed: 422s, 23 tool calls

## Key Findings

### WhatsApp Page Structure
```
app/(dashboard)/settings/whatsapp/
  page.tsx          — Server Component
  loading.tsx       — NOT PRESENT (added at general settings level)
  error.tsx         — NOT PRESENT
```

### page.tsx Implementation
- Is a Server Component (no "use client")
- Uses `getLocale()` from @/shared/locale/server (cookie-based, NOT [locale] param)
- Uses `getServerUserContext()` for auth context
- Uses `requirePermissionForPage([AppPermission.WHATSAPP_VIEW])` for permission gate
- Returns `<WhatsappSettingsContainer />` with locale prop
- Generates metadata via `generateMetadata` with getTranslations

### Settings Layout Pattern (comparison)
- Main `/settings/page.tsx` uses loading.tsx + error.tsx
- Main settings page: server component fetches query params, renders SettingsPageContainer
- WhatsApp page: no loading.tsx or error.tsx at the whatsapp level

### Tab Routing Patterns
**Pattern A (URL-synced) — used by main settings page:**
- Server component reads searchParams (e.g., ?tab=security)
- Passes to client container
- Client uses useSearchParams + router.replace to sync tab to URL
- Allows deep-linking: /settings?tab=whatsapp

**Pattern B (state-only) — used by WhatsApp:**
- WhatsappConfigView uses `useState<TabId>(TAB_IDS[0])` 
- No URL sync
- No deep-linking capability
- Cannot share URL with specific tab selected

### Recommended Migration for WhatsApp
1. **Add loading.tsx**: `app/(dashboard)/settings/whatsapp/loading.tsx`
   - Export default skeleton/loader component
   - Uses PageContainer for consistent layout
   - Shows tab skeleton + content placeholder

2. **Add error.tsx**: `app/(dashboard)/settings/whatsapp/error.tsx`
   - "use client" error boundary
   - Uses theme palette for error display
   - Offers retry button via reset prop

3. **Migrate to URL-synced tabs**:
   - WhatsappConfigView reads `?tab=numbers|templates|optin` from URL
   - Uses `useSearchParams` + `router.replace` to sync tab changes
   - Validates tab param against TAB_IDS allowlist
   - Falls back to first tab if invalid/missing

4. **Drop ssr:false**:
   - Currently `createLazyView(..., { ssr: false })` in WhatsappConfigView
   - Pattern A settings pages don't use ssr:false
   - Remove ssr:false, keep lazy loading with Suspense fallback
   - Benefits: server-side render of initial tab, better SEO, no flash

5. **Per-tab Suspense**:
   - Each tab content wrapped in its own `<Suspense fallback={<TabSkeleton />}>`
   - Allows independent loading of tab content
   - Better UX: only loading affected tab, not entire page

6. **Per-tab RequirePermission**:
   - Each tab wrapped in `<RequirePermission permissions={TAB_PERMISSIONS[tabId]}>`
   - Numbers tab: WHATSAPP_MANAGE
   - Templates tab: WHATSAPP_TEMPLATES_MANAGE  
   - Opt-in tab: WHATSAPP_OPT_IN_MANAGE
   - Allows fine-grained access control per tab

7. **Server-side data prefetch** (future enhancement):
   - Server component can prefetch initial tab data
   - Pass as initialData to Apollo cache
   - Reduces client-side loading time

### Mobile vs Desktop
- WhatsApp uses createLazyView with platform-specific views
- Mobile-only query params should not be needed (tabs are same set)
- Mobile bottom nav handles navigation; tabs handle in-page navigation

### Route Table
| Path | Purpose | Permission | Server/Client |
|---|---|---|---|
| /settings/whatsapp | Main WhatsApp settings page | WHATSAPP_VIEW | Server (page.tsx) |
| /settings/whatsapp?tab=numbers | Numbers tab (deep-link) | WHATSAPP_VIEW | Synced via URL |
| /settings/whatsapp?tab=templates | Templates tab (deep-link) | WHATSAPP_VIEW | Synced via URL |
| /settings/whatsapp?tab=optin | Opt-in tab (deep-link) | WHATSAPP_VIEW | Synced via URL |

### Permission Matrix
| Tab | View Permission | Action Permission |
|---|---|---|
| numbers | WHATSAPP_VIEW | WHATSAPP_MANAGE (for CRUD) |
| templates | WHATSAPP_VIEW | WHATSAPP_TEMPLATES_MANAGE |
| optin | WHATSAPP_VIEW | WHATSAPP_OPT_IN_MANAGE |

### loading.tsx Template
```tsx
import { PageContainer } from "@/frontend/common/components/ui/PageContainer";
import { WhatsappTabSkeleton } from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappTabSkeleton";

export default function Loading() {
  return (
    <PageContainer>
      <WhatsappTabSkeleton />
    </PageContainer>
  );
}
```

### error.tsx Template
```tsx
"use client";
import { useEffect } from "react";
import { Button, Typography, Stack } from "@mui/material";
import { useAppTranslation } from "@/shared/locale/client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const t = useAppTranslation("whatsapp");
  useEffect(() => { logger.error("WhatsApp settings error:", error); }, [error]);
  return (
    <PageContainer>
      <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
        <Typography variant="h6" color="error">{t("errorGenericTitle")}</Typography>
        <Typography variant="body2" color="text.secondary">{t("errorGeneric")}</Typography>
        <Button variant="outlined" onClick={reset}>{t("retry")}</Button>
      </Stack>
    </PageContainer>
  );
}
```
