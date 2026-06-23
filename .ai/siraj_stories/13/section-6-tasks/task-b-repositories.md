### Task B — Repository: User Provisioning Create Methods & Login Validation Query

**Objective:** Implement transactional repository methods for creating teacher, parent, and manager/staff records, and implement role-scoped login validation query in UserRepository.

**Dependencies:** Task A — new permissions are available in the enum and seeded in the database. Depends on existing `UserRepository.create()`, `PermissionManagementRepository.bulkAssignUsersToGroup()`, and `TeacherBankingRepository.submitBankingDetails()`.

**Layer-Specific Rules (Database Repositories - Flattened from backend/db/repo/AGENTS.md):**
- Use Drizzle standard syntax `db.select().from(<table>).leftJoin()` instead of relational `findMany` when multiple joins are needed to avoid type compilation slow downs.
- Wrap all repository changes modifying multiple tables in an atomic `db.transaction()`.
- Repositories are strictly for data access. Business logic, permission checking, and complex orchestration must reside in the `backend/services/` layer.
- No hardcoded error strings — use `getBackendTranslations` for localized error messages, accepting `locale?: string` parameter.
- When performing conditional aggregation, use `sql` template literal with generic typing and `.mapWith(Number)`.
- All repository methods accept optional `tx?: DBTransaction` parameter. If provided, use it; otherwise use global `db` connection.
- **🚫 Services MUST NOT import from this layer's schema files** — Only services import from this repo module, never from `backend/db/schema` directly.

