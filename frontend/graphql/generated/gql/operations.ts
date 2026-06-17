/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type * as Types from './graphql-types.ts';

export type LoginInput = {
  email: string;
  password: string;
};

export type MeQuery_me_User = { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null, permissions: Array<string> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null };

export type MeQuery_Query = { me: MeQuery_me_User | null };


export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = MeQuery_Query;

export type UserQuery_user_User = { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null, permissions: Array<string> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null };

export type UserQuery_Query = { user: UserQuery_user_User | null };


export type UserQueryVariables = Exact<{
  id: string;
}>;


export type UserQuery = UserQuery_Query;

export type UsersQuery_users_User = { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null, permissions: Array<string> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null };

export type UsersQuery_Query = { users: Array<UsersQuery_users_User> | null };


export type UsersQueryVariables = Exact<{ [key: string]: never; }>;


export type UsersQuery = UsersQuery_Query;

export type LoginMutation_login_LoginResponse_user_User = { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null, permissions: Array<string> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null };

export type LoginMutation_login_LoginResponse = { token: string | null, user: LoginMutation_login_LoginResponse_user_User | null };

export type LoginMutation_Mutation = { login: LoginMutation_login_LoginResponse | null };


export type LoginMutationVariables = Exact<{
  input: Types.LoginInput;
}>;


export type LoginMutation = LoginMutation_Mutation;

export type LogoutMutation_Mutation = { logout: boolean | null };


export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = LogoutMutation_Mutation;

export type RefreshTokenMutation_refreshToken_RefreshTokenResponse_user_User = { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null, permissions: Array<string> | null, role: string | null, avatarUrl: string | null, notificationCount: number | null };

export type RefreshTokenMutation_refreshToken_RefreshTokenResponse = { token: string | null, user: RefreshTokenMutation_refreshToken_RefreshTokenResponse_user_User | null };

export type RefreshTokenMutation_Mutation = { refreshToken: RefreshTokenMutation_refreshToken_RefreshTokenResponse | null };


export type RefreshTokenMutationVariables = Exact<{ [key: string]: never; }>;


export type RefreshTokenMutation = RefreshTokenMutation_Mutation;

export type DailyScheduleMetricsQuery_dailyScheduleMetrics_DailyScheduleMetrics = { id: string | null, total: number | null, regular: number | null, trial: number | null, advance: number | null, rescheduled: number | null, suspended: number | null, taken: number | null, pending: number | null, activated: number | null, running: number | null, absent: number | null, leave: number | null };

export type DailyScheduleMetricsQuery_Query = { dailyScheduleMetrics: DailyScheduleMetricsQuery_dailyScheduleMetrics_DailyScheduleMetrics | null };


export type DailyScheduleMetricsQueryVariables = Exact<{
  date: string;
  teacherId: string | null | undefined;
}>;


export type DailyScheduleMetricsQuery = DailyScheduleMetricsQuery_Query;

export type DailyScheduleListQuery_dailyScheduleList_DailyScheduleList_student_DailyScheduleListUserItem = { id: string | null, name: string | null };

export type DailyScheduleListQuery_dailyScheduleList_DailyScheduleList_teacher_DailyScheduleListUserItem = { id: string | null, name: string | null };

export type DailyScheduleListQuery_dailyScheduleList_DailyScheduleList = { id: string | null, studentTime: string | null, yourTime: string | null, duration: number | null, status: string | null, student: DailyScheduleListQuery_dailyScheduleList_DailyScheduleList_student_DailyScheduleListUserItem | null, teacher: DailyScheduleListQuery_dailyScheduleList_DailyScheduleList_teacher_DailyScheduleListUserItem | null };

export type DailyScheduleListQuery_Query = { dailyScheduleList: Array<DailyScheduleListQuery_dailyScheduleList_DailyScheduleList> | null };


export type DailyScheduleListQueryVariables = Exact<{
  date: string;
  teacherId: string | null | undefined;
}>;


export type DailyScheduleListQuery = DailyScheduleListQuery_Query;

export type WelcomeMessageQuery_Query = { welcomeMessage: string | null };


export type WelcomeMessageQueryVariables = Exact<{ [key: string]: never; }>;


export type WelcomeMessageQuery = WelcomeMessageQuery_Query;

export type TranslatedMessageQuery_Query = { translatedMessage: string | null };


export type TranslatedMessageQueryVariables = Exact<{
  key: string;
  namespace: string;
}>;


export type TranslatedMessageQuery = TranslatedMessageQuery_Query;
