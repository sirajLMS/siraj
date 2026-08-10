/**
 * WhatsApp Cloud API — api-call-coverage meta-test (Q1, REQ-9).
 *
 * Fails if any file under `cloud-api/requests/` lacks a paired integration
 * test (4 builders are required to have pairs; nothing else may exist in
 * the folder, Q1).
 *
 * This test does NOT call the live Meta API — it validates file pairing.
 *
 * Run: `bun run test:live-comm` or `bun run test:integration`
 */
import { expect, test } from "bun:test";
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const describeLive = describeLiveWhen(true, "whatsapp-api-call-coverage @live-comm");

// The 4 core request builders (Q1 — no register/deregister/code/template CRUD builders).
const EXPECTED_BUILDERS = [
  "send-template-message.request.ts",
  "list-phone-numbers.request.ts",
  "get-phone-number.request.ts",
  "list-message-templates.request.ts",
] as const;

const REQUESTS_DIR = "backend/services/communication/channels/whatsapp/cloud-api/requests";
const INTEGRATION_TEST_DIR = "test/integration/communication/whatsapp";

describeLive("whatsapp-api-call-coverage @live-comm", () => {
  test("every request builder file has a paired integration test (Q1)", async () => {
    const requestsDir = await import("node:fs/promises");
    const path = await import("node:path");

    const requestFiles = await requestsDir.readdir(path.resolve(process.cwd(), REQUESTS_DIR));

    const builderFiles = requestFiles.filter(f => f.endsWith(".request.ts") && !f.endsWith(".test.ts"));

    expect(builderFiles.toSorted((a, b) => a.localeCompare(b))).toEqual(
      [...EXPECTED_BUILDERS].toSorted((a, b) => a.localeCompare(b))
    );

    const testFiles = await requestsDir.readdir(path.resolve(process.cwd(), INTEGRATION_TEST_DIR));

    const integrationTests = testFiles.filter(f => f.endsWith(".integration.test.ts"));

    const expectedTestPrefixes = EXPECTED_BUILDERS.map(b => b.replace(".request.ts", ""));

    for (const prefix of expectedTestPrefixes) {
      const hasTest = integrationTests.some(t => t.startsWith(prefix));
      expect(hasTest).toBe(true);
    }

    expect(integrationTests.length).toBeGreaterThanOrEqual(EXPECTED_BUILDERS.length);
  });
});
