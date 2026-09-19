# CGVS Project Analysis: i18n, Theme & Shared Infrastructure

## Executive Summary

This document provides a comprehensive analysis of the CGVS project's shared infrastructure at `/home/ahmed/Projects/cgvs/`, covering the i18n system, theme architecture, client contexts, custom table system, layout, shared libraries, input components, and key dependencies. The CGVS project is a **Next.js 15.5.4** (NOT 16) application using **React 19.2**, **MUI v7.3.4** (NOT v9), **Apollo Client v4**, and **Zustand v5**. The project is Arabic-first with RTL as the default direction.

---

## 1. i18n System

### Architecture: Runtime Translation (NOT Compile-Time)

The i18n system is a **runtime** translation system — translations are stored in plain TypeScript objects and selected at runtime via a React hook. This is fundamentally different from Siraj's compile-time TypeScript i18n system.

### Core Files

| File | Purpose |
|------|---------|
| `client/locale/AppLanguage.ts` | Language enum |
| `client/locale/translations.ts` | Central translation map `Record<AppLanguage, Translations>` |
| `client/locale/useAppTranslation.ts` | Runtime translation hook |
| `client/locale/index.ts` | Barrel exports |
| `client/locale/ar/*.ts` | 14 Arabic translation namespace files |
| `client/locale/components/*.ts` | 14 TypeScript type definition files for each namespace |
| `client/locale/table/TableLocaleContext.tsx` | Separate table-specific locale system |

### Language Enum

```typescript
enum AppLanguage {
  default = "ar",
  // English commented out — Arabic-only currently
}
```

Only Arabic is active. The `default` value is `"ar"`.

### Translation Hook

```typescript
function useAppTranslation<N extends keyof Translations>(namespace: N): Translations[N] {
  const { language } = useAppTheme(); // Gets language from ThemeContext
  const ts = translations[language];
  return ts[namespace];
}
```

The hook:
1. Reads `language` from `useAppTheme()` (ThemeContext)
2. Looks up `translations[language][namespace]`
3. Returns the typed translation object for that namespace

### Translation Namespaces (14 total)

| Namespace | Type File | Description |
|-----------|-----------|-------------|
| `headerTranslations` | `header.ts` | Header UI: profile, preferences, logout, theme settings, account settings |
| `authTranslations` | `auth.ts` | Auth: login, email, password, signIn, welcome, error messages |
| `calendarTranslations` | `calendar.ts` | Calendar: Gregorian/Hijri month names, day/month/year labels, date |
| `countryTranslations` | `country.ts` | Country names (ISO codes → Arabic names), selectCountry |
| `genderTranslations` | `gender.ts` | Gender: title, male, female |
| `languageTranslations` | `language.ts` | Language names: ar, arShort, selectLanguage |
| `templateCategoryTranslations` | `templateCategory.ts` | Template category CRUD labels |
| `errorTranslations` | `error.ts` | Error messages: generic, loginFailed, networkError, sessionExpired, refreshTokenFailed |
| `studentTranslations` | `student.ts` | Student fields: name, email, gender, phone, country, birthDate, actions |
| `templateVariableTranslations` | `templateVariable.ts` | Template variable fields: name, type, description |
| `recipientTranslations` | `recipient.ts` | Recipient fields: name, email, student, actions, add, edit |
| `recipientGroupTranslations` | `recipientGroup.ts` | Recipient group fields |
| `storageTranslations` | `storage.ts` | File storage with nested sub-namespaces: uploading, management, ui, dropzone. Interpolation: `%{count}`, `%{fileName}` |
| `connectivityTranslations` | `connectivity.ts` | Network: connected, disconnected, checkingConnection, lastChecked, clickToRetry |

### Interpolation Syntax

Uses `%{paramName}` pattern:
```typescript
uploading: (count: number) => `جاري تحميل %{count} ملف`,
dropzone: {
  fileRejected: (fileName: string) => `تم رفض الملف %{fileName}`,
}
```

### Storage Translations (Nested Sub-namespaces)

The `storageTranslations` namespace has a unique structure with nested sub-namespaces:
```typescript
interface StorageTranslations {
  uploading: {
    title: string;
    uploadingFiles: (count: number) => string; // %{count} interpolation
    uploaded: string;
    failed: string;
    canceled: string;
    waiting: string;
  };
  management: {
    title: string;
    // ... CRUD labels
  };
  ui: {
    dragDrop: string;
    browse: string;
    // ... various labels
  };
  dropzone: {
    dropHere: string;
    fileRejected: (fileName: string) => string; // %{fileName} interpolation
    // ... dropzone-specific messages
  };
}
```

### Translation Type System

Each namespace has a corresponding type definition file in `client/locale/components/`. These define the TypeScript interface for the translation keys, ensuring type safety when accessing translation strings. The types are exported from `client/locale/index.ts` and imported by components.

### Locale File Structure

