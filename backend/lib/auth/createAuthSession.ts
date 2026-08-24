import { randomUUID } from "node:crypto";
import { SessionRepository } from "@/backend/db/repo/shared";
import { generateAccessToken, generateRefreshToken, verifyToken } from "@/backend/lib";
import type { SessionSelectType } from "@/backend/types";

interface CreateAuthSessionResult {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  session: SessionSelectType;
}

export async function createAuthSession(userId: string, email: string): Promise<CreateAuthSessionResult> {
  const accessToken = await generateAccessToken(userId, email);
  const refreshToken = await generateRefreshToken(userId, email);

  // M6: bind the refresh-token JTI to the session at creation time. Previously
  // the JTI was stored only on the first rotation (see rotateTokensAndSession),
  // leaving a window where a stolen refresh token could be replayed because
  // validateRefreshTokenJti treats sessions with no stored JTI as legacy and
  // accepts them. Binding at creation closes that window: the first legitimate
  // rotation updates the stored JTI to the new value, after which any stolen
  // copy of the original refresh token is rejected via the stored-JTI mismatch
  // check (even when both refresh_token and session_id cookies were stolen).
  const refreshPayload = await verifyToken(refreshToken);
  const refreshTokenJti = refreshPayload?.jti;

  const sessionId = randomUUID();
  const session = await SessionRepository.create({
    hashedId: sessionId,
    userId,
    payload: JSON.stringify({ createdAt: new Date().toISOString(), refreshTokenJti }),
  });

  return { accessToken, refreshToken, sessionId, session };
}
