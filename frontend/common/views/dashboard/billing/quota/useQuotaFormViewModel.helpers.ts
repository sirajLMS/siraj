import {
  QuotaKind,
  type QuotaQuery,
  type QuotaStatus,
  type QuotaSubmitInput,
  type QuotasQuery,
  type QuotasQuery_quotas_rows,
  type QuotaUpdateInput,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  QuotaFormData,
  QuotaFormInput,
} from "@/frontend/common/views/dashboard/billing/quota/schemas/quotaSchema";

export const SUCCESS_AUTO_DISMISS_MS = 3000;
export const QUOTAS_PATH = "/quotas";

export const CREATE_DEFAULT_VALUES: QuotaFormInput = {
  studentId: "",
  name: "",
  kind: QuotaKind.Package,
  totalClasses: 10,
  validFrom: null,
  validUntil: null,
  periodType: null,
  periodDays: null,
  priority: 10,
};

export function buildEditDefaults(quota: QuotaQuery["quota"]): QuotaFormInput {
  return {
    studentId: quota?.studentId ?? "",
    name: quota?.name ?? "",
    kind: quota?.kind ?? QuotaKind.Package,
    totalClasses: quota?.totalClasses ?? 10,
    validFrom: quota?.validFrom,
    validUntil: quota?.validUntil,
    periodType: quota?.periodType,
    periodDays: quota?.periodDays,
    priority: quota?.priority ?? 10,
  };
}

function toDateValue(value: string | null | undefined): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

export function buildCreateInput(data: QuotaFormData): QuotaSubmitInput {
  return {
    studentId: data.studentId,
    kind: data.kind,
    name: data.name,
    totalClasses: data.totalClasses,
    validFrom: toDateValue(data.validFrom),
    validUntil: toDateValue(data.validUntil),
    periodType: data.periodType ?? null,
    periodDays: data.periodDays ?? null,
    priority: data.priority,
    idempotencyKey: null,
    rolloverPolicy: null,
  };
}

export function buildUpdateInput(data: QuotaFormData, status: QuotaStatus | null): QuotaUpdateInput {
  return {
    name: data.name,
    validUntil: toDateValue(data.validUntil),
    status,
    priority: data.priority,
  };
}

export function replaceQuotaInListCache(
  quotaId: string,
  updated: QuotaQuery["quota"]
): (data: QuotasQuery | null) => QuotasQuery | null {
  return cached => {
    if (!cached?.quotas?.rows) return cached;
    return {
      ...cached,
      quotas: {
        ...cached.quotas,
        rows: cached.quotas.rows.map(row => (row.id === quotaId ? { ...row, ...updated } : row)),
      },
    };
  };
}

export function replaceQuotaDetailCache(updated: QuotaQuery["quota"]): (data: QuotaQuery | null) => QuotaQuery | null {
  return cached => {
    if (!cached?.quota) return cached;
    return { ...cached, quota: { ...cached.quota, ...updated } };
  };
}

export function appendCreatedQuota(created: QuotasQuery_quotas_rows): (data: QuotasQuery | null) => QuotasQuery | null {
  return cached => {
    if (!cached?.quotas?.rows) return cached;
    return {
      ...cached,
      quotas: {
        ...cached.quotas,
        rows: [...cached.quotas.rows, created],
        totalCount: (cached.quotas.totalCount ?? 0) + 1,
      },
    };
  };
}