```
client/locale/
├── AppLanguage.ts          # Language enum
├── translations.ts          # Central Record<AppLanguage, Translations>
├── useAppTranslation.ts     # Runtime hook
├── index.ts                 # Barrel exports
├── ar/                      # Arabic translations (14 files)
│   ├── header.ts
│   ├── auth.ts
│   ├── calendar.ts
│   ├── country.ts
│   ├── gender.ts
│   ├── language.ts
│   ├── templateCategory.ts
│   ├── error.ts
│   ├── student.ts
│   ├── templateVariable.ts
│   ├── recipient.ts
│   ├── recipientGroup.ts
│   ├── storage.ts
│   └── connectivity.ts
├── components/              # Type definitions (14 files)
│   ├── header.ts
│   ├── auth.ts
│   ├── ... (mirrors ar/ structure)
└── table/                   # Separate table locale system
    ├── TableLocaleContext.tsx
    ├── defaultTableLocales.ts
    └── tableLocale.types.ts
```

### Table Locale System (Separate)

The Table has its own locale system, separate from the main i18n:

```typescript
interface TableLocale {
  sort: { asc, desc, sortDirection, sort, unsort };
  filter: { title, operation, value, apply, clear, cancel };
  textFilterOps: { contains, equals, startsWith, endsWith, notContains, isEmpty, isNotEmpty };
  numberFilterOps: { equals, notEquals, greaterThan, lessThan, greaterThanOrEqual, lessThanOrEqual, isEmpty, isNotEmpty };
  dateFilterOps: { is, isNot, before, after, between, isEmpty, isNotEmpty, from, to };
  pagination: { rowsPerPage, displayedRows: (count: number) => string, rowsSelected: (count: number) => string };
  general: { loading, noData, error };
  selection: { selectAll, selectAllFiltered, clearSelection };
  column: { resize, hide, pinLeft, pinRight, unpin, autosize, showColumnManager, visibility };
}
```

- Supports deep merge of custom strings via provider
- Has both `en` and `ar` default locales
- Pagination strings use function types for dynamic count display

---

## 2. RTL Support

### Dual RTL Implementation

CGVS uses **both** RTL mechanisms simultaneously:

#### 1. Emotion (stylis-plugin-rtl)
```typescript
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";

const rtlCache = createCache({ key: "muirtl", stylisPlugins: [rtlPlugin] });
const ltrCache = createCache({ key: "muiltr" });
```

Used via `<CacheProvider value={isRtl ? rtlCache : ltrCache}>` in `ThemeContext`.

#### 2. JSS (jss-rtl)
```typescript
import { jssPreset } from "@mui/styles";
import rtl from "jss-rtl";

const jss = create({ plugins: [...jssPreset().plugins, rtl] });
```

Used via `<StylesProvider jss={jss}>` in `ThemeContext`.

### Pre-built Themes

Four theme variants are pre-built:
- `rtlLightTheme`
- `rtlDarkTheme`
- `ltrLightTheme`
- `ltrDarkTheme`

Theme direction is set via `createAppTheme(mode, direction)` where direction is `"rtl"` or `"ltr"`.

### Root HTML

```tsx
<html lang="ar" dir="rtl">
```

The root layout in `app/layout.tsx` hardcodes Arabic and RTL.

### RTL-aware Components

Several components check RTL:
- `ResizeHandle` — positions handle on left (RTL) vs right (LTR): `[isRtl ? "left" : "right"]: "0px"`
- `ColumnHeaderCell` — resize direction awareness
- Input components use `dir="rtl"` on HTML inputs where needed

---

## 3. Language Switching

### LanguageSwitcher Component (`client/components/common/LanguageSwitcher.tsx`)

- Uses `useAppTheme()` to get `language` and `setLanguage`
- Renders an `IconButton` with `Translate` icon
- Opens a `Popover` with language options
- Currently only Arabic is listed (English commented out in enum)
- Each option shows short label + full label
- Selected language highlighted with `action.selected` background

### LanguageSelector Component (`client/components/input/LanguageSelector.tsx`)

- Autocomplete-based language dropdown
- Uses `language-icons` from unpkg CDN for flag icons (`https://unpkg.com/language-icons/icons/${option}.svg`)
- Options sourced from `Object.values(AppLanguage)`
- Used in forms for explicit language selection

---

## 4. Theme System

### Theme Modes

```typescript
enum ThemeMode {
  Light = "light",
  Dark = "dark",
  System = "system",
}
```

- Default: `ThemeMode.Dark`
- `System` mode listens to `matchMedia("(prefers-color-scheme: dark)")`
- Theme and language persisted in `localStorage`

### Theme Creation (`client/theme/index.ts`)

```typescript
function createAppTheme(mode: ThemeMode, direction: "rtl" | "ltr"): Theme {
  const baseTheme = createTheme({
    direction,
    palette: { mode: isDark ? "dark" : "light", primary: {...}, secondary: {...} },
    // Custom palette extensions
    palette: {
      onPrimary: "#ffffff",    // Material 3 on-color
      onSecondary: "#ffffff",
      onBackground: "#121212",
      customTable: {
        oddRow: "rgba(0,0,0,0.02)",
        evenRow: "rgba(0,0,0,0.04)",
      },
    },
  });
  return baseTheme;
}
```

