import { BaseLogger } from "@/lib/base-logger";

class ServerLogger extends BaseLogger {
  constructor() {
    super("server");
  }
}

// Create singleton instance
export const logger = new ServerLogger();

export default logger;
