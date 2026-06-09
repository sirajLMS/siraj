import { BaseLogger } from "./base-logger";

class SimpleLogger extends BaseLogger {
  constructor() {
    super("simpleLogger", false);
  }
}

// Create singleton instance
export const logger = new SimpleLogger();
