import { afterAll, describe, expect, test } from "bun:test";
import {
  endPermissionGroupSimulationMutationDocument,
  meQueryDocument,
  permissionGroupSimulationStatusQueryDocument,
  simulatablePermissionGroupsQueryDocument,
  startPermissionGroupSimulationMutationDocument,
} from "../sharedDocuments/auth.documents";
import { authenticatedRequest, cleanupTestSuperAdmin, loginAndProvision, provisionTestSuperAdmin } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";

describe("GraphQL Permission Group Simulation Integration Tests", () => {
  setupTestServerLifecycle();

  let seedSuperAdminToken = "";
  let superAdminToken = "";
  let superAdminUserId = "";
  let teacherGroupSlug = "";

  test("provision super admin for group simulation tests", async () => {
    const provisioned = await loginAndProvision("GroupSimulationTest");
    seedSuperAdminToken = provisioned.superAdminToken;

    const sa = await provisionTestSuperAdmin(seedSuperAdminToken, "GroupSimulationTestSA");
    superAdminToken = sa.token;
    superAdminUserId = sa.userId;
    expect(superAdminUserId).toBeDefined();
  });

  test("lists simulatable permission groups for super admin", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", simulatablePermissionGroupsQueryDocument);
    expect(data.simulatablePermissionGroups?.length).toBeGreaterThan(0);
    const slugs = data.simulatablePermissionGroups?.map(group => group.slug) ?? [];
    expect(slugs).not.toContain("super_admin");
    const teacherGroup = data.simulatablePermissionGroups?.find(group => group.slug === "teacher_default");
    expect(teacherGroup).toBeDefined();
    teacherGroupSlug = teacherGroup?.slug ?? "teacher_default";
  });

  test("simulation status is inactive before starting", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", permissionGroupSimulationStatusQueryDocument);
    expect(data.permissionGroupSimulationStatus?.isActive).toBe(false);
  });

  test("super admin can start permission group simulation", async () => {
    const data = await authenticatedRequest(superAdminToken, "mutate", startPermissionGroupSimulationMutationDocument, {
      groupSlug: teacherGroupSlug || "teacher_default",
    });
    expect(data.startPermissionGroupSimulation?.token).toBeDefined();
    expect(data.startPermissionGroupSimulation?.groupSlug).toBe(teacherGroupSlug || "teacher_default");

    await authenticatedRequest(
      data.startPermissionGroupSimulation?.token as string,
      "mutate",
      endPermissionGroupSimulationMutationDocument
    );
  });

  test("me query keeps admin identity while simulating teacher group", async () => {
    const startData = await authenticatedRequest(
      superAdminToken,
      "mutate",
      startPermissionGroupSimulationMutationDocument,
      {
        groupSlug: teacherGroupSlug || "teacher_default",
      }
    );
    const simulationToken = startData.startPermissionGroupSimulation?.token;
    expect(simulationToken).toBeDefined();
    if (!simulationToken) {
      throw new Error("simulation token was not defined");
    }

    const meData = await authenticatedRequest(simulationToken, "query", meQueryDocument);
    expect(meData.me?.id).toBe(superAdminUserId);

    const statusData = await authenticatedRequest(
      simulationToken,
      "query",
      permissionGroupSimulationStatusQueryDocument
    );
    expect(statusData.permissionGroupSimulationStatus?.isActive).toBe(true);
    expect(statusData.permissionGroupSimulationStatus?.groupSlug).toBe(teacherGroupSlug || "teacher_default");

    await authenticatedRequest(simulationToken, "mutate", endPermissionGroupSimulationMutationDocument);
  });

  test("super admin can end permission group simulation", async () => {
    const startData = await authenticatedRequest(
      superAdminToken,
      "mutate",
      startPermissionGroupSimulationMutationDocument,
      {
        groupSlug: teacherGroupSlug || "teacher_default",
      }
    );
    const simulationToken = startData.startPermissionGroupSimulation?.token;
    expect(simulationToken).toBeDefined();
    if (!simulationToken) {
      throw new Error("simulation token was not defined");
    }

    const endData = await authenticatedRequest(simulationToken, "mutate", endPermissionGroupSimulationMutationDocument);
    expect(endData.endPermissionGroupSimulation?.token).toBeDefined();

    const restoredToken = endData.endPermissionGroupSimulation?.token as string;
    const status = await authenticatedRequest(restoredToken, "query", permissionGroupSimulationStatusQueryDocument);
    expect(status.permissionGroupSimulationStatus?.isActive).toBe(false);
  });

  afterAll(async () => {
    if (superAdminUserId) {
      await cleanupTestSuperAdmin(seedSuperAdminToken, superAdminUserId).catch(() => {});
    }
  });
});
