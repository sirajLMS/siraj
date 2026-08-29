import { describe, expect, test } from "bun:test";
import { AppPermission, isAppPermission, parseAppPermission } from "@/backend/enum/permissions/permission.enum";

const accountingCreditsManageKey = "accounting.credits_manage";

describe("AppPermission accounting credits manage", () => {
  test("defines ACCOUNTING_CREDITS_MANAGE with the accounting.credits_manage key", () => {
    const enumValue: string = AppPermission.ACCOUNTING_CREDITS_MANAGE;
    expect(enumValue).toBe(accountingCreditsManageKey);
  });

  test("isAppPermission accepts the accounting.credits_manage key", () => {
    expect(isAppPermission(accountingCreditsManageKey)).toBe(true);
  });

  test("parseAppPermission resolves the accounting.credits_manage key to the enum value", () => {
    expect(parseAppPermission(accountingCreditsManageKey)).toBe(AppPermission.ACCOUNTING_CREDITS_MANAGE);
  });
});

describe("AppPermission rejection paths", () => {
  test("isAppPermission rejects unknown permission keys", () => {
    expect(isAppPermission("accounting.credits_manage_typo")).toBe(false);
    expect(isAppPermission("unknown.permission")).toBe(false);
    expect(isAppPermission("")).toBe(false);
  });

  test("parseAppPermission returns null for unknown, null, and undefined keys", () => {
    expect(parseAppPermission("unknown.permission")).toBeNull();
    expect(parseAppPermission(null)).toBeNull();
    expect(parseAppPermission(undefined)).toBeNull();
  });
});
