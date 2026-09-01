"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNotifications } from "@toolpad/core/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import {
  studentByIdQueryDocument,
  updateStudentQuotaMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import type { StudentProfileQueryData } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext.types";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import { useStudentProfileContext } from "@/frontend/common/views/dashboard/students/profile/useStudentProfileContext";
import {
  createStudentQuotaSchema,
  type StudentQuotaFormData,
  type StudentQuotaFormInput,
} from "@/frontend/common/views/dashboard/students/quota/schemas/studentQuotaSchema";
import type { StudentProfileData } from "@/frontend/common/views/dashboard/students/quota/types";
import { useRouter } from "@/shared/i18n/navigation";
import { type CommonLabels, Translation, useAppTranslation } from "@/shared/locale";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

function resolveGenderLabel(raw: string | null | undefined): "MALE" | "FEMALE" | null {
  if (raw == null) return null;
  const normalized = raw.toUpperCase();
  if (normalized === "FEMALE") return "FEMALE";
  if (normalized === "MALE") return "MALE";
  return null;
}

function buildStudentQuotaData(
  useUnifiedProfile: boolean,
  profile: StudentProfileQueryData | null | undefined,
  studentById:
    | {
        id: string | null;
        name: string | null;
        language?: string | null;
        gender?: string | null;
        teacherName?: string | null;
        classesTotal?: number | null;
        classesRemaining?: number | null;
        updatedAt?: string | null;
        primaryTeacherId?: string | null;
        avatarUrl?: string | null;
      }
    | undefined,
  notSetLabel: string
): StudentProfileData | null {
  const s = useUnifiedProfile ? profile : studentById;
  if (!s || typeof s.id !== "string" || s.id.length === 0) return null;

  return {
    id: s.id,
    studentName: s.name ?? notSetLabel,
    dateOfBirth: useUnifiedProfile && profile?.dateOfBirth ? profile.dateOfBirth : "",
    language: s.language === "en" ? "en" : "ar",
    gender: resolveGenderLabel(s.gender) ?? "",
    teacher: s.teacherName ?? "",
    totalClasses: s.classesTotal ?? 0,
    classesLeft: s.classesRemaining ?? 0,
    profileImage: useUnifiedProfile ? (profile?.avatarUrl ?? "") : "",
    lastEditedTime: s.updatedAt ? formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true }) : "",
    primaryTeacherId: s.primaryTeacherId ?? null,
  };
}

export interface UseStudentQuotaViewModelProps {
  readonly studentId?: string;
}

type StudentQuotaMethods = UseFormReturn<StudentQuotaFormInput, undefined, StudentQuotaFormData>;

export interface StudentQuotaViewModel {
  readonly t: StudentQuotaLabels;
  readonly tc: CommonLabels;
  readonly studentData: StudentProfileData | null;
  readonly isSaving: boolean;
  readonly isSaved: boolean;
  readonly embedded: boolean;
  readonly readOnly: boolean;
  readonly canEditIdentity: boolean;
  readonly canEditQuota: boolean;
  readonly canViewQuota: boolean;
  readonly canViewTeacher: boolean;
  readonly isLoading: boolean;
  readonly loadingState: "loading" | "missing" | "error" | "ready";
  readonly errorMessage: string | null;
  readonly methods: StudentQuotaMethods;
  readonly onSubmit: (data: StudentQuotaFormData) => Promise<void>;
  readonly onCancel: () => void;
}

export function useStudentQuotaViewModel(props: Readonly<UseStudentQuotaViewModelProps>): StudentQuotaViewModel {
  const t = useAppTranslation(Translation.Dashboard.StudentQuota);
  const tc = useAppTranslation(Translation.Common);
  const router = useRouter();
  const notifications = useNotifications();
  const profileContext = useStudentProfileContext();
  const studentId = props.studentId ?? profileContext?.studentId ?? "";
  const useUnifiedProfile = profileContext != null;
  const { canView, canEdit } = useStudentFieldAccess();
  const canEditQuota = canEdit("student_quota_edit");

  const [isSaved, setIsSaved] = useState(false);

  const { data, loading, error, refetch } = useQuery(studentByIdQueryDocument, {
    variables: { studentId },
    skip: !studentId || useUnifiedProfile,
  });

  const [updateQuota, { loading: saving }] = useMutation(updateStudentQuotaMutationDocument, {
    onCompleted: () => {
      setIsSaved(true);
      notifications.show(t.actions.saveSuccess, { severity: "success", autoHideDuration: 4000 });
      if (useUnifiedProfile) {
        profileContext?.refetch({ year: null, month: null }).catch(() => undefined);
      } else {
        refetch().catch(() => undefined);
      }
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    },
    onError: mutationError => {
      logger.error("Update quota failed:", { mutationError });
      notifications.show(tc.operationFailed, { severity: "error", autoHideDuration: 5000 });
    },
  });

  const handleSave = async (formData: StudentQuotaFormData) => {
    if (!studentId || !canEditQuota) return;
    await updateQuota({
      variables: {
        studentId,
        newClassesRemaining: formData.classesLeft,
        expectedVersion: null,
      },
    });
  };

  const loadingState = (() => {
    const unifiedLoading = Boolean(profileContext?.loading);
    const unifiedProfileMissing = !profileContext?.profile;

    if ((useUnifiedProfile ? unifiedLoading : loading) && !data && !profileContext?.profile) {
      return "loading" as const;
    }
    if (useUnifiedProfile && !unifiedLoading && unifiedProfileMissing) {
      return "missing" as const;
    }
    if (!useUnifiedProfile && error) {
      return "error" as const;
    }
    return "ready" as const;
  })();

  const notSetLabel = tc.notSet;
  const studentData = useMemo(
    () =>
      buildStudentQuotaData(
        useUnifiedProfile,
        profileContext?.profile ?? undefined,
        data?.studentById ?? undefined,
        notSetLabel
      ),
    [useUnifiedProfile, profileContext?.profile, data?.studentById, notSetLabel]
  );

  const canEditIdentity = canEdit("student_identity");
  const canEditQuotaFlag = canEdit("student_quota_edit");
  const canViewQuotaFlag = canView("student_quota_edit");
  const canViewTeacherFlag = canView("student_teacher");

  const validationMessages = t.validation;
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

  const onSubmit = async (formData: StudentQuotaFormData) => {
    await handleSave(formData);
  };

  const onCancel = () => {
    if (useUnifiedProfile) {
      router.replace(`/students/${studentId}/profile?tab=status`);
      return;
    }
    router.back();
  };

  return {
    t,
    tc,
    studentData,
    isSaving: saving,
    isSaved,
    embedded: useUnifiedProfile,
    readOnly: !canEditQuotaFlag,
    canEditIdentity,
    canEditQuota: canEditQuotaFlag,
    canViewQuota: canViewQuotaFlag,
    canViewTeacher: canViewTeacherFlag,
    isLoading: loadingState === "loading",
    loadingState,
    errorMessage: loadingState === "error" ? tc.loadFailed : null,
    methods,
    onSubmit,
    onCancel,
  };
}
