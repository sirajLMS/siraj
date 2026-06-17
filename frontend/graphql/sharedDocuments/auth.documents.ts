import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const meQueryDocument: TypedDocumentNode<Operations.MeQuery> = gql`
  query me {
    me {
      createdAt
      email
      emailVerifiedAt
      id
      name
      updatedAt
      permissions
      role
      avatarUrl
      notificationCount
    }
  }
`;

export const userQueryDocument: TypedDocumentNode<Operations.UserQuery, Types.QueryUserArgs> = gql`
  query user($id: String!) {
    user(id: $id) {
      createdAt
      email
      emailVerifiedAt
      id
      name
      updatedAt
      permissions
      role
      avatarUrl
      notificationCount
    }
  }
`;

export const usersQueryDocument: TypedDocumentNode<Operations.UsersQuery> = gql`
  query users {
    users {
      createdAt
      email
      emailVerifiedAt
      id
      name
      updatedAt
      permissions
      role
      avatarUrl
      notificationCount
    }
  }
`;

export const loginMutationDocument: TypedDocumentNode<Operations.LoginMutation, Types.MutationLoginArgs> = gql`
  mutation login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        createdAt
        email
        emailVerifiedAt
        id
        name
        updatedAt
        permissions
        role
        avatarUrl
        notificationCount
      }
    }
  }
`;

export const demoLoginMutationDocument: TypedDocumentNode<Operations.DemoLoginMutation, Types.MutationDemoLoginArgs> =
  gql`
  mutation demoLogin($input: DemoLoginInput!) {
    demoLogin(input: $input) {
      token
      user {
        createdAt
        email
        emailVerifiedAt
        id
        name
        updatedAt
        permissions
        role
        avatarUrl
        notificationCount
      }
    }
  }
`;

export const logoutMutationDocument: TypedDocumentNode<Operations.LogoutMutation> = gql`
  mutation logout {
    logout
  }
`;

export const refreshTokenMutationDocument: TypedDocumentNode<Operations.RefreshTokenMutation> = gql`
  mutation refreshToken {
    refreshToken {
      token
      user {
        createdAt
        email
        emailVerifiedAt
        id
        name
        updatedAt
        permissions
        role
        avatarUrl
        notificationCount
      }
    }
  }
`;
