import { randomUUID } from "node:crypto";
import { GraphQLError } from "graphql";
import { RateLimitRepository, SessionRepository, UserRepository } from "@/backend/db/repo";
import { generateAccessToken, generateRefreshToken, verifyToken } from "@/backend/lib";
import { comparePassword } from "@/backend/lib/auth/password";
import { getBackendTranslations } from "@/backend/lib/intl";
import logger from "@/backend/lib/logger";
import { DemoAuthService } from "@/backend/services/auth/demo-auth.service";
import type { SafeUser, SessionEntity, UserEntity } from "@/backend/types";
import { AuthUtils } from "@/backend/utils";
import type { BaseContext } from "../gqlContext";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import {
  DemoLoginInputPothosObject,
  LoginInputPothosObject,
  LoginResponsePothosObject,
  RefreshTokenResponsePothosObject,
} from "../pothos";

function setAuthCookies(ctx: BaseContext, sessionId: string, refreshToken: string) {
  if (!ctx.cookies) return;

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "strict" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  };

  ctx.cookies.set("session_id", sessionId, options);
  ctx.cookies.set("refresh_token", refreshToken, options);
}

async function resolveUserFromSession(
  sessionId: string
): Promise<{ session: SessionEntity | null; user: UserEntity | null }> {
  const session = await SessionRepository.validate(sessionId);
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
): Promise<{ session: SessionEntity | null; user: UserEntity | null }> {
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

async function validateRefreshTokenJti(refreshToken: string | undefined, session: SessionEntity): Promise<boolean> {
  if (!refreshToken) return true;
  const refreshPayload = await verifyToken(refreshToken);
  if (!refreshPayload?.jti || !session.payload) return true;
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
  user: UserEntity,
  session: SessionEntity,
  ctx: BaseContext,
  rawSessionId?: string
): Promise<{ token: string; user: SafeUser } | null> {
  const newAccessToken = await generateAccessToken(user.id, user.email);
  const newRefreshToken = await generateRefreshToken(user.id, user.email);

  const newPayload = await verifyToken(newRefreshToken);
  const newJti = newPayload?.jti;

  const sessionPayload = session.payload ? JSON.parse(session.payload) : {};
  sessionPayload.refreshTokenJti = newJti;

  // Use the raw (plaintext) session ID for the update call — the repository
  // hashes it internally before storage lookup.
  const sessionIdForUpdate = rawSessionId || session.hashedId;
  await SessionRepository.update({
    hashedId: sessionIdForUpdate,
    userId: session.userId,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    payload: JSON.stringify(sessionPayload),
  });

  // The cookie must store the *raw* session ID so it can be looked up again.
  if (rawSessionId) {
    setAuthCookies(ctx, rawSessionId, newRefreshToken);
  }

  return { token: newAccessToken, user: AuthUtils.toSafeUser(user) };
}

gqlSchemaBuilder.mutationFields(t => ({
  login: t.field({
    type: LoginResponsePothosObject,
    args: {
      input: t.arg({ type: LoginInputPothosObject, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const { email, password } = args.input;
      const ipAddress = ctx.ipAddress || "unknown";
      const t = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });

      // 1. Check if already locked
      const isLocked = await RateLimitRepository.isLocked(ipAddress, email.value);
      if (isLocked) {
        throw new GraphQLError(t("auth.tooManyLoginAttempts"), {
          extensions: { code: "TOO_MANY_ATTEMPTS" },
        });
      }

      let user: UserEntity | null;
      try {
        user = (await UserRepository.findByEmail(email.value)) ?? null;
      } catch (err) {
        logger.error(err);
        throw new GraphQLError(t("auth.serviceUnavailable"), {
          extensions: { code: "SERVICE_UNAVAILABLE" },
        });
      }

      if (!user) {
        // Still record attempt even if user doesn't exist to prevent enumeration
        await RateLimitRepository.recordAttempt(ipAddress, email.value);
        throw new GraphQLError(t("auth.invalidCredentials"), {
          extensions: { code: "INVALID_CREDENTIALS" },
        });
      }

      // 2. Verify password
      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        // Record failed attempt
        const result = await RateLimitRepository.recordAttempt(ipAddress, email.value);
        if (result.isLocked) {
          throw new GraphQLError(t("auth.accountLocked"), {
            extensions: { code: "TOO_MANY_ATTEMPTS" },
          });
        }
        throw new GraphQLError(t("auth.invalidCredentials"), {
          extensions: { code: "INVALID_CREDENTIALS" },
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
      setAuthCookies(ctx, sessionId, refreshToken);

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
      const t = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
      const isDemo = process.env.IS_DEMO === "true";
      if (!isDemo) {
        throw new GraphQLError(t("auth.demoLoginNotEnabled"), {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const { groupSlug } = args.input;

      try {
        const result = await DemoAuthService.loginWithGroupSlug(groupSlug, ctx.locale);
        setAuthCookies(ctx, result.sessionId, result.refreshToken);
        return {
          token: result.accessToken,
          user: result.user,
        };
      } catch (error) {
        const err = error as Error;
        logger.error("Demo login failed", { error: err });
        throw new GraphQLError(t("auth.demoLoginFailed"), {
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

      let session: SessionEntity | null = null;
      let user: UserEntity | null = null;

      if (sessionId) {
        const result = await resolveUserFromSession(sessionId);
        session = result.session;
        user = result.user;
      }

      if (!user && refreshToken) {
        const result = await resolveUserFromRefreshToken(refreshToken);
        session = result.session;
        user = result.user;
      }

      if (!user || !session) {
        return null;
      }

      if (!(await validateRefreshTokenJti(refreshToken, session))) {
        return null;
      }

      return rotateTokensAndSession(user, session, ctx, sessionId);
    },
  }),

  logout: t.field({
    type: "Boolean",
    authScopes: {
      loggedIn: true,
    },
    resolve: async (_parent, _args, ctx) => {
      if (!ctx.user) {
        return false;
      }

      // Delete all sessions for the user
      await SessionRepository.deleteByUserId(ctx.user.id);

      // Clear authentication cookies
      if (ctx.cookies) {
        ctx.cookies.delete("session_id");
        ctx.cookies.delete("refresh_token");
      }

      return true;
    },
  }),
}));
