import { describe, expect, spyOn, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { PermissionManagementRepository } from "@/backend/db/repo/permissions";
import { UserRepository } from "@/backend/db/repo/users";
import { permissionGroups } from "@/backend/db/schema";
import { createTestUserWithDefaults, runInRollback } from "@/backend/db/test/test-utils";
import { SystemPermissionGroupSlug } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { GeneralUserOnboardingService } from "@/backend/services/user/general-user-onboarding.service";
import { errorsEn } from "@/shared/locale/en/errors";

const DEFAULT_ACTOR_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const NONEXISTENT_SLUG = `nonexistent-${randomUUID()}`;

const tErrors = errorsEn;

function generateTestPassword(): string {
  return `TestPass-${randomUUID().slice(0, 8)}!`;
}

function generateTestEmail(): string {
  return `test-${randomUUID()}@example.com`;
}

function buildValidInput(): {
  name: string;
  email: string;
  password: string;
  groupSlug: string;
} {
  return {
    name: "General User",
    email: generateTestEmail(),
    password: generateTestPassword(),
    groupSlug: SystemPermissionGroupSlug.STAFF_DEFAULT,
  };
}

interface MockOptions {
  hasPermission?: boolean;
  existsByEmail?: boolean;
  findGroupBySlug?: { id: string; slug: string; isSystem: boolean } | null;
}

function setupServiceSpies(opts: MockOptions = {}): { mockRestore: () => void }[] {
  const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(opts.hasPermission ?? true);
  const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(opts.existsByEmail ?? false);
  const findGroupBySlugSpy = spyOn(PermissionManagementRepository, "findGroupBySlug").mockResolvedValue(
    opts.findGroupBySlug !== undefined
      ? opts.findGroupBySlug
      : {
          id: "group-1",
          slug: SystemPermissionGroupSlug.STAFF_DEFAULT,
          isSystem: true,
        }
  );
  return [hasPermissionSpy, existsByEmailSpy, findGroupBySlugSpy];
}

async function expectRejection(fn: () => Promise<unknown>): Promise<Error> {
  let error: unknown = null;
  try {
    await fn();
  } catch (e) {
    error = e;
  }
  expect(error).not.toBeNull();
  if (error instanceof Error) return error;
  return new Error(String(error));
}

function restoreSpies(...spies: { mockRestore: () => void }[]) {
  for (const spy of spies) spy.mockRestore();
}

function testRejection(
  name: string,
  inputOverrides: Partial<ReturnType<typeof buildValidInput>>,
  opts: MockOptions,
  assertError: (error: Error) => void
): void {
  test(name, async () => {
    const spies = setupServiceSpies(opts);
    const input = { ...buildValidInput(), ...inputOverrides };
    const error = await expectRejection(() =>
      GeneralUserOnboardingService.createGeneralUser(DEFAULT_ACTOR_ID, input, "en")
    );
    assertError(error);
    restoreSpies(...spies);
  });
}

describe("GeneralUserOnboardingService.createGeneralUser", () => {
  test("creates a general user with a valid non-specialized group", async () => {
    await runInRollback(async txContext => {
      let [group] = await txContext
        .select()
        .from(permissionGroups)
        .where(eq(permissionGroups.slug, SystemPermissionGroupSlug.STAFF_DEFAULT))
        .limit(1);

      if (!group) {
        [group] = await txContext
          .insert(permissionGroups)
          .values({
            slug: SystemPermissionGroupSlug.STAFF_DEFAULT,
            name: "Staff Default",
            isSystem: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
      }

      const actor = await createTestUserWithDefaults(txContext);
      const spies = setupServiceSpies({ existsByEmail: false, findGroupBySlug: group });

      const result = await GeneralUserOnboardingService.createGeneralUser(actor.id, buildValidInput(), "en", txContext);

      expect(result.user).toBeDefined();
      expect(result.user.id).toBeDefined();
      expect(result.assignedGroupSlug).toBe(SystemPermissionGroupSlug.STAFF_DEFAULT);

      restoreSpies(...spies);
    });
  });

  testRejection("rejects duplicate email", {}, { existsByEmail: true }, error =>
    expect(error.message).toContain("email")
  );

  const SPECIALIZED_SLUGS = [
    ["student_default", SystemPermissionGroupSlug.STUDENT_DEFAULT],
    ["teacher_default", SystemPermissionGroupSlug.TEACHER_DEFAULT],
    ["parent_default", SystemPermissionGroupSlug.PARENT_DEFAULT],
  ] as const;

  for (const [label, slug] of SPECIALIZED_SLUGS) {
    test(`rejects specialized group: ${label}`, async () => {
      const error = await expectRejection(() =>
        GeneralUserOnboardingService.createGeneralUser(
          DEFAULT_ACTOR_ID,
          { ...buildValidInput(), groupSlug: slug },
          "en"
        )
      );
      expect(error.message).toBe(tErrors.specializedGroupNotAllowed);
    });
  }

  testRejection(
    "rejects invalid group slug when group does not exist",
    { groupSlug: NONEXISTENT_SLUG },
    { findGroupBySlug: null },
    error => expect(error.message).toContain("not found")
  );

  testRejection("rejects when actor lacks STAFF_CREATE permission", {}, { hasPermission: false }, error =>
    expect(error.message).toContain("permission")
  );

  testRejection("rejects weak password", { password: "weak" }, { existsByEmail: false }, error =>
    expect(error.message).toContain("Password")
  );
});
