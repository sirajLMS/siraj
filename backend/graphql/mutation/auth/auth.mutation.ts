import { randomUUID } from "node:crypto";
import { GraphQLError } from "graphql";
import { cookies, headers } from "next/headers";
import { RateLimitRepository, SessionRepository } from "@/backend/db/repo";
import { UserRepository } from "@/backend/db/repo/users/user.repository";
import { AccountStatus } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  DemoLoginInputPothosObject,
  LoginInputPothosObject,
  LoginResponsePothosObject,
  RefreshTokenResponsePothosObject,
} from "@/backend/graphql/pothos";
import { extractTokenFromHeader, generateAccessToken, generateRefreshToken, verifyToken } from "@/backend/lib";
import { setAuthCookies as applyAuthCookies, clearAuthCookies } from "@/backend/lib/auth/cookies";
import { comparePassword } from "@/backend/lib/auth/password";
import { getBooleanEnv } from "@/backend/lib/env";
import logger from "@/backend/lib/logger";
import { authRateLimiter, checkRateLimit } from "@/backend/lib/ratelimit";
import { DemoAuthService } from "@/backend/services/auth/demo-auth.service";
import { ImpersonationService } from "@/backend/services/auth/impersonation.service";
import { PermissionGroupSimulationService } from "@/backend/services/auth/permission-group-simulation.service";
import { SessionService } from "@/backend/services/auth/session.service";
import type { SafeUser, SessionSelectType, UserSelectType } from "@/backend/types";
import { AuthUtils } from "@/backend/utils";

function setAuthCookies(ctx: BaseContext, sessionId: string, refreshToken: string, accessToken?: string) {
  applyAuthCookies(ctx.cookies, sessionId, refreshToken, accessToken);
}

async function resolveUserFromSession(
  sessionId: string
): Promise<{ session: SessionSelectType | null; user: UserSelectType | null }> {
  const session = await SessionService.validateSession(sessionId);
  if (!session?.userId) return { session: session ?? null, user: null };

  const user = (await UserRepository.findById(session.userId)) || null;
  if (!user) {
    logger.warn("[RefreshToken] Session found but user not found", {
      userId: session.userId,
    });
  }
  return { session, user };
}

async function resolveUserFromRefreshToken(
  refreshToken: string
): Promise<{ session: SessionSelectType | null; user: UserSelectType | null }> {
  const payload = await verifyToken(refreshToken);
  if (payload?.type !== "refresh") return { session: null, user: null };

  const user = (await UserRepository.findById(payload.userId)) || null;
  if (!user) return { session: null, user: null };

  const session = (await SessionRepository.findByUserId(user.id)) || null;
  if (!session) {
    logger.warn("[RefreshToken] User found but no session exists", {
      userId: user.id,
    });
  }
  return { session, user };
}

async function validateRefreshTokenJti(
  refreshToken: string | undefined,
  session: SessionSelectType,
  resolvedViaSessionId = false
): Promise<boolean> {
  // Session cookie alone is sufficient when the refresh_token cookie is absent
  // (e.g. after a parallel refresh race or browser cookie edge case).
  if (!refreshToken && resolvedViaSessionId) {
    return true;
  }

  const refreshPayload = refreshToken ? await verifyToken(refreshToken) : null;
  // If no refresh token is present and no JTI is stored in session, there's nothing to validate
  if (!refreshPayload?.jti && !session.payload) return true;
  // If refresh token is missing but session expects one, or vice versa, reject
  if (!refreshPayload?.jti || !session.payload) return false;
  try {
    const sessionData = JSON.parse(session.payload);
    if (sessionData.refreshTokenJti && sessionData.refreshTokenJti !== refreshPayload.jti) {
      return false;
    }
  } catch {
    /* ignore parse error */
  }
  return true;
}

