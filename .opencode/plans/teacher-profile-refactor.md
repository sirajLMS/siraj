# Teacher Profile Route Refactor Plan

**Route:** `app/[locale]/(dashboard)/teachers/[id]/profile`
**Scope:** Full-stack — backend types/repo/service/pothos, shared UI, frontend route module only

---

## Decisions Record

| Issue | Decision |
|-------|----------|
| TeacherProfileStats (totalClasses/parentRating) | Full-stack: add `totalClasses` + `avgEngagementScore` to TeacherProfileResult via DB aggregate queries |
| paymentMethod field | Full-stack: add `paymentMethod` column to `teachers` DB schema, types, repo, service, Pothos, GQL docs |
| Gender enum | Uppercase enum values (`MALE`/`FEMALE`), typesafe access via generated GQL enum types |
| AccountStatus in GraphQL | Full-stack: register `AccountStatus` as Pothos enum; change status field from String to AccountStatus enum |
| StatusBadge category | Add `staffAccount` category to StatusBadge with `activated`/`deactivated` mappings |
| Notifications | Container-level `useNotifications` hook — success/error feedback on save |
| updatedAt / lastModified | Full-stack: add `updatedAt` to TeacherProfileResult, repo query, Pothos, GQL docs; display real date |
| In-file types | Move ALL prop interfaces to `types.ts` |
| Loading state | Replace `"Loading..."` with `<CircularProgress />` |
| Discard Changes button | Reset form to original profile values via `methods.reset(profile)` |
| avgEngagement label | Replace misleading "Avg. Parent Rating" with accurate "Avg. Engagement Score" label |

---

## Execution Phases

### Phase 1: Backend (bottom-up)

#### 1a. DB Schema — `backend/db/schema/teachers.ts`
- Add `paymentMethod` column: `paymentMethodEnum("payment_method")` (nullable)
  - `paymentMethodEnum` already defined in `backend/db/schema/enums.ts` (line 54)
  - Uses `PaymentMethod` enum from `shared/lib/enum.ts`: `PAYPAL`, `BANK_ACCOUNT`

#### 1b. Backend Types — `backend/types/staff-profile.types.ts` (new or update existing)
- Create canonical `TeacherProfileReturnType`:
  ```ts
  import type { AccountStatus, Gender, PaymentMethod } from "@/shared/lib/enum";
  
  export type TeacherProfileReturnType = {
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly phone: string | null;
    readonly nationalId: string | null;
    readonly dateOfBirth: string | null;
    readonly gender: Gender | null;
    readonly address: string | null;
    readonly qualifications: string | null;
    readonly skypeId: string | null;
    readonly zoomLink: string | null;
    readonly zoomUsername: string | null;
    readonly timezone: string;
    readonly hourlyRate: string | null;
    readonly rateCurrency: string | null;
    readonly paymentMethod: PaymentMethod | null;
    readonly status: AccountStatus;
    readonly updatedAt: string;
    readonly totalClasses: number;
    readonly avgEngagementScore: number;
  };
  ```
- Create `TeacherProfileUpdateInputType` (add `paymentMethod`):
  ```ts
  export type TeacherProfileUpdateInputType = {
    readonly nationalId?: string | null;
    readonly phone?: string | null;
    readonly dateOfBirth?: string | null;
    readonly gender?: Gender | null;
    readonly address?: string | null;
    readonly qualifications?: string | null;
    readonly skypeId?: string | null;
    readonly zoomLink?: string | null;
    readonly zoomUsername?: string | null;
    readonly zoomPassword?: string | null;
    readonly timezone?: string | null;
    readonly hourlyRate?: string | null;
    readonly rateCurrency?: string | null;
    readonly paymentMethod?: PaymentMethod | null;
  };
  ```

#### 1c. Repository — `backend/db/repo/teacher.repository.ts`
- Update `getTeacherProfileForEdit`:
  - Add `teachers.updatedAt` and `teachers.paymentMethod` to SELECT
  - Add correlated subqueries for stats:
    - `totalClasses`: COUNT from `classInstances` WHERE `teacherId` = ? AND `outcome = 'TAKEN'` AND `executionState = 'COMPLETED'` AND `deletedAt IS NULL`
    - `avgEngagementScore`: AVG from `classInstancePerformance.engagementScore` joined with `classInstances` WHERE `teacherId` = ? AND `engagementScore IS NOT NULL`
  - Change return type to canonical `TeacherProfileReturnType`
  - Cast `status` and `gender` to proper enums
