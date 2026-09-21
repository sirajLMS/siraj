import { randomUUID } from "node:crypto";
import { hashSync } from "bcryptjs";
import { GraphQLError } from "graphql";
import { cookies, headers } from "next/headers";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ChangePasswordInputPothosObject,
  DemoLoginInputPothosObject,
  LoginInputPothosObject,
  LoginResponsePothosObject,
  RefreshTokenResponsePothosObject,
} from "@/backend/graphql/pothos";
import { requireAuthWithRateLimit } from "@/backend/graphql/shared";
import {
  extractTokenFromHeader,
  generateAccessToken,
  generateRefreshToken,
  isTransientError,
  retryTransient,
  verifyToken,
} from "@/backend/lib";
import { setAuthCookies as applyAuthCookies, clearAuthCookies } from "@/backend/lib/auth/cookies";
import { createAuthSession } from "@/backend/lib/auth/createAuthSession";
import { comparePassword } from "@/backend/lib/auth/password";
import { getBooleanEnv } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import { authRateLimiter, checkRateLimit } from "@/backend/lib/ratelimit";
import {
  AuthPasswordService,
  DemoAuthService,
  ImpersonationService,
  LoginAuditService,
  PermissionGroupSimulationService,
  RateLimitService,
  SessionService,
  UserService,
} from "@/backend/services";
import { purgeOrphanSession } from "@/backend/services/auth/session.service";
import type { SessionSelectType, UserReturnType, UserSelectType } from "@/backend/types";
import { AuthUtils } from "@/backend/utils";

function setAuthCookies(ctx: BaseContext, sessionId: string, refreshToken: string, accessToken?: string) {
  applyAuthCookies(ctx.cookies, sessionId, refreshToken, accessToken);
}

/**
 * Fixed input string whose bcrypt hash is compared when the login email matches
 * no user. Running the same bcrypt cost as real password verification keeps the
 * unknown-email failure path indistinguishable in time from the known-email
 * wrong-password path.
 */
const TIMING_EQUALIZER_PAD = "siraj-timing-equalizer-1f4c9d";
const DUMMY_HASH_ROUNDS = 12;

// Precomputed at module load so no request thread ever runs the synchronous
// bcrypt hash; the unknown-email failure path only pays an async compare.
const DUMMY_PASSWORD_HASH = hashSync(TIMING_EQUALIZER_PAD, DUMMY_HASH_ROUNDS);

/**
 * Execute a rate-limit operation with fail-open behavior for transient errors.
 * Non-transient errors are re-thrown (fail-closed) to prevent silently disabling
 * brute-force protection on persistent failures.
 */
async function failOpen<T>(operation: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isTransientError(error)) {
      logger.error(`${operation} failed (transient infrastructure error), failing open`);
      return fallback;
    }
    throw error;
  }
}

async function resolveUserFromSession(
  sessionId: string
): Promise<{ session: SessionSelectType | null; user: UserSelectType | null }> {
  // skipUserCheck: the caller immediately fetches the user via findById below,
  // so the findSafeById verification inside validateSession would be redundant.
  const session = await SessionService.validateSession(sessionId, { skipUserCheck: true });
  if (!session?.userId) return { session: session ?? null, user: null };

  const user = (await UserService.findById(session.userId)) ?? null;
  if (!user) {
    logger.warn("[RefreshToken] Session found but user not found, purging orphan session", {
      userId: session.userId,
      sessionId,
    });
    await purgeOrphanSession(sessionId, session.userId);
    return { session: null, user: null };
  }
  return { session, user };
}

