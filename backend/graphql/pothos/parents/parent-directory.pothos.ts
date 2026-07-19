import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { AccountStatusPothosObject, ParentStatusPothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import { PageInfoObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import type {
  ParentDirectoryAutocompleteRow,
  ParentDirectoryMetrics,
  ParentDirectoryResult,
  ParentDirectoryRow,
} from "@/backend/types";

const ParentDirectoryMetricsRef = gqlSchemaBuilder.objectRef<ParentDirectoryMetrics>("ParentDirectoryMetrics");

export const ParentDirectoryMetricsPothosObject = ParentDirectoryMetricsRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
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
    lifecycleStatus: t.expose("lifecycleStatus", { type: ParentStatusPothosEnum }),
    accountStatus: t.expose("accountStatus", { type: AccountStatusPothosObject }),
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

const ParentDirectoryAutocompleteRowRef = gqlSchemaBuilder.objectRef<ParentDirectoryAutocompleteRow>(
  "ParentDirectoryAutocompleteRow"
);

export const ParentDirectoryAutocompleteRowPothosObject = ParentDirectoryAutocompleteRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    email: t.exposeString("email"),
  }),
});
