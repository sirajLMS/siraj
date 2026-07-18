/**
 * Preload for `bun run test:live-comm`.
 * Bun auto-loads `.env` before tests; this script fails fast when none of
 * the three notification provider key triples is configured so the suite
 * cannot silently no-op.
 */
const hasResend = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
const hasTwilio = Boolean(
  process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
);
const hasFirebase = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL
);

if (!hasResend && !hasTwilio && !hasFirebase) {
  throw new Error(
    "test:live-comm requires at least one provider key triple in .env: RESEND_* and/or TWILIO_* and/or FIREBASE_*"
  );
}
