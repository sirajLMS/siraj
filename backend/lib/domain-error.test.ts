import { expect, test } from "bun:test";
import { GraphQLError } from "graphql";
import {
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  QuotaAlreadyDeletedError,
  QuotaLedgerError,
  QuotaNotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/backend/lib/errors";

test("DomainError extends GraphQLError", () => {
  const error = new NotFoundError("TEST", "test message");
  expect(error).toBeInstanceOf(GraphQLError);
});

test("DomainError extends Error (backward compatibility)", () => {
  const error = new NotFoundError("TEST", "test message");
  expect(error).toBeInstanceOf(Error);
});

test("extensions.code is set from constructor code", () => {
  const error = new NotFoundError("SUGGESTION", "not found");
  expect(error.extensions?.code).toBe("SUGGESTION_NOT_FOUND");
});

test("err.message is preserved", () => {
  const error = new NotFoundError("TEST", "hello world");
  expect(error.message).toBe("hello world");
});

test("err.code property is accessible", () => {
  const error = new NotFoundError("SUGGESTION", "msg");
  expect(error.code).toBe("SUGGESTION_NOT_FOUND");
});

test("name is set to the concrete class name", () => {
  expect(new NotFoundError("X", "m").name).toBe("NotFoundError");
  expect(new UnauthorizedError("m").name).toBe("UnauthorizedError");
});

test("all subclasses inherit GraphQLError", () => {
  expect(new UnauthorizedError("msg")).toBeInstanceOf(GraphQLError);
  expect(new ForbiddenError("msg")).toBeInstanceOf(GraphQLError);
  expect(new ValidationError("msg")).toBeInstanceOf(GraphQLError);
  expect(new ConflictError("msg")).toBeInstanceOf(GraphQLError);
  expect(new QuotaNotFoundError("msg")).toBeInstanceOf(GraphQLError);
  expect(new QuotaAlreadyDeletedError("msg")).toBeInstanceOf(GraphQLError);
  expect(new QuotaLedgerError("msg")).toBeInstanceOf(GraphQLError);
});

test("instanceof checks across the subclass chain", () => {
  const error = new NotFoundError("CODE", "msg");
  expect(error).toBeInstanceOf(DomainError);
  expect(error).toBeInstanceOf(NotFoundError);
  expect(error).toBeInstanceOf(GraphQLError);
  expect(error).toBeInstanceOf(Error);
});

test("QuotaNotFoundError inherits NotFoundError chain", () => {
  const error = new QuotaNotFoundError("quota msg");
  expect(error).toBeInstanceOf(NotFoundError);
  expect(error).toBeInstanceOf(DomainError);
  expect(error.code).toBe("QUOTA_NOT_FOUND");
  expect(error.extensions?.code).toBe("QUOTA_NOT_FOUND");
});

test("UnauthorizedError uses UNAUTHORIZED code", () => {
  const error = new UnauthorizedError("not allowed");
  expect(error.code).toBe("UNAUTHORIZED");
  expect(error.extensions?.code).toBe("UNAUTHORIZED");
});

test("ForbiddenError uses FORBIDDEN code", () => {
  const error = new ForbiddenError("no access");
  expect(error.code).toBe("FORBIDDEN");
  expect(error.extensions?.code).toBe("FORBIDDEN");
});

test("ValidationError uses VALIDATION code", () => {
  const error = new ValidationError("bad input");
  expect(error.code).toBe("VALIDATION");
  expect(error.extensions?.code).toBe("VALIDATION");
});

test("ConflictError uses CONFLICT code", () => {
  const error = new ConflictError("dup");
  expect(error.code).toBe("CONFLICT");
  expect(error.extensions?.code).toBe("CONFLICT");
});

test("ValidationError with custom code uses that code", () => {
  const error = new ValidationError("RECURRING_CLASS_DAYS_REQUIRED", "At least one day is required.");
  expect(error.code).toBe("RECURRING_CLASS_DAYS_REQUIRED");
  expect(error.extensions?.code).toBe("RECURRING_CLASS_DAYS_REQUIRED");
  expect(error.message).toBe("At least one day is required.");
});

test("ValidationError with custom code and options", () => {
  const error = new ValidationError("INVALID_DURATION", "Duration must be greater than zero.", {
    cause: new Error("root"),
  });
  expect(error.code).toBe("INVALID_DURATION");
  expect(error.extensions?.code).toBe("INVALID_DURATION");
  expect(error.message).toBe("Duration must be greater than zero.");
});

test("ValidationError without custom code defaults to VALIDATION", () => {
  const error = new ValidationError("bad input");
  expect(error.code).toBe("VALIDATION");
  expect(error.extensions?.code).toBe("VALIDATION");
  expect(error.message).toBe("bad input");
});
