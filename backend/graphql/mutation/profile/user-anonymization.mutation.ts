// Admin user-management mutation: permanent PII erasure (right-to-be-forgotten).
// Gated by the existing top-tier user-admin permission (USER_ADMIN_RESET_PASSWORD).
//
// Irreversible-write protections:
// - per-actor rate limit (fail-closed limiter) so a hijacked session cannot
//   bulk-erase users
// - step-up re-authentication: the admin must confirm with their OWN current
//   password, re-verified server-side before the erasure starts
//
// Data-retention note: immutable audit-log rows (protected by the
// prevent_audit_modification trigger) intentionally retain the erased person's
// name/email under the statutory audit-retention basis. WhatsApp message
// content and notification deliveries follow the configured retention policy.

import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { comparePassword } from "@/backend/lib/auth/password";
import { authRateLimiter, checkRateLimit } from "@/backend/lib/ratelimit";
import { UserAnonymizationService, UserService } from "@/backend/services";
import type { UserSelectType } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

/**
 * Rate-limit bucket per actor: anonymization is irreversible, so the gate
 * reuses the fail-closed auth limiter under a dedicated key namespace
 * (10 erasure attempts per 15 minutes per admin).
 */
const anonymizeRateLimitKey = (actorUserId: string) => `anonymize-user:${actorUserId}`;

gqlSchemaBuilder.mutationField("anonymizeUser", t =>
  t.boolean({
    authScopes: {
      $all: {
        permission: AppPermission.USER_ADMIN_RESET_PASSWORD,
        notImpersonating: true,
      },
    },
    description: "Anonymizes a person's PII and soft-deletes their user account. Irreversible.",
    args: {
      userId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      confirmPassword: t.arg.string({ required: true, directives: { constraint: { maxLength: 128 } } }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        const tErrors = ctx.t().errorsTranslations;
        throw new GraphQLError(tErrors.unauthorized, { extensions: { code: "UNAUTHENTICATED" } });
      }
      const actorUserId = ctx.user.id;

      const gate = await assertAnonymizationAllowed(actorUserId, args.confirmPassword, ctx.t().errorsTranslations);
      if (!gate.ok) {
        throw gate.error;
      }

      const result = await UserAnonymizationService.anonymizeAndSoftDeleteUser(
        args.userId,
        actorUserId,
        ctx.locale,
        undefined,
        ctx.ipAddress
      );
      return result.anonymized;
    },
  })
);

/**
 * Step-up gate for the irreversible anonymization write:
 * 1. per-actor rate limit — fail-closed: a limiter outage rejects instead of
 *    allowing unbounded erasure attempts
 * 2. re-authentication — the supplied confirmation password is verified
 *    against the ACTOR's own current password hash, never the target's
 */
export const assertAnonymizationAllowed = async (
  actorUserId: string,
  confirmPassword: string,
  errorsTranslations: ErrorsLabels
): Promise<{ ok: true } | { ok: false; error: GraphQLError }> => {
  const rateLimit = await checkRateLimit(anonymizeRateLimitKey(actorUserId), authRateLimiter, {
    failOpen: false,
  });
  if (!rateLimit.success) {
    return {
      ok: false,
      error: new GraphQLError(errorsTranslations.rateLimitExceeded, {
        extensions: { code: "TOO_MANY_ATTEMPTS" },
      }),
    };
  }

  const actor: UserSelectType | null = await UserService.findById(actorUserId);
  if (!actor) {
    return {
      ok: false,
      error: new GraphQLError(errorsTranslations.auth.invalidCredentials, { extensions: { code: "FORBIDDEN" } }),
    };
  }
  const passwordMatches = await comparePassword(confirmPassword, actor.password);
  if (!passwordMatches) {
    return {
      ok: false,
      error: new GraphQLError(errorsTranslations.auth.currentPasswordInvalid, { extensions: { code: "FORBIDDEN" } }),
    };
  }
  return { ok: true };
};
