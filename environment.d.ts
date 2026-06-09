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

      // Signed URL Cleanup Configuration
      SIGNED_URL_CLEANUP_STRATEGY?: "lazy" | "cron" | "both" | "disabled";
      SIGNED_URL_CLEANUP_CRON_SCHEDULE?: string;
      CRON_SECRET?: string;

      // GCP Storage Configuration
      GCP_PROJECT_ID?: string;
      GCP_BUCKET_NAME?: string;
      GCP_SECRET_VERSION?: string;
      GCP_SECRET_ID?: string;

      // Database Configuration
      DB_PROVIDER?: "postgres" | "neon";
      DATABASE_URL: string;

      // JWT Configuration
      JWT_SECRET: string;

      // Redis Configuration
      REDIS_PROVIDER: "local" | "upstash";
      REDIS_URL?: string;
      UPSTASH_REDIS_REST_URL?: string;
      UPSTASH_REDIS_REST_TOKEN?: string;

      // Cache Configuration
      CACHE_PROVIDER: "redis" | "postgres";

      // GraphQL Configuration
      GRAPHQL_ENCRYPTION_KEY: string;
      NEXT_PUBLIC_ENABLE_BINARY_GRAPHQL?: string;
      GRAPHQL_PATH?: string;

      // Environment
      NODE_ENV: "development" | "production" | "test";

      // CORS Configuration
      ALLOWED_ORIGIN?: string;

      // Admin Configuration
      ADMIN_EMAIL?: string;
      ADMIN_PASSWORD?: string;

      // Serverless Platform Detection
      VERCEL?: string;
      NETLIFY?: string;
      AWS_LAMBDA_FUNCTION_NAME?: string;
      K_SERVICE?: string;
      FUNCTION_TARGET?: string;
      FUNCTIONS_WORKER_RUNTIME?: string;
      CF_PAGES?: string;
      RAILWAY_ENVIRONMENT?: string;

      GOOGLE_FONTS_API_KEY?: string;

      /**
       * Blob Read/Write Token for secure access to vercel blob storage
       */
      BLOB_READ_WRITE_TOKEN?: string;
    }
  }
}

export {};