- Update `updateTeacherProfile` to persist `paymentMethod`

#### 1d. Service — `backend/services/staff/staff-profile.service.ts`
- Remove local `TeacherProfileResult` and `TeacherProfileUpdateInput` interfaces
- Import canonical types from `@/backend/types/staff-profile.types`
- Update `updateTeacherProfile` to pass `paymentMethod` to repo

#### 1e. Pothos — `backend/graphql/pothos/enum.pothos.ts`
- Register `AccountStatus` as Pothos enum:
  ```ts
  export const AccountStatusPothosObject = gqlSchemaBuilder.enumType(AccountStatus, {
    name: "AccountStatus",
  });
  ```

#### 1f. Pothos — `backend/graphql/pothos/staff-profile.pothos.ts`
- Remove local `TeacherProfileResultDefinition` and `TeacherProfileUpdateInputDefinition` types
- Import canonical types from `@/backend/types/staff-profile.types`
- Update `TeacherProfileResult` object:
  - Add `updatedAt: t.exposeString("updatedAt")`
  - Add `paymentMethod: t.exposeString("paymentMethod", { nullable: true })`
  - Add `totalClasses: t.exposeInt("totalClasses")`
  - Add `avgEngagementScore: t.exposeFloat("avgEngagementScore")`
  - Change `status` from `t.exposeString("status")` → use `AccountStatusPothosObject` enum type
  - Change `gender` from `t.exposeString("gender", { nullable: true })` → use `GenderPothosObject` enum type
- Update `TeacherProfileUpdateInput`:
  - Add `paymentMethod` field (string input that maps to PaymentMethod enum, or use the enum directly)
  - Consider making `gender` and `paymentMethod` input fields use their respective enums

#### 1g. GQL Documents — `frontend/graphql/sharedDocuments/staff-profile.documents.ts`
- Add to both query and mutation selection sets:
  - `updatedAt`
  - `paymentMethod`
  - `totalClasses`
  - `avgEngagementScore`
- Add `paymentMethod` to mutation input

---

### Phase 2: Shared UI

#### 2a. `frontend/components/ui/StatusBadge.tsx`
- Add `"staffAccount"` to `StatusBadgeCategory` union type
- Add `staffAccount` case to `getStatusColors()`:
  ```ts
  case "staffAccount": {
    const map: Record<string, { backgroundColor: string; color: string }> = {
      activated: {
        backgroundColor: theme.palette.status.activeContainer,
        color: theme.palette.status.onActiveContainer,
      },
      deactivated: {
        backgroundColor: theme.palette.status.cancelledContainer,
        color: theme.palette.status.onCancelledContainer,
      },
    };
    return map[status] ?? { backgroundColor: theme.palette.surfaceContainerHigh, color: theme.palette.onSurfaceVariant };
  }
  ```

---

### Phase 3: Code Generation

#### 3a. Run codegen
```bash
bun run generate:gqlSchema
bun codegen
```
- This regenerates TypeScript types including `AccountStatus` enum in `frontend/graphql/generated/gql/graphql-types.ts`
- Verify generated types include all new fields

---

### Phase 4: Frontend (route module only)

#### 4a. `frontend/views/dashboard/teachers/profile/types.ts`
- Move all interfaces here:
  - `TeacherProfileViewProps`
  - `TeacherProfileFormActionsProps`
  - `TeacherProfileStatsProps`
  - `SectionHeaderProps`
- Redefine `TeacherProfileData` to match actual GraphQL `TeacherProfileResult` (not extend form schema):
  ```ts
  import type { AccountStatus, Gender, PaymentMethod } from "@/shared/lib/enum";
  
  export interface TeacherProfileData {
    readonly id: string;
    readonly fullName: string;
    readonly email: string;
    readonly phone: string;
    readonly gender: Gender;
    readonly timezone: string;
    readonly address: string;
    readonly baseSalary: number;
    readonly currency: string;
    readonly paymentMethod: PaymentMethod;
    readonly zoomLink: string;
    readonly accountStatus: boolean;
    readonly updatedAt: string;
    readonly totalClasses: number;
    readonly avgEngagementScore: number;
  }
  ```

