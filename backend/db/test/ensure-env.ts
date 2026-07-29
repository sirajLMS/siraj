import { ensureEnvironmentValidated } from "@/backend/lib/env";
import { isTestCi } from "@/backend/lib/test-ci-env";

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
  const ciHint = isTestCi()
    ? " In CI, set TEST_CI=true on the job and DATABASE_URL to the Postgres service URL."
    : " Locally, use `bun --env-file=.env.test` and keep DATABASE_URL on database siraj_test.";
  throw new Error(
    `Tests must use .env.test exclusively (DATABASE_URL must target database "siraj_test"). Got: ${redacted || "(unset)"}.${ciHint}`
  );
}
