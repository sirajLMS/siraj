/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type * as Types from './graphql-types.ts';

export type LoginInput = {
  email: string;
  password: string;
};

export type MeQuery_me_User = { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null };

export type MeQuery_Query = { me: MeQuery_me_User | null };


export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = MeQuery_Query;

export type UserQuery_user_User = { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null };

export type UserQuery_Query = { user: UserQuery_user_User | null };


export type UserQueryVariables = Exact<{
  id: string;
}>;


export type UserQuery = UserQuery_Query;

export type UsersQuery_users_User = { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null };

export type UsersQuery_Query = { users: Array<UsersQuery_users_User> | null };


export type UsersQueryVariables = Exact<{ [key: string]: never; }>;


export type UsersQuery = UsersQuery_Query;

export type LoginMutation_login_LoginResponse_user_User = { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null };

export type LoginMutation_login_LoginResponse = { token: string | null, user: LoginMutation_login_LoginResponse_user_User | null };

export type LoginMutation_Mutation = { login: LoginMutation_login_LoginResponse | null };


export type LoginMutationVariables = Exact<{
  input: Types.LoginInput;
}>;


export type LoginMutation = LoginMutation_Mutation;

export type LogoutMutation_Mutation = { logout: boolean | null };


export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = LogoutMutation_Mutation;

export type RefreshTokenMutation_refreshToken_RefreshTokenResponse_user_User = { createdAt: string | null, email: string | null, emailVerifiedAt: string | null, id: string | null, name: string | null, updatedAt: string | null };

export type RefreshTokenMutation_refreshToken_RefreshTokenResponse = { token: string | null, user: RefreshTokenMutation_refreshToken_RefreshTokenResponse_user_User | null };

export type RefreshTokenMutation_Mutation = { refreshToken: RefreshTokenMutation_refreshToken_RefreshTokenResponse | null };


export type RefreshTokenMutationVariables = Exact<{ [key: string]: never; }>;


export type RefreshTokenMutation = RefreshTokenMutation_Mutation;
