import { afterEach, describe, expect, test } from "bun:test";
import type { BrowserContext, Page } from "playwright";
import { DEMO_USERS, closeE2eSession, loginAsDemoUser } from "@/test/ui/e2e/helpers";
import { createContext, setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle";

setupBrowserLifecycle();

let context: BrowserContext;
let page: Page;

afterEach(async () => {
  await closeE2eSession(page, context);
});

describe("Teacher Onboarding E2E", () => {
  test("academy admin can load onboarding page", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);
    await page.goto("/dashboard/teachers/onboarding", { waitUntil: "commit" });
    await page.getByRole("heading", { name: /انضمام المعلم/i }).waitFor({ state: "visible" });
    expect(await page.getByRole("heading", { name: /انضمام المعلم/i }).isVisible()).toBe(true);
  });

  test("phone field shows validation error when exceeding 50 characters", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);
    await page.goto("/dashboard/teachers/onboarding", { waitUntil: "commit" });
    await page.getByRole("heading", { name: /انضمام المعلم/i }).waitFor({ state: "visible" });

    // Fill required name + email + password so the only error is phone
    await page.getByLabel(/الاسم الكامل/i).fill("E2E Test Teacher");
    await page.getByLabel(/البريد الإلكتروني/i).fill("e2e-teacher@example.com");
    await page.getByLabel(/كلمة المرور/i).fill("TestPassword123!");

    // Type a phone number that exceeds 50 characters
    const longPhone = "1".repeat(51);
    await page.getByLabel(/الهاتف/i).fill(longPhone);

    // Blur to trigger validation
    await page.getByLabel(/الهاتف/i).blur();

    // Expect the Zod validation message to appear
    const errorMsg = page.getByText(/يجب ألا يزيد رقم الهاتف عن 50 حرف/i);
    await errorMsg.waitFor({ state: "visible" });
    expect(await errorMsg.isVisible()).toBe(true);
  });

  test("phone field accepts valid phone number under 50 characters", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUser(page, context, DEMO_USERS.academyAdmin.groupSlug);
    await page.goto("/dashboard/teachers/onboarding", { waitUntil: "commit" });
    await page.getByRole("heading", { name: /انضمام المعلم/i }).waitFor({ state: "visible" });

    // Fill required name + email + password
    await page.getByLabel(/الاسم الكامل/i).fill("E2E Test Teacher");
    await page.getByLabel(/البريد الإلكتروني/i).fill("e2e-teacher2@example.com");
    await page.getByLabel(/كلمة المرور/i).fill("TestPassword123!");

    // Type a valid phone number (under 50 chars)
    await page.getByLabel(/الهاتف/i).fill("+1-555-123-4567");
    await page.getByLabel(/الهاتف/i).blur();

    // The max-length error message should NOT be visible
    const errorMsg = page.getByText(/يجب ألا يزيد رقم الهاتف عن 50 حرف/i);
    expect(await errorMsg.isVisible().catch(() => false)).toBe(false);
  });
});
