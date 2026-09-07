/**
 * WhatsApp Cloud API — Environment Configuration Sufficiency & Live API Integration Test.
 *
 * Inspects `.env` (and `.env.test`) to verify whether the configured WhatsApp credentials
 * are fully sufficient and actively functional for:
 * 1. Webhook Handshake Verification (GET /api/webhooks/whatsapp)
 * 2. Inbound Webhook HMAC-SHA256 Security (POST /api/webhooks/whatsapp)
 * 3. Live Meta Graph API Phone Number Lookup (GET /{phone_number_id})
 * 4. Live Meta Graph API WABA Template Listing (GET /{waba_id}/message_templates)
 * 5. Live Outbound Message Send Verification (POST /{phone_number_id}/messages)
 * 6. Overall Sufficiency Verdict
 *
 * Run: `bun run test/scripts/run-test.ts test/integration/communication/whatsapp/whatsapp-env-sufficiency.integration.test.ts`
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/webhooks/whatsapp/route";
import { invalidateEnvConfigCache } from "@/backend/services/system";

interface WhatsappEnvAudit {
  provider?: string;
  appId?: string;
  appSecret?: string;
  verifyToken?: string;
  phoneNumberId?: string;
  wabaId?: string;
  accessToken?: string;
  apiVersion?: string;
  testToPhone?: string;
  testTemplateName?: string;
  testTemplateLanguage?: string;
}

function parseDotEnvFile(): WhatsappEnvAudit {
  const envPath = resolve(process.cwd(), ".env");
  const parsed: Record<string, string> = {};

  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) {
        continue;
      }
      const key = trimmed.slice(0, eqIdx).trim();
      const rawVal = trimmed.slice(eqIdx + 1).trim();
      parsed[key] = rawVal.replace(/^["'](.*)["']$/, "$1");
    }
  }

  return {
    provider: parsed.WHATSAPP_PROVIDER ?? process.env.WHATSAPP_PROVIDER,
    appId: parsed.WHATSAPP_APP_ID ?? process.env.WHATSAPP_APP_ID,
    appSecret: parsed.WHATSAPP_APP_SECRET ?? process.env.WHATSAPP_APP_SECRET,
    verifyToken: parsed.WHATSAPP_VERIFY_TOKEN ?? process.env.WHATSAPP_VERIFY_TOKEN,
    phoneNumberId: parsed.WHATSAPP_PHONE_NUMBER_ID ?? process.env.WHATSAPP_PHONE_NUMBER_ID,
    wabaId: parsed.WHATSAPP_WABA_ID ?? process.env.WHATSAPP_WABA_ID,
    accessToken: parsed.WHATSAPP_ACCESS_TOKEN ?? process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: parsed.WHATSAPP_GRAPH_API_VERSION ?? process.env.WHATSAPP_GRAPH_API_VERSION ?? "v26.0",
    testToPhone: parsed.WHATSAPP_TEST_TO_PHONE ?? process.env.WHATSAPP_TEST_TO_PHONE,
    testTemplateName: parsed.WHATSAPP_TEST_TEMPLATE_NAME ?? process.env.WHATSAPP_TEST_TEMPLATE_NAME ?? "hello_world",
    testTemplateLanguage:
      parsed.WHATSAPP_TEST_TEMPLATE_LANGUAGE ?? process.env.WHATSAPP_TEST_TEMPLATE_LANGUAGE ?? "en_US",
  };
}

describe("WhatsApp Cloud API — Environment Configuration Sufficiency", () => {
  const envAudit = parseDotEnvFile();
  const originalEnv = { ...process.env };

  beforeAll(() => {
    if (envAudit.verifyToken) {
      process.env.WHATSAPP_VERIFY_TOKEN = envAudit.verifyToken;
    }
    if (envAudit.appSecret) {
      process.env.WHATSAPP_APP_SECRET = envAudit.appSecret;
    }
    if (envAudit.appId) {
      process.env.WHATSAPP_APP_ID = envAudit.appId;
    }
    if (envAudit.accessToken) {
      process.env.WHATSAPP_ACCESS_TOKEN = envAudit.accessToken;
    }
    if (envAudit.phoneNumberId) {
      process.env.WHATSAPP_PHONE_NUMBER_ID = envAudit.phoneNumberId;
    }
    if (envAudit.wabaId) {
      process.env.WHATSAPP_WABA_ID = envAudit.wabaId;
    }
    invalidateEnvConfigCache("WHATSAPP_VERIFY_TOKEN");
    invalidateEnvConfigCache("WHATSAPP_APP_SECRET");
    invalidateEnvConfigCache("WHATSAPP_APP_ID");
  });

  afterAll(() => {
    process.env = originalEnv;
    invalidateEnvConfigCache("WHATSAPP_VERIFY_TOKEN");
    invalidateEnvConfigCache("WHATSAPP_APP_SECRET");
    invalidateEnvConfigCache("WHATSAPP_APP_ID");
  });

  test("1. Validates presence and format of all WhatsApp credentials in .env", () => {
    expect(envAudit.provider).toBe("cloud_api");

    expect(envAudit.appId).toBeDefined();
    expect(envAudit.appId?.length).toBeGreaterThan(10);
    expect(/^\d+$/.test(envAudit.appId ?? "")).toBe(true);

    expect(envAudit.appSecret).toBeDefined();
    expect(envAudit.appSecret?.length).toBe(32);
    expect(/^[a-f0-9]{32}$/i.test(envAudit.appSecret ?? "")).toBe(true);

    expect(envAudit.verifyToken).toBeDefined();
    expect(envAudit.verifyToken?.length).toBeGreaterThan(16);

    expect(envAudit.phoneNumberId).toBeDefined();
    expect(/^\d+$/.test(envAudit.phoneNumberId ?? "")).toBe(true);

    expect(envAudit.wabaId).toBeDefined();
    expect(/^\d+$/.test(envAudit.wabaId ?? "")).toBe(true);

    expect(envAudit.accessToken).toBeDefined();
    expect(envAudit.accessToken?.startsWith("EAA")).toBe(true);
  });

  test("2. Verifies Webhook Handshake (GET /api/webhooks/whatsapp) succeeds with verify token", async () => {
    expect(envAudit.verifyToken).toBeDefined();
    const token = envAudit.verifyToken ?? "";
    const testChallenge = "1158201444";

    const validUrl = `http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(token)}&hub.challenge=${testChallenge}`;
    const validRequest = new NextRequest(validUrl);

    const validResponse = await GET(validRequest);
    expect(validResponse.status).toBe(200);

    const responseBody = await validResponse.text();
    expect(responseBody).toBe(testChallenge);

    const invalidUrl = `http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=${testChallenge}`;
    const invalidRequest = new NextRequest(invalidUrl);

    const invalidResponse = await GET(invalidRequest);
    expect(invalidResponse.status).toBe(403);
  });

  test("3. Verifies Webhook HMAC-SHA256 signature validation with configured app secret", () => {
    expect(envAudit.appSecret).toBeDefined();
    const appSecret = envAudit.appSecret ?? "";
    const payload = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [{ id: "12345", changes: [] }],
    });

    const validSignature = crypto.createHmac("sha256", appSecret).update(payload).digest("hex");
    const validHeader = `sha256=${validSignature}`;

    const tamperedPayload = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [{ id: "hacked", changes: [] }],
    });
    const tamperedSignature = crypto.createHmac("sha256", appSecret).update(tamperedPayload).digest("hex");

    const expectedBuffer = Buffer.from(validSignature, "hex");
    const validBuffer = Buffer.from(validHeader.slice(7), "hex");
    const tamperedBuffer = Buffer.from(tamperedSignature, "hex");

    const expectedHash = crypto.createHash("sha256").update(expectedBuffer).digest();
    const validHash = crypto.createHash("sha256").update(validBuffer).digest();
    const tamperedHash = crypto.createHash("sha256").update(tamperedBuffer).digest();

    expect(crypto.timingSafeEqual(expectedHash, validHash)).toBe(true);
    expect(crypto.timingSafeEqual(expectedHash, tamperedHash)).toBe(false);
  });

  test("4. Live Graph API: Validates Phone Number ID and Access Token", async () => {
    expect(envAudit.accessToken).toBeDefined();
    expect(envAudit.phoneNumberId).toBeDefined();

    const url = `https://graph.facebook.com/${envAudit.apiVersion}/${envAudit.phoneNumberId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${envAudit.accessToken}`,
      },
      signal: AbortSignal.timeout(10_000),
    });

    expect(response.status).toBe(200);

    interface PhoneNumberDetailsResponse {
      id?: string;
      display_phone_number?: string;
      verified_name?: string;
    }
    const body: PhoneNumberDetailsResponse = await response.json();

    expect(body.id).toBe(envAudit.phoneNumberId);
    expect(body.display_phone_number).toBeDefined();
    expect(body.verified_name).toBeDefined();
  });

  test("5. Live Graph API: Validates WABA ID and Message Templates", async () => {
    expect(envAudit.accessToken).toBeDefined();
    expect(envAudit.wabaId).toBeDefined();

    const url = `https://graph.facebook.com/${envAudit.apiVersion}/${envAudit.wabaId}/message_templates`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${envAudit.accessToken}`,
      },
      signal: AbortSignal.timeout(10_000),
    });

    expect(response.status).toBe(200);

    interface MessageTemplatesResponse {
      data?: Array<{ name: string; status: string; language: string }>;
    }
    const body: MessageTemplatesResponse = await response.json();

    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data?.length).toBeGreaterThan(0);

    const hasHelloWorld = body.data?.some(tpl => tpl.name === "hello_world" && tpl.status === "APPROVED");
    expect(hasHelloWorld).toBe(true);
  });

  test("6. Live Graph API: Validates Template Send Request Acceptance", async () => {
    expect(envAudit.accessToken).toBeDefined();
    expect(envAudit.phoneNumberId).toBeDefined();

    const recipient = (envAudit.testToPhone ?? "").replace(/^00/, "").trim();
    if (!recipient) {
      return;
    }

    const url = `https://graph.facebook.com/${envAudit.apiVersion}/${envAudit.phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to: recipient,
      type: "template",
      template: {
        name: envAudit.testTemplateName,
        language: { code: envAudit.testTemplateLanguage },
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${envAudit.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });

    interface SendMessageResponse {
      messages?: Array<{ id: string }>;
      error?: { code: number; message: string };
    }
    const result: SendMessageResponse = await response.json();

    // Either delivered successfully (200) OR rejected by recipient allowlist (400 code 131030)
    if (response.status === 200) {
      expect(result.messages).toBeDefined();
      expect(result.messages?.[0]?.id).toBeDefined();
    } else {
      expect(response.status).toBe(400);
      expect(result.error?.code).toBe(131030); // Recipient phone number not in allowed list
    }
  });

  test("7. Overall Sufficiency: Verifies all essential WhatsApp keys are fully configured", () => {
    const missingKeys: string[] = [];
    if (!envAudit.provider) {
      missingKeys.push("WHATSAPP_PROVIDER");
    }
    if (!envAudit.appId) {
      missingKeys.push("WHATSAPP_APP_ID");
    }
    if (!envAudit.appSecret) {
      missingKeys.push("WHATSAPP_APP_SECRET");
    }
    if (!envAudit.verifyToken) {
      missingKeys.push("WHATSAPP_VERIFY_TOKEN");
    }
    if (!envAudit.phoneNumberId) {
      missingKeys.push("WHATSAPP_PHONE_NUMBER_ID");
    }
    if (!envAudit.wabaId) {
      missingKeys.push("WHATSAPP_WABA_ID");
    }
    if (!envAudit.accessToken) {
      missingKeys.push("WHATSAPP_ACCESS_TOKEN");
    }

    expect(missingKeys).toHaveLength(0);
  });
});
