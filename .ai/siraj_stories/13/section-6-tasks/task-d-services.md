### Task D — Services: User Provisioning Orchestration

**Objective:** Implement domain services for teacher, parent, and manager onboarding with full transactional orchestration, permission gating, and localized error handling.

**Dependencies:** Task C — repository create methods are implemented and tested with 100% coverage. Depends on `UserRepository.create()`, `TeacherRepository.create()`, `ParentRepository.create()`, `StaffProfileRepository.create()`, `PermissionManagementRepository.bulkAssignUsersToGroup()`, `TeacherBankingRepository.submitBankingDetails()`, and `PermissionsService.hasPermission()`.

**Layer-Specific Rules (Backend Services - Flattened from backend/services/AGENTS.md):**
- **Domain-Driven Architecture**: Service layers must be constructed per domain of concern: `TeacherOnboardingService`, `ParentOnboardingService`, `ManagerOnboardingService`.
- **NO Monolithic Services**: Do NOT create a generic `OnboardingService` handling all user types. Each user type gets its own service.
- **Business Logic Hub**: This layer contains all business rules, orchestration, and complex permission gating before calling the repository layer.
- **🚫 Services MUST NOT import from DB/Drizzle**: Services can ONLY depend on the repository layer (`backend/db/repo/`). Importing from `drizzle-orm`, `backend/db/schema`, `backend/db/index`, or any Drizzle-related module is **strictly forbidden**. All database access must go through repo methods.
- **SSR Usage**: Services can be used directly by Next.js Server Components (SSR) or Server Actions, so they must not rely on GraphQL-specific contexts unless passed explicitly.
- **i18n / Localized Error Messages**: All user-facing error messages, alerts, and feedback generated in services must be translated using `next-intl` (via `getBackendTranslations`), optionally accepting a `locale?: string` parameter. Hardcoded strings for exceptions or responses are forbidden.
- **Transaction boundaries**: Multi-table writes (user + profile + permission group) must be wrapped in `db.transaction()`. The service initiates the transaction and passes the `tx` object to all repository methods.

**Target Files:**
- `backend/services/teacher/teacher-onboarding.service.ts` — New file for teacher provisioning
- `backend/services/parent/parent-onboarding.service.ts` — New file for parent provisioning
- `backend/services/staff/manager-onboarding.service.ts` — New file for manager provisioning
- `backend/services/teacher/test/teacher-onboarding.service.test.ts` — New test file
- `backend/services/parent/test/parent-onboarding.service.test.ts` — New test file
- `backend/services/staff/test/manager-onboarding.service.test.ts` — New test file

**Detailed Implementation Steps:**

*Step 1: Create TeacherOnboardingService*

Create `backend/services/teacher/teacher-onboarding.service.ts`:

```typescript
import { db } from "@/backend/db/drizzleDb";
import {
  ParentRepository,
  PermissionManagementRepository,
  TeacherBankingRepository,
  TeacherRepository,
  UserRepository,
} from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/services/auth/permissions.service";
import { AppPermission, SystemPermissionGroupSlug } from "@/shared/lib/enum";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface TeacherOnboardingInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
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
  readonly beneficiaryName?: string | null;
  readonly bankName?: string | null;
  readonly accountNumber?: string | null;
  readonly routingNumber?: string | null;
  readonly swiftBic?: string | null;
  readonly iban?: string | null;
}

export interface TeacherOnboardingResult {
  readonly userId: string;
  readonly teacherId: string;
  readonly name: string;
  readonly email: string;
  readonly status: string;
}

export namespace TeacherOnboardingService {
  export async function createTeacher(
    actorUserId: string,
    input: TeacherOnboardingInput,
    locale?: string
  ): Promise<TeacherOnboardingResult> {
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    // Permission check: must have teachers.create

    // Permission check: must have parents.create

    // Permission check: must have staff.create (System Admin only)
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.MANAGER_CREATE_ACCOUNT
    );
    if (!hasPermission) {
      throw new Error(t("insufficientPermissions"));
    }

    // Secondary check: actor must be super_admin
    const actorContext = await PermissionsService.getUserContext(actorUserId);
    if (!actorContext.isSuperAdmin && !actorContext.permissionGroups.includes(SystemPermissionGroupSlug.SUPER_ADMIN)) {
      throw new Error(t("manager.onlySuperAdminCanCreate"));
    }

    // Email uniqueness check
    const emailExists = await UserRepository.existsByEmail(input.email);
    if (emailExists) {
      throw new Error(t("user.emailAlreadyExists"));
    }

    // Determine permission group based on account type
    const targetGroupSlug =
      input.accountType === "admin"
        ? SystemPermissionGroupSlug.ACADEMY_ADMIN
        : SystemPermissionGroupSlug.STAFF_DEFAULT;

    // Transactional provisioning: user + staff profile + permission group
    return await db.transaction(async tx => {
      // Step 1: Create user record
      const user = await UserRepository.create(
        { name: input.name, email: input.email as Email, password: input.password },
        locale,
        tx
      );

      // Step 2: Create staff profile
      const staffProfile = await StaffProfileRepository.create(
        {
          userId: user.id,
          phone: input.phone,
          skypeId: input.skypeId,
          status: "ACTIVATED",
        },
        tx,
        locale
      );

      // Step 3: Assign to target permission group
      const targetGroup = await PermissionManagementRepository.listAllGroups(tx).then(groups =>
        groups.find(g => g.slug === targetGroupSlug)
      );
      if (!targetGroup) {
        throw new Error(t("permission.groupNotFound"));
      }
      await PermissionManagementRepository.bulkAssignUsersToGroup(
        [user.id],
        targetGroup.id,
        actorUserId,
        tx
      );

      logger.info("Manager onboarded successfully", {
        staffProfileId: staffProfile.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        accountType: input.accountType,
        assignedGroup: targetGroupSlug,
      });

      return {
        userId: user.id,
        staffProfileId: staffProfile.id,
        name: user.name,
        email: user.email,
        status: staffProfile.status,
        assignedGroupSlug: targetGroupSlug,
      };
    });
  }
}
```

