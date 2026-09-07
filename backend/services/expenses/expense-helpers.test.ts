import { describe, expect, test } from "bun:test";
import { ExpenseType } from "@/backend/enum";
import { DomainError, ValidationError } from "@/backend/lib";
import {
  assertExpenseIdShape,
  canonicalizeExpenseValue,
  countExpensesByType,
  pickChanged,
  pickDominantExpenseCurrency,
  sumExpenseValues,
  validateCreateInput,
  validateUpdateInput,
} from "@/backend/services/expenses/expense-helpers";
import type { CreateExpenseInput, ExpenseSelectType } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

const ACTOR_ID = "dddd1111-1111-4cc1-8111-111111111111";
const EXPENSE_ID = "dddd4444-4444-4cc4-8444-444444444444";

function assertIsErrorsLabels(value: unknown): asserts value is ErrorsLabels {
  if (value === null || typeof value !== "object") {
    throw new Error("tErrorsStub must be an object");
  }
}

function buildErrorsStub(): ErrorsLabels {
  const stub = {
    insufficientPermissions: "Insufficient permissions.",
    invalidInput: "Invalid input.",
    internalServerError: "Internal server error.",
    unknownName: "Unknown",
    expenses: {
      notFound: "Expense not found.",
      alreadyDeleted: "Expense is already deleted.",
      deleteViaUnpay: "This salary expense must be removed via the carryover Unpay flow.",
      typeImmutableForSalaries: "Type is read-only for Salaries expenses.",
      valueImmutableForSalaries: "Value is read-only for Salaries expenses.",
      salariesViaCarryoverOnly: "Salaries expenses are created through the carryover settlement flow.",
      titleRequired: "Title is required.",
      valueRequired: "Expense value is required.",
      valueInvalid: "Expense value must be a valid non-negative amount.",
      valueNegative: "Expense value cannot be negative.",
      currencyRequired: "Currency is required.",
      paymentDateInvalid: "Payment date must be a valid YYYY-MM-DD date.",
      expenseDateInvalid: "Expense month must be in YYYY-MM format.",
      createFailed: "Failed to persist the expense record.",
    },
    teacher: {
      teacherNotFound: (id: string) => `Teacher not found: ${id}`,
    },
  };
  assertIsErrorsLabels(stub);
  return stub;
}

const tErrors = buildErrorsStub();

/** Test-only narrowing: feeds a deliberately empty currency string into the validator. */
function assertIsCurrencyCode(value: string): asserts value is CurrencyCode {
  if (typeof value !== "string") throw new Error("expected a string");
}

function buildInput(overrides: Partial<CreateExpenseInput> = {}): CreateExpenseInput {
  return {
    title: "Office rent",
    type: ExpenseType.MARKETING,
    expenseValue: "100.00",
    expenseCurrency: CurrencyCode.SAR,
    paymentDate: "2026-01-15",
    expenseDate: "2026-01",
    createdByUserId: ACTOR_ID,
    ...overrides,
  };
}

function expectError(fn: () => void, code: string): void {
  let caught: unknown = null;
  try {
    fn();
  } catch (error) {
    caught = error;
  }
  expect(caught).not.toBeNull();
  if (!(caught instanceof DomainError)) {
    throw new Error(`expected a DomainError but got ${String(caught)}`);
  }
  expect(caught.code).toBe(code);
}

