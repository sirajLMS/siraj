"use client";

import { useMutation } from "@apollo/client/react";
import type { StudentOnboardingInput } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { createStudentMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import type { StudentOnboardingFormData } from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";

export function useCreateStudentOnboarding() {
  const [mutate, { loading, error, data }] = useMutation(createStudentMutationDocument);

  const execute = async (formData: StudentOnboardingFormData) => {
    const input: StudentOnboardingInput = {
      parentId: formData.parentId,
      name: formData.name,
      avatarUrl: formData.avatarUrl ?? null,
      dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth : null,
      gender: formData.gender ?? null,
      language: formData.language ?? null,
      status: formData.status,
      primaryTeacherId: formData.primaryTeacherId || null,
      classesTotal: null,
      classesRemaining: null,
      email: formData.email,
      password: formData.password,
      timezone: null,
    };

    const result = await mutate({ variables: { input } });

    if (result.data?.createStudent) {
      return result.data.createStudent;
    }

    throw new Error("Mutation returned no data");
  };

  const executeSafe = async (formData: StudentOnboardingFormData) => {
    try {
      return await execute(formData);
    } catch (err) {
      logger.error("Student creation failed:", { err });
      throw err;
    }
  };

  return { execute: executeSafe, loading, error, data };
}
