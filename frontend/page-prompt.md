I have a design for a new page that I need to implement in my Next.js + Material-UI project. I'll provide:

1. `screen.png` - A screenshot/mockup of the page design
2. `code.html` - HTML structure reference

**IMPORTANT: Check `.ai/ux/01-in_progress/` for the files to focus on, refer to `.ai/siraj_lms_combined.txt` for complete UI specifications, and strictly follow the [NEW_PAGE_WORKFLOW.md](NEW_PAGE_WORKFLOW.md) for all implementation steps.**

## Architecture Principles

### Feature-Based Organization

- This project uses **feature-based structure**, NOT role-based
- Routes organized by feature (schedule, students, teachers), not by user type (admin, teacher, parent)
- All users share the same dashboard layout at `/[locale]/(dashboard)/`
- Access controlled by **permissions** (runtime checks), not by route groups

### Permission-Driven Access

- Users have a `permissions: string[]` array
- Navigation filtered at runtime based on user permissions
- Same components render different data/actions based on permissions
- NO role-specific code duplication

### Data Flow (Mandatory)

- **Components are presentational only** - they receive ALL data via props
- **Containers** connect Zustand stores to Views/Components
- **Views** handle layout and composition, passing props down
- **NO component should access stores directly**

```
Store (Zustand) → Container → View → Components
                      ↓
                  Server Actions
```

### MUI Component Usage

- **Always use mui-mcp** to check component APIs (MUI v9+)
- This is a newer version than your training data—verify all APIs
- Use `slotProps` instead of deprecated `InputProps`
- Import from `@mui/material` and `@mui/icons-material`

Please implement this page following our project's patterns and standards:

## Project Stack & Conventions

- **Framework**: Next.js 16+ with App Router
- **UI Library**: Material-UI (MUI) v9+
- **Language**: TypeScript
- **Styling**: MUI's `sx` prop with theme integration
- **Forms**: React Hook Form + Zod validation
- **Internationalization**: next-intl with English and Arabic support
- **Package Manager**: Bun (use `~/.bun/bin/bun`)

## Implementation Requirements

### 1. File Structure

**For Dashboard Pages** (most pages):

```
src/app/[locale]/(dashboard)/[feature]/
  ├── page.tsx                           # Route entry point
  ├── [id]/page.tsx                      # Dynamic routes
  └── [nested-path]/page.tsx             # Nested routes

src/views/dashboard/[feature]/
  ├── components/
  │   ├── [ComponentName].tsx            # Presentational components
  │   └── [AnotherComponent].tsx
  ├── schemas/
  │   └── [name]Schema.ts                # Zod validation
  ├── actions/
  │   └── [name].ts                      # Server actions
  ├── [Feature]Container.tsx             # Connects store to view
  └── [Feature]View.tsx                  # Layout + composition
```

**For Auth Pages** (login, etc.):

```
src/app/[locale]/(auth)/[page]/
  └── page.tsx

src/views/auth/[page]/
  ├── components/
  ├── schemas/
  └── actions/
```

**Feature Examples**:

- `schedule/` - Schedule management
- `students/` - Students directory and profiles
- `teachers/` - Teachers directory and profiles
- `classes/` - Class details and management
- `billing/` - Invoices and payments
- `reports/` - Analytics and reporting

**Key Points**:

- All dashboard pages under `(dashboard)` group
- Features organized by domain, not by user role
- Shared dashboard components in `views/dashboard/components/`
- Feature-specific components in `views/dashboard/[feature]/components/`

### Theme and Styling Rules

- **NO hardcoded colors allowed** - All colors MUST come from the theme palette defined in `providers/theme/types.ts`.
- **NEVER use hex colors, rgb/rgba values, or color names** (e.g., `#fff`, `#000000`, `rgb(255,0,0)`, `"white"`, `"red"`).
- **NO Quotes for Colors**: Never use MUI's string-based palette access (e.g., `color="primary.main"` or `sx={{ color: 'primary.main' }}`).
- **Theme Callback Pattern**: Use the theme callback pattern ONLY when theme-specific values are needed:
    - `sx={(theme) => ({ color: theme.palette.primary.main })}`
    - `sx={(theme) => ({ bgcolor: theme.palette.onPrimaryContainer })}`
    - If no theme values are used, use a plain object: `sx={{ display: 'flex' }}`
