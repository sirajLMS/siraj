import { describe, expect, test } from "bun:test";
import crypto from "node:crypto";
import {
  managerDirectoryQueryDocument,
  updateManagerProfileMutationDocument,
} from "../sharedDocuments/staff-directory.documents";
import { authenticatedRequest, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

async function getManagers(token: string) {
  const data = await authenticatedRequest(token, "query", managerDirectoryQueryDocument);
  const managers = data?.managerDirectory;
  if (!managers) {
    throw new Error("managerDirectory was not returned");
  }
  return managers;
}

async function testUpdateManagerProfile(actorRole: string, phonePrefix: string, skypePrefix: string) {
  const actorToken = await loginDemoUser(actorRole);
  const managers = await getManagers(actorToken);

  // Find a Staff Default user
  const staffDefault = managers.find(m => m.roleSlug === "staff_default");
  if (!staffDefault) {
    throw new Error("No staff_default manager found in directory");
  }

  if (!staffDefault.staffProfileId) {
    throw new Error("staffProfileId is missing");
  }

  const uniquePhone = `${phonePrefix}${crypto.randomInt(1000000, 9999999)}`;
  const uniqueSkype = `${skypePrefix}_${Date.now()}`;

  const updateData = await authenticatedRequest(actorToken, "mutate", updateManagerProfileMutationDocument, {
    staffProfileId: staffDefault.staffProfileId,
    input: {
      phone: uniquePhone,
      skypeId: uniqueSkype,
    },
  });

  const updated = updateData?.updateManagerProfile;
  if (!updated) {
    throw new Error("Mutation did not return updated profile");
  }

  expect(updated.staffProfileId).toBe(staffDefault.staffProfileId);
  expect(updated.phone).toBe(uniquePhone);
  expect(updated.skypeId).toBe(uniqueSkype);
}

describe("managerDirectory and updateManagerProfile GraphQL Integration Tests", () => {
  setupTestServerLifecycle();

  test("Super Admin can query manager directory", async () => {
    const token = await loginDemoUser("super_admin");
    const managers = await getManagers(token);

    expect(Array.isArray(managers)).toBeTrue();
    expect(managers.length).toBeGreaterThan(0);

    for (const manager of managers) {
      expect(manager.id).toBeDefined();
      expect(manager.staffProfileId).toBeDefined();
      expect(manager.name).toBeDefined();
      expect(manager.email).toBeDefined();
      expect(manager.status).toBeDefined();
      expect(manager.roleSlug).toBeDefined();
      expect(manager.roleName).toBeDefined();
    }
  });

  test("Academy Admin can query manager directory", async () => {
    const token = await loginDemoUser("academy_admin");
    const managers = await getManagers(token);

    expect(Array.isArray(managers)).toBeTrue();
    expect(managers.length).toBeGreaterThan(0);
  });

  test("Teacher denied from manager directory", async () => {
    const teacherToken = await loginDemoUser("teacher_default");

    const result = await testClient.query({
      query: managerDirectoryQueryDocument,
      errorPolicy: "all",
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });

    expect(result.error).toBeDefined();
  });

  test("Super Admin can update any manager profile", async () => {
    await testUpdateManagerProfile("super_admin", "+1999", "skype_staff");
  });

  test("Academy Admin denied from updating Super Admin profile", async () => {
    const superAdminToken = await loginDemoUser("super_admin");
    const managers = await getManagers(superAdminToken);

    // Find the Super Admin user profile
    const superAdmin = managers.find(m => m.roleSlug === "super_admin");
    if (!superAdmin) {
      throw new Error("No super_admin manager found in directory");
    }

    if (!superAdmin.staffProfileId) {
      throw new Error("staffProfileId is missing");
    }

    const academyAdminToken = await loginDemoUser("academy_admin");

    const result = await testClient.mutate({
      mutation: updateManagerProfileMutationDocument,
      variables: {
        staffProfileId: superAdmin.staffProfileId,
        input: {
          phone: "+15555555555",
          skypeId: "hacker_skype",
        },
      },
      errorPolicy: "all",
      context: {
        headers: {
          Authorization: `Bearer ${academyAdminToken}`,
        },
      },
    });

    expect(result.error).toBeDefined();
  });

  test("Academy Admin can update Staff Default profile", async () => {
    await testUpdateManagerProfile("academy_admin", "+1888", "skype_academy_edit");
  });

  test("Updating non-existent profile returns error", async () => {
    const superAdminToken = await loginDemoUser("super_admin");
    const fakeProfileId = "00000000-0000-0000-0000-000000000000";

    const result = await testClient.mutate({
      mutation: updateManagerProfileMutationDocument,
      variables: {
        staffProfileId: fakeProfileId,
        input: {
          phone: "+10000000000",
          skypeId: "nonexistent",
        },
      },
      errorPolicy: "all",
      context: {
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
        },
      },
    });

    expect(result.error).toBeDefined();
  });
});
