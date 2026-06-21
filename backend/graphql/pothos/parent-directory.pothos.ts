import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

export type ParentDirectoryMetricsDefinition = {
  id: string;
  activated: number;
  deactivated: number;
  regular: number;
  onLeave: number;
  suspended: number;
  onTrial: number;
};

const ParentDirectoryMetricsRef =
  gqlSchemaBuilder.objectRef<ParentDirectoryMetricsDefinition>("ParentDirectoryMetrics");

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

export type ParentDirectoryRowDefinition = {
  id: string;
  index: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  guardianOf: string;
  time: string;
  accountStatus: string;
  unpaidInvoices: number;
};

const ParentDirectoryRowRef = gqlSchemaBuilder.objectRef<ParentDirectoryRowDefinition>("ParentDirectoryRow");

export const ParentDirectoryRowPothosObject = ParentDirectoryRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    index: t.exposeInt("index"),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    guardianOf: t.exposeString("guardianOf"),
    time: t.exposeString("time"),
    accountStatus: t.exposeString("accountStatus"),
    unpaidInvoices: t.exposeInt("unpaidInvoices"),
  }),
});

export type ParentDirectoryDefinition = {
  id: string;
  metrics: ParentDirectoryMetricsDefinition;
  rows: ParentDirectoryRowDefinition[];
  totalParents: number;
};

const ParentDirectoryRef = gqlSchemaBuilder.objectRef<ParentDirectoryDefinition>("ParentDirectory");

export const ParentDirectoryPothosObject = ParentDirectoryRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    metrics: t.expose("metrics", { type: ParentDirectoryMetricsPothosObject }),
    rows: t.expose("rows", { type: [ParentDirectoryRowPothosObject] }),
    totalParents: t.exposeInt("totalParents"),
  }),
});
