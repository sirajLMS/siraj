import { expect } from "bun:test";
import type { BrowserContext, Page } from "playwright";
import { academyAdmins, parents, teachers } from "@/shared/demo-users";
import { SystemPermissionGroupSlug } from "@/shared/lib/enum";

const PWD = "12345678";

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
} as const;

export type DemoUserSlug = keyof typeof DEMO_USERS;

export async function loginAsDemoUser(page: Page, context: BrowserContext, groupSlug: string): Promise<void> {
  const response = await page.evaluate(async (slug: string) => {
    const res = await fetch("/api/graphql", {
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
        variables: { input: { groupSlug: slug } },
      }),
    });
    return res.json();
  }, groupSlug);

  const token = response?.data?.demoLogin?.token;
  if (!token) {
    throw new Error(`Failed to login demo user with groupSlug: ${groupSlug}`);
  }

  await context.addCookies([
    {
      name: "access_token",
      value: token,
      domain: "localhost",
      path: "/",
    },
  ]);

  await page.goto("/ar/dashboard");
  await page.waitForURL("**/dashboard**");
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
    baseURL: "http://localhost:3001",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  });
}
