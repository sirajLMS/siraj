import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { Storage } from "@google-cloud/storage";
import { GoogleAuth } from "google-auth-library";
import logger from "@/backend/lib/logger";

const projectId = process.env.GCP_PROJECT_ID;
const secretId = process.env.GCP_SECRET_ID;
const secretVersion = process.env.GCP_SECRET_VERSION || "latest";

const getStorageFromSecretManager = async (): Promise<Storage> => {
	if (!projectId || !secretId) {
		throw new Error(
			"GCP_PROJECT_ID and GCP_SECRET_ID environment variables are required for Secret Manager auth",
		);
	}

	try {
		const client = new SecretManagerServiceClient();
		const name = `projects/${projectId}/secrets/${secretId}/versions/${secretVersion}`;

		const [version] = await client.accessSecretVersion({ name });
		const payload = version.payload?.data;

		if (!payload) {
			throw new Error("No payload found in secret version");
		}

		const credentials = JSON.parse(payload.toString()) as {
			client_email: string;
			private_key: string;
			type: string;
			project_id?: string;
		};

		if (
			!credentials.client_email ||
			!credentials.private_key ||
			credentials.type !== "service_account"
		) {
			throw new Error(
				"Invalid service account credentials from Secret Manager",
			);
		}

		const auth = new GoogleAuth({
			credentials,
			scopes: ["https://www.googleapis.com/auth/cloud-platform"],
		});

		return new Storage({
			projectId,
			authClient: auth,
		});
	} catch (error) {
		logger.error(
			`Failed to access secret version: ${secretId} in project: ${projectId}`,
			error,
		);
		throw error;
	}
};

const getStorageFromEnv = (): Storage | null => {
	const credentialsJson = process.env.GCP_CREDENTIALS_JSON;

	if (!credentialsJson) {
		return null;
	}

	try {
		const credentials = JSON.parse(credentialsJson) as {
			client_email: string;
			private_key: string;
			type: string;
			project_id?: string;
		};

		if (
			!credentials.client_email ||
			!credentials.private_key ||
			credentials.type !== "service_account"
		) {
			throw new Error(
				"Invalid service account credentials from GCP_CREDENTIALS_JSON",
			);
		}

		const auth = new GoogleAuth({
			credentials,
			scopes: ["https://www.googleapis.com/auth/cloud-platform"],
		});

		return new Storage({
			...(credentials.project_id ? { projectId: credentials.project_id } : {}),
			authClient: auth,
		});
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
