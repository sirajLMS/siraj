import { afterEach, describe, expect, test } from "bun:test";
import type { BrowserContext, Page } from "playwright";
import { getDefaultTranslations } from "@/shared/locale/server";
import { closeE2eSession, DEMO_USERS, loginAsDemoUserAtRoute } from "@/test/ui/e2e/helpers";
import { createContext, setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle";

setupBrowserLifecycle();

const isDevMode = process.env.TEST_SERVER_MODE === "dev";
const headingTimeout = isDevMode ? 180_000 : 30_000;

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const onboarding = getDefaultTranslations().dashboardTranslations.teacherOnboarding;
const phoneInput = getDefaultTranslations().uiTranslations.phoneInput;

const PAGE_TITLE = new RegExp(escapeRegExp(onboarding.pageTitle));
const FULL_NAME_LABEL = new RegExp(escapeRegExp(onboarding.fields.fullName));
const EMAIL_LABEL = new RegExp(escapeRegExp(onboarding.fields.email));
const PASSWORD_LABEL = new RegExp(escapeRegExp(onboarding.fields.password));
const PHONE_LABEL = new RegExp(escapeRegExp(onboarding.fields.phone));
const PHONE_MAX_LENGTH_ERROR = new RegExp(escapeRegExp(onboarding.validation.phoneMaxLength));
const PHONE_INVALID_ERROR = new RegExp(escapeRegExp(phoneInput.invalidPhone));

let context: BrowserContext;
let page: Page;

afterEach(async () => {
  await closeE2eSession(page, context);
});

describe("Teacher Onboarding E2E", () => {
  test("super admin can load onboarding page", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUserAtRoute(page, context, DEMO_USERS.superAdmin.groupSlug, "/teachers/onboarding");
    await page.getByRole("heading", { name: PAGE_TITLE }).waitFor({ state: "visible", timeout: headingTimeout });
    expect(await page.getByRole("heading", { name: PAGE_TITLE }).isVisible()).toBe(true);
  });

  test("phone field shows validation error when exceeding 50 characters", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUserAtRoute(page, context, DEMO_USERS.superAdmin.groupSlug, "/teachers/onboarding");
    await page.getByRole("heading", { name: PAGE_TITLE }).waitFor({ state: "visible", timeout: headingTimeout });

    await page.getByLabel(FULL_NAME_LABEL).fill("E2E Test Teacher");
    await page.getByLabel(EMAIL_LABEL).fill("[EMAIL_REDACTED]");
    await page.getByLabel(PASSWORD_LABEL).fill("TestPassword123!");

    const longPhone = "1".repeat(51);
    const phoneField = page.getByLabel(PHONE_LABEL);
    await phoneField.fill(longPhone);
    await phoneField.blur();

    // PhoneInput validates inline — a 51-digit phone is structurally invalid
    // (50 national digits after prefix "1" parsing), so the validation error
    // appears without needing form submit.
    const errorMsg = page.getByText(PHONE_MAX_LENGTH_ERROR);
    await errorMsg.waitFor({ state: "visible", timeout: 30_000 });
    expect(await errorMsg.isVisible()).toBe(true);
  });

  test("phone field accepts valid phone number under 50 characters", async () => {
    context = await createContext();
    page = await context.newPage();
    await loginAsDemoUserAtRoute(page, context, DEMO_USERS.superAdmin.groupSlug, "/teachers/onboarding");
    await page.getByRole("heading", { name: PAGE_TITLE }).waitFor({ state: "visible", timeout: headingTimeout });

    await page.getByLabel(FULL_NAME_LABEL).fill("E2E Test Teacher");
    await page.getByLabel(EMAIL_LABEL).fill("[EMAIL_REDACTED]");
    await page.getByLabel(PASSWORD_LABEL).fill("TestPassword123!");

    await page.getByLabel(PHONE_LABEL).fill("+1 415 555 2671");
    await page.getByLabel(PHONE_LABEL).blur();

    // A valid phone should not show any phone validation error.
    // Wait for the prefix to settle (valid phone success indicator).
    const phoneDisplay = page.getByLabel(PHONE_LABEL);
    await phoneDisplay.waitFor({ state: "visible", timeout: 5_000 });
    expect(
      await page
        .getByText(PHONE_INVALID_ERROR)
        .isVisible()
        .catch(() => false)
    ).toBe(false);
  });
});