- **Universal Contrast**: Use Material 3 `on<Color>` siblings instead of legacy `contrastText` (e.g., `theme.palette.onPrimary`).
- **Flattened Accessors**: Use the flattened M3 sibling accessors directly on the palette (e.g., `onPrimaryContainer`, `onBackground`, `onHeader`).
- **NO DELETION**: Never delete an existing theme value (like `boxShadow` or `border`). Map it to the most appropriate theme property (e.g., `theme.palette.shadow.card`).
- Check **THEME_PALETTE.md** for the full specification and access patterns.

### 2. Component Patterns

**Container Component** (connects store to presentation):

```tsx
"use client";

import { useScheduleStore } from "@/frontend/stores/scheduleStore";
import { ScheduleView } from "./ScheduleView";

export function ScheduleContainer() {
  const { schedules, filters, setFilter, fetchSchedules } = useScheduleStore();

  return <ScheduleView schedules={schedules} filters={filters} onFilterChange={setFilter} onRefresh={fetchSchedules} />;
}
```

**View Component** (layout + composition):

```tsx
"use client";

import { ScheduleTable } from "./components/ScheduleTable";
import { ScheduleFilters } from "./components/ScheduleFilters";

interface ScheduleViewProps {
  schedules: Schedule[];
  filters: ScheduleFilters;
  onFilterChange: (filter: Partial<ScheduleFilters>) => void;
  onRefresh: () => void;
}

export function ScheduleView({ schedules, filters, onFilterChange, onRefresh }: ScheduleViewProps) {
  return (
    <Box sx={{ p: 3 }}>
      <ScheduleFilters filters={filters} onChange={onFilterChange} />
      <ScheduleTable schedules={schedules} onRefresh={onRefresh} />
    </Box>
  );
}
```

**Presentational Component** (pure UI):

```tsx
"use client";

interface ScheduleTableProps {
  schedules: Schedule[];
  onRefresh: () => void;
}

export function ScheduleTable({ schedules, onRefresh }: ScheduleTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table>{/* Render schedules */}</Table>
    </TableContainer>
  );
}
```

**Page Component** (route entry):

```tsx
import { ScheduleContainer } from "@/frontend/views/dashboard/schedule/ScheduleContainer";

export default function SchedulePage() {
  return <ScheduleContainer />;
}
```

**Form Components**:

- Use React Hook Form with Zod resolver
- Use MUI's `slotProps` instead of deprecated `InputProps`
- Handle autofill styles properly (already configured in theme)
- Email fields: use `type="email"` for HTML5 validation
- Password fields: implement show/hide toggle with visibility icons

**Example TextField**:

```tsx
<TextField
  {...field}
  label={t("fieldLabel")}
  type="email"
  error={!!errors.fieldName}
  helperText={errors.fieldName?.message}
  disabled={isSubmitting}
  fullWidth
  slotProps={{
    input: {
      startAdornment: (
        <InputAdornment position="start">
          <Icon sx={{ color: "text.secondary" }} />
        </InputAdornment>
      ),
    },
  }}
/>
```

### 3. Validation Schemas

Use Zod v4 syntax:

```ts
export const createSchema = (messages: { ... }) => {
  return z.object({
    email: z
      .string({ required_error: messages.emailRequired })
      .min(1, messages.emailRequired)
      .pipe(z.email({ message: messages.emailInvalid })),
    password: z.string().min(1, messages.passwordRequired).min(6, messages.passwordMinLength),
    rememberMe: z.boolean().optional(),
  });
};

export type FormData = z.infer<ReturnType<typeof createSchema>>;
```

### 4. Internationalization

Add translations to both language files organized by feature:

**src/messages/en.ts**:

```ts
dashboard: {
  schedule: {
    title: "Schedule Overview",
    filters: {
      date: "Date",
      teacher: "Teacher",
      // ...
    },
  },
  students: {
    title: "Students Directory",
    // ...
  },
},
auth: {
  login: {
    title: "Login",
    email: "Email Address",
    password: "Password",
    rememberMe: "Remember me",
    submit: "Sign In",
    emailRequired: "Email is required",
    emailInvalid: "Invalid email format",
    passwordRequired: "Password is required",
  },
},
```

**src/messages/ar.ts**: (Provide Arabic translations)

```ts
dashboard: {
  schedule: {
    title: "نظرة عامة على الجدول",
    filters: {
      date: "التاريخ",
      teacher: "المعلم",
    },
  },
},
```

