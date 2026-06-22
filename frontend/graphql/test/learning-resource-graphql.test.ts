import { describe, expect, test } from "bun:test";
import crypto from "node:crypto";
import {
  learningResourcesQueryDocument,
  prepareUploadMutationDocument,
  uploadLearningResourceMutationDocument,
} from "../sharedDocuments/learning-resource.documents";
import { authenticatedRequest, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

// Helper to upload a dummy file and get its database file ID
async function uploadDummyFile(token: string): Promise<{ id: string; path: string }> {
  const fileContent = Buffer.from("hello world");
  const contentHash = crypto.createHash("sha256").update(fileContent).digest("base64");
  const filePath = `public/resources/test-${Date.now()}.pdf`;

  // 1. Prepare upload via mutation
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

  // 2. Perform the physical PUT request to the test server running on port 3001
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

    // Upload the file first
    const file = await uploadDummyFile(adminToken);

    // Call upload mutation
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
      throw new Error("Failed to upload learning resource record");
    }

    expect(resource.id).toBeDefined();
    expect(resource.displayName).toBe(displayName);
    expect(resource.filePath).toBe(file.path);
    expect(resource.uploadedByUserId).toBeDefined();
  });

  test("Teacher denied from uploading resource", async () => {
    const adminToken = await loginDemoUser("academy_admin");
    const teacherToken = await loginDemoUser("teacher_default");

    // Academy Admin prepares the file
    const file = await uploadDummyFile(adminToken);

    // Teacher tries to upload but gets denied
    const result = await testClient.mutate({
      mutation: uploadLearningResourceMutationDocument,
      variables: {
        input: {
          displayName: "Teacher Attempt Upload",
          filePath: file.path,
          fileId: file.id,
        },
      },
      errorPolicy: "all",
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });

    expect(result.error).toBeDefined();
  });

  test("Parent denied from resource directory", async () => {
    const parentToken = await loginDemoUser("parent_default");

    const result = await testClient.query({
      query: learningResourcesQueryDocument,
      variables: {
        searchQuery: null,
      },
      errorPolicy: "all",
      context: {
        headers: {
          Authorization: `Bearer ${parentToken}`,
        },
      },
    });

    expect(result.error).toBeDefined();
  });

  test("Upload with missing displayName returns validation error", async () => {
    const adminToken = await loginDemoUser("academy_admin");
    const file = await uploadDummyFile(adminToken);

    const result = await testClient.mutate({
      mutation: uploadLearningResourceMutationDocument,
      variables: {
        input: {
          displayName: "", // missing/empty
          filePath: file.path,
          fileId: file.id,
        },
      },
      errorPolicy: "all",
      context: {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    });

    // Pothos or service layer should throw validation error
    expect(result.error).toBeDefined();
  });
});
