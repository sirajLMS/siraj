import type { ParentDirectoryMetrics, ParentDirectoryResult, ParentDirectoryRow } from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { ParentStatusPothosEnum } from "./enum.pothos";
import { PageInfoObject } from "./pagination.objects";

const ParentDirectoryMetricsRef = gqlSchemaBuilder.objectRef<ParentDirectoryMetrics>("ParentDirectoryMetrics");

export const ParentDirectoryMetricsPothosObject = ParentDirectoryMetricsRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    activated: t.exposeInt("activated"),
    deactivated: t.exposeInt("deactivated"),
    regular: t.exposeInt("regular"),
    onLeave: t.exposeInt("onLeave"),
    suspended: t.exposeInt("suspended"),
    onTrial: t.exposeInt("onTrial"),
  }),
});

const ParentDirectoryRowRef = gqlSchemaBuilder.objectRef<ParentDirectoryRow>("ParentDirectoryRow");

export const ParentDirectoryRowPothosObject = ParentDirectoryRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId"),
    index: t.exposeInt("index"),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    guardianOf: t.exposeString("guardianOf"),
    time: t.exposeString("time"),
    accountStatus: t.expose("accountStatus", { type: ParentStatusPothosEnum }),
    unpaidInvoices: t.exposeInt("unpaidInvoices"),
  }),
});

const ParentDirectoryRef = gqlSchemaBuilder.objectRef<ParentDirectoryResult>("ParentDirectory");

export const ParentDirectoryPothosObject = ParentDirectoryRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    metrics: t.expose("metrics", { type: ParentDirectoryMetricsPothosObject }),
    rows: t.expose("rows", { type: [ParentDirectoryRowPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});
