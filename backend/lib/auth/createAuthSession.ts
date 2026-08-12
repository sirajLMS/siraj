import { randomUUID } from "node:crypto";
import { SessionRepository } from "@/backend/db/repo/shared";
import { generateAccessToken, generateRefreshToken } from "@/backend/lib";
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

  const sessionId = randomUUID();
  const session = await SessionRepository.create({
    hashedId: sessionId,
    userId,
    payload: JSON.stringify({ createdAt: new Date().toISOString() }),
  });

  return { accessToken, refreshToken, sessionId, session };
}
