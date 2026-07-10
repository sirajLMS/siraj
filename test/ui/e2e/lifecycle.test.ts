import { describe, expect, test } from "bun:test";
import { getTestBaseUrl } from "@/frontend/graphql/test/testPort";
import { createContext, setupBrowserLifecycle } from "@/test/ui/e2e/lifecycle";

describe("E2E Lifecycle", () => {
  setupBrowserLifecycle();

  test("browser launches and navigates to dev server", async () => {
    const context = await createContext();
    const page = await context.newPage();
    await page.goto("/");
    expect(page.url()).toContain(getTestBaseUrl());
    await context.close();
  });
});
