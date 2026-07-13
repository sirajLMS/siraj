import { afterAll, beforeAll } from "bun:test";
import { type Browser, type BrowserContext, chromium } from "playwright";
import { setupTestServerLifecycle } from "@/frontend/common/graphql/test/lifecycle";
import { getTestBaseUrl } from "@/frontend/common/graphql/test/testPort";

let browser: Browser | null = null;

export function setupBrowserLifecycle() {
  setupTestServerLifecycle();

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  }, 70000);

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
  return browser.newContext({
    baseURL: getTestBaseUrl(),
    viewport,
  });
}

export async function createMobileContext(): Promise<BrowserContext> {
  if (!browser) {
    throw new Error("Browser not initialized. Call setupBrowserLifecycle() first.");
  }
  return browser.newContext({
    baseURL: getTestBaseUrl(),
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
}