### Custom Palette Extensions

- `theme.palette.onPrimary` — Material 3 on-color for contrast text on primary
- `theme.palette.onSecondary` — Material 3 on-color for secondary
- `theme.palette.onBackground` — on-color for background
- `theme.palette.customTable.oddRow` — alternating row color (odd)
- `theme.palette.customTable.evenRow` — alternating row color (even)

### CssBaseline Overrides

Custom scrollbar styling in CssBaseline:
- WebKit scrollbar: 8px width, rounded, primary color thumb
- Firefox scrollbar: thin, primary color

### MUI Locale

```typescript
import { arSD } from "@mui/x-data-grid/locales";
components: { MuiDataGrid: { defaultProps: { localeText: arSD } } }
```

Arabic (Sudan) locale applied to MUI x-data-grid components.

### ThemeContext (`client/contexts/ThemeContext.tsx`)

The `AppThemeProvider`:
1. Manages `themeMode` (Light/Dark/System) and `language` (AppLanguage) in state
2. Persists both to `localStorage`
3. Listens to `matchMedia` for system theme changes
4. Computes `isDark` and `isRtl` derived values
5. Wraps children in:
   - `<StylesProvider jss={jss}>` (JSS-RTL)
   - `<CacheProvider value={cache}>` (Emotion RTL)
   - `<ThemeProvider theme={activeTheme}>`
   - `<CssBaseline />`

### ThemeSwitcher Component (`client/components/common/ThemeSwitcher.tsx`)

- Three options: Light, Dark, System (with icons)
- Shows current mode icon on button
- Uses `headerTranslations` for labels (themeLight, themeDark, themeSystem, themeSettings)

---

## 5. Client Contexts (Provider Nesting)

### Nesting Order (`client/components/ClientProviders.tsx`)

```
AppThemeProvider
  └── NotificationsProvider (@toolpad/core)
        └── AppApolloProvider
              └── AuthProvider
                    └── {children}
```

### AppThemeProvider (`client/contexts/ThemeContext.tsx`)
- Provides: `themeMode`, `setThemeMode`, `isDark`, `language`, `setLanguage`, `isRtl`, `theme`
- Wraps with `StylesProvider`, `CacheProvider`, `ThemeProvider`, `CssBaseline`

### NotificationsProvider
- From `@toolpad/core` — provides `useNotifications()` for snackbars/toasts
- Used in Dashboard for online/offline notifications

### AppApolloProvider (`client/contexts/AppApolloProvider.tsx`)
- Provisions Apollo Client with:
  - **Auth link**: attaches JWT from in-memory state (NOT localStorage)
  - **Connectivity check link**: checks server before rendering children
  - **Error link**: handles auth errors, token refresh
  - **Persisted query link**: `sha256` hash-based persisted queries
  - **HTTP link**: sends credentials (httpOnly cookies for refresh tokens)
- **Network connectivity**: Uses `useNetworkConnectivity()` hook, exposes `isConnected`, `isChecking`, `checkConnectivity`, `lastChecked`
- Auth token stored in **React state only** (memory) — never persisted
- Refresh tokens via **httpOnly cookies** (secure)

### AuthProvider (`client/contexts/AuthContext.tsx`)
- `login()`, `logout()`, `refreshToken()` via GraphQL mutations
- `user` state, `isAuthenticated` derived
- Loading UI during auth operations
- httpOnly cookie-based sessions

### ProtectedRoute (`client/components/ProtectedRoute.tsx`)
- Auth guard component
- Redirects to `/login` if not authenticated

---

## 6. Zustand Pattern

### Navigation State Store (`client/views/dashboard/layout/useNavigationStateStore.ts`)

```typescript
interface NavigationStateStore {
  pageStates: Record<string, PageState>;           // pathname -> { params, timestamp }
  lastVisitedChildren: Record<string, string>;     // parent path -> last child path
  savePageState: (pathname, params) => void;
  saveLastVisitedChild: (parentPath, childPath) => void;
  restorePageState: (pathname) => string | null;
  restoreLastVisitedChild: (parentPath) => string | null;
  clearPageState: (pathname) => void;
  clearLastVisitedChild: (parentPath) => void;
  clearAllStates: () => void;
}
```

Key characteristics:
- Uses `zustand/middleware` `persist` + `createJSONStorage`
- Persisted to **`sessionStorage`** (not localStorage)
- `partialize` to only persist state data, not actions
- Named `"navigation-state-store"` in storage

### Pattern Summary
- Stores are singletons created with `create<T>()(persist(...))`
- Actions defined inline in the create function
- State and actions co-located in the same store
- `partialize` used to exclude actions from persistence

---

## 7. Custom Table System

