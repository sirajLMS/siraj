import crypto from "node:crypto";
import { prepareUploadMutationDocument } from "@/frontend/common/graphql/sharedDocuments/resources/learning-resource.documents";
import { authenticatedRequest } from "@/frontend/common/graphql/test/helpers";
import { getTestApiUrl } from "@/frontend/common/graphql/test/testClient";

export interface UploadFileToStorageOptions {
  /** The authenticated user's token. */
  readonly token: string;
  /** Raw file bytes to upload. */
  readonly fileContent: Buffer;
  /** Storage path, e.g. "private/billing/proof-test-123.pdf" or "public/resources/test-456.pdf". */
  readonly filePath: string;
  /** Content-Type header. Defaults to "application/pdf". */
  readonly contentType?: string;
  /** Error message prefix used when the upload fails. */
  readonly errorMessagePrefix: string;
}

export interface UploadFileToStorageResult {
  /** Upload id from the storage response. */
  readonly id: string;
  /** Storage path echoed back by the storage response (if present). */
  readonly path?: string;
}

interface StorageUploadResponse {
  readonly id: string;
  readonly path?: string;
}

function isStorageUploadResponse(value: unknown): value is StorageUploadResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "id" in value &&
    typeof (value as Record<string, unknown>).id === "string"
  );
}

/**
 * Prepares an upload via the `prepareUpload` mutation, then PUTs the file bytes
 * to the test storage endpoint. Shared by GraphQL integration tests that need a
 * provisioned file id/path (e.g. billing payment proofs, learning resources).
 *
 * Mirrors the previous per-test `uploadProofFile` / `uploadDummyFile` helpers,
 * with the error message prefix and file content parameterized per call site.
 */
export async function uploadFileToStorage(options: UploadFileToStorageOptions): Promise<UploadFileToStorageResult> {
  const { token, fileContent, filePath, errorMessagePrefix, contentType = "application/pdf" } = options;

  const contentHash = crypto.createHash("sha256").update(fileContent).digest("base64");

  const prepData = await authenticatedRequest(token, "mutate", prepareUploadMutationDocument, {
    input: {
      path: filePath,
      fileSize: fileContent.length,
      contentType,
      contentHash,
    },
  });

  const prep = prepData?.prepareUpload;
  if (!prep) {
    throw new Error("Failed to prepare upload");
  }

  const uploadUrl = getTestApiUrl(`/api/storage/upload/${prep.id}`);
  const response = await Bun.fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-MD5": contentHash,
      "Content-Length": String(fileContent.length),
    },
    body: new Uint8Array(fileContent),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${errorMessagePrefix}: ${response.status} - ${errorText}`);
  }

  const json: unknown = await response.json();
  if (!isStorageUploadResponse(json)) {
    throw new Error(`${errorMessagePrefix}: invalid storage response`);
  }
  return {
    id: json.id,
    path: json.path,
  };
}
