# Plan: Migrate Next.js Navigation to next-intl

## Goal
Replace all `next/navigation` and `next/link` imports with the next-intl equivalents from `@/shared/i18n/routing`, update `redirect()` call signatures for the next-intl API, remove `frontend/utils/routes.ts` and inline its consumers.

## Context

`shared/i18n/routing.ts` already exports: `Link`, `redirect`, `usePathname`, `useRouter` (via `createNavigation`).

With `localePrefix: "never"`, next-intl automatically handles locale in routing — code should **not** manually prepend `/${locale}/` to paths when using the next-intl navigation APIs.

## Key API Differences

### `redirect()` signature change (CRITICAL)
- **Before (next/navigation)**: `redirect("/ar/login")` — plain string path with locale
- **After (next-intl)**: `redirect({ href: "/login", locale: "ar" })` — object with `href` (without locale prefix) and `locale`
- This is a breaking change in server components (`app/` files)

### `useRouter` and `router.push()` (client components)
- With `localePrefix: "never"`, next-intl's `useRouter` automatically handles locale
- **Before**: `router.push(\`/${locale}/teachers/${id}/profile\`)`  
- **After**: `router.push(\`/teachers/${id}/profile\`)` — remove the `/${locale}` prefix since next-intl handles it

### `Link` component
- **Before**: `<Link href="/ar/about">` or `<Box component={Link} href="/ar/about">`  
- **After**: `<Link href="/about">` — no locale prefix needed, next-intl handles it

### `usePathname`
- **Before (next/navigation)**: Returns `/ar/dashboard`  
- **After (next-intl)**: Returns `/dashboard` — locale prefix already stripped

### What stays on `next/navigation`
- `useServerInsertedHTML` — next-intl doesn't wrap this; stays as-is (only in `emotion-cache.tsx`)
- `useSearchParams` — next-intl's `createNavigation` does NOT export this; stays on `next/navigation`
- `useParams` — next-intl's `createNavigation` does NOT export this; stays on `next/navigation`

## Step 1: Update `shared/i18n/routing.ts`

No changes needed to exports — already has `Link`, `redirect`, `usePathname`, `useRouter`. The `useParams` and `useSearchParams` are NOT provided by `createNavigation` and should stay on `next/navigation`.

## Step 2: Modify codemod script (`scripts/codemod-navigation.ts`)

The existing codemod handles import swapping but has gaps:

1. **Remove `useParams` and `useSearchParams` from `KEEP_FROM_NEXT_NAV`** — NO, these should stay on `next/navigation` since next-intl doesn't export them. Keep as-is.

2. **Update `ROUTING_IMPORTS`** — already correct: `["useRouter", "usePathname", "redirect", "Link"]`

3. **Add: Replace `router.push(\`/${locale}/...\`)` calls** — strip `/${locale}` prefix from `router.push()` string arguments since next-intl handles locale automatically. This requires parsing the locale variable usage.

4. **Add: Replace `<Link href={\`/${locale}/...\`}>` and `href={\`/${locale}/...\`}` patterns** — strip locale prefix from Link href props.

5. **Add: Update `redirect()` signature in server components** — change `redirect("/ar/login")` to `redirect({ href: "/login", locale: "ar" })`. This is complex because locale may be a variable.

6. **Add: Update `redirect()` calls in client components using routing's redirect** — same signature change.

7. **Add: Handle `styled(Link)` pattern** — the codemod's `handleNextLinkImport` already handles `import Link from "next/link"`, but some files use `styled(Link)` which needs the default import. The next-intl `Link` is a named export, so `styled(Link)` with named import should still work.

8. **Add: Handle `component={Link}` pattern** — `Box component={Link}` works the same with named import.

9. **Add: Remove `frontend/utils/routes` imports and inline path logic** — or replace with `getPathname` from routing.

10. **Skip directories**: Add `frontend/graphql/generated`, `test` to skip list.

### Codemod changes detail for `redirect()` migration

For server component files (files without `"use client"` that use `redirect`):