*Step 4: Write service tests for TeacherOnboardingService*

Create `backend/services/teacher/test/teacher-onboarding.service.test.ts`:

```typescript
import { describe, test, expect, spyOn } from "bun:test";
import { db } from "@/backend/db/drizzleDb";
import { runInRollback } from "@/backend/db/test/test-utils";
import { TeacherOnboardingService } from "@/services/teacher/teacher-onboarding.service";
import { PermissionsService } from "@/services/auth/permissions.service";
import { UserRepository, TeacherRepository, PermissionManagementRepository } from "@/backend/db/repo";
import { AppPermission } from "@/shared/lib/enum";

describe("TeacherOnboardingService.createTeacher", () => {
  test("rejects unauthorized user", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(false);

    let error: unknown = null;
    try {
      await TeacherOnboardingService.createTeacher("actor-id", {
        name: "Test",
        email: "test@test.com",
        password: "password123",
        timezone: "UTC",
      });
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    expect((error as Error).message).toContain("permission");

    hasPermissionSpy.mockRestore();
  });

  test("creates teacher with full onboarding data", async () => {
    await runInRollback(async tx => {
      const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
      const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(false);

      const result = await TeacherOnboardingService.createTeacher(
        "actor-id",
        {
          name: "New Teacher",
          email: "newteacher@test.com",
          password: "password123",
          timezone: "America/New_York",
          nationality: "US",
          phone: "+1234567890",
          gender: "MALE",
          hourlyRate: "30.00",
          rateCurrency: "USD",
          beneficiaryName: "John Doe",
          bankName: "Test Bank",
          accountNumber: "123456789",
          iban: "US123456789",
        },
        "en"
      );

      expect(result.userId).toBeDefined();
      expect(result.teacherId).toBeDefined();
      expect(result.name).toBe("New Teacher");
      expect(result.email).toBe("newteacher@test.com");
      expect(result.status).toBe("ACTIVATED");

      hasPermissionSpy.mockRestore();
      existsByEmailSpy.mockRestore();
    });
  });

  test("rejects duplicate email", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(true);

    let error: unknown = null;
    try {
      await TeacherOnboardingService.createTeacher("actor-id", {
        name: "Dup Teacher",
        email: "existing@test.com",
        password: "password123",
        timezone: "UTC",
      });
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    expect((error as Error).message).toContain("email");

    hasPermissionSpy.mockRestore();
    existsByEmailSpy.mockRestore();
  });
});
```

*Step 5: Write service tests for ParentOnboardingService*

Create `backend/services/parent/test/parent-onboarding.service.test.ts`:

```typescript
import { describe, test, expect, spyOn } from "bun:test";
import { runInRollback } from "@/backend/db/test/test-utils";
import { ParentOnboardingService } from "@/services/parent/parent-onboarding.service";
import { PermissionsService } from "@/services/auth/permissions.service";
import { UserRepository } from "@/backend/db/repo";
import { AppPermission } from "@/shared/lib/enum";

describe("ParentOnboardingService.createParent", () => {
  test("rejects unauthorized user", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(false);

    let error: unknown = null;
    try {
      await ParentOnboardingService.createParent("actor-id", {
        name: "Test",
        email: "test@test.com",
        password: "password123",
      });
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    hasPermissionSpy.mockRestore();
  });

  test("creates parent with billing configuration", async () => {
    await runInRollback(async tx => {
      const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
      const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(false);

      const result = await ParentOnboardingService.createParent(
        "actor-id",
        {
          name: "New Parent",
          email: "newparent@test.com",
          password: "password123",
          phone: "+1234567890",
          invoiceType: "MONTHLY",
          feeAmount: "500.00",
          paymentMethod: "BANK_ACCOUNT",
          currency: "USD",
          timezone: "America/Chicago",
        },
        "en"
      );

      expect(result.userId).toBeDefined();
      expect(result.parentId).toBeDefined();
      expect(result.invoiceType).toBe("MONTHLY");
      expect(result.currency).toBe("USD");

      hasPermissionSpy.mockRestore();
      existsByEmailSpy.mockRestore();
    });
  });
});
```

