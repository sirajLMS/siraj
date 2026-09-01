import { describe, expect, it } from "bun:test";
import { DatabaseUnavailableError } from "@/backend/lib/errors";
import { toDatabaseUnavailableError } from "@/backend/lib/retry";
import { makeTransientError } from "@/backend/lib/test/helpers";
import { DATABASE_UNAVAILABLE_DIGEST } from "@/shared/constants";

describe("DatabaseUnavailableError", () => {
  it("carries the DATABASE_UNAVAILABLE extensions code", () => {
    const error = new DatabaseUnavailableError();
    expect(error.code).toBe("DATABASE_UNAVAILABLE");
    expect(error.extensions).toMatchObject({ code: "DATABASE_UNAVAILABLE" });
  });

  it("carries the digest sentinel that survives production error serialization", () => {
    const error = new DatabaseUnavailableError();
    expect(error.digest).toBe(DATABASE_UNAVAILABLE_DIGEST);
  });

  it("never exposes the underlying error in its message", () => {
    const cause = makeTransientError("ECONNREFUSED", "connect ECONNREFUSED 10.0.0.1:5432");
    const error = new DatabaseUnavailableError(undefined, { cause });
    expect(error.message).toBe("Database temporarily unavailable");
    expect(error.cause).toBe(cause);
  });
});

describe("toDatabaseUnavailableError", () => {
  it("converts ECONNRESET into DatabaseUnavailableError preserving the cause", () => {
    const original = makeTransientError("ECONNRESET", "read ECONNRESET");
    const converted = toDatabaseUnavailableError(original);
    expect(converted).toBeInstanceOf(DatabaseUnavailableError);
    expect(converted?.cause).toBe(original);
    expect(converted?.digest).toBe(DATABASE_UNAVAILABLE_DIGEST);
  });

  it("converts ETIMEDOUT errors", () => {
    expect(toDatabaseUnavailableError(makeTransientError("ETIMEDOUT"))).toBeInstanceOf(DatabaseUnavailableError);
  });

  it("converts ECONNREFUSED errors", () => {
    expect(toDatabaseUnavailableError(makeTransientError("ECONNREFUSED"))).toBeInstanceOf(DatabaseUnavailableError);
  });

  it("converts message-pattern transient errors (connection terminated)", () => {
    expect(toDatabaseUnavailableError(new Error("connection terminated"))).toBeInstanceOf(DatabaseUnavailableError);
  });

  it("passes an existing DatabaseUnavailableError through untouched", () => {
    const original = new DatabaseUnavailableError();
    expect(toDatabaseUnavailableError(original)).toBe(original);
  });

  it("converts driver-wrapper errors whose cause is transient (DrizzleQueryError shape)", () => {
    const cause = makeTransientError("ECONNREFUSED", "connect ECONNREFUSED 127.0.0.1:5432");
    const wrapped = new Error("Failed query: select 1", { cause });
    const converted = toDatabaseUnavailableError(wrapped);
    expect(converted).toBeInstanceOf(DatabaseUnavailableError);
    expect(converted?.cause).toBe(wrapped);
  });

  it("returns null for non-transient errors so callers surface the original", () => {
    expect(toDatabaseUnavailableError(new Error("duplicate key value violates unique constraint"))).toBeNull();
    expect(toDatabaseUnavailableError(new Error("Invalid credentials"))).toBeNull();
    expect(toDatabaseUnavailableError(null)).toBeNull();
    expect(toDatabaseUnavailableError(undefined)).toBeNull();
  });
});
