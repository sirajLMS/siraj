import { describe, expect, test } from "bun:test";
import crypto from "node:crypto";
import {
  deleteLearningResourceMutationDocument,
  learningResourcesQueryDocument,
  prepareUploadMutationDocument,
  uploadLearningResourceMutationDocument,
} from "../sharedDocuments/learning-resource.documents";
import { assertOperationDenied, authenticatedRequest, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

async function uploadDummyFile(token: string): Promise<{ id: string; path: string }> {
  const fileContent = Buffer.from("hello world");
  const contentHash = crypto.createHash("sha256").update(fileContent).digest("base64");
  const filePath = `public/resources/test-${Date.now()}.pdf`;

  const prepData = await authenticatedRequest(token, "mutate", prepareUploadMutationDocument, {
    input: {
      path: filePath,
      fileSize: fileContent.length,
      contentType: "application/pdf",
      contentHash,
    },
  });

  const prep = prepData?.prepareUpload;
  if (!prep) {
    throw new Error("Failed to prepare upload");
  }

  const uploadUrl = `http://localhost:3001/api/storage/upload/${prep.id}`;
  const response = await Bun.fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/pdf",
      "Content-MD5": contentHash,
      "Content-Length": String(fileContent.length),
    },
    body: fileContent,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload file to storage: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return {
    id: result.id,
    path: result.path,
  };
}

async function createTestResource(token: string): Promise<string> {
  const file = await uploadDummyFile(token);
  const displayName = `Test Resource ${Date.now()}`;
  const uploadResult = await authenticatedRequest(token, "mutate", uploadLearningResourceMutationDocument, {
    input: {
      displayName,
      filePath: file.path,
      fileId: file.id,
    },
  });

  const resource = uploadResult?.uploadLearningResource;

  if (typeof resource?.id !== "string") {
    throw new TypeError(
      `Failed to upload learning resource record: expected id to be a string, got ${typeof resource?.id}`
    );
  }

  return resource.id;
}

async function testQueryLearningResources(role: string) {
  const token = await loginDemoUser(role);
  const data = await authenticatedRequest(token, "query", learningResourcesQueryDocument, {
    searchQuery: null,
  });

  const resources = data?.learningResources;
  if (!resources) {
    throw new Error("learningResources query returned no data");
  }

  expect(Array.isArray(resources)).toBeTrue();
  return resources;
}

describe("learningResources and uploadLearningResource GraphQL Integration Tests", () => {
  setupTestServerLifecycle();

  test("Teacher can query learning resources", async () => {
    await testQueryLearningResources("teacher_default");
  });

  test("Academy Admin can query learning resources", async () => {
    await testQueryLearningResources("academy_admin");
  });

  test("Academy Admin can upload resource", async () => {
    const adminToken = await loginDemoUser("academy_admin");

    const file = await uploadDummyFile(adminToken);

    const displayName = `Test Resource ${Date.now()}`;
    const uploadResult = await authenticatedRequest(adminToken, "mutate", uploadLearningResourceMutationDocument, {
      input: {
        displayName,
        filePath: file.path,
        fileId: file.id,
      },
    });

    const resource = uploadResult?.uploadLearningResource;
    if (!resource) {
      throw new TypeError("Failed to upload learning resource record");
    }

    expect(resource.id).toBeDefined();
    expect(resource.displayName).toBe(displayName);
    expect(resource.filePath).toBe(file.path);
    expect(resource.uploadedByUserId).toBeDefined();
  });

  test("Teacher denied from uploading resource", async () => {
    const adminToken = await loginDemoUser("academy_admin");
    const file = await uploadDummyFile(adminToken);

    await assertOperationDenied("teacher_default", "mutate", uploadLearningResourceMutationDocument, {
      input: {
        displayName: "Teacher Attempt Upload",
        filePath: file.path,
        fileId: file.id,
      },
    });
  });

  test("Parent denied from resource directory", async () => {
    await assertOperationDenied("parent_default", "query", learningResourcesQueryDocument, {
      searchQuery: null,
    });
  });

  test("Upload with missing displayName returns validation error", async () => {
    const adminToken = await loginDemoUser("academy_admin");
    const file = await uploadDummyFile(adminToken);

    const result = await testClient.mutate({
      mutation: uploadLearningResourceMutationDocument,
      variables: {
        input: {
          displayName: "",
          filePath: file.path,
          fileId: file.id,
        },
      },
      context: {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    });

    expect(result.error).toBeDefined();
  });

  test("Academy Admin can delete learning resource successfully", async () => {
    const adminToken = await loginDemoUser("academy_admin");
    const resourceId = await createTestResource(adminToken);

    const deleteResult = await testClient.mutate({
      mutation: deleteLearningResourceMutationDocument,
      variables: {
        id: resourceId,
      },
      context: {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    });

    expect(deleteResult.error).toBeUndefined();
    expect(deleteResult.data?.deleteLearningResource).toBe(true);

    const list = await testQueryLearningResources("academy_admin");
    const found = list.find(r => r.id === resourceId);
    expect(found).toBeUndefined();
  });

  test("Teacher denied from deleting learning resource", async () => {
    const adminToken = await loginDemoUser("academy_admin");
    const resourceId = await createTestResource(adminToken);

    await assertOperationDenied("teacher_default", "mutate", deleteLearningResourceMutationDocument, {
      id: resourceId,
    });

    const list = await testQueryLearningResources("academy_admin");
    const found = list.find(r => r.id === resourceId);
    expect(found).toBeDefined();
  });
});
