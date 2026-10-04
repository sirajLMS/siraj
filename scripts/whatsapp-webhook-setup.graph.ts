import type { WhatsappEnv } from "@/scripts/whatsapp-webhook-setup.env";
import { isRecord, logError } from "@/scripts/whatsapp-webhook-setup.helpers";

interface GraphErrorInfo {
  code: number;
  message: string;
}

export class GraphApiError extends Error {
  readonly graphError: GraphErrorInfo;

  constructor(info: GraphErrorInfo) {
    super(`Graph API error ${info.code}: ${info.message}`);
    this.graphError = info;
  }
}

interface GraphCallOptions {
  env: WhatsappEnv;
  path: string;
  token: string;
  method?: "GET" | "POST";
  form?: Record<string, string>;
}

export async function graphCall({ env, path, token, method = "GET", form }: GraphCallOptions): Promise<unknown> {
  const url = `https://graph.facebook.com/${env.apiVersion}/${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      ...(form ? { body: new URLSearchParams(form).toString() } : {}),
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    throw new Error(`Network error calling Graph API: ${err instanceof Error ? err.message : String(err)}`, {
      cause: err,
    });
  }

  const body: unknown = await res.json().catch(() => null);
  if (isRecord(body) && isRecord(body.error)) {
    const code = typeof body.error.code === "number" ? body.error.code : res.status;
    const message = typeof body.error.message === "string" ? body.error.message : "Unknown Graph API error";
    throw new GraphApiError({ code, message });
  }
  if (!res.ok) {
    throw new GraphApiError({ code: res.status, message: `HTTP ${res.status} ${res.statusText}` });
  }
  return body;
}

export function printGraphError(err: unknown): void {
  if (err instanceof GraphApiError) {
    logError(`Graph API error ${err.graphError.code}: ${err.graphError.message}`);
  } else {
    logError(err instanceof Error ? err.message : String(err));
  }
}

// ── Subscription Inspection ─────────────────────────────────────────────────

export interface AppSubscription {
  callbackUrl: string | null;
  fields: string[];
}

function extractSubscription(body: unknown): AppSubscription | null {
  if (!isRecord(body) || !Array.isArray(body.data)) return null;
  for (const entry of body.data) {
    if (isRecord(entry) && entry.object === "whatsapp_business_account") {
      return {
        callbackUrl: typeof entry.callback_url === "string" ? entry.callback_url : null,
        fields: Array.isArray(entry.fields)
          ? entry.fields
              .filter((f): f is Record<string, unknown> => isRecord(f))
              .map(f => (typeof f.name === "string" ? f.name : ""))
              .filter(Boolean)
          : [],
      };
    }
  }
  return null;
}

export async function getAppSubscription(env: WhatsappEnv): Promise<AppSubscription | null> {
  const body = await graphCall({
    env,
    path: `${env.appId}/subscriptions`,
    token: `${env.appId}|${env.appSecret}`,
  });
  return extractSubscription(body);
}

export async function getWabaAttached(env: WhatsappEnv): Promise<boolean> {
  const body = await graphCall({
    env,
    path: `${env.wabaId}/subscribed_apps`,
    token: env.accessToken,
  });
  return isRecord(body) && Array.isArray(body.data) && body.data.length > 0;
}

export function isAlreadySubscribedError(err: unknown): boolean {
  return err instanceof GraphApiError && /already (subscribed|connected)/i.test(err.graphError.message);
}
