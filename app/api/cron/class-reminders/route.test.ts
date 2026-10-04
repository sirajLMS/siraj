import { beforeEach, describe, expect, mock, test } from "bun:test";

const { NextRequest: NextRequestImpl, NextResponse } = await import("next/server");

// --- Mock logger ---

const noop = () => {};
await mock.module("@/backend/lib/logger", () => ({
  logger: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
  default: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
}));

// --- Mock cron-auth ---

const TEST_SECRET = "test-cron-secret-1234567890abcdef";
await mock.module("@/backend/lib/cron-auth", () => {
  const verifyCronSecretAuth = (request: { method: string; headers: Headers }) => {
    // R1 / R1b: Production without CRON_SECRET → 500 (fail-loud for server misconfiguration)
    if (process.env.NODE_ENV === "production" && !process.env.CRON_SECRET) {
      return { authorized: false, response: NextResponse.json({ error: "Server misconfigured" }, { status: 500 }) };
    }
    const auth = request.headers.get("authorization");
    if (request.method !== "GET")
      return { authorized: false, response: NextResponse.json({ error: "Method not allowed" }, { status: 405 }) };
    if (auth === `Bearer ${TEST_SECRET}`) return { authorized: true };
    return { authorized: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  };

  const withCronAuth = (handler: (req: unknown) => Promise<Response>) => {
    return async (request: { method: string; headers: Headers }) => {
      const result = verifyCronSecretAuth(request);
      if (!result.authorized) return result.response;
      return handler(request);
    };
  };

  return { verifyCronSecretAuth, withCronAuth };
});

// --- Mock ClassReminderService (submodule file, so the real @/backend/services
// barrel stays intact for other suites in the same bun test process) ---

const mockDispatchDailyReminders = mock(async () => ({
  success: true,
  instancesProcessed: 3,
  deliveriesDispatched: 5,
}));

await mock.module("@/backend/services/notification/class-reminder.service", () => ({
  ClassReminderService: {
    dispatchDailyReminders: mockDispatchDailyReminders,
  },
}));

// formatError / getCronErrorT are NOT mocked: the real implementations are
// pure (sync locale lookup) and the routes' 500 path is asserted against the
// real English messages.

// --- Import the route under test (after all mocks are registered) ---

const { GET } = await import("@/app/api/cron/class-reminders/route");

// --- Helpers ---

function makeRequest(url: string, method = "GET", headers: Record<string, string | null> = {}) {
  const headersInit = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value !== null) headersInit.set(key, value);
  }
  return new NextRequestImpl(url, { method, headers: headersInit });
}

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  return await response.json();
}

const BASE_URL = "http://localhost:3000/api/cron/class-reminders";

// --- Tests ---

describe("GET /api/cron/class-reminders", () => {
  beforeEach(() => {
    mockDispatchDailyReminders.mockClear();
  });

  test("returns 401 without valid auth", async () => {
    const request = makeRequest(BASE_URL, "GET", { authorization: null });
    const response = await GET(request);
    expect(response.status).toBe(401);
    expect(mockDispatchDailyReminders).toHaveBeenCalledTimes(0);
  });

  test("returns 405 for non-GET methods", async () => {
    const request = makeRequest(BASE_URL, "POST", { authorization: `Bearer ${TEST_SECRET}` });
    const response = await GET(request);
    expect(response.status).toBe(405);
    expect(mockDispatchDailyReminders).toHaveBeenCalledTimes(0);
  });

  test("happy path: calls dispatchDailyReminders with withinHours: 24 and returns 200 JSON result", async () => {
    const request = makeRequest(BASE_URL, "GET", { authorization: `Bearer ${TEST_SECRET}` });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockDispatchDailyReminders).toHaveBeenCalledTimes(1);
    expect(mockDispatchDailyReminders).toHaveBeenCalledWith({ withinHours: 24 });

    const body = await parseJson(response);
    expect(body).toEqual({
      success: true,
      instancesProcessed: 3,
      deliveriesDispatched: 5,
    });
  });

  test("returns 500 when dispatchDailyReminders throws", async () => {
    mockDispatchDailyReminders.mockRejectedValueOnce(new Error("Notification provider error"));

    const request = makeRequest(BASE_URL, "GET", { authorization: `Bearer ${TEST_SECRET}` });
    const response = await GET(request);

    expect(response.status).toBe(500);
    const body = await parseJson(response);
    expect(body).toEqual({
      success: false,
      error: "Class reminders failed",
    });
  });
});
