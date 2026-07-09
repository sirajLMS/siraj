import type { AppPermission } from "@/backend/enum";
import type { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import type {
  ParentAssignedStudentsResult,
  ParentOwnProfileReturnType,
  ParentProfileResult,
} from "@/backend/types/parents/parent.types";
import type {
  ManagerDirectoryRow,
  StaffPermissionGroupReturnType,
  StaffPermissionOverrideReturnType,
} from "@/backend/types/staff/staff-profile.types";
import type {
  TeacherAssignedStudentsResult,
  TeacherBankingSummaryReturnType,
  TeacherOwnProfileReturnType,
  TeacherOwnProfileUpdateInput,
  TeacherProfileReturnType,
  TeacherProfileUpdateInputType,
} from "@/backend/types/teachers/teacher.types";

export type { TeacherOwnProfileUpdateInput };

export type ProfileMode = "view" | "edit";
export type ProfileAudience = "teacher" | "parent" | "staff";
export type ProfileScope = "own" | "other";

export type ProfilePageContext = {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly audience: ProfileAudience;
  readonly actorUserId: string;
  readonly targetUserId: string;
  readonly teacherId?: string;
  readonly parentId?: string;
  readonly staffProfileId?: string;
  readonly allowedPermissions: readonly AppPermission[];
};

export type ProfilePageRedirect = {
  readonly redirect: string;
};

export type ProfilePageResolution = ProfilePageContext | ProfilePageRedirect;

export type CoreUserProfileFields = {
  readonly name?: string;
  readonly email?: string;
  readonly avatarUrl?: string | null;
};

export type ParentOwnProfileUpdateInput = {
  readonly phone?: string | null;
  readonly facebook?: string | null;
  readonly whatsapp?: string | null;
  readonly twitter?: string | null;
  readonly defaultZoomLink?: string | null;
};

export type ParentAdminProfileUpdateInput = ParentOwnProfileUpdateInput & {
  readonly nationality?: string | null;
  readonly address?: string | null;
  readonly invoiceType?: string | null;
  readonly feeAmount?: string | null;
  readonly paymentMethod?: string | null;
  readonly currency?: string | null;
  readonly timezone?: IanaTimezone | null;
};

export type StaffOwnProfileUpdateInput = {
  readonly phone?: string | null;
};

export type StaffAdminProfileUpdateInput = StaffOwnProfileUpdateInput & {
  readonly status?: string | null;
};

export type UpdateOwnProfileInput = {
  readonly core?: CoreUserProfileFields;
  readonly teacher?: TeacherOwnProfileUpdateInput;
  readonly parent?: ParentOwnProfileUpdateInput;
  readonly staff?: StaffOwnProfileUpdateInput;
};

export type UpdateUserProfileInput = {
  readonly core?: CoreUserProfileFields;
  readonly teacher?: TeacherProfileUpdateInputType;
  readonly parent?: ParentAdminProfileUpdateInput;
  readonly staff?: StaffAdminProfileUpdateInput;
};

export type UnifiedProfileReturnType = {
  readonly id: string;
  readonly userId: string;
  readonly audience: ProfileAudience;
  readonly scope: ProfileScope;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl: string | null;
  readonly teacherId: string | null;
  readonly parentId: string | null;
  readonly staffProfileId: string | null;
  readonly teacherOwnProfile: TeacherOwnProfileReturnType | null;
  readonly teacherAdminProfile: TeacherProfileReturnType | null;
  readonly parentOwnProfile: ParentOwnProfileReturnType | null;
  readonly parentAdminProfile: ParentProfileResult | null;
  readonly associatedStudents: ParentAssignedStudentsResult | null;
  readonly staffProfile: ManagerDirectoryRow | null;
  readonly staffPermissionGroups: StaffPermissionGroupReturnType[] | null;
  readonly staffPermissionOverrides: StaffPermissionOverrideReturnType[] | null;
  readonly bankingSummary: TeacherBankingSummaryReturnType | null;
  readonly assignedStudents: TeacherAssignedStudentsResult | null;
};
