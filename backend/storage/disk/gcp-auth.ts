import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { Storage } from "@google-cloud/storage";
import { GoogleAuth } from "google-auth-library";
import { getStringEnv } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";

const projectId = getStringEnv("GCP_PROJECT_ID");
const secretId = getStringEnv("GCP_SECRET_ID");
const secretVersion = getStringEnv("GCP_SECRET_VERSION", "latest");

interface GcpCredentials {
  client_email: string;
  private_key: string;
  type: string;
  project_id?: string;
}

/**
 * Validates the structure of GCP service account credentials
 */
function validateGcpCredentials(credentials: GcpCredentials, source: string): void {
  if (!credentials.client_email || !credentials.private_key || credentials.type !== "service_account") {
    throw new Error(`Invalid service account credentials from ${source}`);
  }
}

/**
 * Creates a Storage client from credentials
 */
function createStorageClient(credentials: GcpCredentials, defaultProjectId?: string): Storage {
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  return new Storage({
    projectId: credentials.project_id || defaultProjectId,
    authClient: auth,
  });
}

const getStorageFromSecretManager = async (): Promise<Storage> => {
  if (!projectId || !secretId) {
    throw new Error("GCP_PROJECT_ID and GCP_SECRET_ID environment variables are required for Secret Manager auth");
  }

  try {
    const client = new SecretManagerServiceClient();
    const name = `projects/${projectId}/secrets/${secretId}/versions/${secretVersion}`;

    const [version] = await client.accessSecretVersion({ name });
    const payload = version.payload?.data;

    if (!payload) {
      throw new Error("No payload found in secret version");
    }

    const credentials = JSON.parse(payload.toString()) as GcpCredentials;
    validateGcpCredentials(credentials, "Secret Manager");

    return createStorageClient(credentials, projectId);
  } catch (error) {
    logger.error(`Failed to access secret version: ${secretId} in project: ${projectId}`, error);
    throw error;
  }
};

const getStorageFromEnv = (): Storage | null => {
  const credentialsJson = getStringEnv("GCP_CREDENTIALS_JSON");

  if (!credentialsJson) {
    return null;
  }

  try {
    const credentials = JSON.parse(credentialsJson) as GcpCredentials;
    validateGcpCredentials(credentials, "GCP_CREDENTIALS_JSON");

    return createStorageClient(credentials, projectId);
  } catch (error) {
    logger.error("Failed to create Storage with GCP_CREDENTIALS_JSON", error);
    throw new Error("Invalid GCP_CREDENTIALS_JSON", { cause: error });
  }
};

export const getGcpStorageClient = async (): Promise<Storage> => {
  const storageFromEnv = getStorageFromEnv();
  if (storageFromEnv) {
    logger.info("Using GCP credentials from environment variable.");
    return storageFromEnv;
  }

  logger.info("Using GCP credentials from Secret Manager.");
  return getStorageFromSecretManager();
};
