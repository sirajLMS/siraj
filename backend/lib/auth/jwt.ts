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
}

/**
 * Generate an access token for a user
 */
export async function generateAccessToken(userId: string, email: string): Promise<string> {
  const jti = randomUUID();
  const token = await new SignJWT({
    userId,
    email,
    type: "access" as const,
    jti,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_ACCESS_TOKEN_EXPIRY)
    .sign(secret);

  return token;
}

/**
 * Generate a refresh token for a user
 */
export async function generateRefreshToken(userId: string, email: string): Promise<string> {
  const jti = randomUUID();
  const token = await new SignJWT({
    userId,
    email,
    type: "refresh" as const,
    jti,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_REFRESH_TOKEN_EXPIRY)
    .sign(secret);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<CustomJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as CustomJWTPayload;
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