**Target Files:**
- `backend/db/repo/teacher.repository.ts` — Add `create` method
- `backend/db/repo/parent.repository.ts` — Add `create` method
- `backend/db/repo/staff-profile.repository.ts` — Add `create` method
- `backend/db/repo/user.repository.ts` — Add `validateLoginScope` method
- `backend/db/test/repo/teacher.repository.test.ts` — Add create method tests
- `backend/db/test/repo/parent.repository.test.ts` — Add create method tests
- `backend/db/test/repo/staff-profile.test.ts` — Add create method tests
- `backend/db/test/repo/user.repository.test.ts` — Add login validation tests (create if doesn't exist)

**Detailed Implementation Steps:**

*Step 1: Add TeacherRepository.create() method*

Open `backend/db/repo/teacher.repository.ts` and add the following types and method to the `TeacherRepository` namespace:

```typescript
export type TeacherCreateInput = {
  readonly userId: string;
  readonly status: "ACTIVATED" | "DEACTIVATED";
  readonly nationality?: string | null;
  readonly nationalId?: string | null;
  readonly phone?: string | null;
  readonly dateOfBirth?: string | null;
  readonly gender?: "MALE" | "FEMALE" | null;
  readonly address?: string | null;
  readonly qualifications?: string | null;
  readonly skypeId?: string | null;
  readonly zoomLink?: string | null;
  readonly zoomUsername?: string | null;
  readonly zoomPassword?: string | null;
  readonly countryCode?: string | null;
  readonly timezoneId?: number | null;
  readonly timezone: string;
  readonly hourlyRate?: string | null;
  readonly rateCurrency?: string | null;
};

export type TeacherCreateResult = {
  readonly id: string;
  readonly userId: string;
  readonly status: string;
  readonly timezone: string;
  readonly createdAt: Date;
};
```

Add the create method inside the `TeacherRepository` namespace:

```typescript
export async function create(
  input: TeacherCreateInput,
  tx?: DBTransaction,
  locale?: string
): Promise<TeacherCreateResult> {
  const queryDb = tx ?? db;

  // Verify the user exists and doesn't already have a teacher profile
  const existingTeacher = await queryDb
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.userId, input.userId))
    .limit(1);

  if (existingTeacher.length > 0) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("teacher.alreadyExists"));
  }

  // Validate timezone format
  try {
    Intl.DateTimeFormat(undefined, { timeZone: input.timezone });
  } catch {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("teacher.invalidTimezone"));
  }

  const [created] = await queryDb
    .insert(teachers)
    .values({
      userId: input.userId,
      status: input.status,
      nationality: input.nationality ?? null,
      nationalId: input.nationalId ?? null,
      phone: input.phone ?? null,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      gender: input.gender ?? null,
      address: input.address ?? null,
      qualifications: input.qualifications ?? null,
      skypeId: input.skypeId ?? null,
      zoomLink: input.zoomLink ?? null,
      zoomUsername: input.zoomUsername ?? null,
      zoomPassword: input.zoomPassword ?? null,
      countryCode: input.countryCode ?? null,
      timezoneId: input.timezoneId ?? null,
      timezone: input.timezone,
      hourlyRate: input.hourlyRate ? Number(input.hourlyRate) : null,
      rateCurrency: input.rateCurrency ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({
      id: teachers.id,
      userId: teachers.userId,
      status: teachers.status,
      timezone: teachers.timezone,
      createdAt: teachers.createdAt,
    });

  if (!created) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("teacher.createFailed"));
  }

  return created;
}
```

*Step 2: Add ParentRepository.create() method*

Open `backend/db/repo/parent.repository.ts` and add the following types and method:

```typescript
export type ParentCreateInput = {
  readonly userId: string;
  readonly status: "ACTIVATED" | "DEACTIVATED" | "REGULAR" | "ON_LEAVE" | "SUSPENDED" | "ON_TRIAL";
  readonly phone?: string | null;
  readonly nationality?: string | null;
  readonly address?: string | null;
  readonly facebook?: string | null;
  readonly whatsapp?: string | null;
  readonly twitter?: string | null;
  readonly skype?: string | null;
  readonly defaultZoomLink?: string | null;
  readonly invoiceType?: "PER_CLASSES" | "MONTHLY" | null;
  readonly feeAmount?: string | null;
  readonly paymentMethod?: "PAYPAL" | "BANK_ACCOUNT" | null;
  readonly currency?: string | null;
  readonly timezone?: string;
};

export type ParentCreateResult = {
  readonly id: string;
  readonly userId: string;
  readonly status: string;
  readonly invoiceType: string | null;
  readonly feeAmount: string | null;
  readonly paymentMethod: string | null;
  readonly currency: string | null;
  readonly createdAt: Date;
};
```

Add the create method inside the `ParentRepository` namespace:

```typescript
export async function create(
  input: ParentCreateInput,
  tx?: DBTransaction,
  locale?: string
): Promise<ParentCreateResult> {
  const queryDb = tx ?? db;

  // Verify the user exists and doesn't already have a parent profile
  const existingParent = await queryDb
    .select({ id: parents.id })
    .from(parents)
    .where(eq(parents.userId, input.userId))
    .limit(1);

  if (existingParent.length > 0) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("parent.alreadyExists"));
  }

  // Validate timezone if provided
  const timezone = input.timezone ?? "UTC";
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("parent.invalidTimezone"));
  }

  const [created] = await queryDb
    .insert(parents)
    .values({
      userId: input.userId,
      status: input.status,
      phone: input.phone ?? null,
      nationality: input.nationality ?? null,
      address: input.address ?? null,
      facebook: input.facebook ?? null,
      whatsapp: input.whatsapp ?? null,
      twitter: input.twitter ?? null,
      skype: input.skype ?? null,
      defaultZoomLink: input.defaultZoomLink ?? null,
      invoiceType: input.invoiceType ?? null,
      feeAmount: input.feeAmount ? Number(input.feeAmount) : null,
      paymentMethod: input.paymentMethod ?? null,
      currency: input.currency ?? null,
      timezone: timezone,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({
      id: parents.id,
      userId: parents.userId,
      status: parents.status,
      invoiceType: parents.invoiceType,
      feeAmount: parents.feeAmount,
      paymentMethod: parents.paymentMethod,
      currency: parents.currency,
      createdAt: parents.createdAt,
    });

  if (!created) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("parent.createFailed"));
  }

  return created;
}
```

*Step 3: Add StaffProfileRepository.create() method*

Open `backend/db/repo/staff-profile.repository.ts` and add the following types and method:

```typescript
export type StaffProfileCreateInput = {
  readonly userId: string;
  readonly phone?: string | null;
  readonly skypeId?: string | null;
  readonly status: "ACTIVATED" | "DEACTIVATED";
};

export type StaffProfileCreateResult = {
  readonly id: string;
  readonly userId: string;
  readonly status: string;
  readonly phone: string | null;
  readonly skypeId: string | null;
  readonly createdAt: Date;
};
```

Add the create method inside the `StaffProfileRepository` namespace:

```typescript
export async function create(
  input: StaffProfileCreateInput,
  tx?: DBTransaction,
  locale?: string
): Promise<StaffProfileCreateResult> {
  const queryDb = tx ?? db;

  // Verify the user exists and doesn't already have a staff profile
  const existingProfile = await queryDb
    .select({ id: staffProfiles.id })
    .from(staffProfiles)
    .where(eq(staffProfiles.userId, input.userId))
    .limit(1);

  if (existingProfile.length > 0) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("staff.alreadyExists"));
  }

  const [created] = await queryDb
    .insert(staffProfiles)
    .values({
      userId: input.userId,
      phone: input.phone ?? null,
      skypeId: input.skypeId ?? null,
      status: input.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({
      id: staffProfiles.id,
      userId: staffProfiles.userId,
      status: staffProfiles.status,
      phone: staffProfiles.phone,
      skypeId: staffProfiles.skypeId,
      createdAt: staffProfiles.createdAt,
    });

  if (!created) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("staff.createFailed"));
  }

  return created;
}
```

*Step 4: Add UserRepository.validateLoginScope() method*

Open `backend/db/repo/user.repository.ts` and add the following types and method:

```typescript
export type LoginValidationInput = {
  readonly email: string;
  readonly roleTab: "teacher" | "parent" | "manager";
};

export type LoginValidationResult = {
  readonly valid: boolean;
  readonly error?: "USER_NOT_FOUND" | "USER_NOT_IN_ROLE";
  readonly userId?: string;
};
```

Add the validateLoginScope method inside the `UserRepository` namespace:

```typescript
export async function validateLoginScope(
  input: LoginValidationInput,
  locale?: string
): Promise<LoginValidationResult> {
  // First check if the user exists at all
  const user = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, input.email), isNull(users.deletedAt), eq(users.isActive, true)))
    .limit(1);

  if (user.length === 0) {
    return { valid: false, error: "USER_NOT_FOUND" };
  }

  const userId = user[0].id;

  // Check if the user exists in the role-specific table
  switch (input.roleTab) {
    case "teacher": {
      const teacher = await db
        .select({ id: teachers.id })
        .from(teachers)
        .where(eq(teachers.userId, userId))
        .limit(1);
      
      if (teacher.length === 0) {
        return { valid: false, error: "USER_NOT_IN_ROLE" };
      }
      return { valid: true, userId };
    }

    case "parent": {
      const parent = await db
        .select({ id: parents.id })
        .from(parents)
        .where(eq(parents.userId, userId))
        .limit(1);
      
      if (parent.length === 0) {
        return { valid: false, error: "USER_NOT_IN_ROLE" };
      }
      return { valid: true, userId };
    }

    case "manager": {
      const staff = await db
        .select({ id: staffProfiles.id })
        .from(staffProfiles)
        .where(eq(staffProfiles.userId, userId))
        .limit(1);
      
      if (staff.length === 0) {
        return { valid: false, error: "USER_NOT_IN_ROLE" };
      }
      return { valid: true, userId };
    }

    default: {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("auth.invalidRoleTab"));
    }
  }
}
```

*Step 5: Update repository barrel exports*

Open `backend/db/repo/index.ts` and verify that all modified repositories are exported. The file should already export these modules, but verify the new types are accessible:

```typescript
export { TeacherRepository } from "./teacher.repository";
export type { TeacherCreateInput, TeacherCreateResult } from "./teacher.repository";

export { ParentRepository } from "./parent.repository";
export type { ParentCreateInput, ParentCreateResult } from "./parent.repository";

export { StaffProfileRepository } from "./staff-profile.repository";
export type { StaffProfileCreateInput, StaffProfileCreateResult } from "./staff-profile.repository";

export { UserRepository } from "./user.repository";
export type { LoginValidationInput, LoginValidationResult } from "./user.repository";
```

*Step 6: Write repository tests for TeacherRepository.create()*

Open `backend/db/test/repo/teacher.repository.test.ts` and add comprehensive tests:

```typescript
import { describe, test, expect } from "bun:test";
import { db } from "@/backend/db/drizzleDb";
import { runInRollback } from "@/backend/db/test/test-utils";
import { createTestUser } from "@/backend/db/test/entity-setup";
import { TeacherRepository } from "@/backend/db/repo/teacher.repository";

describe("TeacherRepository.create", () => {
  test("creates teacher profile successfully", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Test Teacher", email: "teacher@test.com" });
      
      const result = await TeacherRepository.create(
        {
          userId: user.id,
          status: "ACTIVATED",
          timezone: "America/New_York",
          nationality: "US",
          phone: "+1234567890",
          gender: "MALE",
          hourlyRate: "25.00",
          rateCurrency: "USD",
        },
        tx
      );

      expect(result.id).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.status).toBe("ACTIVATED");
      expect(result.timezone).toBe("America/New_York");
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  test("rejects duplicate teacher profile for same user", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Dup Teacher", email: "dup@test.com" });
      
      await TeacherRepository.create(
        { userId: user.id, status: "ACTIVATED", timezone: "UTC" },
        tx
      );

      let error: unknown = null;
      try {
        await TeacherRepository.create(
          { userId: user.id, status: "ACTIVATED", timezone: "UTC" },
          tx
        );
      } catch (e) {
        error = e;
      }

      expect(error).not.toBeNull();
      expect((error as Error).message).toContain("already exists");
    });
  });

  test("rejects invalid timezone", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "TZ Teacher", email: "tz@test.com" });
      
      let error: unknown = null;
      try {
        await TeacherRepository.create(
          { userId: user.id, status: "ACTIVATED", timezone: "Invalid/Timezone" },
          tx
        );
      } catch (e) {
        error = e;
      }

      expect(error).not.toBeNull();
      expect((error as Error).message).toContain("timezone");
    });
  });

  test("creates teacher with minimal required fields", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Min Teacher", email: "min@test.com" });
      
      const result = await TeacherRepository.create(
        { userId: user.id, status: "ACTIVATED", timezone: "Europe/London" },
        tx
      );

      expect(result.id).toBeDefined();
      expect(result.userId).toBe(user.id);
    });
  });
});
```

*Step 7: Write repository tests for ParentRepository.create()*

Open `backend/db/test/repo/parent.repository.test.ts` and add comprehensive tests:

```typescript
import { describe, test, expect } from "bun:test";
import { runInRollback } from "@/backend/db/test/test-utils";
import { createTestUser } from "@/backend/db/test/entity-setup";
import { ParentRepository } from "@/backend/db/repo/parent.repository";

describe("ParentRepository.create", () => {
  test("creates parent profile successfully with billing configuration", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Test Parent", email: "parent@test.com" });
      
      const result = await ParentRepository.create(
        {
          userId: user.id,
          status: "REGULAR",
          phone: "+1234567890",
          nationality: "US",
          address: "123 Main St",
          invoiceType: "MONTHLY",
          feeAmount: "500.00",
          paymentMethod: "BANK_ACCOUNT",
          currency: "USD",
          timezone: "America/Chicago",
        },
        tx
      );

      expect(result.id).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.status).toBe("REGULAR");
      expect(result.invoiceType).toBe("MONTHLY");
      expect(result.feeAmount).toBe("500.00");
      expect(result.paymentMethod).toBe("BANK_ACCOUNT");
      expect(result.currency).toBe("USD");
    });
  });

  test("rejects duplicate parent profile for same user", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Dup Parent", email: "dupp@test.com" });
      
      await ParentRepository.create(
        { userId: user.id, status: "REGULAR" },
        tx
      );

      let error: unknown = null;
      try {
        await ParentRepository.create(
          { userId: user.id, status: "REGULAR" },
          tx
        );
      } catch (e) {
        error = e;
      }

      expect(error).not.toBeNull();
      expect((error as Error).message).toContain("already exists");
    });
  });

  test("creates parent with default UTC timezone", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "UTC Parent", email: "utc@test.com" });
      
      const result = await ParentRepository.create(
        { userId: user.id, status: "REGULAR" },
        tx
      );

      expect(result.id).toBeDefined();
      expect(result.timezone).toBe("UTC");
    });
  });
});
```

*Step 8: Write repository tests for StaffProfileRepository.create()*

Open `backend/db/test/repo/staff-profile.test.ts` and add comprehensive tests:

```typescript
import { describe, test, expect } from "bun:test";
import { runInRollback } from "@/backend/db/test/test-utils";
import { createTestUser } from "@/backend/db/test/entity-setup";
import { StaffProfileRepository } from "@/backend/db/repo/staff-profile.repository";

describe("StaffProfileRepository.create", () => {
  test("creates staff profile successfully", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Test Staff", email: "staff@test.com" });
      
      const result = await StaffProfileRepository.create(
        {
          userId: user.id,
          status: "ACTIVATED",
          phone: "+1234567890",
          skypeId: "test_skype",
        },
        tx
      );

      expect(result.id).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.status).toBe("ACTIVATED");
      expect(result.phone).toBe("+1234567890");
      expect(result.skypeId).toBe("test_skype");
    });
  });

  test("rejects duplicate staff profile for same user", async () => {
    await runInRollback(async tx => {
      const user = await createTestUser(tx, { name: "Dup Staff", email: "dups@test.com" });
      
      await StaffProfileRepository.create(
        { userId: user.id, status: "ACTIVATED" },
        tx
      );

      let error: unknown = null;
      try {
        await StaffProfileRepository.create(
          { userId: user.id, status: "ACTIVATED" },
          tx
        );
      } catch (e) {
        error = e;
      }

      expect(error).not.toBeNull();
      expect((error as Error).message).toContain("already exists");
    });
  });
});
```

*Step 9: Write repository tests for UserRepository.validateLoginScope()*

Create or open `backend/db/test/repo/user.repository.test.ts` and add comprehensive tests:

```typescript
import { describe, test, expect } from "bun:test";
import { runInRollback } from "@/backend/db/test/test-utils";
import { setupTeacher, setupStudent } from "@/backend/db/test/entity-setup";
import { UserRepository } from "@/backend/db/repo/user.repository";

describe("UserRepository.validateLoginScope", () => {
  test("validates teacher login on teacher tab", async () => {
    await runInRollback(async tx => {
      const { user } = await setupTeacher(tx, { name: "Login Teacher" });
      
      const result = await UserRepository.validateLoginScope({
        email: user.email,
        roleTab: "teacher",
      });

      expect(result.valid).toBe(true);
      expect(result.userId).toBe(user.id);
      expect(result.error).toBeUndefined();
    });
  });

  test("rejects teacher login on parent tab", async () => {
    await runInRollback(async tx => {
      const { user } = await setupTeacher(tx, { name: "Wrong Tab Teacher" });
      
      const result = await UserRepository.validateLoginScope({
        email: user.email,
        roleTab: "parent",
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("USER_NOT_IN_ROLE");
    });
  });

  test("validates parent login on parent tab", async () => {
    await runInRollback(async tx => {
      const { parentUser } = await setupStudent(tx, { parentName: "Login Parent" });
      
      const result = await UserRepository.validateLoginScope({
        email: parentUser.email,
        roleTab: "parent",
      });

      expect(result.valid).toBe(true);
      expect(result.userId).toBe(parentUser.id);
    });
  });

  test("rejects parent login on teacher tab", async () => {
    await runInRollback(async tx => {
      const { parentUser } = await setupStudent(tx, { parentName: "Wrong Tab Parent" });
      
      const result = await UserRepository.validateLoginScope({
        email: parentUser.email,
        roleTab: "teacher",
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("USER_NOT_IN_ROLE");
    });
  });

  test("rejects non-existent email", async () => {
    await runInRollback(async tx => {
      const result = await UserRepository.validateLoginScope({
        email: "nonexistent@test.com",
        roleTab: "teacher",
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("USER_NOT_FOUND");
    });
  });

  test("rejects soft-deleted user", async () => {
    await runInRollback(async tx => {
      const { user } = await setupTeacher(tx, { name: "Deleted Teacher" });
      
      // Soft delete the user
      await tx.update(users)
        .set({ deletedAt: new Date() })
        .where(eq(users.id, user.id));
      
      const result = await UserRepository.validateLoginScope({
        email: user.email,
        roleTab: "teacher",
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("USER_NOT_FOUND");
    });
  });
});
```

**Test Execution Requirements:**
- Run the full database test suite:
  ```bash
  bun run test:db
  ```
- Run coverage on modified repository test files:
  ```bash
  bun run test:coverage backend/db/test/repo/teacher.repository.test.ts
  bun run test:coverage backend/db/test/repo/parent.repository.test.ts
  bun run test:coverage backend/db/test/repo/staff-profile.test.ts
  bun run test:coverage backend/db/test/repo/user.repository.test.ts
  ```
  All must show 100% line + function coverage on new methods.
- Verify TypeScript compilation:
  ```bash
  bun tsgo
  ```

**Success Criteria / Check Progress Points:**
- [ ] `TeacherRepository.create()` is fully implemented with duplicate check and timezone validation
- [ ] `ParentRepository.create()` is fully implemented with duplicate check and billing field support
- [ ] `StaffProfileRepository.create()` is fully implemented with duplicate check
- [ ] `UserRepository.validateLoginScope()` is fully implemented with role-scoped validation
- [ ] All repository methods accept optional `tx?: DBTransaction` parameter
- [ ] All repository methods use `getBackendTranslations` for localized error messages
- [ ] All repository methods throw errors with localized messages on failure
- [ ] All test cases pass for teacher create (success, duplicate, invalid timezone, minimal fields)
- [ ] All test cases pass for parent create (success, duplicate, default timezone)
- [ ] All test cases pass for staff create (success, duplicate)
- [ ] All test cases pass for login validation (teacher/parent/manager tabs, cross-role rejection, non-existent email, soft-deleted user)
- [ ] `bun run test:db` passes with zero failures
- [ ] Coverage reports show 100% line + function coverage on new methods
- [ ] `bun tsgo` passes with zero TypeScript errors
- [ ] Repository barrel exports include all new types

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
