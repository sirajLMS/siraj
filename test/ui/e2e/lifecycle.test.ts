import { describe, expect, test } from "bun:test";
import { getTestBaseUrl } from "@/test/helpers";
import { createContext, setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle";

describe("E2E Lifecycle", () => {
  setupBrowserLifecycle();

  test("browser launches and navigates to dev server", async () => {
    const context = await createContext();
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(page.url()).toContain(getTestBaseUrl());
    await context.close();
  });
});
