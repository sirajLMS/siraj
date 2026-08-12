import type {
  ClassSubjectCreateInput,
  ClassSubjectUpdateInput,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { SubjectFormValues } from "@/frontend/common/views/dashboard/subjects/home/schemas/subject.schema";

const VALID_CURRENCY_CODES = new Set(Object.values(CurrencyCode) as readonly string[]);

function isCurrencyCode(value: string): value is CurrencyCode {
  return VALID_CURRENCY_CODES.has(value);
}

type SubjectInputFields = Pick<
  ClassSubjectCreateInput,
  | "name"
  | "slug"
  | "categoryId"
  | "description"
  | "isActive"
  | "sortOrder"
  | "avatarUrl"
  | "hourlyRate"
  | "rateCurrency"
>;

function buildSubjectInputFields(data: SubjectFormValues): SubjectInputFields {
  return {
    name: data.name,
    slug: data.slug,
    categoryId: data.categoryId,
    description: data.description || null,
    isActive: data.isActive ?? null,
    sortOrder: null,
    avatarUrl: data.avatarUrl || null,
    hourlyRate: data.hourlyRate || null,
    rateCurrency: data.rateCurrency && isCurrencyCode(data.rateCurrency) ? data.rateCurrency : null,
  };
}

export function subjectFormValuesToCreateInput(data: SubjectFormValues): ClassSubjectCreateInput {
  return buildSubjectInputFields(data);
}

export function subjectFormValuesToUpdateInput(data: SubjectFormValues): ClassSubjectUpdateInput {
  return buildSubjectInputFields(data);
}