async function resolveUserFromRefreshToken(
  refreshToken: string
): Promise<{ session: SessionSelectType | null; user: UserSelectType | null }> {
  const payload = await verifyToken(refreshToken);
  if (payload?.type !== "refresh") return { session: null, user: null };

  const user = (await UserService.findById(payload.userId)) ?? null;
  if (!user) return { session: null, user: null };

  const session = (await SessionService.findByUserId(user.id)) ?? null;
  if (!session) {
    logger.warn("[RefreshToken] User found but no session exists", {
      userId: user.id,
    });
  }
  return { session, user };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSessionPayload(payload: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(payload);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function logStaleRefreshTokenJti(sessionJti: string, cookieJti: string): void {
  logger.warn("[RefreshToken] Stale refresh_token JTI with valid session_id; allowing rotation", {
    sessionJti,
    cookieJti,
  });
}

function warnIfStaleRefreshTokenJti(
  refreshToken: string | undefined,
  refreshPayload: Awaited<ReturnType<typeof verifyToken>> | null,
  session: SessionSelectType
): void {
  if (!refreshToken || !refreshPayload?.jti || !session.payload) return;

  const sessionData = parseSessionPayload(session.payload);
  const sessionJti = sessionData?.refreshTokenJti;
  if (typeof sessionJti === "string" && sessionJti !== refreshPayload.jti) {
    logStaleRefreshTokenJti(sessionJti, refreshPayload.jti);
  }
}

function jtiMatchesSession(
  refreshPayload: Awaited<ReturnType<typeof verifyToken>> | null,
  session: SessionSelectType
): boolean {
  if (!refreshPayload?.jti && !session.payload) return true;
  if (!refreshPayload?.jti || !session.payload) return false;

  const sessionData = parseSessionPayload(session.payload);
  const sessionJti = sessionData?.refreshTokenJti;
  return !(typeof sessionJti === "string" && sessionJti !== refreshPayload.jti);
}

async function validateRefreshTokenJti(
  refreshToken: string | undefined,
  session: SessionSelectType,
  resolvedViaSessionId = false
): Promise<boolean> {
  // A valid session_id cookie is authoritative. Stale refresh_token cookies can linger
  // after rotation (e.g. client still holds pre-refresh cookie while session JTI updated).
  if (resolvedViaSessionId) {
    if (refreshToken) {
      const refreshPayload = await verifyToken(refreshToken);
      warnIfStaleRefreshTokenJti(refreshToken, refreshPayload, session);
    }
    return true;
  }

  const refreshPayload = refreshToken ? await verifyToken(refreshToken) : null;
  return jtiMatchesSession(refreshPayload, session);
}

export async function rotateTokensAndSession(
  user: UserSelectType,
  session: SessionSelectType,
  ctx: BaseContext,
  rawSessionId?: string
): Promise<{ token: string; user: UserReturnType } | null> {
  const sessionIdForUpdate = rawSessionId ?? session.hashedId;
  const tErrors = ctx.t().errorsTranslations;
  const newAccessToken =
    (rawSessionId ? await ImpersonationService.issueAccessTokenForSession(user.id, rawSessionId) : null) ??
    (rawSessionId ? await PermissionGroupSimulationService.issueAccessTokenForSession(user.id, rawSessionId) : null) ??
    (await generateAccessToken(user.id, user.email));
  const newRefreshToken = await generateRefreshToken(user.id, user.email);

  const newPayload = await verifyToken(newRefreshToken);
  const newJti = newPayload?.jti;

  const sessionPayload = session.payload ? JSON.parse(session.payload) : {};
  sessionPayload.refreshTokenJti = newJti;

  // Use the raw (plaintext) session ID for the update call — the repository
  // hashes it internally before storage lookup.
  await SessionService.updateSession({
    hashedId: sessionIdForUpdate,
    userId: session.userId,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    payload: JSON.stringify(sessionPayload),
  });

  // The cookie must store the *raw* session ID so it can be looked up again.
  if (rawSessionId) {
    setAuthCookies(ctx, rawSessionId, newRefreshToken, newAccessToken);
  }

  // Reuse the already-loaded `user` when not impersonating (effectiveUserId === user.id).
  // Only fetch from DB when impersonating (effectiveUserId !== user.id).
  const effectiveUserId = ctx.isImpersonating && ctx.user ? ctx.user.id : user.id;
  let effectiveUser: UserSelectType;
  if (effectiveUserId === user.id) {
    effectiveUser = user;
  } else {
    const impersonatedUser = await UserService.findById(effectiveUserId);
    if (!impersonatedUser) {
      throw new GraphQLError(tErrors.auth.impersonationTargetNotFound, {
        extensions: { code: "FORBIDDEN" },
      });
    }
    effectiveUser = impersonatedUser;
  }

  return { token: newAccessToken, user: AuthUtils.toSafeUser(AuthUtils.toUserReturnType(effectiveUser)) };
}

gqlSchemaBuilder.mutationFields(t => ({
  login: t.field({
    type: LoginResponsePothosObject,
    args: {
      input: t.arg({ type: LoginInputPothosObject, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const { email, password } = args.input;
      const ipAddress = ctx.ipAddress ?? "127.0.0.1";
      const tErrors = ctx.t().errorsTranslations;

      // 0. Enforce auth rate limit before any credential checks.
      // checkRateLimit is fail-closed: cache outages reject logins rather
      // than unconditionally allowing them.
      const rateLimitResult = await checkRateLimit(ipAddress, authRateLimiter);
      if (!rateLimitResult.success) {
        throw new GraphQLError(tErrors.auth.tooManyLoginAttempts, {
          extensions: { code: "TOO_MANY_ATTEMPTS" },
        });
      }

      // 1. Check if already locked
      // Fail-open: if DB is cold-starting, proceed with credential verification
      const isLocked = await failOpen("isLocked check", () => RateLimitService.isLocked(ipAddress, email.value), false);
      if (isLocked) {
        throw new GraphQLError(tErrors.auth.tooManyLoginAttempts, {
          extensions: { code: "TOO_MANY_ATTEMPTS" },
        });
      }

      let user: UserSelectType | null;
      try {
        user = (await retryTransient(() => UserService.findByEmail(email.value))) ?? null;
      } catch (err) {
        logger.error(err);
        throw new GraphQLError(tErrors.auth.serviceUnavailable, {
          // ← compile-time ✅
          extensions: { code: "SERVICE_UNAVAILABLE" },
        });
      }

      if (!user) {
        // Timing-equalize with the found-user path: run a real bcrypt compare
        // against a valid dummy hash so response latency does not reveal email
        // existence.
        await comparePassword(password, DUMMY_PASSWORD_HASH);
        // Still record attempt even if user doesn't exist to prevent enumeration
        await failOpen("recordAttempt (user not found)", () => RateLimitService.recordAttempt(ipAddress, email.value), {
          attempts: 0,
          lockedUntil: null,
          isLocked: false,
        });
        await LoginAuditService.recordUnknownEmailLoginFailure(email.value, ipAddress);
        throw new GraphQLError(tErrors.auth.invalidCredentials, {
          extensions: { code: "INVALID_CREDENTIALS" },
        });
      }

      // 2. Verify password
      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        // Record failed attempt
        // Fail-open: cold-start recordAttempt failure should not block login flow
        const result = await failOpen(
          "recordAttempt (invalid password)",
          () => RateLimitService.recordAttempt(ipAddress, email.value),
          { attempts: 0, lockedUntil: null, isLocked: false }
        );
        await LoginAuditService.recordWrongPasswordLoginFailure(user.id, ipAddress);
        if (result.isLocked) {
          throw new GraphQLError(tErrors.auth.accountLocked, {
            extensions: { code: "TOO_MANY_ATTEMPTS" },
          });
        }
        throw new GraphQLError(tErrors.auth.invalidCredentials, {
          extensions: { code: "INVALID_CREDENTIALS" },
        });
      }

      if (user.status === "DEACTIVATED") {
        throw new GraphQLError(tErrors.auth.accountDeactivated, {
          // ← compile-time ✅
          extensions: { code: "ACCOUNT_DEACTIVATED" },
        });
      }

      // 3. Successful login - reset attempts
      // Fail-open: cold-start resetAttempts failure should not block successful login
      await failOpen("resetAttempts", () => RateLimitService.resetAttempts(ipAddress, email.value), undefined);

      // Generate tokens and create session in database.
      // Store session metadata only, not sensitive tokens.
      // createAuthSession is NOT retried — it's a non-idempotent write (generates a
      // fresh randomUUID sessionId on each call). If it throws transient, the
      // resolver catches and returns SERVICE_UNAVAILABLE so the frontend can retry
      // the entire login flow.
      try {
        const { accessToken, refreshToken, sessionId } = await createAuthSession(user.id, user.email);

        // Set httpOnly cookies for session and refresh token
        setAuthCookies(ctx, sessionId, refreshToken, accessToken);

        await LoginAuditService.recordLoginSuccess(user.id, ipAddress);

        return {
          token: accessToken,
          user: AuthUtils.toSafeUser(user),
        };
      } catch (err) {
        logger.error(err);
        throw new GraphQLError(tErrors.auth.serviceUnavailable, {
          // ← compile-time ✅
          extensions: { code: "SERVICE_UNAVAILABLE" },
        });
      }
    },
  }),

  /**
   * Special GraphQL endpoint for demo fast login.
   * This endpoint logs in a user using the provided permission group slug without requiring a password.
   * It is intended strictly for demonstration purposes and is secured by environment variables.
   *
   * @see `DemoAuthService.loginWithGroupSlug` (which uses `db.query.permissionGroups`, `db.query.userPermissionGroups`, `db.query.users`)
   * @see `SessionService.createSession` (which uses `db.insert(sessions)`)
   */
  demoLogin: t.field({
    type: LoginResponsePothosObject,
    description:
      "Special GraphQL endpoint for demo fast login. It bypasses password checks and logs in a user using the provided permission group slug. Intended strictly for demonstration purposes and secured by environment variables.",
    args: {
      input: t.arg({ type: DemoLoginInputPothosObject, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      const ipAddress = ctx.ipAddress ?? "127.0.0.1";

      // 0. Enforce auth rate limit before any checks (fail-closed on cache
      // errors, mirroring login)
      const rateLimitResult = await checkRateLimit(ipAddress, authRateLimiter);
      if (!rateLimitResult.success) {
        throw new GraphQLError(tErrors.auth.tooManyLoginAttempts, {
          // ← compile-time ✅
          extensions: { code: "TOO_MANY_ATTEMPTS" },
        });
      }

      const isDemo = getBooleanEnv("IS_DEMO");
      if (!isDemo) {
        throw new GraphQLError(tErrors.auth.demoLoginNotEnabled, {
          // ← compile-time ✅
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      // Defense-in-depth: hard-block demoLogin in real production deployments
      // even if IS_DEMO is accidentally set to a truthy value.
      // Reject on ANY Vercel deployment (preview or production), unless ALLOW_VERCEL_DEMO=true is explicitly set.
      const allowVercelDemo = getBooleanEnv("ALLOW_VERCEL_DEMO");
      if (!allowVercelDemo) {
        const isVercelDeploy = Boolean(process.env.VERCEL_ENV);
        const isProductionDeployment = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
        if (isVercelDeploy || isProductionDeployment) {
          throw new GraphQLError(tErrors.auth.demoLoginNotEnabled, {
            extensions: { code: "UNAUTHENTICATED" },
          });
        }
      }

      const { groupSlug } = args.input;

      try {
        const result = await DemoAuthService.loginWithGroupSlug(groupSlug, tErrors);
        setAuthCookies(ctx, result.sessionId, result.refreshToken, result.accessToken);
        return {
          token: result.accessToken,
          user: result.user,
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        // Expected rejections (excluded group slug, missing demo user, etc.) — not crashes.
        logger.logDomainError("Demo login failed", { error: err, groupSlug });
        throw new GraphQLError(tErrors.auth.demoLoginFailed, {
          // ← compile-time ✅
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
    },
  }),

  refreshToken: t.field({
    type: RefreshTokenResponsePothosObject,
    nullable: true,
    resolve: async (_parent, _args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;

      const rateLimitResult = await checkRateLimit(ctx.ipAddress ?? "[unknown]", authRateLimiter);
      if (!rateLimitResult.success) {
        throw new GraphQLError(tErrors.auth.tooManyLoginAttempts, {
          extensions: { code: "TOO_MANY_ATTEMPTS" },
        });
      }

      const sessionId = ctx.sessionId;
      const refreshToken = ctx.refreshToken;

      if (!sessionId && !refreshToken) {
        return null;
      }

      let session: SessionSelectType | null = null;
      let user: UserSelectType | null = null;
      let resolvedViaSessionId = false;

      if (sessionId) {
        const result = await resolveUserFromSession(sessionId);
        session = result.session;
        user = result.user;
        resolvedViaSessionId = Boolean(user);
      }

      if (!user && refreshToken) {
        const result = await resolveUserFromRefreshToken(refreshToken);
        session = result.session;
        user = result.user;
      }

      if (!user || !session) {
        return null;
      }

      if (!(await validateRefreshTokenJti(refreshToken, session, resolvedViaSessionId))) {
        return null;
      }

      // When the session_id cookie is missing or stale but refresh_token is valid,
      // issue a fresh session so SSR (getServerUserContext) and GraphQL stay in sync.
      let rawSessionIdForCookies: string | undefined = resolvedViaSessionId ? sessionId : undefined;
      if (!resolvedViaSessionId) {
        rawSessionIdForCookies = randomUUID();
        session = await SessionService.createSession({
          hashedId: rawSessionIdForCookies,
          userId: user.id,
          ipAddress: ctx.ipAddress ?? null,
          userAgent: null,
          payload: JSON.stringify({ createdAt: new Date().toISOString() }),
        });
      }

      return rotateTokensAndSession(user, session, ctx, rawSessionIdForCookies);
    },
  }),

  logout: t.field({
    type: "Boolean",
    authScopes: {
      loggedIn: true,
    },
    resolve: async (_parent, _args, ctx) => {
      const cookieStore = await cookies();
      const headersList = await headers();
      const accessToken =
        extractTokenFromHeader(headersList.get("authorization")) ?? cookieStore.get("access_token")?.value ?? null;

      const loggedOut = await SessionService.logoutUser({
        sessionId: ctx.sessionId ?? null,
        accessToken,
        ipAddress: ctx.ipAddress,
        locale: ctx.locale,
      });

      clearAuthCookies(ctx.cookies);
      return loggedOut;
    },
  }),

  changePassword: t.field({
    type: "Boolean",
    authScopes: {
      loggedIn: true,
    },
    args: {
      input: t.arg({ type: ChangePasswordInputPothosObject, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const { userId: actorUserId } = await requireAuthWithRateLimit(ctx);
      const changed = await AuthPasswordService.changePassword(actorUserId, args.input, ctx.locale);
      // The password change revoked the caller's sessions — clear the auth cookies
      // so the rotated session forces re-authentication.
      clearAuthCookies(ctx.cookies);
      return changed;
    },
  }),
}));