### Overview

A fully custom table system built from scratch — **NOT** using MUI DataGrid. The system is split across 22+ files and uses 4 React Contexts for state management.

### Architecture

```
TableContext (root provider)
  ├── TableRowsContext   (row selection, heights, infinite scroll)
  ├── TableColumnContext (column widths, visibility, pinning, autosize)
  └── TableDataContext   (sorting, filtering, cell editing)
```

### Four Contexts

#### 1. TableContext (Root Provider - `Table/TableContext.tsx`)
- Receives: `data`, `columns`, `pageInfo`, `pageSize`, pagination callbacks
- Nests the three sub-providers

#### 2. TableRowsContext (`Table/TableRowsContext.tsx`)
- **Row selection**: supports external (controlled) or internal state
- **Per-page select-all**: preserves cross-page selections
- **Row heights**: configurable per-row height
- **Infinite scroll**: `loadMore` callback, loading indicator
- **Row styling**: `getRowStyle` callback

#### 3. TableColumnContext (`Table/TableColumnContext.tsx`)
- **Column widths**: persisted to `localStorage` via `widthStorageKey`
- **Column visibility**: show/hide individual columns
- **Column pinning**: sticky left/right positioning
- **Autosize**: DOM-based measurement for automatic width
- **Width persistence**: per-column localStorage with storage key

#### 4. TableDataContext (`Table/TableDataContext.tsx`)
- **Sorting**: multi-column support, ASC → DESC → remove toggle cycle
- **Filtering**: 3 typed filter systems (text, number, date)
- **Cell editing**: per-cell edit state, virtualization-safe save/restore

### Rendering Structure

The Table renders header and body as **separate `<table>` elements** with synchronized horizontal scroll:
```html
<div class="table-container">
  <table class="table-header"> <!-- sticky header -->
    <colgroup> <!-- fixed column widths --> </colgroup>
    <thead> ... </thead>
  </table>
  <div class="table-body-scroll">
    <table class="table-body">
      <colgroup> <!-- same fixed column widths --> </colgroup>
      <tbody> ... </tbody>
    </table>
  </div>
  <div class="table-footer"> <!-- pagination --> </div>
</div>
```

- `tableLayout: "fixed"` via CSS
- Column widths managed through `<colgroup><col>` elements
- Horizontal scroll synchronized between header and body

### Row Features
- `DataRow` is **React.memo'd**
- `DataCell` is **React.memo'd**
- Alternating row colors: `theme.palette.customTable.evenRow` / `oddRow`
- Row selection checkbox per row
- Row resize handle

### Cell Editing
- Double-click to edit
- Inline editors: TextField, Select, Autocomplete, MuiTelInput (for phone)
- Validation via `column.getIsValid`
- Commit on Enter or blur
- Cancel on Escape
- Virtualization-safe: saves/restores edit state when scrolled out and back

### Cell Content Rendering (`TableBody/CellContentRenderer.tsx`)

Type-specific renderers:
- **SelectViewRenderer**: renders select-type columns with option labels
- **CountryViewRenderer**: renders country codes with flag images from `flagcdn.com`
- **PhoneEditRenderer**: uses `MuiTelInput` for phone number editing
- **DefaultViewRenderer**: plain text rendering

### Column Header Features

#### ColumnHeaderCell (`TableHeader/ColumnHeaderCell.tsx`)
- Sort icon (click to toggle sort)
- Filter icon with badge (indicates active filter)
- Column options menu trigger
- Resize handle (RTL-aware)
- React.memo'd

#### ColumnOptionsMenu (`TableHeader/ColumnOptionsMenu.tsx`)
- Pin left / Pin right / Unpin
- Autosize column
- Hide column
- Show column manager (opens ColumnVisibilityPanel)

#### ResizeHandle (`TableHeader/ResizeHandle.tsx`)
- RTL-aware positioning: `left: 0` for RTL, `right: 0` for LTR
- Mouse and touch event support
- Visual feedback: changes color to `primary.main` while resizing
- Events: `onMouseDown`, `onTouchStart` → `onResize` callback
- Global `mouseup`/`touchend` listeners on window to handle end-of-resize

### Filtering System

#### Three Typed Filter Popovers

1. **TextFilterPopover** (`TextFilterPopover.tsx`)
   - Operations: contains, equals, startsWith, endsWith, notContains, isEmpty, isNotEmpty
   - Text input field
   - `operationRequiresValue` helper: isEmpty/isNotEmpty don't need a value

2. **NumberFilterPopover** (`NumberFilterPopover.tsx`)
   - Operations: equals, notEquals, greaterThan, lessThan, greaterThanOrEqual, lessThanOrEqual, isEmpty, isNotEmpty
   - Number input field
   - Validation: must be a valid number for value-requiring operations

3. **DateFilterPopover** (`DateFilterPopover.tsx`)
   - Operations: is, isNot, before, after, between, isEmpty, isNotEmpty
   - Single date input (for most operations) or dual date inputs (for `between`)
   - Native HTML date input (`type="date"`)
   - `between` shows from/to date fields

