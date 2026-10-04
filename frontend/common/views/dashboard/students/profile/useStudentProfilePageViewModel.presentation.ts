"use client";

import { useMemo } from "react";
import type { StudentProfileQueryData } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext.types";
import type { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import { STATUS_BADGE_KEY } from "@/frontend/common/views/dashboard/students/profile/useStudentProfilePageViewModel.constants";
import {
  buildStudentStatusLabel,
  type StudentProfileHeaderValues,
  type StudentProfileStatusBadge,
} from "@/frontend/common/views/dashboard/students/profile/useStudentProfilePageViewModel.helpers";
import type { StudentStatusLabels } from "@/shared/locale";
import type { StudentProfileLabels } from "@/shared/locale/types/dashboard/students/profile";

type StudentFieldAccess = ReturnType<typeof useStudentFieldAccess>;

interface StudentProfilePresentationState {
  readonly header: StudentProfileHeaderValues;
  readonly statusBadge: StudentProfileStatusBadge | undefined;
}

export function useStudentProfilePresentation(
  profile: StudentProfileQueryData | undefined,
  access: StudentFieldAccess,
  tStatus: StudentStatusLabels,
  t: StudentProfileLabels
): StudentProfilePresentationState {
  const { canView, showField } = access;
  const studentStatusLabel = useMemo(() => buildStudentStatusLabel(tStatus), [tStatus]);

  const header = useMemo<StudentProfileHeaderValues>(() => {
    const showName = profile ? showField(profile.name, "student_identity") : false;
    if (showName && profile?.name) {
      return { title: profile.name, subtitle: t.subtitle };
    }
    if (profile?.id) {
      return { title: t.title, subtitle: t.restrictedIdentity(profile.id) };
    }
    return { title: t.title, subtitle: t.restrictedIdentityGeneric };
  }, [profile, showField, t]);

  const statusBadge = useMemo<StudentProfileStatusBadge | undefined>(() => {
    const showStatus = canView("student_academic") && profile?.status != null;
    if (!showStatus || !profile?.status) {
      return undefined;
    }
    return {
      category: "studentAccount",
      status: STATUS_BADGE_KEY[profile.status] ?? "regular",
      label: studentStatusLabel[profile.status],
    };
  }, [canView, profile, studentStatusLabel]);

  return { header, statusBadge };
}