*Step 6: Write service tests for ManagerOnboardingService*

Create `backend/services/staff/test/manager-onboarding.service.test.ts`:

```typescript
import { describe, test, expect, spyOn } from "bun:test";
import { runInRollback } from "@/backend/db/test/test-utils";
import { ManagerOnboardingService } from "@/services/staff/manager-onboarding.service";
import { PermissionsService } from "@/services/auth/permissions.service";
import { UserRepository } from "@/backend/db/repo";
import { AppPermission, SystemPermissionGroupSlug } from "@/shared/lib/enum";

describe("ManagerOnboardingService.createManager", () => {
  test("rejects non-super-admin user", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(false);

    let error: unknown = null;
    try {
      await ManagerOnboardingService.createManager("actor-id", {
        name: "Test",
        email: "test@test.com",
        password: "password123",
        accountType: "manager",
      });
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    hasPermissionSpy.mockRestore();
  });

  test("creates manager with admin account type", async () => {
    await runInRollback(async tx => {
      const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
      const getUserContextSpy = spyOn(PermissionsService, "getUserContext").mockResolvedValue({
        permissions: [],
        permissionGroups: [SystemPermissionGroupSlug.SUPER_ADMIN],
        isSuperAdmin: true,
        role: "Super Admin",
      });
      const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(false);

      const result = await ManagerOnboardingService.createManager(
        "super-admin-id",
        {
          name: "New Admin",
          email: "newadmin@test.com",
          password: "password123",
          accountType: "admin",
        },
        "en"
      );

      expect(result.userId).toBeDefined();
      expect(result.staffProfileId).toBeDefined();
      expect(result.assignedGroupSlug).toBe(SystemPermissionGroupSlug.ACADEMY_ADMIN);

      hasPermissionSpy.mockRestore();
      getUserContextSpy.mockRestore();
      existsByEmailSpy.mockRestore();
    });
  });

  test("creates manager with manager account type", async () => {
    await runInRollback(async tx => {
      const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
      const getUserContextSpy = spyOn(PermissionsService, "getUserContext").mockResolvedValue({
        permissions: [],
        permissionGroups: [SystemPermissionGroupSlug.SUPER_ADMIN],
        isSuperAdmin: true,
        role: "Super Admin",
      });
      const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(false);

      const result = await ManagerOnboardingService.createManager(
        "super-admin-id",
        {
          name: "New Manager",
          email: "newmanager@test.com",
          password: "password123",
          accountType: "manager",
        },
        "en"
      );

      expect(result.userId).toBeDefined();
      expect(result.assignedGroupSlug).toBe(SystemPermissionGroupSlug.STAFF_DEFAULT);

      hasPermissionSpy.mockRestore();
      getUserContextSpy.mockRestore();
      existsByEmailSpy.mockRestore();
    });
  });
});
```



**Success Criteria / Check Progress Points:**
- [ ] `TeacherOnboardingService.createTeacher()` is fully implemented with permission gating, email validation, and transactional orchestration
- [ ] `ParentOnboardingService.createParent()` is fully implemented with permission gating, email validation, and billing configuration
- [ ] `ManagerOnboardingService.createManager()` is fully implemented with super-admin-only check and account type mapping
- [ ] All services use `getBackendTranslations` for localized error messages
- [ ] All services delegate to repository layer (NO direct Drizzle imports)
- [ ] All multi-table writes are wrapped in `db.transaction()`
- [ ] Banking details are submitted via `TeacherBankingRepository.submitBankingDetails()` when provided
- [ ] Permission groups are assigned correctly (teacher→teacher_default, parent→parent_default, manager→academy_admin or staff_default)
- [ ] Manager creation enforces super-admin-only access (both permission check AND group check)
- [ ] Service tests verify permission gating (unauthorized rejection)
- [ ] Service tests verify successful creation with full data
- [ ] Service tests verify email collision detection
- [ ] Service tests verify transaction rollback behavior
- [ ] `bun run test:db` passes with zero failures
- [ ] `bun tsgo` passes with zero TypeScript errors
- [ ] NO imports from `drizzle-orm`, `backend/db/schema`, or `backend/db/index` in service files

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