describe("validateCreateInput", () => {
  test("accepts a complete manual payload", () => {
    expect(() => validateCreateInput(buildInput(), tErrors)).not.toThrow();
  });

  test("rejects an empty title", () => {
    expectError(() => validateCreateInput(buildInput({ title: "   " }), tErrors), "VALIDATION");
  });

  test("rejects a missing value", () => {
    expectError(() => validateCreateInput(buildInput({ expenseValue: "" }), tErrors), "VALIDATION");
  });

  test("rejects a non-numeric value", () => {
    expectError(() => validateCreateInput(buildInput({ expenseValue: "not-a-number" }), tErrors), "VALIDATION");
  });

  test("rejects a negative value", () => {
    expectError(() => validateCreateInput(buildInput({ expenseValue: "-0.01" }), tErrors), "VALIDATION");
  });

  test("rejects a value with more than two decimals", () => {
    expectError(() => validateCreateInput(buildInput({ expenseValue: "10.999" }), tErrors), "VALIDATION");
  });

  test("rejects a malformed payment date", () => {
    expectError(() => validateCreateInput(buildInput({ paymentDate: "2026-1-5" }), tErrors), "PAYMENT_DATE_INVALID");
    expectError(() => validateCreateInput(buildInput({ paymentDate: "" }), tErrors), "PAYMENT_DATE_INVALID");
  });

  test("rejects a malformed expense month", () => {
    expectError(() => validateCreateInput(buildInput({ expenseDate: "2026-1" }), tErrors), "EXPENSE_DATE_INVALID");
    expectError(() => validateCreateInput(buildInput({ expenseDate: "" }), tErrors), "EXPENSE_DATE_INVALID");
  });

  test("rejects an out-of-range expense month", () => {
    expectError(() => validateCreateInput(buildInput({ expenseDate: "2026-13" }), tErrors), "EXPENSE_DATE_INVALID");
    expectError(() => validateCreateInput(buildInput({ expenseDate: "2026-00" }), tErrors), "EXPENSE_DATE_INVALID");
  });

  test("rejects a malformed teacher id", () => {
    expectError(() => validateCreateInput(buildInput({ teacherId: "not-a-uuid" }), tErrors), "TEACHER_NOT_FOUND");
  });

  test("rejects a malformed currency-empty payload", () => {
    const emptyCurrency = "";
    assertIsCurrencyCode(emptyCurrency);
    expectError(() => validateCreateInput(buildInput({ expenseCurrency: emptyCurrency }), tErrors), "VALIDATION");
  });

  test("rejects a malformed source entity id", () => {
    expectError(() => validateCreateInput(buildInput({ sourceEntityId: "junk" }), tErrors), "VALIDATION");
  });
});

describe("validateUpdateInput", () => {
  test("accepts an id-only patch", () => {
    expect(() => validateUpdateInput({ id: EXPENSE_ID, actorUserId: ACTOR_ID }, tErrors)).not.toThrow();
  });

  test("rejects a blank title patch", () => {
    let caught: unknown = null;
    try {
      validateUpdateInput({ id: EXPENSE_ID, actorUserId: ACTOR_ID, title: "  " }, tErrors);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ValidationError);
  });

  test("rejects a negative value patch", () => {
    expectError(
      () => validateUpdateInput({ id: EXPENSE_ID, actorUserId: ACTOR_ID, expenseValue: "-5" }, tErrors),
      "VALIDATION"
    );
  });

  test("rejects malformed date patches", () => {
    expectError(
      () => validateUpdateInput({ id: EXPENSE_ID, actorUserId: ACTOR_ID, paymentDate: "15-01-2026" }, tErrors),
      "PAYMENT_DATE_INVALID"
    );
    expectError(
      () => validateUpdateInput({ id: EXPENSE_ID, actorUserId: ACTOR_ID, expenseDate: "2026-1" }, tErrors),
      "EXPENSE_DATE_INVALID"
    );
    expectError(
      () => validateUpdateInput({ id: EXPENSE_ID, actorUserId: ACTOR_ID, expenseDate: "2026-13" }, tErrors),
      "EXPENSE_DATE_INVALID"
    );
  });

  test("skips validation for fields explicitly patched to null", () => {
    expect(() =>
      validateUpdateInput(
        {
          id: EXPENSE_ID,
          actorUserId: ACTOR_ID,
          title: null,
          expenseValue: null,
          paymentDate: null,
          expenseDate: null,
        },
        tErrors
      )
    ).not.toThrow();
  });
});

describe("canonicalizeExpenseValue", () => {
  test("renames single-decimal, trimmed, and padded inputs to the two-decimal form", () => {
    expect(canonicalizeExpenseValue("1.5")).toBe("1.50");
    expect(canonicalizeExpenseValue(" 1.50 ")).toBe("1.50");
    expect(canonicalizeExpenseValue("2500")).toBe("2500.00");
    expect(canonicalizeExpenseValue("0")).toBe("0.00");
  });

  test("falls back to the trimmed input for unparseable amounts", () => {
    expect(canonicalizeExpenseValue(" abc ")).toBe("abc");
  });
});

