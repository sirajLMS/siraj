/**
 * Preload for `bun run test:live-fx`.
 * Bun auto-loads `.env` before tests; this script fails fast when neither
 * provider key is configured so the suite cannot silently no-op.
 */
const hasOer = Boolean(process.env.OPENEXCHANGERATES_APP_ID);
const hasFixer = Boolean(process.env.FIXER_API_KEY);

if (!hasOer && !hasFixer) {
  throw new Error(
    "test:live-fx requires at least one provider key in .env: OPENEXCHANGERATES_APP_ID and/or FIXER_API_KEY"
  );
}
