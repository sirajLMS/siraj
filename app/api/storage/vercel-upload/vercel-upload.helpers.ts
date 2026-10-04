import type { HandleUploadBody } from "@vercel/blob/client";
import type { NextRequest } from "next/server";
import type { VercelUploadUrlClientPlayload } from "@/app/api/storage/vercel-upload/vercel-upload.types";
import { extractTokenFromHeader, verifyToken } from "@/backend/lib";
import { SessionService } from "@/backend/services";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isHandleUploadBody(value: unknown): value is HandleUploadBody {
  return isRecord(value) && typeof value.type === "string" && isRecord(value.payload);
}

export function parseClientPayload(raw: string | null | undefined): VercelUploadUrlClientPlayload {
  const empty: VercelUploadUrlClientPlayload = {
    sessionId: "",
    fileSize: 0,
    contentType: "",
  };
  if (!raw) {
    return empty;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return empty;
    }
    return {
      sessionId: typeof parsed.sessionId === "string" ? parsed.sessionId : "",
      fileSize: typeof parsed.fileSize === "number" ? parsed.fileSize : 0,
      contentType: typeof parsed.contentType === "string" ? parsed.contentType : "",
    };
  } catch {
    return empty;
  }
}

export function parseTokenPayload(raw: string): { sessionId?: string; contentType?: string } {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return {};
    }
    return {
      ...(typeof parsed.sessionId === "string" ? { sessionId: parsed.sessionId } : {}),
      ...(typeof parsed.contentType === "string" ? { contentType: parsed.contentType } : {}),
    };
  } catch {
    return {};
  }
}

export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const accessToken = extractTokenFromHeader(authHeader) ?? request.cookies.get("access_token")?.value ?? null;

  if (accessToken) {
    const payload = await verifyToken(accessToken);
    if (payload?.type === "access") {
      return payload.userId;
    }
  }

  const sessionId = request.cookies.get("session_id")?.value;
  if (sessionId) {
    const session = await SessionService.validateSession(sessionId);
    if (session?.userId) {
      return session.userId;
    }
  }

  return null;
}
