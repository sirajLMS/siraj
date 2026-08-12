import type { AppPermission, ProfileAudience, ProfileMode, ProfileScope } from "@/backend/enum";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { AccountStatus } from "@/backend/enum/auth/auth.enum";
import type { PaymentMethodDefaults, UserPaymentMethodReturnType } from "@/backend/types/billing/payment-method.types";
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
  TeacherOwnProfileReturnType,
  TeacherOwnProfileUpdateInput,
  TeacherProfileReturnType,
  TeacherProfileUpdateInputType,
} from "@/backend/types/teachers/teacher.types";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

// Re-surface the profile enums from @/backend/enum so type-layer consumers
// importing via `@/backend/types` can resolve them. TeacherOwnProfileUpdateInput
// is NOT re-exported here — it is owned by the teachers domain and reached via
// `@/backend/types` through the teachers barrel.
export type { ProfileAudience, ProfileMode, ProfileScope };

export type ProfilePageContext = {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly audience: ProfileAudience;
  readonly actorUserId: string;
  readonly targetUserId: string;
  readonly teacherId?: string;
  readonly parentId?: string;
  readonly staffProfileId?: string;
  readonly studentId?: string;
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
  readonly displayCurrency?: CurrencyCode | null;
  readonly phone?: string | null;
  readonly timezone?: IanaTimezone | null;
  readonly status?: AccountStatus | null;
};

export type ParentOwnProfileUpdateInput = {
  readonly phone?: string | null;
  readonly facebook?: string | null;
  readonly whatsapp?: string | null;
  readonly twitter?: string | null;
  readonly nationality?: string | null;
  readonly address?: string | null;
  readonly timezone?: IanaTimezone | null;
};

export type ParentAdminProfileUpdateInput = ParentOwnProfileUpdateInput & {
  readonly nationality?: string | null;
  readonly address?: string | null;
  readonly invoiceType?: string | null;
  readonly feeAmount?: string | null;
  readonly currency?: CurrencyCode | null;
  readonly timezone?: IanaTimezone | null;
};

export type StaffOwnProfileUpdateInput = {
  readonly phone?: string | null;
};

export type StaffAdminProfileUpdateInput = {
  readonly status?: string | null;
  readonly hourlyRate?: string | null;
  readonly rateCurrency?: import("@/shared/constants/currency.enum").CurrencyCode | null;
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
  readonly paymentMethods: readonly UserPaymentMethodReturnType[] | null;
  readonly paymentMethodDefaults: PaymentMethodDefaults | null;
  readonly meetingConfigs:
    | readonly import("@/backend/types/meeting/meeting-config.types").UserMeetingConfigReturnType[]
    | null;
  readonly assignedStudents: TeacherAssignedStudentsResult | null;
  readonly displayCurrency: CurrencyCode | null;
  readonly timezone: IanaTimezone | null;
  readonly phone: string | null;
};