```ts
// Before:
redirect(`/${locale}/login`);
// After:
redirect({ href: "/login", locale });
```

```ts
// Before:
redirect(`/${locale}/dashboard?mode=teacher`);
// After:
redirect({ href: "/dashboard?mode=teacher", locale });
```

For link href patterns in client components:

```ts
// Before:
href={`/${locale}${item.href}`}
// After:
href={item.href}
```

```ts
// Before:
router.push(`/${locale}/teachers/${row.id}/profile`);
// After:
router.push(`/teachers/${row.id}/profile`);
```

## Step 3: Run the codemod

```bash
bun run scripts/codemod-navigation.ts
```

## Step 4: Manual fixes for edge cases the codemod can't handle

These files need manual review after running the codemod:

### Server components — `redirect()` signature change

| File | Current | Target |
|------|---------|--------|
| `app/[locale]/page.tsx` | `redirect(\`/${locale}/login\`)` | `redirect({ href: "/login", locale })` |
| `app/[locale]/(dashboard)/layout.tsx` | `redirect(\`/${locale}/login\`)` | `redirect({ href: "/login", locale })` |
| `app/[locale]/(dashboard)/teachers/dashboard/page.tsx` | `redirect(\`/${locale}/dashboard?mode=teacher\`)` | `redirect({ href: "/dashboard?mode=teacher", locale })` |
| `app/[locale]/(dashboard)/teachers/dashboard/active/page.tsx` | `redirect(\`/${locale}/dashboard?mode=teacher-active\`)` | `redirect({ href: "/dashboard?mode=teacher-active", locale })` |
| `app/[locale]/(dashboard)/complaints/page.tsx` | `redirect(\`/${locale}/login\`)` and `redirect(\`/${locale}\`)` | `redirect({ href: "/login", locale })` and `redirect({ href: "/", locale })` |

### Client components — remove `/${locale}` from `router.push()` and `Link href`

| File | Pattern |
|------|---------|
| `useDashboardLayoutProps.ts` | `router.push(\`/${locale}${href}\`)` → `router.push(href)` |
| `TeacherCardList.tsx` | Two `router.push(..locale..)` calls |
| `TeacherDashboardContainer.tsx` | `router.push(\`/${locale}/schedule\`)` |
| `RescheduleContainer.tsx` | Two `router.push(..locale..)` calls |
| `RescheduleTrackingContainer.tsx` | `router.push(..locale..)` |
| `ScheduleOverviewCardList.tsx` | `router.push(..locale..)` |
| `UnpaidInvoicesSection.tsx` | `router.push(..locale..)` |
| `DashboardErrorView.tsx` | `router.push(..locale..)` |
| `CreateRecurringClassContainer.tsx` | Two `router.push(..locale..)` calls |
| `ClassDetailsContainer.tsx` | Three `router.push(..locale..)` calls |
| `ClassAuditContainer.tsx` | Two `router.push(..locale..)` calls |
| `ManualInvoiceContainer.tsx` | `router.push(..locale..)` |
| `AdminBillingContainer.tsx` | `router.push(..locale..)` |
| `ReportsContainer.tsx` | `router.push(teacherProfilePath(..))` |
| `SidebarShell.tsx` | `href={\`/${locale}${item.href}\`}` → `href={item.href}` |
| `BottomNavbar.tsx` | `href={\`/${locale}${item.href}\`}` → `href={item.href}` |
| `EntityLinks.tsx` | `href={\`/${locale}/students/${studentId}\`}` → `href={\`/students/${studentId}\`}` |
| `ClassInfoCard.tsx` | Similar locale-prefixed Link hrefs |
| `StudentProfileCard.tsx` | Similar |
| `DashboardLayoutPreview.tsx` | Link with locale prefix |
| `ScheduleOverviewDataGrid.styles.tsx` | Uses `styled(Link)` — needs named import change |

### `useDashboardLayoutProps.ts` — `usePathname` change

