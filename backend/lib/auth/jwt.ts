import { randomUUID } from "node:crypto";
import { type JWTPayload as JoseJWTPayload, jwtVerify, SignJWT } from "jose";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const JWT_REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

const secret = new TextEncoder().encode(JWT_SECRET);

export interface CustomJWTPayload extends JoseJWTPayload {
  userId: string;
  email: string;
  type: "access" | "refresh";
  jti?: string;
  actorUserId?: string;
  impersonation?: true;
  impersonationExpiresAt?: number;
  groupSimulation?: true;
  groupSimulationSlug?: string;
  groupSimulationExpiresAt?: number;
}

function signToken(claims: Record<string, unknown>, expiry: string): Promise<string> {
  const jti = randomUUID();
  return new SignJWT({ ...claims, jti })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(secret);
}

/**
 * Generate an access token for a user
 */
export function generateAccessToken(userId: string, email: string): Promise<string> {
  return signToken({ userId, email, type: "access" }, JWT_ACCESS_TOKEN_EXPIRY);
}

/**
 * Generate a refresh token for a user
 */
export function generateRefreshToken(userId: string, email: string): Promise<string> {
  return signToken({ userId, email, type: "refresh" }, JWT_REFRESH_TOKEN_EXPIRY);
}

/**
 * Generate an access token for impersonation (effective user = target, actor = admin).
 */
export function generateImpersonationAccessToken(
  actorUserId: string,
  targetUserId: string,
  targetEmail: string,
  impersonationExpiresAt: number
): Promise<string> {
  return signToken(
    {
      userId: targetUserId,
      email: targetEmail,
      type: "access",
      actorUserId,
      impersonation: true,
      impersonationExpiresAt,
    },
    JWT_ACCESS_TOKEN_EXPIRY
  );
}

/**
 * Generate an access token for permission group simulation (identity stays admin).
 */
export function generateGroupSimulationAccessToken(
  userId: string,
  email: string,
  groupSlug: string,
  groupSimulationExpiresAt: number
): Promise<string> {
  return signToken(
    {
      userId,
      email,
      type: "access",
      groupSimulation: true,
      groupSimulationSlug: groupSlug,
      groupSimulationExpiresAt,
    },
    JWT_ACCESS_TOKEN_EXPIRY
  );
}

function isCustomJWTPayload(payload: JoseJWTPayload): payload is CustomJWTPayload {
  return (
    typeof payload.userId === "string" &&
    typeof payload.email === "string" &&
    (payload.type === "access" || payload.type === "refresh")
  );
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<CustomJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!isCustomJWTPayload(payload)) {
      return null;
    }
    return payload;
  } catch {
    // Token verification failed - invalid or expired
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
