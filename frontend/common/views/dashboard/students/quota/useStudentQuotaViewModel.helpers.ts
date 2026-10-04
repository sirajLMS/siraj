import { formatDistanceToNow } from "date-fns";
import type { StudentProfileQueryData } from "@/frontend/common/views/dashboard/students/profile/studentProfileContext.types";
import type { StudentProfileData } from "@/frontend/common/views/dashboard/students/quota/types";

interface StudentQuotaByIdData {
  readonly id: string | null;
  readonly name: string | null;
  readonly language?: string | null;
  readonly gender?: string | null;
  readonly teacherName?: string | null;
  readonly classesTotal?: number | null;
  readonly classesRemaining?: number | null;
  readonly updatedAt?: string | null;
  readonly primaryTeacherId?: string | null;
  readonly avatarUrl?: string | null;
}

function resolveGenderLabel(raw: string | null | undefined): "MALE" | "FEMALE" | null {
  if (raw == null) return null;
  const normalized = raw.toUpperCase();
  if (normalized === "FEMALE") return "FEMALE";
  if (normalized === "MALE") return "MALE";
  return null;
}

export function buildStudentQuotaData(
  useUnifiedProfile: boolean,
  profile: StudentProfileQueryData | null | undefined,
  studentById: StudentQuotaByIdData | undefined,
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

export type StudentQuotaLoadingState = "loading" | "missing" | "error" | "ready";

export function resolveQuotaLoadingState(input: {
  readonly useUnifiedProfile: boolean;
  readonly unifiedLoading: boolean;
  readonly unifiedProfilePresent: boolean;
  readonly standaloneLoading: boolean;
  readonly standaloneDataPresent: boolean;
  readonly standaloneError: boolean;
}): StudentQuotaLoadingState {
  const effectiveLoading = input.useUnifiedProfile ? input.unifiedLoading : input.standaloneLoading;
  if (effectiveLoading && !input.standaloneDataPresent && !input.unifiedProfilePresent) {
    return "loading";
  }
  if (input.useUnifiedProfile && !input.unifiedLoading && !input.unifiedProfilePresent) {
    return "missing";
  }
  if (!input.useUnifiedProfile && input.standaloneError) {
    return "error";
  }
  return "ready";
}
