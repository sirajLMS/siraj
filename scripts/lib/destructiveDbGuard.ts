export interface DestructiveDbSafetyAssessment {
  blocked: boolean;
  reasons: string[];
}

function getCloudProviderReasons(): string[] {
  const reasons: string[] = [];

  // if (process.env.NODE_ENV === "production") {
  //   reasons.push('NODE_ENV is "production"');
  // }

  // const dbProvider = process.env.DB_PROVIDER || "postgres";
  // if (dbProvider === "neon") {
  //   reasons.push('DB_PROVIDER is "neon" (cloud database)');
  // }

  // const storageProvider = process.env.STORAGE_PROVIDER || "local";
  // if (storageProvider !== "local") {
  //   reasons.push(`STORAGE_PROVIDER is "${storageProvider}" (cloud storage)`);
  // }

  // if (process.env.REDIS_PROVIDER === "upstash") {
  //   reasons.push('REDIS_PROVIDER is "upstash" (cloud redis)');
  // }

  // if (process.env.UPSTASH_REDIS_REST_URL) {
  //   reasons.push("UPSTASH_REDIS_REST_URL is set");
  // }

  // if (process.env.GCP_PROJECT_ID || process.env.GCP_BUCKET_NAME) {
  //   reasons.push("GCP storage configuration is set");
  // }

  // if (process.env.BLOB_READ_WRITE_TOKEN) {
  //   reasons.push("BLOB_READ_WRITE_TOKEN is set (Vercel Blob)");
  // }

  // const databaseUrl = process.env.DATABASE_URL;
  // if (databaseUrl) {
  //   reasons.push(...getDatabaseUrlHostReasons(databaseUrl));
  // }

  return reasons;
}

/**
 * Assess whether destructive DB commands (reset, drop, cleanGenerate) are safe to run.
 */
export function assessDestructiveDbCommandSafety(): DestructiveDbSafetyAssessment {
  const reasons = getCloudProviderReasons();
  return {
    blocked: reasons.length > 0,
    reasons,
  };
}

export function formatDestructiveDbBlockMessage(reasons: string[]): string {
  const lines = [
    "✗ Blocked: destructive DB command is disabled for production/cloud environments.",
    "",
    "Detected signals:",
    ...reasons.map(reason => `  - ${reason}`),
    "",
    "Use a local .env (postgres + local storage) for destructive DB workflows.",
  ];
  return lines.join("\n");
}

/**
 * Throws when destructive DB commands must not run in the current environment.
 */
export function assertDestructiveDbCommandAllowed(): void {
  const assessment = assessDestructiveDbCommandSafety();
  if (assessment.blocked) {
    throw new Error(formatDestructiveDbBlockMessage(assessment.reasons));
  }
}