async function rotateTokensAndSession(
  user: UserSelectType,
  session: SessionSelectType,
  ctx: BaseContext,
  rawSessionId?: string
): Promise<{ token: string; user: SafeUser } | null> {
  const sessionIdForUpdate = rawSessionId || session.hashedId;
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
  await SessionRepository.update({
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

  const effectiveUserId = ctx.isImpersonating && ctx.user ? ctx.user.id : user.id;
  const effectiveUser = (await UserRepository.findById(effectiveUserId)) ?? user;

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
      const ipAddress = ctx.ipAddress || "127.0.0.1";
      const tErrors = ctx.t().errorsTranslations;

      // 0. Enforce auth rate limit before any credential checks
      const rateLimitResult = await checkRateLimit(ipAddress, authRateLimiter);
      if (!rateLimitResult.success) {
        throw new GraphQLError(tErrors.auth.tooManyLoginAttempts, {
          // ← compile-time ✅
          extensions: { code: "TOO_MANY_ATTEMPTS" },
        });
      }

      // 1. Check if already locked
      const isLocked = await RateLimitRepository.isLocked(ipAddress, email.value);
      if (isLocked) {
        throw new GraphQLError(tErrors.auth.tooManyLoginAttempts, {
          // ← compile-time ✅
          extensions: { code: "TOO_MANY_ATTEMPTS" },
        });
      }

      let user: UserSelectType | null;
      try {
        user = (await UserRepository.findByEmail(email.value)) ?? null;
      } catch (err) {
        logger.error(err);
        throw new GraphQLError(tErrors.auth.serviceUnavailable, {
          // ← compile-time ✅
          extensions: { code: "SERVICE_UNAVAILABLE" },
        });
      }

      if (!user) {
        // Still record attempt even if user doesn't exist to prevent enumeration
        await RateLimitRepository.recordAttempt(ipAddress, email.value);
        throw new GraphQLError(tErrors.auth.invalidCredentials, {
          // ← compile-time ✅
          extensions: { code: "INVALID_CREDENTIALS" },
        });
      }

      // 2. Verify password
      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        // Record failed attempt
        const result = await RateLimitRepository.recordAttempt(ipAddress, email.value);
        if (result.isLocked) {
          throw new GraphQLError(tErrors.auth.accountLocked, {
            // ← compile-time ✅
            extensions: { code: "TOO_MANY_ATTEMPTS" },
          });
        }
        throw new GraphQLError(tErrors.auth.invalidCredentials, {
          // ← compile-time ✅
          extensions: { code: "INVALID_CREDENTIALS" },
        });
      }

      if (user.status === AccountStatus.DEACTIVATED) {
        throw new GraphQLError(tErrors.auth.accountDeactivated, {
          // ← compile-time ✅
          extensions: { code: "ACCOUNT_DEACTIVATED" },
        });
      }

      // 3. Successful login - reset attempts
      await RateLimitRepository.resetAttempts(ipAddress, email.value);

      // Generate tokens
      const accessToken = await generateAccessToken(user.id, user.email);
      const refreshToken = await generateRefreshToken(user.id, user.email);

      // Create session in database
      const sessionId = randomUUID();
      await SessionRepository.create({
        hashedId: sessionId,
        userId: user.id,
        payload: JSON.stringify({
          createdAt: new Date().toISOString(),
          // Store session metadata only, not sensitive tokens
        }),
      });

      // Set httpOnly cookies for session and refresh token
      setAuthCookies(ctx, sessionId, refreshToken, accessToken);

      return {
        token: accessToken,
        user: AuthUtils.toSafeUser(user),
      };
    },
  }),

  /**
   * Special GraphQL endpoint for demo fast login.
   * This endpoint logs in a user using the provided permission group slug without requiring a password.
   * It is intended strictly for demonstration purposes and is secured by environment variables.
   *
   * @drizzle `DemoAuthService.loginWithGroupSlug` (which uses `db.query.permissionGroups`, `db.query.userPermissionGroups`, `db.query.users`)
   * @drizzle `SessionRepository.create` (which uses `db.insert(sessions)`)
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
      const isDemo = getBooleanEnv("IS_DEMO");
      if (!isDemo) {
        throw new GraphQLError(tErrors.auth.demoLoginNotEnabled, {
          // ← compile-time ✅
          extensions: { code: "UNAUTHENTICATED" },
        });
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
        const err = error as Error;
        logger.error("Demo login failed", { error: err });
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
        session = await SessionRepository.create({
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
}));
