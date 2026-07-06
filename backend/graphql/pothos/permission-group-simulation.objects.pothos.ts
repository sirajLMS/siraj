import type {
  EndPermissionGroupSimulationReturnType,
  PermissionGroupSimulationStatusReturnType,
  SimulatablePermissionGroupReturnType,
  StartPermissionGroupSimulationReturnType,
} from "@/backend/types/permission-group-simulation.types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

const SimulatablePermissionGroupPothosObjectRef =
  gqlSchemaBuilder.objectRef<SimulatablePermissionGroupReturnType>("SimulatablePermissionGroup");

export const SimulatablePermissionGroupPothosObject = SimulatablePermissionGroupPothosObjectRef.implement({
  fields: t => ({
    slug: t.exposeString("slug"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
  }),
});

const PermissionGroupSimulationStatusPothosObjectRef =
  gqlSchemaBuilder.objectRef<PermissionGroupSimulationStatusReturnType>("PermissionGroupSimulationStatus");

export const PermissionGroupSimulationStatusPothosObject = PermissionGroupSimulationStatusPothosObjectRef.implement({
  fields: t => ({
    isActive: t.exposeBoolean("isActive"),
    groupSlug: t.exposeString("groupSlug", { nullable: true }),
    groupName: t.exposeString("groupName", { nullable: true }),
    startedAt: t.expose("startedAt", { type: "DateTime", nullable: true }),
    expiresAt: t.expose("expiresAt", { type: "DateTime", nullable: true }),
  }),
});

const StartPermissionGroupSimulationResponsePothosObjectRef =
  gqlSchemaBuilder.objectRef<StartPermissionGroupSimulationReturnType>("StartPermissionGroupSimulationResponse");

export const StartPermissionGroupSimulationResponsePothosObject =
  StartPermissionGroupSimulationResponsePothosObjectRef.implement({
    fields: t => ({
      token: t.exposeString("token"),
      expiresAt: t.expose("expiresAt", { type: "DateTime" }),
      groupSlug: t.exposeString("groupSlug"),
    }),
  });

const EndPermissionGroupSimulationResponsePothosObjectRef =
  gqlSchemaBuilder.objectRef<EndPermissionGroupSimulationReturnType>("EndPermissionGroupSimulationResponse");

export const EndPermissionGroupSimulationResponsePothosObject =
  EndPermissionGroupSimulationResponsePothosObjectRef.implement({
    fields: t => ({
      token: t.exposeString("token"),
    }),
  });