#### 4b. `frontend/views/dashboard/teachers/profile/schemas/teacherProfileSchema.ts`
- Change `gender`: `z.enum(["male", "female"])` → `z.enum(["MALE", "FEMALE"])`
- Change `paymentMethod`: `z.string()` → `z.enum(["PAYPAL", "BANK_ACCOUNT"])`

#### 4c. i18n updates
- `shared/messages/types/dashboard/teachers/profile.ts`:
  - Rename `stats.parentRating` → `stats.avgEngagement`
  - Add `actions.saveSuccess` and `actions.saveError` keys
- `shared/messages/en.ts`:
  - Change `"Avg. Parent Rating"` → `"Avg. Engagement Score"`
  - Add save success/error notification messages
- `shared/messages/ar/dashboard/teachers/profile.ts`:
  - Update Arabic translation for avgEngagement
  - Add save success/error Arabic messages

#### 4d. `TeacherProfileContainer.tsx`
- Add `import { useNotifications } from "@toolpad/core/useNotifications"`
- Remove hardcoded data (`totalClasses: 0`, `parentRating: "0.0"`, `paymentMethod: "paypal"`, `lastModified: new Date().toLocaleDateString()`)
- Map real data from GraphQL result:
  - `totalClasses: data.teacherProfileForEdit.totalClasses`
  - `avgEngagementScore: data.teacherProfileForEdit.avgEngagementScore`
  - `paymentMethod: data.teacherProfileForEdit.paymentMethod ?? PaymentMethod.PAYPAL`
  - `updatedAt: data.teacherProfileForEdit.updatedAt`
  - `status: data.teacherProfileForEdit.status === AccountStatus.Activated`
- Map `gender` without `.toLowerCase()` — use `Gender` enum directly
- Add `onDiscard` handler: `() => { methods.reset(profile); }` — pass to View
- On save success: `notifications.show(t("actions.saveSuccess"), { severity: "success", autoHideDuration: 4000 })`
- On save error: `notifications.show(t("actions.saveError"), { severity: "error", autoHideDuration: 5000 })`

#### 4e. `TeacherProfileView.tsx`
- Import `TeacherProfileViewProps` from `./types`
- Replace `"Loading..."` with centered `<CircularProgress />`
- Pass `onDiscard` prop through to `TeacherProfileFormActions`
- Pass `updatedAt` from profile data instead of `lastModified`

#### 4f. `TeacherProfileFormActions.tsx`
- Import `TeacherProfileFormActionsProps` from `../types`
- Add `onDiscard: () => void` to interface
- Wire "Discard Changes" button: `onClick={onDiscard}`
- Replace hardcoded `"Last modified"` with `t("actions.lastModified", { date: new Date(updatedAt).toLocaleDateString() })`
- Rename `lastModified` prop → `updatedAt`

#### 4g. `TeacherProfileStats.tsx`
- Import `TeacherProfileStatsProps` from `../types`
- Replace `parentRating: string` with `avgEngagementScore: number`
- Change icon from `StarHalfOutlined` → `TrendingUpOutlined` (engagement metric)
- Update label from `t("stats.parentRating")` → `t("stats.avgEngagement")`
- Format value as number (e.g., `85.2`) not string

#### 4h. `SystemConfigSection.tsx`
- Change `StatusBadge` category from `"studentAccount"` → `"staffAccount"`
- Pass `status` using AccountStatus enum values (lowercase for StatusBadge key mapping):
  - Activated: `status="activated"`
  - Deactivated: `status="deactivated"`

#### 4i. `SalaryDetailsSection.tsx`
- Change `<Select>` values:
  - `"paypal"` → `PaymentMethod.PAYPAL` (`"PAYPAL"`)
  - `"bank"` → `PaymentMethod.BANK_ACCOUNT` (`"BANK_ACCOUNT"`)
  - Remove `"cash"` option (not in PaymentMethod enum)
