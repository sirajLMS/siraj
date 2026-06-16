import { BaseLogger } from "./base-logger";

class TestLogger extends BaseLogger {
  constructor() {
    super("test");
  }
}

// Create singleton instance
export const testLogger = new TestLogger();
