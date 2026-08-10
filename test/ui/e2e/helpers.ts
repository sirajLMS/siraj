import { expect } from "bun:test";
import type { BrowserContext, Cookie, Page } from "playwright";
import { SystemPermissionGroupSlug } from "@/backend/enum";
import { getTestBaseUrl } from "@/frontend/common/graphql/test/testPort";
import { isTestServerRunning, startTestServer } from "@/frontend/common/graphql/test/testServer";
import { academyAdmins, parents, staff, students, superAdmins, supervisors, teachers } from "@/shared/demo-users";
import { testLogger } from "@/shared/lib/logger/testlogger";

const PWD = "12345678";
const REQUIRED_AUTH_COOKIES = ["session_id", "refresh_token", "access_token"] as const;

export const DEMO_USERS = {
  superAdmin: {
    email: superAdmins[0].email,
    password: PWD,
    groupSlug: SystemPermissionGroupSlug.SUPER_ADMIN,
  },
  academyAdmin: {
    email: academyAdmins[0].email,
    password: PWD,
    groupSlug: SystemPermissionGroupSlug.ACADEMY_ADMIN,
  },
  teacher: {
    email: teachers[0].email,
    password: PWD,
    groupSlug: SystemPermissionGroupSlug.TEACHER_DEFAULT,
  },
  parent: {
    email: parents[0].email,
    password: PWD,
    groupSlug: SystemPermissionGroupSlug.PARENT_DEFAULT,
  },
  supervisor: {
    email: supervisors[0].email,
    password: PWD,
    groupSlug: SystemPermissionGroupSlug.SUPERVISOR_DEFAULT,
  },
  staff: {
    email: staff[0].email,
    password: PWD,
    groupSlug: SystemPermissionGroupSlug.STAFF_DEFAULT,
  },
  student: {
    email: students[0].email,
    password: PWD,
    groupSlug: SystemPermissionGroupSlug.STUDENT_DEFAULT,
  },
} as const;

export type DemoUserSlug = keyof typeof DEMO_USERS;

function parseSetCookieHeader(raw: string, baseUrl: string): Cookie | null {
  const [nameValue, ...attributes] = raw.split(";").map(part => part.trim());
  const separatorIndex = nameValue.indexOf("=");
  if (separatorIndex <= 0) {
    return null;
  }

  const name = nameValue.slice(0, separatorIndex);
  const value = nameValue.slice(separatorIndex + 1);
  const cookie: Cookie = {
    name,
    value,
    domain: "localhost",
    path: "/",
    expires: -1,
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
  };

  for (const attribute of attributes) {
    const lower = attribute.toLowerCase();
    if (lower === "httponly") {
      cookie.httpOnly = true;
      continue;
    }
    if (lower === "secure") {
      cookie.secure = true;
      continue;
    }
    if (lower.startsWith("path=")) {
      cookie.path = attribute.slice(5);
      continue;
    }
    if (lower.startsWith("samesite=")) {
      const sameSite = attribute.slice(9);
      if (sameSite === "Strict" || sameSite === "Lax" || sameSite === "None") {
        cookie.sameSite = sameSite;
      }
    }
  }

  if (cookie.secure && baseUrl.startsWith("http://")) {
    cookie.secure = false;
  }

  return cookie;
}

function getSetCookieHeaders(response: Response): string[] {
  if (typeof response.headers.getSetCookie === "function") {
    const cookies = response.headers.getSetCookie();
    if (cookies.length > 0) {
      return cookies;
    }
  }

  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
}

function assertRequiredAuthCookies(cookies: Cookie[]): void {
  const names = new Set(cookies.map(cookie => cookie.name));
  const missing = REQUIRED_AUTH_COOKIES.filter(name => !names.has(name));
  if (missing.length > 0) {
    throw new Error(
      `demoLogin missing auth cookies: ${missing.join(", ")}. Ensure AUTH_COOKIE_SECURE=false in .env.test and rebuild: bun run build:test`
    );
  }
}

