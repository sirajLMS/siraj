import { randomUUID } from "node:crypto";
import { GraphQLError } from "graphql";
import { cookies, headers } from "next/headers";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import {
  DUMMY_PASSWORD_HASH,
  failOpen,
  resolveUserFromRefreshToken,
  resolveUserFromSession,
  rotateTokensAndSession,
  setAuthCookies,
  validateRefreshTokenJti,
} from "@/backend/graphql/mutation/auth/auth.mutation.helpers";
import { requireAuthWithRateLimit } from "@/backend/graphql/shared";
import { extractTokenFromHeader, retryTransient } from "@/backend/lib";
import { clearAuthCookies } from "@/backend/lib/auth/cookies";
import { createAuthSession } from "@/backend/lib/auth/createAuthSession";
import { comparePassword } from "@/backend/lib/auth/password";
import type { Email } from "@/backend/lib/email";
import { getBooleanEnv } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import { authRateLimiter, checkRateLimit } from "@/backend/lib/ratelimit";
import {
  AuthPasswordService,
  DemoAuthService,
  LoginAuditService,
  RateLimitService,
  SessionService,
  UserService,
} from "@/backend/services";
import type {
  ChangePasswordInput,
  DemoLoginInput,
  LoginInput,
  LoginResponse,
  RefreshTokenResponse,
  SessionSelectType,
  UserSelectType,
} from "@/backend/types";
import { AuthUtils } from "@/backend/utils";
import type { Translations } from "@/shared/locale";

type ErrorsTranslations = Translations["errorsTranslations"];

const LOCKED_ATTEMPT_RESULT = { attempts: 0, lockedUntil: null, isLocked: false };

function throwTooManyAttempts(tErrors: ErrorsTranslations): never {
  throw new GraphQLError(tErrors.auth.tooManyLoginAttempts, {
    extensions: { code: "TOO_MANY_ATTEMPTS" },
  });
}

async function assertLoginAllowed(ipAddress: string, email: Email, tErrors: ErrorsTranslations): Promise<void> {
  // checkRateLimit is fail-closed: cache outages reject logins rather
  // than unconditionally allowing them.
  const rateLimitResult = await checkRateLimit(ipAddress, authRateLimiter);
  if (!rateLimitResult.success) {
    throwTooManyAttempts(tErrors);
  }

  // Fail-open: if DB is cold-starting, proceed with credential verification
  const isLocked = await failOpen("isLocked check", () => RateLimitService.isLocked(ipAddress, email.value), false);
  if (isLocked) {
    throwTooManyAttempts(tErrors);
  }
}

async function findUserForLogin(email: Email, tErrors: ErrorsTranslations): Promise<UserSelectType | null> {
  try {
    return (await retryTransient(() => UserService.findByEmail(email.value))) ?? null;
  } catch (err) {
    logger.error(err);
    throw new GraphQLError(tErrors.auth.serviceUnavailable, {
      extensions: { code: "SERVICE_UNAVAILABLE" },
    });
  }
}

async function handleUnknownEmailLogin(
  email: Email,
  password: string,
  ipAddress: string,
  tErrors: ErrorsTranslations
): Promise<never> {
  // Timing-equalize with the found-user path: run a real bcrypt compare
  // against a valid dummy hash so response latency does not reveal email
  // existence.
  await comparePassword(password, DUMMY_PASSWORD_HASH);
  // Still record attempt even if user doesn't exist to prevent enumeration
  await failOpen("recordAttempt (user not found)", () => RateLimitService.recordAttempt(ipAddress, email.value), {
    ...LOCKED_ATTEMPT_RESULT,
  });
  await LoginAuditService.recordUnknownEmailLoginFailure(email.value, ipAddress);
  throw new GraphQLError(tErrors.auth.invalidCredentials, {
    extensions: { code: "INVALID_CREDENTIALS" },
  });
}

async function assertPasswordValid(
  user: UserSelectType,
  email: Email,
  password: string,
  ipAddress: string,
  tErrors: ErrorsTranslations
): Promise<void> {
  const isPasswordValid = await comparePassword(password, user.password);
  if (isPasswordValid) return;

  // Fail-open: cold-start recordAttempt failure should not block login flow
  const result = await failOpen(
    "recordAttempt (invalid password)",
    () => RateLimitService.recordAttempt(ipAddress, email.value),
    { ...LOCKED_ATTEMPT_RESULT }
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

async function completeLogin(
  user: UserSelectType,
  email: Email,
  ipAddress: string,
  ctx: BaseContext,
  tErrors: ErrorsTranslations
): Promise<LoginResponse> {
  // Fail-open: cold-start resetAttempts failure should not block successful login
  await failOpen("resetAttempts", () => RateLimitService.resetAttempts(ipAddress, email.value), undefined);

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
      extensions: { code: "SERVICE_UNAVAILABLE" },
    });
  }
}