#### Filter Types (`client/types/filters.ts`)
```typescript
interface FilterClause<T, OpType> {
  columnId: string;
  operation: OpType;
  value?: T;
}
```
- `TextFilterOperation` enum
- `NumberFilterOperation` enum
- `DateFilterOperation` enum
- `DateFilterValue`: `{ from?: string; to?: string }`
- `operationRequiresValue(op)`: returns false for isEmpty/isNotEmpty operations

### Column Visibility Panel (`Table/ColumnVisibilityPanel.tsx`)
- Dialog with checkbox list
- Show/hide individual columns
- "Select All" checkbox with indeterminate state (via `getSelectAllCheckboxState`)

### Table Footer (`TableFooter/TableFooter.tsx`)
- Wraps MUI `TablePagination`
- Uses table locale strings for labels
- Compact mode support
- Custom footer content support

### Table Locale (`TableLocaleContext.tsx`)
- Separate from main i18n
- Provider accepts `customStrings` for deep merge
- Both `en` and `ar` default locales
- Function-type strings for `displayedRows(count)` and `rowsSelected(count)`

---

## 8. Date Utilities

### `client/utils/dateUtils.ts`

```typescript
function formatDate(date: Date | null, format?: string): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", { ... }).format(date);
}
```

- Simple implementation using `Intl.DateTimeFormat`
- Hardcoded `"en-US"` locale

### Hijri Calendar Support

**`moment-hijri`** is a dependency (v3.0.0 in package.json).

The `DateScrollPicker` component (`client/components/input/DateScrollPicker.tsx`) provides full Hijri/Gregorian calendar support:

```typescript
import moment from "moment-hijri";
import { Calendar } from "@/lib/enum";

// Calendar enum: Gregorian | Hijri
// Component allows switching between calendars
// Uses moment-hijri methods: iYear(), iMonth(), iDate(), iDaysInMonth()
// Gregorian: moment().year(), .month(), .date(), .daysInMonth()
// Hijri: moment().iYear(), .iMonth(), .iDate(), moment.iDaysInMonth()
```

Features:
- Calendar toggle (Gregorian ⇄ Hijri) via ButtonGroup
- Day/Month/Year selection via TextField + Menu (scrollable dropdown)
- Month names localized via `calendarTranslations` (both Gregorian and Hijri names)
- Date boundaries: min 1941-01-01, max 2075-12-31 (Gregorian)
- Over-flow handling: if day > daysInMonth, rolls to next month
- Input blur validation: resets to current date if invalid

### Calendar Enum (`lib/enum.ts`)
```typescript
enum Calendar {
  Gregorian = "gregorian",
  Hijri = "hijri",
}
```

---

## 9. Error Handling

### Client-Side Error Utilities (`client/utils/errorUtils.ts`)

```typescript
function isAbortError(error: Error): boolean {
  // Checks for "aborted" or "AbortError" in message or name
}

function isNetworkError(error: Error): boolean {
  // Checks for "fetch", "NetworkError", "Failed to fetch", "ERR_CONNECTION_REFUSED" in message
}
```

### Error Translations
The `errorTranslations` namespace provides localized error messages:
- `generic`: generic error
- `loginFailed`: login failure
- `networkError`: network error
- `sessionExpired`: session expired
- `refreshTokenFailed`: token refresh failure

### Apollo Error Link
The AppApolloProvider includes an error link that:
- Catches auth errors → attempts token refresh
- Handles session expiry → redirects to login
- Network errors handled by connectivity context

---

## 10. Layout System

### Root Layout (`app/layout.tsx`)
```tsx
<html lang="ar" dir="rtl">
  <body>
    <GeistSans /> / <GeistMono />
    {children}
  </body>
</html>
```

### Route Group Layout (`app/(root)/layout.tsx`)
Wraps children in `<ClientProviders>{children}</ClientProviders>`.

### Dashboard Layout

#### Structure (`client/views/dashboard/layout/`)

```
Dashboard.tsx                    # Main dashboard page (static content)
layout/
├── DashboardLayout.tsx          # Main layout component
├── DashboardLayoutContext.tsx   # Layout context provider
├── CollapsedDashboardSidebar.tsx
├── ExpandedDashboardSidebar.tsx
├── FloatingDashboardSidebar.tsx  # Mobile drawer
├── DashboardDefaultTitle.tsx    # Title renderer
├── DashboardEndActions.tsx      # End actions slot
├── ToggleSideBarButton.tsx      # Sidebar toggle button
├── useNavigationStateStore.ts   # Zustand store for nav state
├── types.ts                     # Layout types
└── utilts.ts                    # Utility functions (isPathActive)
```

#### DashboardLayout Component

