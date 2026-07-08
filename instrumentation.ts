export async function register() {
  const { ensureEnvironmentValidated } = await import("@/backend/lib/env");
  ensureEnvironmentValidated();
}
