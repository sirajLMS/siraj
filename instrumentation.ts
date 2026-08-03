export async function register() {
  // Env validation uses Node APIs (fs, path, crypto via logger/env).
  // Next.js still analyzes instrumentation for Edge — gate the import.
  // https://nextjs.org/docs/app/guides/instrumentation#importing-runtime-specific-code
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureEnvironmentValidated } = await import("./backend/lib/env");
    ensureEnvironmentValidated();
  }
}
