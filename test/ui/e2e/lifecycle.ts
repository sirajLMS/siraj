import { afterAll, beforeAll } from "bun:test";
import { type Browser, type BrowserContext, chromium } from "playwright";
import { setupTestServerLifecycle } from "@/frontend/common/graphql/test/lifecycle";
import { getTestBaseUrl } from "@/frontend/common/graphql/test/testPort";

let browser: Browser | null = null;

export function setupBrowserLifecycle() {
  setupTestServerLifecycle();

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
        : {}),
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
      browser = null;
    }
  });
}

const DEFAULT_VIEWPORT = { width: 1280, height: 720 } as const;

export async function createContext(viewport = DEFAULT_VIEWPORT): Promise<BrowserContext> {
  if (!browser) {
    throw new Error("Browser not initialized. Call setupBrowserLifecycle() first.");
  }
  const context = await browser.newContext({
    baseURL: getTestBaseUrl(),
    viewport,
  });
  context.setDefaultTimeout(30_000);
  context.setDefaultNavigationTimeout(60_000);
  return context;
}

export async function createMobileContext(): Promise<BrowserContext> {
  if (!browser) {
    throw new Error("Browser not initialized. Call setupBrowserLifecycle() first.");
  }
  const context = await browser.newContext({
    baseURL: getTestBaseUrl(),
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  context.setDefaultTimeout(30_000);
  context.setDefaultNavigationTimeout(60_000);
  return context;
}
