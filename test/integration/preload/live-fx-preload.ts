/**
 * Preload for `bun run test:live-fx`.
 * Fails fast when neither FX provider key is configured.
 */
const hasOer = Boolean(process.env.OPENEXCHANGERATES_APP_ID);
const hasFixer = Boolean(process.env.FIXER_API_KEY);

if (!hasOer && !hasFixer) {
  throw new Error(
    "test:live-fx requires at least one provider key in .env.test: OPENEXCHANGERATES_APP_ID and/or FIXER_API_KEY"
  );
}
