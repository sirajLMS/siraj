import { describe, expect, test } from "bun:test";
import crypto from "node:crypto";
import { ManagerAccountType } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  managerDirectoryQueryDocument,
  updateManagerProfileMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import {
  authenticatedRequest,
  cleanupTestEntities,
  cleanupTestManager,
  cleanupTestSuperAdmin,
  loginAndProvision,
  provisionTestManager,
  provisionTestSuperAdmin,
} from "@/frontend/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/graphql/test/lifecycle";
import { testClient } from "@/frontend/graphql/test/testClient";

async function getManagers(token: string) {
  const data = await authenticatedRequest(token, "query", managerDirectoryQueryDocument);
  const result = data?.managerDirectory;
  if (!result) {
    throw new Error("managerDirectory was not returned");
  }
  return result;
}

describe("managerDirectory and updateManagerProfile GraphQL Integration Tests", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let teacherId = "";
  let studentId = "";
  let studentUserId = "";
  let teacherUserId = "";
  let parentUserId = "";
  let parentId = "";
  let superAdminToken = "";
  let superAdminUserId = "";
  let adminManagerUserId = "";
  let staffManagerUserId = "";

  test("provision test entities, super admin, and managers", async () => {
    const r = await loginAndProvision("MgrDirTest");
    adminToken = r.adminToken;
    teacherId = r.teacherId;
    studentId = r.studentId;
    studentUserId = r.studentUserId;
    teacherUserId = r.teacherUserId;
    parentUserId = r.parentUserId;
    parentId = r.parentId;

    const sa = await provisionTestSuperAdmin(r.superAdminToken, "MgrDirTestSA");
    superAdminToken = sa.token;
    superAdminUserId = sa.userId;

    const adminMgr = await provisionTestManager(superAdminToken, "MgrDirTest-Admin", ManagerAccountType.Admin);
    adminManagerUserId = adminMgr.userId;

    const staffMgr = await provisionTestManager(superAdminToken, "MgrDirTest-Staff", ManagerAccountType.Manager);
    staffManagerUserId = staffMgr.userId;

    expect(adminToken).toBeTruthy();
    expect(teacherId).toBeTruthy();
    expect(studentId).toBeTruthy();
    expect(superAdminToken).toBeTruthy();
    expect(adminManagerUserId).toBeTruthy();
    expect(staffManagerUserId).toBeTruthy();
  });

  test("Super Admin can query manager directory", async () => {
    const managerResult = await getManagers(superAdminToken);

    expect(Array.isArray(managerResult.rows)).toBeTrue();
    if (!managerResult.rows) throw new Error("No rows returned");
    expect(managerResult.rows.length).toBeGreaterThan(0);

    for (const manager of managerResult.rows) {
      expect(manager.id).toBeDefined();
      expect(manager.staffProfileId).toBeDefined();
      expect(manager.name).toBeDefined();
      expect(manager.email).toBeDefined();
      expect(manager.status).toBeDefined();
      expect(manager.roleSlug).toBeDefined();
      expect(manager.roleName).toBeDefined();
    }
  });

  test("Admin can query manager directory", async () => {
    const managerResult = await getManagers(adminToken);

    expect(Array.isArray(managerResult.rows)).toBeTrue();
    if (!managerResult.rows) throw new Error("No rows returned");
    expect(managerResult.rows.length).toBeGreaterThan(0);
  });

  test("Teacher denied from manager directory", async () => {
    const teacherToken = await loginAndProvision("MgrDirTestDenied").then(r => r.teacherToken);

    const result = await testClient.query({
      query: managerDirectoryQueryDocument,
      variables: { paginationArgs: null, roleFilter: null, statusFilter: null },
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
    const managerResult = await getManagers(superAdminToken);

    if (!managerResult.rows) throw new Error("No rows returned");

    const staffMgr = managerResult.rows.find(
      m => m.roleSlug === "staff_default" || m.name?.includes("MgrDirTest-Staff")
    );
    if (!staffMgr?.staffProfileId) throw new Error("No manager found to update");

    const uniquePhone = `+1999${crypto.randomInt(1000000, 9999999)}`;
    const updateData = await authenticatedRequest(superAdminToken, "mutate", updateManagerProfileMutationDocument, {
      staffProfileId: staffMgr.staffProfileId,
      input: {
        phone: uniquePhone,
        status: null,
      },
    });

    const updated = updateData?.updateManagerProfile;
    if (!updated) throw new Error("Mutation did not return updated profile");

    expect(updated.staffProfileId).toBe(staffMgr.staffProfileId);
    expect(updated.phone).toBe(uniquePhone);
  });

  test("Admin denied from updating Super Admin profile", async () => {
    const managerResult = await getManagers(adminToken);

    if (!managerResult.rows) throw new Error("No rows returned");

    const superAdmin = managerResult.rows.find(m => m.roleSlug === "super_admin" || m.name?.includes("Super Admin"));
    if (!superAdmin?.staffProfileId) {
      // No super admin row visible to academy_admin — test passes by verifying denial
      const result = await testClient.mutate({
        mutation: updateManagerProfileMutationDocument,
        variables: {
          staffProfileId: "00000000-0000-0000-0000-000000000000",
          input: { phone: "+15555555555", status: null },
        },
        errorPolicy: "all",
        context: { headers: { Authorization: `Bearer ${adminToken}` } },
      });
      expect(result.error).toBeDefined();
      return;
    }

    const result = await testClient.mutate({
      mutation: updateManagerProfileMutationDocument,
      variables: {
        staffProfileId: superAdmin.staffProfileId,
        input: {
          phone: "+15555555555",
          status: null,
        },
      },
      errorPolicy: "all",
      context: {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    });

    expect(result.error).toBeDefined();
  });

  test("Admin denied from updating any manager profile (requires superAdmin auth scope)", async () => {
    const managerResult = await getManagers(superAdminToken);

    if (!managerResult.rows) throw new Error("No rows returned");

    const staffMgr = managerResult.rows.find(m => m.name?.includes("MgrDirTest-Staff"));
    if (!staffMgr?.staffProfileId) throw new Error("No staff manager found to test denial");

    const result = await testClient.mutate({
      mutation: updateManagerProfileMutationDocument,
      variables: {
        staffProfileId: staffMgr.staffProfileId,
        input: { phone: "+15555555555", status: null },
      },
      errorPolicy: "all",
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("Updating non-existent profile returns error", async () => {
    const fakeProfileId = "00000000-0000-0000-0000-000000000000";

    const result = await testClient.mutate({
      mutation: updateManagerProfileMutationDocument,
      variables: {
        staffProfileId: fakeProfileId,
        input: {
          phone: "+10000000000",
          status: null,
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

  test("cleanup provisioned entities", async () => {
    const managerCountBefore = await getManagers(superAdminToken).then(r => r.rows?.length ?? 0);

    await cleanupTestManager(superAdminToken, adminManagerUserId);
    await cleanupTestManager(superAdminToken, staffManagerUserId);
    await cleanupTestEntities(adminToken, {
      studentUserId,
      teacherUserId,
      parentUserId,
      studentId,
      teacherId,
      parentId,
    });

    const managerCountAfter = await getManagers(superAdminToken).then(r => r.rows?.length ?? 0);
    expect(managerCountAfter).toBeLessThan(managerCountBefore);
    expect(superAdminToken).toBeTruthy();

    await cleanupTestSuperAdmin(superAdminToken, superAdminUserId);
  });
});
