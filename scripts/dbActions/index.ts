/**
 * DB Actions Script
 * Converted from dbActions.sh
 */
import { main } from "./cli";

main().catch((err: unknown) => {
  globalThis.console.error("Fatal:", err);
  process.exit(1);
});
