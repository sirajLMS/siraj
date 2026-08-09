import { beforeEach, describe, expect, mock, test } from "bun:test";

const { NextRequest: NextRequestImpl, NextResponse } = await import("next/server");
const { NotFoundError } = await import("@/backend/lib/errors");

// --- Mock logger ---

const noop = () => {};
void mock.module("@/backend/lib/logger", () => ({
  logger: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
  default: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
}));

// --- Mock cron-auth ---

const TEST_SECRET = "test-cron-secret-1234567890abcdef";
void mock.module("@/backend/lib/cron-auth", () => {
  const verifyCronSecretAuth = (request: { method: string; headers: Headers }) => {
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

// --- Mock CronService ---

const mockDispatchById = mock(async () => ({
  runId: "run-123",
  queueJobId: "q-456",
}));

void mock.module("@/backend/services/cron/cron.service", () => ({
  CronService: {
    dispatchScheduleById: mockDispatchById,
  },
}));

// --- Import the route under test (after all mocks are registered) ---

const { GET } = await import("@/app/api/cron/execute/route");

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

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000".toLowerCase();

const BASE_URL = "http://localhost:3000/api/cron/execute";

function makeAuthedRequest(scheduleId?: string): InstanceType<typeof NextRequestImpl> {
  const url = scheduleId ? `${BASE_URL}?scheduleId=${scheduleId}` : BASE_URL;
  return makeRequest(url, "GET", { authorization: `Bearer ${TEST_SECRET}` });
}

async function expectDispatchNotCalled(response: Response): Promise<void> {
  expect(response.status).toBe(400);
  const body = await parseJson(response);
  expect(body).toHaveProperty("error");
  expect(mockDispatchById).toHaveBeenCalledTimes(0);
}

async function expectErrorResponse(response: Response, status: number): Promise<void> {
  expect(response.status).toBe(status);
  const body = await parseJson(response);
  expect(body).toHaveProperty("error");
}

// --- Tests ---

describe("GET /api/cron/execute", () => {
  beforeEach(() => {
    mockDispatchById.mockClear();
  });

  test("returns 401 without valid auth", async () => {
    const request = makeRequest(`${BASE_URL}?scheduleId=${VALID_UUID}`, "GET", { authorization: null });
    const response = await GET(request);
    expect(response.status).toBe(401);
    expect(mockDispatchById).toHaveBeenCalledTimes(0);
  });

  test("returns 400 when scheduleId is missing", async () => {
    const response = await GET(makeAuthedRequest());
    await expectDispatchNotCalled(response);
  });

  test("returns 400 when scheduleId is not a valid UUID", async () => {
    const response = await GET(makeAuthedRequest("not-a-uuid"));
    await expectDispatchNotCalled(response);
  });

  test("happy path: calls dispatchScheduleById and returns 200 with runId + queueJobId", async () => {
    const response = await GET(makeAuthedRequest(VALID_UUID));

    expect(response.status).toBe(200);
    expect(mockDispatchById).toHaveBeenCalledTimes(1);

    const body = await parseJson(response);
    expect(body).toEqual({
      dispatchedCount: 1,
      runId: "run-123",
      queueJobId: "q-456",
    });
  });

  test("returns 404 when schedule not found", async () => {
    mockDispatchById.mockRejectedValueOnce(new NotFoundError("SCHEDULE", "Schedule not found"));
    const response = await GET(makeAuthedRequest(VALID_UUID));
    await expectErrorResponse(response, 404);
  });

  test("returns 500 for other errors", async () => {
    mockDispatchById.mockRejectedValueOnce(new Error("Unexpected DB failure"));
    const response = await GET(makeAuthedRequest(VALID_UUID));
    await expectErrorResponse(response, 500);
  });
});