async function attemptDemoLogin(graphqlUrl: string, groupSlug: string, fetchFn: typeof fetch): Promise<Response> {
  return fetchFn(graphqlUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        mutation demoLogin($input: DemoLoginInput!) {
          demoLogin(input: $input) {
            token
          }
        }
      `,
      variables: { input: { groupSlug } },
    }),
  });
}

interface DemoLoginResponseBody {
  data?: { demoLogin?: { token?: string } };
  errors?: unknown[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDemoLoginResponseBody(value: unknown): value is DemoLoginResponseBody {
  if (!isRecord(value)) return false;
  if (value.errors !== undefined && !Array.isArray(value.errors)) return false;
  if (value.data !== undefined) {
    const data = value.data;
    if (!isRecord(data)) return false;
    if (data.demoLogin !== undefined) {
      const demoLogin = data.demoLogin;
      if (!isRecord(demoLogin)) return false;
      if (demoLogin.token !== undefined && typeof demoLogin.token !== "string") return false;
    }
  }
  return true;
}

async function processDemoLoginResponse(
  response: Response,
  context: BrowserContext,
  baseUrl: string
): Promise<boolean> {
  if (!response.ok) return false;

  const body: unknown = await response.json();
  if (!isDemoLoginResponseBody(body)) return false;
  const token = body.data?.demoLogin?.token;
  if (!token) return false;

  const authCookies = getSetCookieHeaders(response)
    .map(raw => parseSetCookieHeader(raw, baseUrl))
    .filter((cookie): cookie is Cookie => cookie !== null);

  assertRequiredAuthCookies(authCookies);
  await context.addCookies(authCookies);
  return true;
}

async function handleDemoLoginRetry(
  attempt: number,
  maxAttempts: number,
  isDevMode: boolean,
  is429 = false
): Promise<boolean> {
  if (attempt >= maxAttempts) return false;
  const delay = is429 ? 2_000 * attempt : isDevMode ? 10_000 * attempt : 1_000 * attempt;
  await new Promise(resolve => setTimeout(resolve, delay));
  return true;
}

async function executeDemoLoginAttempt(
  graphqlUrl: string,
  groupSlug: string,
  fetchFn: typeof fetch,
  context: BrowserContext,
  baseUrl: string
): Promise<{ success: boolean; is429?: boolean; error?: unknown }> {
  try {
    const response = await attemptDemoLogin(graphqlUrl, groupSlug, fetchFn);
    if (response.status === 429) {
      return { success: false, is429: true };
    }
    const success = await processDemoLoginResponse(response, context, baseUrl);
    if (success) return { success: true };
    return {
      success: false,
      error: new Error(`Failed to login demo user with groupSlug: ${groupSlug}. Status: ${response.status}`),
    };
  } catch (err) {
    return { success: false, error: err };
  }
}

async function authenticateDemoUserAttempt(
  graphqlUrl: string,
  groupSlug: string,
  fetchFn: typeof fetch,
  context: BrowserContext,
  baseUrl: string,
  isDevMode: boolean,
  maxAttempts: number,
  attempt: number,
  lastError: unknown
): Promise<void> {
  if (attempt > maxAttempts) {
    throw lastError ?? new Error(`Failed to authenticate demo user with groupSlug: ${groupSlug}`);
  }
  const result = await executeDemoLoginAttempt(graphqlUrl, groupSlug, fetchFn, context, baseUrl);
  if (result.success) return;
  const newError = result.error ?? lastError;
  const isRetryable = await handleDemoLoginRetry(attempt, maxAttempts, isDevMode, result.is429);
  if (!isRetryable) {
    throw newError ?? new Error(`Failed to authenticate demo user with groupSlug: ${groupSlug}`);
  }
  return authenticateDemoUserAttempt(
    graphqlUrl,
    groupSlug,
    fetchFn,
    context,
    baseUrl,
    isDevMode,
    maxAttempts,
    attempt + 1,
    newError
  );
}

export async function authenticateDemoUser(context: BrowserContext, groupSlug: string): Promise<void> {
  const baseUrl = getTestBaseUrl();
  const graphqlUrl = `${baseUrl}/api/graphql`;
  const fetchFn = typeof Bun === "undefined" ? fetch : Bun.fetch;
  const isDevMode = process.env.TEST_SERVER_MODE === "dev";
  const maxAttempts = isDevMode ? 10 : 5;
  await authenticateDemoUserAttempt(
    graphqlUrl,
    groupSlug,
    fetchFn,
    context,
    baseUrl,
    isDevMode,
    maxAttempts,
    1,
    undefined
  );
}

export async function waitForDashboardReady(page: Page): Promise<void> {
  if (page.url().includes("/login")) {
    throw new Error(`Login failed: redirected to ${page.url()}`);
  }

  const isDevMode = process.env.TEST_SERVER_MODE === "dev";
  const timeout = isDevMode ? 180_000 : 30_000;
  await page.locator("main, [role='main']").first().waitFor({ state: "visible", timeout });
}

async function retryWithBackoffAttempt<T>(
  operation: () => Promise<T>,
  maxAttempts: number,
  backoff: (attempt: number) => Promise<void>,
  attempt: number,
  lastError: unknown
): Promise<T> {
  if (attempt > maxAttempts) {
    throw lastError;
  }
  try {
    return await operation();
  } catch (error) {
    if (attempt >= maxAttempts) {
      throw error;
    }
    await backoff(attempt);
    return retryWithBackoffAttempt(operation, maxAttempts, backoff, attempt + 1, error);
  }
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxAttempts: number,
  backoff: (attempt: number) => Promise<void>
): Promise<T> {
  return retryWithBackoffAttempt(operation, maxAttempts, backoff, 1, undefined);
}

async function gotoWithRetry(page: Page, path: string): Promise<void> {
  const maxAttempts = 3;
  const isDevMode = process.env.TEST_SERVER_MODE === "dev";
  const gotoTimeout = isDevMode ? 180_000 : 30_000;
  await retryWithBackoff(
    () => page.goto(path, { waitUntil: "commit", timeout: gotoTimeout }),
    maxAttempts,
    attempt => page.waitForTimeout(3_000 * attempt)
  );
}

export async function loginAsDemoUser(page: Page, context: BrowserContext, groupSlug: string): Promise<void> {
  await authenticateDemoUser(context, groupSlug);
  const maxAttempts = 3;
  await retryWithBackoff(
    async () => {
      await gotoWithRetry(page, "/dashboard");
      await waitForDashboardReady(page);
    },
    maxAttempts,
    attempt => page.waitForTimeout(2_000 * attempt)
  );
}

/**
 * Authenticate a demo user and navigate directly to a specific route,
 * skipping the /dashboard warmup that can OOM in memory-constrained dev mode.
 * In dev mode, restarts the test server if it crashed during a previous test.
 */
export async function loginAsDemoUserAtRoute(
  page: Page,
  context: BrowserContext,
  groupSlug: string,
  path: string
): Promise<void> {
  // In dev mode, the server may have crashed (OOM) during a previous test's
  // page compilation. Check and restart if needed before authenticating.
  if (process.env.TEST_SERVER_MODE === "dev") {
    if (!(await isTestServerRunning())) {
      testLogger.info("Dev server not running; restarting...");
      await startTestServer();
    }
  }
  await authenticateDemoUser(context, groupSlug);
  // Use absolute URL with current port (server may have been restarted on a new port)
  await gotoWithRetry(page, `${getTestBaseUrl()}${path}`);
}

export async function loginAsDemoUserAt(
  page: Page,
  context: BrowserContext,
  groupSlug: string,
  path: string,
  waitForReady: (page: Page) => Promise<void>
): Promise<void> {
  await authenticateDemoUser(context, groupSlug);
  await gotoAppRoute(page, path);
  await waitForReady(page);
}

export async function gotoAppRoute(page: Page, path: string): Promise<void> {
  await gotoWithRetry(page, path);
}

const CLOSE_TIMEOUT_MS = 5_000;

export async function closeE2eSession(page?: Page, context?: BrowserContext): Promise<void> {
  const closeWithTimeout = async (close: () => Promise<void>): Promise<void> => {
    await Promise.race([close(), new Promise<void>(resolve => setTimeout(resolve, CLOSE_TIMEOUT_MS))]);
  };

  if (page) {
    await page.goto("about:blank", { waitUntil: "commit", timeout: 5_000 }).catch(() => {});
    await closeWithTimeout(() => page.close());
  }
  if (context) {
    await closeWithTimeout(() => context.close());
  }
}

export async function assertElementVisible(page: Page, selector: string): Promise<void> {
  const isVisible = await page.locator(selector).isVisible();
  expect(isVisible).toBe(true);
}

export async function assertElementHidden(page: Page, selector: string): Promise<void> {
  const isVisible = await page.locator(selector).isVisible();
  expect(isVisible).toBe(false);
}

export async function createMobileContext(browser: {
  newContext: (options?: unknown) => Promise<BrowserContext>;
}): Promise<BrowserContext> {
  return browser.newContext({
    baseURL: getTestBaseUrl(),
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  });
}
