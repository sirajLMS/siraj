import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

export type DstMigrationReportDefinition = {
  id: string;
  runId: string;
  updated: number;
  conflicts: number;
  unchanged: number;
  total: number;
};

const DstMigrationReportRef = gqlSchemaBuilder.objectRef<DstMigrationReportDefinition>("DstMigrationReport");

export const DstMigrationReportPothosObject = DstMigrationReportRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    runId: t.exposeString("runId"),
    updated: t.exposeInt("updated"),
    conflicts: t.exposeInt("conflicts"),
    unchanged: t.exposeInt("unchanged"),
    total: t.exposeInt("total"),
  }),
});
