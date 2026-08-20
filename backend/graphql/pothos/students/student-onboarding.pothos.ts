import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AppLanguagePothosObject,
  CurrencyCodePothosObject,
  GenderPothosObject,
  IanaTimezonePothosObject,
  StudentStatusPothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type { StudentOnboardingInput, StudentOnboardingResult } from "@/backend/types";

export const StudentOnboardingInputPothosObject = gqlSchemaBuilder
  .inputRef<StudentOnboardingInput>("StudentOnboardingInput")
  .implement({
    description: "Input for creating a new student profile under a parent",
    fields: t => ({
      parentId: t.string({ required: false, directives: { constraint: { maxLength: 36 } } }),
      name: t.string({ required: true, directives: { constraint: { maxLength: 255 } } }),
      dateOfBirth: t.field({ type: "DateTime" }),
      gender: t.field({ type: GenderPothosObject }),
      language: t.field({ type: AppLanguagePothosObject }),
      primaryTeacherId: t.string({ directives: { constraint: { maxLength: 36 } } }),
      status: t.field({ type: StudentStatusPothosObject }),
      classesTotal: t.int(),
      classesRemaining: t.int(),
      email: t.string({
        required: false,
        description: "Student login email (creates a users row when provided)",
        directives: { constraint: { maxLength: 255 } },
      }),
      password: t.string({
        required: false,
        directives: { constraint: { maxLength: 128 } },
        description: "Student login password (required when email is provided)",
      }),
      timezone: t.field({
        type: IanaTimezonePothosObject,
        description: "Student timezone (applied to the created user record)",
      }),
      phone: t.string({
        required: false,
        description: "Student phone (stored on users row)",
        directives: { constraint: { maxLength: 50 } },
      }),
      displayCurrency: t.field({
        type: CurrencyCodePothosObject,
        required: false,
        description: "User display currency",
      }),
      avatarUrl: t.string({
        required: false,
        description: "Student avatar URL",
        directives: { constraint: { maxLength: 1024 } },
      }),
    }),
  });

export const StudentOnboardingResultPothosObject = gqlSchemaBuilder
  .objectRef<StudentOnboardingResult>("StudentOnboardingResult")
  .implement({
    description: "Result of student onboarding operation",
    fields: t => ({
      id: t.string({ resolve: student => student.studentId }),
      studentId: t.exposeString("studentId"),
      parentId: t.exposeString("parentId", { nullable: true }),
      name: t.exposeString("name"),
      status: t.expose("status", { type: StudentStatusPothosObject }),
      primaryTeacherId: t.exposeString("primaryTeacherId", { nullable: true }),
    }),
  });
