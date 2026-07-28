import { expect } from "bun:test";
import type { BrowserContext, Cookie, Page } from "playwright";
import { SystemPermissionGroupSlug } from "@/backend/enum";
import { getTestBaseUrl } from "@/frontend/common/graphql/test/testPort";
import { academyAdmins, parents, staff, students, supervisors, teachers } from "@/shared/demo-users";

const PWD = "12345678";
const REQUIRED_AUTH_COOKIES = ["session_id", "refresh_token", "access_token"] as const;

export const DEMO_USERS = {
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

export async function authenticateDemoUser(context: BrowserContext, groupSlug: string): Promise<void> {
  const baseUrl = getTestBaseUrl();
  const graphqlUrl = `${baseUrl}/api/graphql`;
  const fetchFn = typeof Bun === "undefined" ? fetch : Bun.fetch;
  const maxAttempts = 5;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetchFn(graphqlUrl, {
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

    if (response.status === 429 && attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2_000 * attempt));
      continue;
    }

    if (!response.ok) {
      lastError = new Error(`demoLogin request failed with status ${response.status}`);
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1_000 * attempt));
        continue;
      }
      throw lastError;
    }

    const body = (await response.json()) as {
      data?: { demoLogin?: { token?: string } };
      errors?: unknown[];
    };
    const token = body.data?.demoLogin?.token;
    if (!token) {
      lastError = new Error(
        `Failed to login demo user with groupSlug: ${groupSlug}. Response: ${JSON.stringify(body)}`
      );
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1_000 * attempt));
        continue;
      }
      throw lastError;
    }

    const authCookies = getSetCookieHeaders(response)
      .map(raw => parseSetCookieHeader(raw, baseUrl))
      .filter((cookie): cookie is Cookie => cookie !== null);

    assertRequiredAuthCookies(authCookies);
    await context.addCookies(authCookies);
    return;
  }

  throw lastError ?? new Error(`Failed to authenticate demo user with groupSlug: ${groupSlug}`);
}

export async function waitForDashboardReady(page: Page): Promise<void> {
  if (page.url().includes("/login")) {
    throw new Error(`Login failed: redirected to ${page.url()}`);
  }

  await page.locator("main, [role='main']").first().waitFor({ state: "visible", timeout: 30_000 });
}

async function gotoWithRetry(page: Page, path: string): Promise<void> {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await page.goto(path, { waitUntil: "commit", timeout: 30_000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await page.waitForTimeout(3_000 * attempt);
      }
    }
  }

  throw lastError;
}

export async function loginAsDemoUser(page: Page, context: BrowserContext, groupSlug: string): Promise<void> {
  await authenticateDemoUser(context, groupSlug);

  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await gotoWithRetry(page, "/dashboard");
      await waitForDashboardReady(page);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await page.waitForTimeout(2_000 * attempt);
      }
    }
  }

  throw lastError;
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