```ts
// Before (next/navigation usePathname):
const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/dashboard";
// After (next-intl usePathname already strips locale):
const activeNavKey = sidebarItems.find(item => pathname.startsWith(item.href))?.key ?? "home";
```

### `useLanguageSwitch.ts` — switch `useRouter` import

```ts
// Before:
import { useRouter } from "next/navigation";
// After:
import { useRouter } from "@/shared/i18n/routing";
```

No `router.push()` calls that include locale (only `router.refresh()`), so no path changes needed.

## Step 5: Remove `frontend/utils/routes.ts`

Only one consumer: `ReportsContainer.tsx` imports `studentStatusPath` and `teacherProfilePath`. Replace:

```ts
// Before:
import { studentStatusPath, teacherProfilePath } from "@/frontend/utils/routes";
router.push(teacherProfilePath(locale, row.entityId));
router.push(studentStatusPath(locale, row.entityId));

// After:
router.push(`/teachers/${row.entityId}/profile`);
router.push(`/students/${row.entityId}/status`);
```

Then delete `frontend/utils/routes.ts`.

## Step 6: Update `useDashboardLayoutProps.ts` — `handleNavigate` simplification

```ts
// Before:
const handleNavigate = (href: string) => {
  router.push(`/${locale}${href}`);
};

// After: 
const handleNavigate = (href: string) => {
  router.push(href);
};
```

## Step 7: Update Styled Link patterns

`ScheduleOverviewDataGrid.styles.tsx` uses `styled(Link)`. After import change, the styled component should work the same since the `Link` component is compatible. However, the `import Link from "next/link"` default import needs to become a named import:

```ts
// Before:
import Link from "next/link";
// After:
import { Link } from "@/shared/i18n/routing";
```

Same for all 7 files that use `import Link from "next/link"`.

## Step 8: Update test mocks

Test files that mock `next/navigation` need updating:

| File | Mock | Change |
|------|------|--------|
| `UnpaidInvoicesSection.test.tsx` | `useParams: () => ({ locale: "en" })` | Keep — `useParams` stays on `next/navigation` |
| `SearchScheduleContainer.test.tsx` | `useParams: () => ({ locale: "en" })` | Keep |
| `ScheduleOverviewSection.test.tsx` | `useParams: () => ({ locale: "ar" })` | Keep |
| `ScheduleOverviewDataGrid.test.tsx` | `useParams: () => ({ locale: "ar" })` | Keep |
| `NotificationPanel.test.tsx` | `useParams: () => ({ locale: "en" })` | Keep |

Tests mocking `useRouter` or `usePathname` from `next/navigation` must mock them from `@/shared/i18n/routing` instead. Need to verify each test file.

## Step 9: Verify with `bun run tsgo` and `bun run lint`

After all changes, run type checking and linting to catch any missed conversions or signature mismatches.

## Execution Order

1. Update the codemod script to handle all patterns
2. Run codemod for import replacements (the automated part)
3. Manually fix `redirect()` signatures in all server components (5 files)
4. Manually remove `/${locale}/` prefixes from all `router.push()`, `Link href`, and `styled(Link)` href values (~20 files)
5. Update `useDashboardLayoutProps.ts` pathname logic  
6. Remove `routes.ts` usage and delete the file
7. Update test mocks for routing import changes
8. Run `tsgo` and `lint`, fix any remaining issues
9. Final `quality-gate` run

## Files Modified (Summary)

**Codemod-automated (imports only):**
- ~19 files with `next/navigation` → `@/shared/i18n/routing` imports for `useRouter`/`usePathname`/`redirect`
- ~7 files with `import Link from "next/link"` → `import { Link } from "@/shared/i18n/routing"`

**Manual changes:**
- 5 server component files: `redirect()` signature change
- ~15 client component files: strip `/${locale}/` from `router.push()` and `Link href`
- 1 file: `useDashboardLayoutProps.ts` pathname logic update
- 1 file: `useLanguageSwitch.ts` import change
- 1 file: `ReportsContainer.tsx` routes.ts removal
- Delete: `frontend/utils/routes.ts`
- Test mock updates as needed
