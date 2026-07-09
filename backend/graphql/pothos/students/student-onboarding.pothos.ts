import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AppLanguagePothosObject,
  GenderPothosObject,
  StudentStatusPothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type { StudentOnboardingInput, StudentOnboardingResult } from "@/backend/types";

export const StudentOnboardingInputPothosObject = gqlSchemaBuilder
  .inputRef<StudentOnboardingInput>("StudentOnboardingInput")
  .implement({
    description: "Input for creating a new student profile under a parent",
    fields: t => ({
      parentId: t.string({ required: true }),
      name: t.string({ required: true, directives: { constraint: { maxLength: 255 } } }),
      dateOfBirth: t.field({ type: "DateTime" }),
      gender: t.field({ type: GenderPothosObject }),
      language: t.field({ type: AppLanguagePothosObject }),
      primaryTeacherId: t.string(),
      status: t.field({ type: StudentStatusPothosObject }),
      classesTotal: t.int(),
      classesRemaining: t.int(),
    }),
  });

export const StudentOnboardingResultPothosObject = gqlSchemaBuilder
  .objectRef<StudentOnboardingResult>("StudentOnboardingResult")
  .implement({
    description: "Result of student onboarding operation",
    fields: t => ({
      studentId: t.exposeString("studentId"),
      parentId: t.exposeString("parentId"),
      name: t.exposeString("name"),
      status: t.expose("status", { type: StudentStatusPothosObject }),
      primaryTeacherId: t.exposeString("primaryTeacherId", { nullable: true }),
    }),
  });