Renders:
1. **Header bar**: ToggleSideBarButton + DashboardTitleRenderer + middleActions slot + endActions slot
2. **Sidebar area** (one of three variants based on state):
   - `CollapsedDashboardSidebar` (72px wide) — icon-only nav, desktop only
   - `ExpandedDashboardSidebar` (280px wide) — full nav with text, desktop only
   - `FloatingDashboardSidebar` — Drawer for mobile
3. **Main content** — `flex: 1`, scrollable

Responsive behavior:
- `useMediaQuery(theme.breakpoints.down("sm"))` for mobile detection
- Mobile: force collapsed, show floating sidebar
- Desktop: restore previous state

Dimension tracking:
- Measures header height, sidebar toggle width, sidebar width via refs
- `useEffect` with resize listener
- Dimensions stored in context for child components

#### DashboardLayoutContext

Provides:
- `navigation` (computed): navigation items with dynamic segment updates based on current path
- `slots`: titleRenderer, startActions, middleActions, endActions, expandedSidebar, collapsedSidebar
- `title`: title state (text, logo, visibility flags)
- `sidebarState`: "collapsed" | "expanded"
- Dimension state: headerHeight, sideBarToggleWidth, sideBarWidth
- Navigation state: restoreLastVisitedChild from Zustand store

**Navigation State Tracking**:
- On every path/searchParams change: saves page state to Zustand store
- Tracks parent→child relationships: when visiting `/admin/templates/15/manage`, saves as last visited child of `/admin/templates`
- Clears child path when user explicitly visits parent
- Restores last visited child when rendering sidebar items

#### Sidebar Variants

**CollapsedDashboardSidebar**:
- Icon + tiny caption per nav item
- Tooltip on hover with title
- No headers/dividers rendered (skips header items)
- 72px wide

**ExpandedDashboardSidebar**:
- Full nav items with icon + text
- Supports nested children (expand/collapse via `Collapse`)
- `isPathActive` determines active state and initial open state
- Headers (ListSubheader) and dividers rendered
- 280px wide

**FloatingDashboardSidebar**:
- MUI Drawer for mobile
- Slides in from right (RTL)
- Dismissible via close callback

#### Navigation Types

```typescript
type NavigationItem =
  | NavigationPageItem      // kind?: "page", id, segment, title, icon, pattern, action, children
  | NavigationSubheaderItem // kind: "header", title
  | NavigationDividerItem;  // kind: "divider"

type Navigation = NavigationItem[];
```

#### Dashboard Stats Page (`Dashboard.tsx`)
- Static demo page with hardcoded stats (totalTemplates, totalCertificates)
- Arabic hardcoded text (not using i18n)
- `@toolpad/core/useNotifications` demo for online/offline notifications
- Stats displayed in MUI Cards with icons

---

## 11. Shared Lib (`lib/`)

### `lib/base-logger.ts`
Abstract `BaseLogger` class:
- **Dev-only**: `process.env.NODE_ENV !== "production"`
- Writes to `/logs/` directory
- Session-based filenames: `YYYY-MM-DD_HH-MM-SS.log`
- 7-day log retention with auto-cleanup on init
- Abstract methods for inheriting classes to implement

### `lib/enum.ts`
Shared enums:
- `Calendar`: Gregorian, Hijri
- `OrderSortDirection`: ASC, DESC
- `Gender`: MALE, FEMALE, OTHER
- `CountryCode`: Full ISO 3166-1 alpha-2 country code list

### `lib/middleware.ts`
Request logging middleware:
- Logs each request with method, URL, status
- Sets `X-Response-Time` header
- Sets `X-Request-ID` header

### `client/lib/logger/`

Client-side logger (`client/lib/logger/index.ts`):
- `ClientLogger` class with singleton export
- Dev-only (`process.env.NODE_ENV === "development"`)
- Session ID generated from timestamp
- **Dual output**: console (with colored formatting) + API endpoint (`POST /api/logs`)
- Log levels: log, info, warn, error, debug
- Console formatting: colored timestamp, level badge
- API calls are fire-and-forget (catch silently to avoid infinite loops)
- Types (`client/lib/logger/types.ts`): `LogEntry`, `LogLevel`, `LoggerConfig`

### `client/lib/country/`

Country data (`client/lib/country/index.ts`):
- Full list of countries with `code` (ISO alpha-2) and `phone` (calling code)
- `CountryType` interface: `{ code: CountryCode; phone: string; suggested?: boolean }`
- `preferredCountries`: Array of 26 Arabic/Middle-Eastern country codes (SA, PS, YE, SY, EG, etc.) for MuiTelInput preference
- Used by `CountrySelect` component and `PhoneEditRenderer` in Table

Country detection (`client/lib/country/useCountryDetection.ts`):
- `useCountryDetection(timeout?, defaultCountryCode?)` hook
- Calls `https://ipapi.co/json/` for IP-based country detection
- **Rate limiting**: max 5 requests per day (stored in localStorage)
- Caches detected country code in localStorage with date
- Falls back to default (`"SA"`) on timeout (2s) or error
- Returns: `{ countryCode, countryCodeLoading, countryCodeError }`

