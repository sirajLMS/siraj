import { describe, expect, test } from "bun:test";
import { AppPermission, isAppPermission, parseAppPermission } from "@/backend/enum/permissions/permission.enum";

const accountingCreditsManageKey = "accounting.credits_manage";
const accountingPayrollViewKey = "accounting.payroll_view";
const accountingPayrollManageKey = "accounting.payroll_manage";
const accountingReportsViewKey = "accounting.reports_view";
const accountingReportsManageKey = "accounting.reports_manage";
const accountingCarryoverViewKey = "accounting.carryover_view";
const accountingCarryoverManageKey = "accounting.carryover_manage";
const accountingExpensesViewKey = "accounting.expenses_view";
const accountingExpensesManageKey = "accounting.expenses_manage";
const accountingProfitsViewKey = "accounting.profits_view";
const whatsappConversationsViewKey = "whatsapp.conversations_view";
const whatsappConversationsManageKey = "whatsapp.conversations_manage";
const whatsappGroupsViewKey = "whatsapp.groups_view";
const whatsappGroupsManageKey = "whatsapp.groups_manage";

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

describe("AppPermission accounting payroll", () => {
  test("defines ACCOUNTING_PAYROLL_VIEW and ACCOUNTING_PAYROLL_MANAGE with their keys", () => {
    const viewValue: string = AppPermission.ACCOUNTING_PAYROLL_VIEW;
    const manageValue: string = AppPermission.ACCOUNTING_PAYROLL_MANAGE;
    expect(viewValue).toBe(accountingPayrollViewKey);
    expect(manageValue).toBe(accountingPayrollManageKey);
  });

  test("isAppPermission accepts the accounting payroll keys", () => {
    expect(isAppPermission(accountingPayrollViewKey)).toBe(true);
    expect(isAppPermission(accountingPayrollManageKey)).toBe(true);
  });

  test("parseAppPermission resolves the accounting payroll keys to the enum values", () => {
    expect(parseAppPermission(accountingPayrollViewKey)).toBe(AppPermission.ACCOUNTING_PAYROLL_VIEW);
    expect(parseAppPermission(accountingPayrollManageKey)).toBe(AppPermission.ACCOUNTING_PAYROLL_MANAGE);
  });
});

describe("AppPermission accounting reports", () => {
  test("defines ACCOUNTING_REPORTS_VIEW and ACCOUNTING_REPORTS_MANAGE with their keys", () => {
    const viewValue: string = AppPermission.ACCOUNTING_REPORTS_VIEW;
    const manageValue: string = AppPermission.ACCOUNTING_REPORTS_MANAGE;
    expect(viewValue).toBe(accountingReportsViewKey);
    expect(manageValue).toBe(accountingReportsManageKey);
  });

  test("isAppPermission accepts the accounting reports keys", () => {
    expect(isAppPermission(accountingReportsViewKey)).toBe(true);
    expect(isAppPermission(accountingReportsManageKey)).toBe(true);
  });

  test("parseAppPermission resolves the accounting reports keys to the enum values", () => {
    expect(parseAppPermission(accountingReportsViewKey)).toBe(AppPermission.ACCOUNTING_REPORTS_VIEW);
    expect(parseAppPermission(accountingReportsManageKey)).toBe(AppPermission.ACCOUNTING_REPORTS_MANAGE);
  });
});

describe("AppPermission accounting carryover", () => {
  test("defines ACCOUNTING_CARRYOVER_VIEW and ACCOUNTING_CARRYOVER_MANAGE with their keys", () => {
    const viewValue: string = AppPermission.ACCOUNTING_CARRYOVER_VIEW;
    const manageValue: string = AppPermission.ACCOUNTING_CARRYOVER_MANAGE;
    expect(viewValue).toBe(accountingCarryoverViewKey);
    expect(manageValue).toBe(accountingCarryoverManageKey);
  });

  test("isAppPermission accepts the accounting carryover keys", () => {
    expect(isAppPermission(accountingCarryoverViewKey)).toBe(true);
    expect(isAppPermission(accountingCarryoverManageKey)).toBe(true);
  });

  test("parseAppPermission resolves the accounting carryover keys to the enum values", () => {
    expect(parseAppPermission(accountingCarryoverViewKey)).toBe(AppPermission.ACCOUNTING_CARRYOVER_VIEW);
    expect(parseAppPermission(accountingCarryoverManageKey)).toBe(AppPermission.ACCOUNTING_CARRYOVER_MANAGE);
  });
});

describe("AppPermission accounting expenses", () => {
  test("defines ACCOUNTING_EXPENSES_VIEW and ACCOUNTING_EXPENSES_MANAGE with their keys", () => {
    const viewValue: string = AppPermission.ACCOUNTING_EXPENSES_VIEW;
    const manageValue: string = AppPermission.ACCOUNTING_EXPENSES_MANAGE;
    expect(viewValue).toBe(accountingExpensesViewKey);
    expect(manageValue).toBe(accountingExpensesManageKey);
  });

  test("isAppPermission accepts the accounting expenses keys", () => {
    expect(isAppPermission(accountingExpensesViewKey)).toBe(true);
    expect(isAppPermission(accountingExpensesManageKey)).toBe(true);
  });

  test("parseAppPermission resolves the accounting expenses keys to the enum values", () => {
    expect(parseAppPermission(accountingExpensesViewKey)).toBe(AppPermission.ACCOUNTING_EXPENSES_VIEW);
    expect(parseAppPermission(accountingExpensesManageKey)).toBe(AppPermission.ACCOUNTING_EXPENSES_MANAGE);
  });
});