- Update display labels: "PayPal Business" → "PayPal", "Bank Transfer" → "Bank Account"

#### 4j. `TeacherInfoFields.tsx`
- Change Gender radio `value`:
  - `"male"` → `Gender.MALE` (`"MALE"`)
  - `"female"` → `Gender.FEMALE` (`"FEMALE"`)

#### 4k. `SectionHeader.tsx`
- Import `SectionHeaderProps` from `../types`
- Remove icon re-exports (`BadgeOutlined`, `PaymentsOutlined`, `SettingsSuggestOutlined`)
  - `TeacherInfoSection.tsx` will import `BadgeOutlined` directly from `@mui/icons-material`
  - `SalaryDetailsSection.tsx` will import `PaymentsOutlined` directly
  - `SystemConfigSection.tsx` will import `SettingsSuggestOutlined` directly

---

### Phase 5: Quality Checks

```bash
bun tsgo          # Type-check all layers
bun biome:check   # Lint + format
bun run lint       # ESLint (via queue server if needed)
```

Fix any issues that arise from each check before proceeding to the next.

---

## Files Modified (by scope)

### In-scope (route module + required upstream)
| File | Change Type |
|------|-------------|
| `backend/db/schema/teachers.ts` | Add `paymentMethod` column |
| `backend/types/staff-profile.types.ts` | New/updated canonical types |
| `backend/db/repo/teacher.repository.ts` | Update query + return type |
| `backend/services/staff/staff-profile.service.ts` | Remove local types, add paymentMethod |
| `backend/graphql/pothos/enum.pothos.ts` | Register AccountStatus enum |
| `backend/graphql/pothos/staff-profile.pothos.ts` | Remove local types, add fields, use enums |
| `frontend/graphql/sharedDocuments/staff-profile.documents.ts` | Add new fields to selection sets |
| `frontend/components/ui/StatusBadge.tsx` | Add `staffAccount` category |
| `frontend/views/dashboard/teachers/profile/types.ts` | Rewrite with canonical types + move interfaces |
| `frontend/views/dashboard/teachers/profile/schemas/teacherProfileSchema.ts` | Enum alignment |
| `frontend/views/dashboard/teachers/profile/TeacherProfileContainer.tsx` | useNotifications + real data + enums |
| `frontend/views/dashboard/teachers/profile/TeacherProfileView.tsx` | Loading state + props + onDiscard passthrough |
| `frontend/views/dashboard/teachers/profile/components/TeacherProfileFormActions.tsx` | onDiscard + i18n lastModified |
| `frontend/views/dashboard/teachers/profile/components/TeacherProfileStats.tsx` | avgEngagementScore |
| `frontend/views/dashboard/teachers/profile/components/SystemConfigSection.tsx` | staffAccount category |
| `frontend/views/dashboard/teachers/profile/components/SalaryDetailsSection.tsx` | PaymentMethod enum values |
| `frontend/views/dashboard/teachers/profile/components/TeacherInfoFields.tsx` | Gender enum values |
| `frontend/views/dashboard/teachers/profile/components/SectionHeader.tsx` | Import types, remove re-exports |
| `frontend/views/dashboard/teachers/profile/components/TeacherInfoSection.tsx` | Direct icon import |
| `shared/messages/types/dashboard/teachers/profile.ts` | avgEngagement + notification keys |
| `shared/messages/en.ts` | Updated English messages |
| `shared/messages/ar/dashboard/teachers/profile.ts` | Updated Arabic messages |

### Auto-regenerated (do not edit)
| File | Trigger |
|------|---------|
| `frontend/graphql/generated/gql/graphql-types.ts` | `bun codegen` |
| `frontend/graphql/generated/gql/operations.ts` | `bun codegen` |
| `frontend/graphql/generated/gql/graphql.schema.json` | `bun run generate:gqlSchema` |

---

## Dependencies & Ordering

```
1a (schema) → 1b (types) → 1c (repo) → 1d (service) → 1e (pothos enum) → 1f (pothos object) → 1g (gql docs) → 3a (codegen) → 4a–4k (frontend) → 5 (quality)
                                                                              ↑
2a (StatusBadge) can run in parallel with 1f+
```

All backend changes must complete and codegen must succeed before frontend changes begin.