---

## 12. Input Components (`client/components/input/`)

### 1. CountrySelect (`CountrySelect.tsx`)
- MUI `Autocomplete` with country list
- Flag images from `https://flagcdn.com/w20/${code}.png` (via `next/image` with `unoptimized`)
- Country names translated via `countryTranslations`
- Props: `country`, `setCountryAction`, `fullWidth`, `required`, `label`, `onBlurAction`, `style`

### 2. DateScrollPicker (`DateScrollPicker.tsx`)
- Three TextField inputs (day, month, year) with dropdown Menus
- **Dual calendar support**: Gregorian and Hijri via `moment-hijri`
- Calendar toggle via ButtonGroup (Hijri/Gregorian buttons)
- Month names localized via `calendarTranslations`
- Date overflow handling (days beyond month roll to next)
- Min/max date enforcement
- Props: `selectedDate` (moment), `onChangeAction`, `setCalendarAction`, `calendar`, `minDate`, `maxDate`, `title`

### 3. EditableTypography (`EditableTypography.tsx`)
- Toggle between Typography display and TextField editing
- Double-click or single-click to edit (configurable via `doubleClickToEdit`)
- Long-press on touch to edit (500ms timeout)
- Validation via `isValidAction` callback (returns error string or null)
- Save/cancel adornment buttons (Check/Close icons)
- Keyboard: Enter to save, Escape to cancel
- `onSaveAction` can be async with error return

### 4. GenderSelector (`GenderSelector.tsx`)
- ButtonGroup with Male/Female buttons
- Error state with red color
- Uses `Gender` enum from `@/lib/enum`
- Translated via `genderTranslations`
- Props: `gender`, `setGender`, `error`, `setError`

### 5. LanguageSelector (`LanguageSelector.tsx`)
- MUI `Autocomplete` for language selection
- Flag icons from `https://unpkg.com/language-icons/icons/${option}.svg`
- Selected language flag shown as start adornment
- Uses `AppLanguage` enum values
- Translated via `languageTranslations`

### 6. TagInput (`TagInput.tsx`)
- Chip-based tag input with add/edit/delete
- **Add**: Type and press Enter or comma
- **Edit**: Double-click chip, inline edit with InputBase
- **Delete**: Chip `onDelete` or Backspace on empty input
- **Blur handling**: adds tag on blur if value exists and not clicking inside container
- Styled with `styled(Paper)` for focus-within border highlight
- Fade-in animation for new chips
- Props: `label`, `placeholder`, `onChange`, `initialTags`

### Barrel Export (`index.ts`)
Exports: `EditableTypography`, `CountrySelect`, `DateScrollPicker`, `GenderSelector`, `LanguageSelector`, `TagInput`

---

## 13. Common Components (`client/components/common/`)

### 1. LanguageSwitcher
- Icon button with Translate icon
- Popover with language options
- Currently Arabic only

### 2. ThemeSwitcher
- Icon button showing current theme mode icon
- Popover with Light/Dark/System options
- Uses `headerTranslations` for labels

### 3. ConnectivityStatus
- Icon button showing network status (WiFi/WifiOff/Sync)
- Color-coded: green (connected), red (disconnected), warning (checking)
- Spinning animation when checking
- Click to retry connectivity check
- Tooltip with last checked time
- Uses `useNetworkConnectivity()` from AppApolloProvider

### 4. EmptyStateIllustration
- Centered box with sad face icon and message
- Simple component for empty states

### 5. UserMenu
- Avatar button with menu
- Menu items: Profile, Preferences, Logout
- Logout calls `logout()` from AuthContext and redirects to `/login`
- Uses `headerTranslations` for labels

### Barrel Export (`index.ts`)
Only exports `EmptyStateIllustration` (others are default exports, imported individually).

---

## 14. Utility Functions (`client/utils/`)

### `dateUtils.ts`
- `formatDate(date, format?)` — uses `Intl.DateTimeFormat("en-US")`

### `email.ts`
- `emailRegex` — regex pattern
- `isValidEmailChar(char)` — character validation
- `isValidEmail(email)` — full email validation

### `errorUtils.ts`
- `isAbortError(error)` — checks for abort-related strings
- `isNetworkError(error)` — checks for network-related strings

### `localStorage.ts`
- `debounce(func, delay)` — generic debounce utility
- `saveToLocalStorage(key, value)` — JSON stringify and save
- `loadFromLocalStorage<T>(key)` — JSON parse and return
- `debouncedSaveToLocalStorage(key, value, delay)` — debounced save

---

## 15. Key Dependencies

### Framework & Runtime
| Package | Version | Notes |
|---------|---------|-------|
| next | 15.5.4 | **NOT 16** — App Router |
| react | 19.2 | React 19 |
| react-dom | 19.2 | |
| bun | (runtime) | Bun used as package manager |