describe("AppPermission accounting profits view", () => {
  test("defines ACCOUNTING_PROFITS_VIEW with the accounting.profits_view key", () => {
    const enumValue: string = AppPermission.ACCOUNTING_PROFITS_VIEW;
    expect(enumValue).toBe(accountingProfitsViewKey);
  });

  test("isAppPermission accepts the accounting.profits_view key", () => {
    expect(isAppPermission(accountingProfitsViewKey)).toBe(true);
  });

  test("parseAppPermission resolves the accounting.profits_view key to the enum value", () => {
    expect(parseAppPermission(accountingProfitsViewKey)).toBe(AppPermission.ACCOUNTING_PROFITS_VIEW);
  });

  test("no manage variant exists for the read-only profit & loss dashboard", () => {
    expect(isAppPermission("accounting.profits_manage")).toBe(false);
  });
});

describe("AppPermission whatsapp conversations", () => {
  test("defines WHATSAPP_CONVERSATIONS_VIEW and WHATSAPP_CONVERSATIONS_MANAGE with their keys", () => {
    const viewValue: string = AppPermission.WHATSAPP_CONVERSATIONS_VIEW;
    const manageValue: string = AppPermission.WHATSAPP_CONVERSATIONS_MANAGE;
    expect(viewValue).toBe(whatsappConversationsViewKey);
    expect(manageValue).toBe(whatsappConversationsManageKey);
  });

  test("isAppPermission accepts the whatsapp conversations keys", () => {
    expect(isAppPermission(whatsappConversationsViewKey)).toBe(true);
    expect(isAppPermission(whatsappConversationsManageKey)).toBe(true);
  });

  test("parseAppPermission resolves the whatsapp conversations keys to the enum values", () => {
    expect(parseAppPermission(whatsappConversationsViewKey)).toBe(AppPermission.WHATSAPP_CONVERSATIONS_VIEW);
    expect(parseAppPermission(whatsappConversationsManageKey)).toBe(AppPermission.WHATSAPP_CONVERSATIONS_MANAGE);
  });
});

describe("AppPermission whatsapp groups", () => {
  test("defines WHATSAPP_GROUPS_VIEW and WHATSAPP_GROUPS_MANAGE with their keys", () => {
    const viewValue: string = AppPermission.WHATSAPP_GROUPS_VIEW;
    const manageValue: string = AppPermission.WHATSAPP_GROUPS_MANAGE;
    expect(viewValue).toBe(whatsappGroupsViewKey);
    expect(manageValue).toBe(whatsappGroupsManageKey);
  });

  test("isAppPermission accepts the whatsapp groups keys", () => {
    expect(isAppPermission(whatsappGroupsViewKey)).toBe(true);
    expect(isAppPermission(whatsappGroupsManageKey)).toBe(true);
  });

  test("parseAppPermission resolves the whatsapp groups keys to the enum values", () => {
    expect(parseAppPermission(whatsappGroupsViewKey)).toBe(AppPermission.WHATSAPP_GROUPS_VIEW);
    expect(parseAppPermission(whatsappGroupsManageKey)).toBe(AppPermission.WHATSAPP_GROUPS_MANAGE);
  });
});

describe("AppPermission rejection paths", () => {
  test("isAppPermission rejects unknown permission keys", () => {
    expect(isAppPermission("accounting.credits_manage_typo")).toBe(false);
    expect(isAppPermission("accounting.payroll_view_typo")).toBe(false);
    expect(isAppPermission("accounting.reports_view_typo")).toBe(false);
    expect(isAppPermission("accounting.carryover_view_typo")).toBe(false);
    expect(isAppPermission("accounting.expenses_view_typo")).toBe(false);
    expect(isAppPermission("accounting.profits_view_typo")).toBe(false);
    expect(isAppPermission("whatsapp.conversations_view_typo")).toBe(false);
    expect(isAppPermission("whatsapp.conversations_manage_typo")).toBe(false);
    expect(isAppPermission("whatsapp.groups_view_typo")).toBe(false);
    expect(isAppPermission("whatsapp.groups_manage_typo")).toBe(false);
    expect(isAppPermission("unknown.permission")).toBe(false);
    expect(isAppPermission("")).toBe(false);
  });

  test("parseAppPermission returns null for unknown, null, and undefined keys", () => {
    expect(parseAppPermission("unknown.permission")).toBeNull();
    expect(parseAppPermission(null)).toBeNull();
    expect(parseAppPermission(undefined)).toBeNull();
  });
});
