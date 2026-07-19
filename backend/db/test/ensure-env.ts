import { ensureEnvironmentValidated } from "@/backend/lib/env";

ensureEnvironmentValidated();

const databaseUrl = process.env.DATABASE_URL ?? "";
const pathname = (() => {
  try {
    return new URL(databaseUrl).pathname;
  } catch {
    return "";
  }
})();

if (!pathname.endsWith("/siraj_test") && pathname !== "/siraj_test") {
  const redacted = databaseUrl.replace(/:([^:@/]+)@/, ":***@");
  throw new Error(
    `Tests must use .env.test exclusively (DATABASE_URL must target database "siraj_test"). Got: ${redacted || "(unset)"}`
  );
}