### UI / Styling
| Package | Version | Notes |
|---------|---------|-------|
| @mui/material | 7.3.4 | **MUI v7** (NOT v9) |
| @mui/icons-material | 7.x | |
| @mui/styles | 6.4.8 | JSS (for jss-rtl) |
| @mui/x-data-grid | 8.14.1 | Used for locale only (arSD), NOT for rendering |
| @emotion/cache | 11.14 | Emotion cache |
| @emotion/react | 11.14 | |
| @emotion/styled | 11.14 | |
| stylis-plugin-rtl | 2.1.1 | Emotion RTL plugin |
| jss-rtl | 0.3.0 | JSS RTL plugin |
| next-themes | 0.4.6 | (present, may be unused in favor of custom ThemeContext) |

### Data & State
| Package | Version | Notes |
|---------|---------|-------|
| @apollo/client | 4.0.7 | Apollo Client v4 |
| zustand | 5.0.8 | State management |

### Dates
| Package | Version | Notes |
|---------|---------|-------|
| moment-hijri | 3.0.0 | Hijri calendar support |
| date-fns | 4.1.0 | Date utilities |

### Forms & Inputs
| Package | Version | Notes |
|---------|---------|-------|
| mui-tel-input | (current) | Phone input component |
| google-libphonenumber | (latest) | Phone number validation |

### Files & Media
| Package | Version | Notes |
|---------|---------|-------|
| react-dropzone | (latest) | File upload drag-and-drop |
| xlsx | (latest) | Excel file handling |

### Layout & UI Utilities
| Package | Version | Notes |
|---------|---------|-------|
| @toolpad/core | 0.16.0 | Notifications, layout utilities |
| @xyflow/react | (latest) | Flow diagrams (likely for template editor) |
| lucide-react | (latest) | Icon set |
| html-to-image | (latest) | HTML to image conversion |
| react-zoom-pan-pinch | (latest) | Zoom/pan for certificate preview |
| use-debounce | (latest) | Debounce hooks |

### Other
| Package | Version | Notes |
|---------|---------|-------|
| puppeteer | (latest) | Server-side PDF generation |

---

## 16. CSS & Global Styles

### `app/globals.css`
- CSS variables for light/dark color schemes
- Basic CSS reset (`*`, `body`)
- `:root` variables for theming
- No Tailwind or CSS framework

---

## 17. Summary of Key Architectural Differences from Siraj

| Aspect | CGVS | Siraj |
|--------|------|-------|
| Next.js | 15.5.4 | 16 (App Router) |
| MUI | v7 | v9 |
| i18n | Runtime (TS objects) | Compile-time (TS system) |
| RTL | Dual (stylis-plugin-rtl + jss-rtl) | Single (likely stylis-plugin-rtl only) |
| Language | Arabic-first (default = "ar") | TBD |
| State | Zustand v5 | Zustand v5 |
| GraphQL | Apollo Client v4 | Apollo Client v4 |
| DataGrid | Custom Table (NOT DataGrid) | MUI DataGrid |
| Theme | Custom (light/dark/system) | Custom |
| Dates | moment-hijri (Hijri support) | date-fns |
| Logger | ClientLogger → API + console | @/backend/lib/logger / @/frontend/utils/logger |
| Path alias | @/ → project root | @/ → project root |
| Fonts | Geist (Sans + Mono) | TBD |

---

## 18. Migration Notes for Siraj

When adapting CGVS infrastructure for Siraj:

1. **i18n**: The runtime translation system will need to be replaced with Siraj's compile-time TypeScript system in `shared/locale/`. The 14 namespaces will need to be restructured as typed translation functions.

2. **RTL**: The dual RTL approach (both stylis-plugin-rtl AND jss-rtl) should be simplified. MUI v9 (Siraj) likely only needs stylis-plugin-rtl, as jss-rtl is legacy.

3. **MUI Version**: CGVS uses MUI v7 style props directly (e.g., `color`, `variant` as direct props). Siraj's MUI v9 requires `sx` prop for styling. The `sx` migration is needed for all components.

4. **Next.js**: CGVS is on Next.js 15, Siraj is on 16. Route handlers, metadata exports, and other APIs may differ.

5. **Theme**: The custom palette extensions (`onPrimary`, `customTable`) will need to be adapted to MUI v9's theme structure.

6. **Custom Table**: The fully custom table system is framework-agnostic and largely portable as-is, but MUI component usage will need v9 adjustments.

7. **DateScrollPicker**: Uses `moment-hijri` which is compatible across MUI versions. The Hijri calendar support is a key feature to preserve.

8. **Zustand stores**: The pattern (create + persist + createJSONStorage) is compatible and directly portable.

9. **Apollo Provider**: The connectivity checking and in-memory auth token pattern is portable but needs alignment with Siraj's auth layer.

10. **Logger**: The CGVS ClientLogger sends to `/api/logs` — Siraj uses structured logger. The client logger pattern may need adaptation to use Siraj's `@/frontend/utils/logger`.
