/**
 * Environment Variable Type Definitions
 * Extends the NodeJS.ProcessEnv interface with application-specific variables
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Storage Configuration
      STORAGE_PROVIDER: "local" | "gcp" | "vercel" | "s3" | "r2";
      LOCAL_STORAGE_PATH?: string;
      NEXT_PUBLIC_BASE_URL?: string;

      // FX Ingestion
      FX_PROVIDER?: "openexchangerates" | "fixer";
      OPENEXCHANGERATES_APP_ID?: string;
      FIXER_API_KEY?: string;
      // Signed URL Cleanup Configuration
      SIGNED_URL_CLEANUP_STRATEGY?: "lazy" | "cron" | "both" | "disabled";
      SIGNED_URL_CLEANUP_CRON_SCHEDULE?: string;
      CRON_SECRET?: string;
      CRON_EXECUTION_MODE?: "vercel" | "vercel-daily" | "external" | "standalone";
      CRON_FX_REFRESH_SCHEDULE?: string;
      CRON_CLASS_REMINDERS_SCHEDULE?: string;
      CRON_WHATSAPP_SYNC_SWEEP_SCHEDULE?: string;
      CRON_WHATSAPP_WEBHOOK_SWEEP_SCHEDULE?: string;
      CRON_TICKER_SCHEDULE?: string;
      CRON_EXTERNAL_ENABLED?: string;
      CRON_EXTERNAL_ENDPOINT?: string;
      CRON_EXTERNAL_SCHEDULE?: string;
      CRON_EXTERNAL_SECRET?: string;

      // GCP Storage Configuration
      GCP_PROJECT_ID?: string;
      GCP_BUCKET_NAME?: string;
      GCP_SECRET_VERSION?: string;
      GCP_SECRET_ID?: string;

      // Database Configuration
      DB_PROVIDER?: "postgres" | "neon" | "sqlite";
      DB_CONNECTION_MODE?: "auto" | "pg" | "neon";
      DATABASE_URL: string;
      DATABASE_ENCRYPTION_KEY: string;
      /** SQLite database file name/path (e.g. ./db/siraj.sqlite) */
      DB_FILE_NAME?: string;
      /** Neon integration test database URL (loaded from .env.test, not for production use) */
      NEON_TEST_DATABASE_URL?: string;

      // JWT Configuration
      JWT_SECRET: string;

      // Redis Configuration
      REDIS_PROVIDER: "local" | "upstash";
      REDIS_URL?: string;
      UPSTASH_REDIS_REST_URL?: string;
      UPSTASH_REDIS_REST_TOKEN?: string;
      /** Upstash Redis integration test REST URL (loaded from .env.test, not for production use) */
      UPSTASH_TEST_REDIS_REST_URL?: string;
      /** Upstash Redis integration test REST Token (loaded from .env.test, not for production use) */
      UPSTASH_TEST_REDIS_REST_TOKEN?: string;
      /** Redis Cloud integration test connection URL (loaded from .env.test, not for production use) */
      REDIS_CLOUD_TEST_REDIS_URL?: string;

      // Cache Configuration
      CACHE_PROVIDER: "redis" | "postgres";

      // Email Configuration
      EMAIL_PROVIDER?: "resend";
      RESEND_API_KEY?: string;
      RESEND_FROM_EMAIL?: string;
      /** Verified Resend recipient for test/live-comm runs (loaded from .env.test) */
      RESEND_TEST_TO_EMAIL?: string;
      /** Verified Twilio recipient for test/live-comm runs (loaded from .env.test) */
      TWILIO_VERIFIED_TEST_RECIPIENT?: string;
      /** Valid FCM device token for test/live-comm runs (loaded from .env.test) */
      FCM_TEST_DEVICE_TOKEN?: string;

      // WhatsApp Cloud API Configuration
      WHATSAPP_ACCESS_TOKEN?: string;
      WHATSAPP_PHONE_NUMBER_ID?: string;
      WHATSAPP_WABA_ID?: string;
      WHATSAPP_API_VERSION?: string;
      WHATSAPP_GRAPH_API_VERSION?: string;
      WHATSAPP_ES_CONFIG_ID?: string;
      WHATSAPP_TEST_TO_PHONE?: string;
      WHATSAPP_TEST_TEMPLATE_NAME?: string;
      WHATSAPP_TEST_TEMPLATE_LANGUAGE?: string;

      // SMS Configuration
      SMS_PROVIDER?: "twilio";
      TWILIO_ACCOUNT_SID?: string;
      TWILIO_AUTH_TOKEN?: string;
      TWILIO_FROM_NUMBER?: string;

      // Push Notification Configuration
      PUSH_PROVIDER?: "fcm";
      FIREBASE_PROJECT_ID?: string;
      FIREBASE_PRIVATE_KEY?: string;
      FIREBASE_CLIENT_EMAIL?: string;

      // GraphQL Configuration
      GRAPHQL_ENCRYPTION_KEY: string;
      /** Consolidated People directory; DB override via Settings → Environment wins at runtime. */
      NEXT_PUBLIC_ENABLE_USERS_DIRECTORY?: string;
      GRAPHQL_PATH?: string;

      // Environment
      NODE_ENV: "development" | "production" | "test";

      /**
       * Set to "true" in GitHub Actions CI test jobs (see `.github/workflows/ci.yml`).
       * Signals that test/build harnesses should keep workflow job env (e.g. DATABASE_URL
       * for the Postgres service) instead of clearing parent vars before `bun --env-file=.env.test`.
       * Leave unset or "false" locally — `.env.test` is then the sole source of test config.
       */
      TEST_CI?: string;

      /**
       * Set to "1" by GraphQL/UI test harnesses (`frontend/common/graphql/test/testServer.ts`)
       * when spawning `next start` against `.next-test-prod`. Required for test-helper GraphQL
       * mutations when NODE_ENV=production. Never set on real production deployments.
       */
      TEST_SERVER?: string;

      /**
       * Vercel deployment target (`production`, `preview`, `development`).
       * Test helpers are hard-disabled when this is `production` (see `test-helper-gate.ts`).
       */
      VERCEL_ENV?: "production" | "preview" | "development";

      // CORS Configuration
      ALLOWED_ORIGIN?: string;

      // Admin Configuration
      ADMIN_EMAIL: string;
      ADMIN_PASSWORD: string;

      // Serverless Platform Detection
      VERCEL?: string;
      NETLIFY?: string;
      AWS_LAMBDA_FUNCTION_NAME?: string;
      K_SERVICE?: string;
      FUNCTION_TARGET?: string;
      FUNCTIONS_WORKER_RUNTIME?: string;
      CF_PAGES?: string;
      RAILWAY_ENVIRONMENT?: string;

      /**
       * Set to "true" ONLY when the deployment sits behind a real reverse proxy
       * (nginx/haproxy/ingress) that overwrites `x-forwarded-for` / `x-real-ip`.
       * When unset, those headers are treated as client-spoofable and rate
       * limiting falls back to the anon fingerprint (security review M2).
       * On Vercel/Cloudflare deployments this is unnecessary — the platform
       * headers are used instead.
       */
      TRUSTED_PROXY?: string;

      GOOGLE_FONTS_API_KEY?: string;

      /**
       * Blob Read/Write Token for secure access to vercel blob storage
       */
      BLOB_READ_WRITE_TOKEN?: string;

      // Meeting Integrations (auto-generation)
      ZOOM_ACCOUNT_ID?: string;
      ZOOM_CLIENT_ID?: string;
      ZOOM_CLIENT_SECRET?: string;
      ZOOM_REQUIRED_SCOPES?: string;
      GOOGLE_MEET_SERVICE_ACCOUNT_JSON?: string;
      GOOGLE_MEET_IMPERSONATE_SUBJECT?: string;
      GOOGLE_MEET_CLIENT_ID?: string;
      GOOGLE_MEET_CLIENT_SECRET?: string;
      MS_TEAMS_TENANT_ID?: string;
      MS_TEAMS_CLIENT_ID?: string;
      MS_TEAMS_CLIENT_SECRET?: string;
      MS_TEAMS_REQUIRED_SCOPES?: string;
      MS_TEAMS_ORGANIZER_USER_ID?: string;
      OAUTH_REDIRECT_BASE_URL?: string;

      // Demo Site Configuration
      // NEXT_PUBLIC_IS_DEMO controls the client-side demo UI (fast-login buttons).
      // IS_DEMO is the authoritative server-side gate for the demoLogin mutation.
      // Both are intentional: NEXT_PUBLIC_ prefix is required for client components
      // which cannot access server-only env vars. IS_DEMO is the security-critical
      // guard — it must be "true" for demo login to work server-side.
      NEXT_PUBLIC_IS_DEMO?: string;
      IS_DEMO?: string;

      /**
       * When "false", auth cookies (session_id, refresh_token, access_token) are
       * written without the Secure flag even when NODE_ENV=production.
       * Production deployments over HTTPS should omit this (defaults to secure).
       * Set to "false" for local production-mode servers over HTTP (e.g. E2E tests
       * via `next start` on http://localhost).
       */
      AUTH_COOKIE_SECURE?: string;

      // WhatsApp Configuration
      WHATSAPP_PROVIDER?: "cloud_api";
      WHATSAPP_APP_ID?: string;
      WHATSAPP_APP_SECRET?: string;
      WHATSAPP_VERIFY_TOKEN?: string;
      WHATSAPP_WEBHOOK_BASE_URL?: string;

      // Logging
      // ENABLE_LOGGING gates the server-side BaseLogger (shared/lib/logger/base-logger.ts)
      // AND the client-log ingestion route (app/api/logs/route.ts). When "true", the
      // server logger writes logs/server.log and the /api/logs route accepts client
      // batch POSTs, writing logs/client_<sessionId>.log. Defaults to "development"
      // implicitly — set to "true" on prod to triage browser-side diagnostics
      // (e.g. the [AuthRedirect] recovery path) without requiring the user to open
      // DevTools. ENABLE_LOGGING must be the server-side var (no NEXT_PUBLIC_ prefix)
      // because /api/logs/route.ts runs in the Node runtime.
      // NEXT_PUBLIC_ENABLE_LOGGING additionally ungates the CLIENT logger's browser
      // console output (frontend/common/lib/logger/index.ts) — set BOTH to surface
      // client diagnostics in both the browser console AND server log files.
      ENABLE_LOGGING?: string;
      NEXT_PUBLIC_ENABLE_LOGGING?: string;

      // New Relic Browser Agent (client-side; NEXT_PUBLIC_ required for browser access)
      /** New Relic Browser license key (JS ingest key, distinct from the APM license key) */
      NEXT_PUBLIC_NEW_RELIC_BROWSER_LICENSE_KEY?: string;
      /** New Relic account ID */
      NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID?: string;
      /** New Relic application / agent ID for browser monitoring */
      NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID?: string;
      /** New Relic trust key (usually the same as account ID) */
      NEXT_PUBLIC_NEW_RELIC_TRUST_KEY?: string;
      /** New Relic beacon hostname (default: bam.eu01.nr-data.net for EU region) */
      NEXT_PUBLIC_NEW_RELIC_BEACON?: string;
    }
  }
}

export {};