export async function resolveLogin(input: LoginInput, ctx: BaseContext): Promise<LoginResponse> {
  const ipAddress = ctx.ipAddress ?? "127.0.0.1";
  const tErrors = ctx.t().errorsTranslations;
  const { email, password } = input;

  await assertLoginAllowed(ipAddress, email, tErrors);

  const user = await findUserForLogin(email, tErrors);
  if (!user) {
    return handleUnknownEmailLogin(email, password, ipAddress, tErrors);
  }

  await assertPasswordValid(user, email, password, ipAddress, tErrors);

  if (user.status === "DEACTIVATED") {
    throw new GraphQLError(tErrors.auth.accountDeactivated, {
      extensions: { code: "ACCOUNT_DEACTIVATED" },
    });
  }

  return completeLogin(user, email, ipAddress, ctx, tErrors);
}

function assertDemoLoginEnabled(tErrors: ErrorsTranslations): void {
  if (!getBooleanEnv("IS_DEMO")) {
    throw new GraphQLError(tErrors.auth.demoLoginNotEnabled, {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  // Defense-in-depth: hard-block demoLogin in real production deployments
  // even if IS_DEMO is accidentally set to a truthy value.
  // Reject on ANY Vercel deployment (preview or production), unless ALLOW_VERCEL_DEMO=true is explicitly set.
  const allowVercelDemo = getBooleanEnv("ALLOW_VERCEL_DEMO");
  if (allowVercelDemo) return;

  const isVercelDeploy = Boolean(process.env.VERCEL_ENV);
  const isProductionDeployment = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  if (isVercelDeploy || isProductionDeployment) {
    throw new GraphQLError(tErrors.auth.demoLoginNotEnabled, {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
}

export async function resolveDemoLogin(input: DemoLoginInput, ctx: BaseContext): Promise<LoginResponse> {
  const tErrors = ctx.t().errorsTranslations;
  const ipAddress = ctx.ipAddress ?? "127.0.0.1";

  // Enforce auth rate limit before any checks (fail-closed on cache
  // errors, mirroring login)
  const rateLimitResult = await checkRateLimit(ipAddress, authRateLimiter);
  if (!rateLimitResult.success) {
    throw new GraphQLError(tErrors.auth.tooManyLoginAttempts, {
      extensions: { code: "TOO_MANY_ATTEMPTS" },
    });
  }

  assertDemoLoginEnabled(tErrors);

  try {
    const result = await DemoAuthService.loginWithGroupSlug(input.groupSlug, tErrors);
    setAuthCookies(ctx, result.sessionId, result.refreshToken, result.accessToken);
    return {
      token: result.accessToken,
      user: result.user,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    // Expected rejections (excluded group slug, missing demo user, etc.) — not crashes.
    logger.logDomainError("Demo login failed", { error: err, groupSlug: input.groupSlug });
    throw new GraphQLError(tErrors.auth.demoLoginFailed, {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
}

async function resolveRefreshSession(
  sessionId: string | undefined,
  refreshToken: string | undefined
): Promise<{ session: SessionSelectType; user: UserSelectType; resolvedViaSessionId: boolean } | null> {
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

  if (!user || !session) return null;
  return { session, user, resolvedViaSessionId };
}

export async function resolveRefreshToken(ctx: BaseContext): Promise<RefreshTokenResponse | null> {
  const tErrors = ctx.t().errorsTranslations;

  const rateLimitResult = await checkRateLimit(ctx.ipAddress ?? "[unknown]", authRateLimiter);
  if (!rateLimitResult.success) {
    throw new GraphQLError(tErrors.auth.tooManyLoginAttempts, {
      extensions: { code: "TOO_MANY_ATTEMPTS" },
    });
  }

  const sessionId = ctx.sessionId;
  const refreshToken = ctx.refreshToken;

  const resolved = await resolveRefreshSession(sessionId, refreshToken);
  if (!resolved) return null;

  const { user, resolvedViaSessionId } = resolved;
  let { session } = resolved;

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
}

export async function resolveLogout(ctx: BaseContext): Promise<boolean> {
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
}

export async function resolveChangePassword(input: ChangePasswordInput, ctx: BaseContext): Promise<boolean> {
  const { userId: actorUserId } = await requireAuthWithRateLimit(ctx);
  const changed = await AuthPasswordService.changePassword(actorUserId, input, ctx.locale);
  // The password change revoked the caller's sessions — clear the auth cookies
  // so the rotated session forces re-authentication.
  clearAuthCookies(ctx.cookies);
  return changed;
}
