import { afterAll, beforeAll } from "bun:test";
import { startTestServer, stopTestServer } from "./testServer";

export function setupTestServerLifecycle() {
  beforeAll(async () => {
    await startTestServer();
  }, 65000);

  afterAll(() => {
    stopTestServer();
  });
}
