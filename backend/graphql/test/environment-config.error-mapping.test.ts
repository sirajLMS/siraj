import { describe, expect, spyOn, test } from "bun:test";
import { GraphQLError } from "graphql";

import { handleEnvConfigServiceError } from "@/backend/graphql/pothos/system/environment-config.pothos";
import { logger } from "@/backend/lib/logger";
import { EnvConfigServiceError } from "@/backend/services/system/environment-config.service";
import { getServerTranslations } from "@/shared/locale";

/**
 * Error-mapping contract for the env-config GraphQL surface
 * (`handleEnvConfigServiceError`, used by `executeEnvConfigMutation`).
 *
 * The security-relevant pin: an UNRECOGNIZED error (e.g. a drizzle
 * `DrizzleQueryError` from a failed `upsertSetting`) must never be rethrown
 * raw. Drizzle's wrapper message embeds the FULL bound parameters — for an
 * `env::` override upsert that includes the plaintext override value — so a
 * raw rethrow would echo secrets through the GraphQL error response. The
 * resolver must surface the stable localized internal-server-error copy plus
 * projected name/code only, and the same projection (no params) is what
 * reaches the log line.
 */

const SECRET_MARKER = "SUPER_SECRET_OVERRIDE_VALUE_9f8e7d6c";

/** Drizzle-shaped failure: wrapper message + params embed the plaintext value. */
function makeDrizzleShapedError(): Error & { query: string; params: string[] } {
  const error = new Error(`Failed query: insert into "system_settings" ... -- bound params: ["${SECRET_MARKER}"]`);
  return Object.assign(error, {
    name: "DrizzleQueryError",
    query: 'insert into "system_settings" ("key", "value") values ($1, $2)',
    params: [SECRET_MARKER],
    cause: { message: 'duplicate key value violates unique constraint "system_settings_key_unique"', code: "23505" },
  });
}

const tErrors = getServerTranslations("en").errorsTranslations;

/**
 * instanceof guard — keeps the GraphQLError assertions assertion-free
 * (oxlint no-unsafe-type-assertion: type guards instead of casts).
 */
function asGraphQLError(error: unknown): GraphQLError {
  if (error instanceof GraphQLError) {
    return error;
  }
  throw new Error("Expected the thrown value to be a GraphQLError");
}

describe("handleEnvConfigServiceError — known domain errors pass through", () => {
  test("ENOT_IN_REGISTRY maps to the localized notFound message with the stable code", () => {
    const raw = new EnvConfigServiceError("ENOT_IN_REGISTRY", "raw registry detail that must not surface");

    try {
      handleEnvConfigServiceError(raw, tErrors);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      const gqlError = asGraphQLError(error);
      expect(gqlError.message).toBe(tErrors.notFound);
      expect(gqlError.extensions.code).toBe("ENOT_IN_REGISTRY");
      expect(gqlError.message).not.toContain("raw registry detail");
    }
  });

  test("other domain codes map to the localized invalidInput message with the stable code", () => {
    const raw = new EnvConfigServiceError("ENOT_DB_MANAGED", "raw validation detail that must not surface");

    try {
      handleEnvConfigServiceError(raw, tErrors);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      const gqlError = asGraphQLError(error);
      expect(gqlError.message).toBe(tErrors.invalidInput);
      expect(gqlError.extensions.code).toBe("ENOT_DB_MANAGED");
    }
  });
});

describe("handleEnvConfigServiceError — unknown errors are projected, never echoed", () => {
  test("drizzle-shaped error with a secret in its params surfaces a message WITHOUT the marker", () => {
    const logSpy = spyOn(logger, "error");
    const raw = makeDrizzleShapedError();

    try {
      try {
        handleEnvConfigServiceError(raw, tErrors);
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        const gqlError = asGraphQLError(error);

        // Stable localized copy — the raw (param-embedding) message is gone.
        expect(gqlError.message).toBe(tErrors.internalServerError);
        expect(gqlError.message).not.toContain(SECRET_MARKER);

        // Only stable identifiers survive in extensions.
        expect(gqlError.extensions.code).toBe("INTERNAL_SERVER_ERROR");
        expect(gqlError.extensions.errorName).toBe("DrizzleQueryError");
        expect(gqlError.extensions.errorCode).toBe("23505");

        // The serialized error surface (message + extensions) is marker-free.
        expect(JSON.stringify({ message: gqlError.message, extensions: gqlError.extensions })).not.toContain(
          SECRET_MARKER
        );

        // The raw error is NOT attached as originalError/cause — it cannot
        // leak through error serializers that traverse those links.
        expect(gqlError.originalError).toBeUndefined();
        expect(gqlError.cause).toBeUndefined();
      }

      // The log line carries the projection only — never the params.
      const logged = logSpy.mock.calls.map(call => call.join(" ")).join("\n");
      expect(logged).toContain("DrizzleQueryError");
      expect(logged).not.toContain(SECRET_MARKER);
    } finally {
      logSpy.mockRestore();
    }
  });

  test("non-Error throwables map to the stable UnknownError projection", () => {
    const logSpy = spyOn(logger, "error");

    try {
      try {
        handleEnvConfigServiceError("primitive failure string", tErrors);
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        const gqlError = asGraphQLError(error);
        expect(gqlError.message).toBe(tErrors.internalServerError);
        expect(gqlError.extensions.code).toBe("INTERNAL_SERVER_ERROR");
        expect(gqlError.extensions.errorName).toBe("UnknownError");
        expect(gqlError.extensions.errorCode).toBeUndefined();
        expect(gqlError.message).not.toContain("primitive failure string");
      }
    } finally {
      logSpy.mockRestore();
    }
  });
});
