"use client";

import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEffect, useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { updateStudentQuotaMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import type { StudentProfileContextValue } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext.types";
import {
  createStudentQuotaSchema,
  type StudentQuotaFormData,
  type StudentQuotaFormInput,
} from "@/frontend/common/views/dashboard/students/quota/schemas/studentQuotaSchema";
import type { StudentProfileData } from "@/frontend/common/views/dashboard/students/quota/types";
import { useRouter } from "@/shared/i18n/navigation";
import type { StudentQuotaLabels } from "@/shared/locale/types";

const SAVED_FLAG_RESET_MS = 2000;

export type StudentQuotaMethods = UseFormReturn<StudentQuotaFormInput, undefined, StudentQuotaFormData>;

interface StudentQuotaSaveMutationProps {
  readonly useUnifiedProfile: boolean;
  readonly canSubmit: boolean;
  readonly profileContext: StudentProfileContextValue | null;
  readonly refetchStudentById: () => Promise<unknown>;
  readonly successMessage: string;
  readonly failureMessage: string;
}

export function useStudentQuotaSaveMutation(props: Readonly<StudentQuotaSaveMutationProps>) {
  const notifications = useNotifications();
  const [isSaved, setIsSaved] = useState(false);

  const [updateQuota, { loading: saving }] = useMutation(updateStudentQuotaMutationDocument, {
    onCompleted: () => {
      setIsSaved(true);
      notifications.show(props.successMessage, { severity: "success", autoHideDuration: 4000 });
      if (props.useUnifiedProfile) {
        props.profileContext?.refetch({ year: null, month: null }).catch(() => undefined);
      } else {
        props.refetchStudentById().catch(() => undefined);
      }
      setTimeout(() => {
        setIsSaved(false);
      }, SAVED_FLAG_RESET_MS);
    },
    onError: mutationError => {
      logger.error("Update quota failed:", { mutationError });
      notifications.show(props.failureMessage, { severity: "error", autoHideDuration: 5000 });
    },
  });

  const saveQuota = async (studentId: string, formData: StudentQuotaFormData): Promise<void> => {
    if (!studentId || !props.canSubmit) return;
    await updateQuota({
      variables: {
        studentId,
        newClassesRemaining: formData.classesLeft,
        expectedVersion: null,
      },
    });
  };

  return { saveQuota, saving, isSaved };
}

export function useStudentQuotaFormMethods(
  studentData: StudentProfileData | null,
  validationMessages: StudentQuotaLabels["validation"]
): StudentQuotaMethods {
  const schema = createStudentQuotaSchema(validationMessages);

  const methods = useForm<StudentQuotaFormInput, undefined, StudentQuotaFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      studentName: "",
      dateOfBirth: "",
      language: "ar",
      gender: "",
      teacher: "",
      totalClasses: 0,
      classesLeft: 0,
    },
  });
  const { reset } = methods;

  useEffect(() => {
    if (!studentData) return;
    reset({
      studentName: studentData.studentName,
      dateOfBirth: studentData.dateOfBirth,
      language: studentData.language,
      gender: studentData.gender,
      teacher: studentData.teacher,
      totalClasses: studentData.totalClasses,
      classesLeft: studentData.classesLeft,
    });
  }, [studentData, reset]);

  return methods;
}

export function useStudentQuotaCancelNavigation(useUnifiedProfile: boolean, studentId: string): () => void {
  const router = useRouter();
  return () => {
    if (useUnifiedProfile) {
      router.replace(`/students/${studentId}/profile?tab=status`);
      return;
    }
    router.back();
  };
}
