/**
 * WhatsApp Cloud API — unit tests for buildRequest / parseResponse (r6-tq-27).
 *
 * Exercises the request builders and response parsers WITHOUT any env vars
 * or live API credentials. Uses `mock.module` to stub `globalThis.fetch` so
 * the tests run purely in-process.
 *
 * Run: `bun test test/integration/communication/whatsapp/whatsapp-unit.test.ts`
 */
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import {
  buildRequest as buildGetPhoneNumberRequest,
  parseResponse as parseGetPhoneNumberResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/get-phone-number.request";
import {
  buildRequest as buildListTemplatesRequest,
  parseResponse as parseListTemplatesResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/list-message-templates.request";
import {
  buildRequest as buildListPhoneNumbersRequest,
  parseResponse as parseListPhoneNumbersResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/list-phone-numbers.request";
import {
  buildRequest as buildSendTemplateRequest,
  parseResponse as parseSendTemplateResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/send-template-message.request";
import type { GraphApiRequestContext } from "@/backend/types/whatsapp/whatsapp-cloud-api.types";

const CTX: GraphApiRequestContext = {
  accessToken: "test-token-abc123",
  apiVersion: "23.0",
};

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restore();
});

describe("send-template-message — buildRequest", () => {
  test("builds correct URL, method, headers, and JSON body", () => {
    const { url, init } = buildSendTemplateRequest(CTX, {
      phoneNumberId: "123456789",
      to: "971501234567",
      templateName: "hello_world",
      languageCode: "en_US",
    });

    expect(url).toBe("https://graph.facebook.com/v23.0/123456789/messages");
    expect(init.method).toBe("POST");

    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-token-abc123");
    expect(headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(init.body as string);
    expect(body.messaging_product).toBe("whatsapp");
    expect(body.to).toBe("971501234567");
    expect(body.type).toBe("template");
    expect(body.template.name).toBe("hello_world");
    expect(body.template.language.code).toBe("en_US");
    expect(body.template.components).toBeUndefined();
  });

  test("includes components when provided", () => {
    const { init } = buildSendTemplateRequest(CTX, {
      phoneNumberId: "123456789",
      to: "971501234567",
      templateName: "hello_world",
      languageCode: "en_US",
      components: [{ type: "body", parameters: [{ type: "text", text: "John" }] }],
    });

    const body = JSON.parse(init.body as string);
    expect(body.template.components).toHaveLength(1);
    expect(body.template.components[0].type).toBe("body");
  });

  test.each([
    {
      description: "invalid phoneNumberId (empty)",
      params: { phoneNumberId: "", to: "971501234567", templateName: "hello_world", languageCode: "en_US" },
      expectedError: "Invalid phoneNumberId",
    },
    {
      description: "invalid recipient (non-numeric)",
      params: { phoneNumberId: "123456789", to: "+971501234567", templateName: "hello_world", languageCode: "en_US" },
      expectedError: "Invalid recipient",
    },
    {
      description: "template name with special characters",
      params: { phoneNumberId: "123456789", to: "971501234567", templateName: "hello world!", languageCode: "en_US" },
      expectedError: "must contain only alphanumeric",
    },
  ])("throws on $description", ({ params, expectedError }) => {
    expect(() => buildSendTemplateRequest(CTX, params)).toThrow(expectedError);
  });
});

describe("send-template-message — parseResponse", () => {
  test("extracts providerMessageId and recipientWaId", () => {
    const result = parseSendTemplateResponse({
      messaging_product: "whatsapp",
      contacts: [{ input: "971501234567", wa_id: "971501234567" }],
      messages: [{ id: "wamid.HBgI..." }],
    });

    expect(result.providerMessageId).toBe("wamid.HBgI...");
    expect(result.recipientWaId).toBe("971501234567");
  });

  test("returns empty recipientWaId when contacts missing", () => {
    const result = parseSendTemplateResponse({
      messaging_product: "whatsapp",
      contacts: [],
      messages: [{ id: "wamid.test" }],
    });

    expect(result.providerMessageId).toBe("wamid.test");
    expect(result.recipientWaId).toBe("");
  });

  test("throws when messages array is empty", () => {
    expect(() =>
      parseSendTemplateResponse({
        messaging_product: "whatsapp",
        contacts: [],
        messages: [],
      })
    ).toThrow("missing messages[0].id");
  });
});

describe("list-phone-numbers — buildRequest", () => {
  test("builds GET URL with limit=100 on first page", () => {
    const { url, init } = buildListPhoneNumbersRequest(CTX, { wabaId: "987654321" });

    expect(url).toContain("/987654321/phone_numbers");
    expect(url).toContain("limit=100");
    expect(init.method).toBe("GET");

    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-token-abc123");
  });

  test("builds GET URL with after cursor for pagination", () => {
    const { url } = buildListPhoneNumbersRequest(CTX, { wabaId: "987654321" }, "cursor-abc");

    expect(url).toContain("after=cursor-abc");
    expect(url).not.toContain("limit=100");
  });
});

describe("list-phone-numbers — parseResponse", () => {
  test("extracts phone numbers and next cursor", () => {
    const result = parseListPhoneNumbersResponse({
      data: [
        {
          id: "111",
          display_phone_number: "+971501234567",
          verified_name: "Test Business",
          quality_rating: "GREEN",
          throughput_level: "STANDARD",
        },
      ],
      paging: { cursors: { before: "b1", after: "c1" } },
    });

    expect(result.phoneNumbers).toHaveLength(1);
    expect(result.phoneNumbers[0].display_phone_number).toBe("+971501234567");
    expect(result.nextCursor).toBe("c1");
  });

  test("returns empty array and undefined cursor when no data", () => {
    const result = parseListPhoneNumbersResponse({
      data: [],
      paging: { cursors: {} },
    });

    expect(result.phoneNumbers).toHaveLength(0);
    expect(result.nextCursor).toBeUndefined();
  });
});

describe("get-phone-number — buildRequest", () => {
  test("builds GET URL for a phone number ID", () => {
    const { url, init } = buildGetPhoneNumberRequest(CTX, { phoneNumberId: "123456789" });

    expect(url).toBe("https://graph.facebook.com/v23.0/123456789");
    expect(init.method).toBe("GET");
  });

  test("throws on non-numeric phoneNumberId", () => {
    expect(() => buildGetPhoneNumberRequest(CTX, { phoneNumberId: "abc" })).toThrow("Invalid phoneNumberId");
  });
});

describe("get-phone-number — parseResponse", () => {
  test("returns body as-is (passthrough)", () => {
    const body = {
      id: "123456789",
      display_phone_number: "+971501234567",
      verified_name: "Business",
      quality_rating: "GREEN",
      throughput_level: "STANDARD",
      portfolio_messaging_limit_tier: "TIER_1K",
    };

    const result = parseGetPhoneNumberResponse(body);
    expect(result).toEqual(body);
    expect(result.portfolio_messaging_limit_tier).toBe("TIER_1K");
  });
});

describe("list-message-templates — buildRequest", () => {
  test("builds GET URL for message_templates endpoint", () => {
    const { url, init } = buildListTemplatesRequest(CTX, { wabaId: "987654321" });

    expect(url).toContain("/987654321/message_templates");
    expect(url).toContain("limit=100");
    expect(init.method).toBe("GET");
  });

  test("builds URL with after cursor for pagination", () => {
    const { url } = buildListTemplatesRequest(CTX, { wabaId: "987654321" }, "next-cursor");

    expect(url).toContain("after=next-cursor");
  });
});

describe("list-message-templates — parseResponse", () => {
  test("extracts templates with language codes and next cursor", () => {
    const result = parseListTemplatesResponse({
      data: [
        {
          id: "tmpl-1",
          name: "hello_world",
          language: { code: "en_US" },
          status: "APPROVED",
          category: "MARKETING",
        },
        {
          id: "tmpl-2",
          name: "order_confirmation",
          language: { code: "ar" },
          status: "APPROVED",
          category: "UTILITY",
        },
      ],
      paging: { cursors: { before: "b1", after: "c2" } },
    });

    expect(result.templates).toHaveLength(2);
    expect(result.templates[0].name).toBe("hello_world");
    expect(result.templates[0].language.code).toBe("en_US");
    expect(result.templates[1].language.code).toBe("ar");
    expect(result.nextCursor).toBe("c2");
  });

  test("returns empty array when no templates", () => {
    const result = parseListTemplatesResponse({ data: [] });
    expect(result.templates).toHaveLength(0);
    expect(result.nextCursor).toBeUndefined();
  });
});

describe("buildRequest + mocked fetch — round-trip", () => {
  beforeEach(() => {
    const mockedFetch = async () =>
      new Response(
        JSON.stringify({
          messaging_product: "whatsapp",
          contacts: [{ input: "971501234567", wa_id: "971501234567" }],
          messages: [{ id: "wamid.mocked.123" }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    globalThis.fetch = mockedFetch as unknown as typeof fetch;
  });

  test("send-template-message: fetch with buildRequest returns parsed result", async () => {
    const { url, init } = buildSendTemplateRequest(CTX, {
      phoneNumberId: "123456789",
      to: "971501234567",
      templateName: "hello_world",
      languageCode: "en_US",
    });

    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
    const body = await response.json();
    const result = parseSendTemplateResponse(body);

    expect(result.providerMessageId).toBe("wamid.mocked.123");
    expect(result.recipientWaId).toBe("971501234567");
  });
});
