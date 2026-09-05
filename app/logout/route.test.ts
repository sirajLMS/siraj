import { beforeEach, describe, expect, mock, test } from "bun:test";

const NextServerModule = await import("next/server");
const RealNextRequest = NextServerModule.NextRequest;

await mock.module("next/server", () => {
  return {
    NextRequest: RealNextRequest,
    NextResponse: NextServerModule.NextResponse,
  };
});

const logoutUserMock = mock(async () => true);

await mock.module("@/backend/services", () => ({
  SessionService: {
    logoutUser: logoutUserMock,
  },
}));

async function importRoute() {
  return import("./route");
}

beforeEach(() => {
  logoutUserMock.mockClear();
});

describe("app/logout/route", () => {
  test("GET /logout clears cookies and redirects to /login", async () => {
    const { GET } = await importRoute();
    const req = new RealNextRequest("http://localhost:3000/logout", {
      headers: {
        "x-forwarded-for": "203.0.113.195",
      },
    });

    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
    expect(logoutUserMock).toHaveBeenCalled();
  });

  test("POST /logout clears cookies and redirects to /login", async () => {
    const { POST } = await importRoute();
    const req = new RealNextRequest("http://localhost:3000/logout", {
      method: "POST",
    });

    const res = await POST(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
    expect(logoutUserMock).toHaveBeenCalled();
  });
});
