import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  QuotaKindPothosEnum,
  QuotaLedgerReasonPothosEnum,
  QuotaPeriodTypePothosEnum,
  QuotaStatusPothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type {
  QuotaBalanceReturnType,
  QuotaExpirationBreakdown,
  QuotaLedgerPaginatedResult,
  QuotaLedgerReturnType,
  QuotaPaginatedFilter,
  QuotaPaginatedResult,
  QuotaReturnType,
  QuotaRolloverPolicy,
  QuotaSubmitInput,
  QuotaUpdateInput,
} from "@/backend/types";

const QuotaRef = gqlSchemaBuilder.objectRef<QuotaReturnType>("Quota");

export const QuotaPothosObject = QuotaRef.implement({
  description: "A class quota allocation for a student",
  fields: t => ({
    id: t.exposeString("id"),
    studentId: t.exposeString("studentId"),
    name: t.exposeString("name"),
    kind: t.expose("kind", { type: QuotaKindPothosEnum }),
    totalClasses: t.exposeInt("totalClasses"),
    remaining: t.exposeInt("remaining"),
    reservedClasses: t.exposeInt("reservedClasses"),
    validFrom: t.expose("validFrom", { type: "DateTime", nullable: true }),
    validUntil: t.expose("validUntil", { type: "DateTime", nullable: true }),
    status: t.expose("status", { type: QuotaStatusPothosEnum }),
    periodType: t.expose("periodType", { type: QuotaPeriodTypePothosEnum, nullable: true }),
    periodDays: t.exposeInt("periodDays", { nullable: true }),
    priority: t.exposeInt("priority"),
    version: t.exposeInt("version"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

const QuotaLedgerRef = gqlSchemaBuilder.objectRef<QuotaLedgerReturnType>("QuotaLedger");

export const QuotaLedgerPothosObject = QuotaLedgerRef.implement({
  description: "An append-only transaction ledger row for a quota",
  fields: t => ({
    id: t.exposeString("id"),
    quotaId: t.exposeString("quotaId"),
    studentId: t.exposeString("studentId"),
    delta: t.exposeInt("delta"),
    reason: t.expose("reason", { type: QuotaLedgerReasonPothosEnum }),
    classInstanceId: t.exposeString("classInstanceId", { nullable: true }),
    recurringScheduleId: t.exposeString("recurringScheduleId", { nullable: true }),
    idempotencyKey: t.exposeString("idempotencyKey"),
    actorUserId: t.exposeString("actorUserId", { nullable: true }),
    reasonNote: t.exposeString("reasonNote", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

const QuotaExpirationBreakdownRef = gqlSchemaBuilder.objectRef<QuotaExpirationBreakdown>("QuotaExpirationBreakdown");

export const QuotaExpirationBreakdownPothosObject = QuotaExpirationBreakdownRef.implement({
  description: "Breakdown of an individual active quota contributing to a student's balance",
  fields: t => ({
    quotaId: t.exposeString("quotaId"),
    quotaName: t.exposeString("quotaName"),
    validUntil: t.expose("validUntil", { type: "DateTime", nullable: true }),
    remaining: t.exposeInt("remaining"),
  }),
});

const QuotaBalanceRef = gqlSchemaBuilder.objectRef<QuotaBalanceReturnType>("QuotaBalance");

export const QuotaBalancePothosObject = QuotaBalanceRef.implement({
  description: "Aggregated quota balance summary for a student",
  fields: t => ({
    studentId: t.exposeString("studentId"),
    totalActiveClasses: t.exposeInt("totalActiveClasses"),
    totalRemaining: t.exposeInt("totalRemaining"),
    totalReserved: t.exposeInt("totalReserved"),
    breakdownByExpiration: t.field({
      type: [QuotaExpirationBreakdownPothosObject],
      resolve: parent => parent.breakdownByExpiration,
    }),
  }),
});

const QuotaPaginatedResultRef = gqlSchemaBuilder.objectRef<QuotaPaginatedResult>("QuotaPaginatedResult");

export const QuotaPaginatedResultPothosObject = QuotaPaginatedResultRef.implement({
  description: "Paginated result set of quotas",
  fields: t => ({
    rows: t.field({
      type: [QuotaPothosObject],
      resolve: parent => parent.rows,
    }),
    totalCount: t.exposeInt("totalCount"),
  }),
});

const QuotaLedgerPaginatedResultRef =
  gqlSchemaBuilder.objectRef<QuotaLedgerPaginatedResult>("QuotaLedgerPaginatedResult");

export const QuotaLedgerPaginatedResultPothosObject = QuotaLedgerPaginatedResultRef.implement({
  description: "Paginated result set of quota ledger entries",
  fields: t => ({
    rows: t.field({
      type: [QuotaLedgerPothosObject],
      resolve: parent => parent.rows,
    }),
    totalCount: t.exposeInt("totalCount"),
  }),
});

const QuotaRolloverPolicyInputPothosRef = gqlSchemaBuilder.inputRef<QuotaRolloverPolicy>("QuotaRolloverPolicyInput");

export const QuotaRolloverPolicyInputPothosObject = QuotaRolloverPolicyInputPothosRef.implement({
  description: "Rollover policy configuration for periodic quotas",
  fields: t => ({
    maxRolloverPercent: t.field({ type: "Float", required: false }),
    accumulationCap: t.field({ type: "Int", required: false }),
  }),
});

export const QuotaSubmitInputPothosRef = gqlSchemaBuilder.inputRef<QuotaSubmitInput>("QuotaSubmitInput").implement({
  description: "Input for creating a new student quota",
  fields: t => ({
    studentId: t.string({ required: true }),
    kind: t.field({ type: QuotaKindPothosEnum, required: true }),
    name: t.string({ required: true }),
    totalClasses: t.int({ required: true }),
    validFrom: t.field({ type: "DateTime", required: false }),
    validUntil: t.field({ type: "DateTime", required: false }),
    periodType: t.field({ type: QuotaPeriodTypePothosEnum, required: false }),
    periodDays: t.int({ required: false }),
    priority: t.int({ required: false }),
    rolloverPolicy: t.field({ type: QuotaRolloverPolicyInputPothosRef, required: false }),
    idempotencyKey: t.string({ required: false }),
  }),
});

export const QuotaUpdateInputPothosRef = gqlSchemaBuilder.inputRef<QuotaUpdateInput>("QuotaUpdateInput").implement({
  description: "Input for updating an existing quota",
  fields: t => ({
    name: t.string({ required: false }),
    validUntil: t.field({ type: "DateTime", required: false }),
    status: t.field({ type: QuotaStatusPothosEnum, required: false }),
    priority: t.int({ required: false }),
    version: t.int({ required: true }),
  }),
});

export const QuotaPaginatedFilterPothosRef = gqlSchemaBuilder
  .inputRef<QuotaPaginatedFilter>("QuotaPaginatedFilterInput")
  .implement({
    description: "Filter options for querying quotas",
    fields: t => ({
      studentId: t.string({ required: false }),
      kind: t.field({ type: QuotaKindPothosEnum, required: false }),
      status: t.field({ type: QuotaStatusPothosEnum, required: false }),
      search: t.string({ required: false }),
    }),
  });