describe("assertExpenseIdShape", () => {
  test("rejects a non-uuid id with EXPENSE_NOT_FOUND", () => {
    expectError(() => assertExpenseIdShape("nope", tErrors), "EXPENSE_NOT_FOUND");
  });

  test("accepts a canonical uuid", () => {
    expect(() => assertExpenseIdShape(EXPENSE_ID, tErrors)).not.toThrow();
  });
});

function buildRow(overrides: Partial<ExpenseSelectType> = {}): ExpenseSelectType {
  return {
    id: EXPENSE_ID,
    teacherId: null,
    teacherName: null,
    title: "Office rent",
    type: ExpenseType.MARKETING,
    expenseValue: "100.00",
    expenseCurrency: CurrencyCode.SAR,
    paymentDate: "2026-01-15",
    expenseDate: "2026-01",
    note: null,
    sourceEntity: null,
    sourceEntityId: null,
    createdByUserId: ACTOR_ID,
    deletedAt: null,
    deletedByUserId: null,
    deletedReason: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("pickChanged", () => {
  test("returns only fields that actually changed", () => {
    const existing = buildRow();
    const previous = pickChanged(existing, { title: "Storage rent", paymentDate: "2026-01-15" });
    expect(previous).toEqual({ title: "Office rent" });
  });

  test("omits fields patched to the same value", () => {
    expect(pickChanged(buildRow(), { title: "Office rent" })).toEqual({});
  });

  test("omits undefined patch entries", () => {
    expect(pickChanged(buildRow(), { title: undefined })).toEqual({});
  });
});

describe("sumExpenseValues", () => {
  test("sums two-decimal amounts without float drift", () => {
    const rows = [
      { expenseValue: "100.00" },
      { expenseValue: "25.50" },
      { expenseValue: "0.25" },
      { expenseValue: "40" },
    ];
    expect(sumExpenseValues(rows)).toBe("165.75");
  });

  test("an empty page sums to zero", () => {
    expect(sumExpenseValues([])).toBe("0.00");
  });

  test("negative stored amounts render with the minus sign", () => {
    expect(sumExpenseValues([{ expenseValue: "-20.00" }, { expenseValue: "5.00" }])).toBe("-15.00");
  });

  test("a malformed stored amount contributes zero", () => {
    expect(sumExpenseValues([{ expenseValue: "not-a-number" }, { expenseValue: "5.00" }])).toBe("5.00");
  });

  test("a single-decimal stored amount pads to two decimals", () => {
    expect(sumExpenseValues([{ expenseValue: "5.5" }])).toBe("5.50");
  });
});

describe("pickDominantExpenseCurrency", () => {
  test("the currency with the most rows wins", () => {
    const rows = [
      { expenseCurrency: CurrencyCode.USD },
      { expenseCurrency: CurrencyCode.SAR },
      { expenseCurrency: CurrencyCode.SAR },
    ];
    expect(pickDominantExpenseCurrency(rows)).toBe(CurrencyCode.SAR);
  });

  test("an empty page falls back to the default report currency", () => {
    expect(pickDominantExpenseCurrency([])).toBe(CurrencyCode.SAR);
  });

  test("a tied currency count keeps the earliest-seen currency", () => {
    const rows = [{ expenseCurrency: CurrencyCode.USD }, { expenseCurrency: CurrencyCode.SAR }];
    expect(pickDominantExpenseCurrency(rows)).toBe(CurrencyCode.USD);
  });
});

describe("countExpensesByType", () => {
  test("counts rows per type with zeroes for absent types", () => {
    const rows = [{ type: ExpenseType.MARKETING }, { type: ExpenseType.MARKETING }, { type: ExpenseType.SALARIES }];
    expect(countExpensesByType(rows)).toEqual({
      [ExpenseType.SALARIES]: 1,
      [ExpenseType.MARKETING]: 2,
      [ExpenseType.LOGISTICS]: 0,
      [ExpenseType.TECHNOLOGY]: 0,
    });
  });
});
