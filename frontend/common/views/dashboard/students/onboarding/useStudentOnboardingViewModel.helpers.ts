import { CurrencyCode, StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { StudentOnboardingFormData } from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import type { StudentOnboardingLabels as StudentOnboardingLocaleLabels } from "@/shared/locale/types/dashboard/students/onboarding";

export interface StudentOnboardingLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly statusBanner: string;
  readonly create: string;
  readonly processing: string;
  readonly sections: {
    readonly parentAssignment: string;
    readonly studentInfo: string;
    readonly teacherAssignment: string;
  };
  readonly fields: {
    readonly parent: string;
    readonly name: string;
    readonly dateOfBirth: string;
    readonly gender: string;
    readonly male: string;
    readonly female: string;
    readonly language: string;
    readonly status: string;
    readonly primaryTeacher: string;
    readonly avatar: string;
  };
  readonly placeholders: {
    readonly parent: string;
    readonly name: string;
    readonly dateOfBirth: string;
    readonly language: string;
    readonly primaryTeacher: string;
  };
  readonly options: {
    readonly status: {
      readonly onTrial: string;
      readonly regular: string;
    };
  };
  readonly validation: {
    readonly parentRequired: string;
    readonly nameMinLength: string;
  };
}

export function buildLabels(t: StudentOnboardingLocaleLabels): StudentOnboardingLabels {
  return {
    pageTitle: t.pageTitle,
    pageSubtitle: t.pageSubtitle,
    statusBanner: t.statusBanner,
    create: t.actions.create,
    processing: t.actions.processing,
    sections: {
      parentAssignment: t.sections.parentAssignment,
      studentInfo: t.sections.studentInfo,
      teacherAssignment: t.sections.teacherAssignment,
    },
    fields: {
      parent: t.fields.parent,
      name: t.fields.name,
      dateOfBirth: t.fields.dateOfBirth,
      gender: t.fields.gender,
      male: t.fields.male,
      female: t.fields.female,
      language: t.fields.language,
      status: t.fields.status,
      primaryTeacher: t.fields.primaryTeacher,
      avatar: t.fields.avatar,
    },
    placeholders: {
      parent: t.placeholders.parent,
      name: t.placeholders.name,
      dateOfBirth: t.placeholders.dateOfBirth,
      language: t.placeholders.language,
      primaryTeacher: t.placeholders.primaryTeacher,
    },
    options: {
      status: {
        onTrial: t.options.status.onTrial,
        regular: t.options.status.regular,
      },
    },
    validation: {
      parentRequired: t.validation.parentRequired,
      nameMinLength: t.validation.nameMinLength,
    },
  };
}

export function buildOnboardingFormValues(parentId: StudentOnboardingFormData["parentId"]): StudentOnboardingFormData {
  return {
    parentId,
    name: "",
    email: "",
    password: "",
    avatarUrl: undefined,
    phone: "",
    timezone: IanaTimezone.Africa_Cairo,
    displayCurrency: CurrencyCode.Usd,
    dateOfBirth: "",
    gender: null,
    language: null,
    status: StudentStatus.OnTrial,
    primaryTeacherId: "",
  };
}