Update **src/types/message.ts** to include the new keys in the `MessageSchema` type.

**Usage in components**:

```tsx
import { useTranslations } from "next-intl";

export function ScheduleView() {
  const t = useTranslations("dashboard.schedule");

  return <Typography variant="h4">{t("title")}</Typography>;
}
```

### 5. Theme Integration

Use theme values through `sx` prop callbacks:

```tsx
sx={{
  maxWidth: (theme) => theme.layout.authWidth,
  boxShadow: (theme) => theme.palette.shadow.card,
  p: (theme) => theme.layout.cardPadding,
}}
```

Available theme values:

- Layout: `theme.layout.{pageMargin, gutter, authWidth, sidebarWidth, navbarHeight, cardPadding}`
- Colors: `theme.palette.{primary, secondary, background, text, border, shadow}`
- Custom: `theme.palette.{overlay, header, footer, status, sidebar, icon}`

### 6. Server Actions

For mock/demo functionality:

```ts
"use server";

import { webcrypto } from "node:crypto";

// Use cryptographically secure random instead of Math.random()
function secureRandom(): number {
  const array = new Uint32Array(1);
  webcrypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
}
```

### 7. Form Submission

Handle promises correctly to avoid ESLint errors:

```tsx
<Box
  component="form"
  onSubmit={(e) => {
    e.preventDefault();
    void handleSubmit(onSubmit)(e);
  }}
>
```

### 8. Quality Checks

After implementation, run:

1. `~/.bun/bin/bun tsgo` - TypeScript type checking
2. `~/.bun/bin/bun lint` - ESLint validation
3. Fix all errors before completion

### 9. Styling Guidelines

- **No console methods**: Use `import { logger } from '@/frontend/utils/logger'` instead
- **Dark mode support**: All components must work in both light and dark themes
- **RTL support**: Design should work for both LTR (English) and RTL (Arabic)
- **Responsive**: Use MUI's responsive utilities
- **Autofill**: Already handled globally in theme, no need for component-level overrides

### 10. Icons

Use MUI icons:

- Import from `@mui/icons-material`
- Use the correct export names (e.g., `HelpOutlined` not `HelpOutline`)

### 11. Permissions & Navigation

**Adding navigation items** (if this page should appear in sidebar):

Edit `src/views/dashboard/config/navigationConfig.ts`:

```ts
export const SIDEBAR_NAV_ITEMS: readonly NavItem[] = [
  // ... existing items
  {
    key: "schedule",
    labelKey: "dashboard.nav.schedule",
    icon: CalendarTodayOutlined,
    href: "/schedule",
    section: "main",
    permission: "schedule-view", // Users need this permission to see the nav item
  },
];
```

**Permission keys** should follow the pattern: `[feature]-[action]`

- Examples: `schedule-view`, `students-manage`, `reports-generate`, `billing-create`

**Navigation is filtered at runtime**:

```ts
function getNavItemsForPermissions(items: readonly NavItem[], permissions: readonly string[]): NavItem[] {
  return items.filter(item => !item.permission || permissions.includes(item.permission));
}
```

### 12. Zustand Store Pattern

If creating a new store for this feature:

```ts
// src/stores/[feature]Store.ts
import { create } from "zustand";

interface FeatureState {
  data: Data[];
  filters: Filters;
  isLoading: boolean;

  // Actions
  setData: (data: Data[]) => void;
  setFilter: (filter: Partial<Filters>) => void;
  fetchData: () => Promise<void>;
}

export const useFeatureStore = create<FeatureState>((set, get) => ({
  data: [],
  filters: {},
  isLoading: false,

  setData: data => set({ data }),
  setFilter: filter => set(state => ({ filters: { ...state.filters, ...filter } })),
  fetchData: async () => {
    set({ isLoading: true });
    // Fetch logic
    set({ isLoading: false });
  },
}));
```

**Store should be accessed ONLY in Container components, never in presentational components.**

## Deliverables

Please create:

1. All component files with proper structure
2. Validation schemas with Zod
3. Translation files (both EN and AR)
4. Type definitions updates
5. Server actions if needed
6. Ensure all TypeScript and ESLint checks pass

**Important**: Do NOT create summary markdown files. Provide a brief summary in chat instead.

---

Now, please analyze the attached `screen.png` and `code.html` and implement the page following these guidelines.
