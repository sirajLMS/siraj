/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query me {\n    me {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n": typeof types.MeDocument,
    "\n  query user($id: String!) {\n    user(id: $id) {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n": typeof types.UserDocument,
    "\n  query users {\n    users {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n": typeof types.UsersDocument,
    "\n  mutation login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n": typeof types.LoginDocument,
    "\n  mutation demoLogin($input: DemoLoginInput!) {\n    demoLogin(input: $input) {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n": typeof types.DemoLoginDocument,
    "\n  mutation logout {\n    logout\n  }\n": typeof types.LogoutDocument,
    "\n  mutation refreshToken {\n    refreshToken {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n": typeof types.RefreshTokenDocument,
    "\n  query dailyScheduleMetrics($date: String!, $teacherId: String) {\n    dailyScheduleMetrics(date: $date, teacherId: $teacherId) {\n      id\n      total\n      regular\n      trial\n      advance\n      rescheduled\n      suspended\n      taken\n      pending\n      activated\n      running\n      absent\n      leave\n    }\n  }\n": typeof types.DailyScheduleMetricsDocument,
    "\n  query dailyScheduleList($date: String!, $teacherId: String) {\n    dailyScheduleList(date: $date, teacherId: $teacherId) {\n      id\n      studentTime\n      yourTime\n      duration\n      status\n      student {\n        id\n        name\n      }\n      teacher {\n        id\n        name\n      }\n    }\n  }\n": typeof types.DailyScheduleListDocument,
    "\n  query teachers($search: String!, $limit: Int!) {\n    teachers(search: $search, limit: $limit) {\n      id\n      name\n    }\n  }\n": typeof types.TeachersDocument,
    "\n  query welcomeMessage {\n    welcomeMessage\n  }\n": typeof types.WelcomeMessageDocument,
    "\n  query translatedMessage($key: String!, $namespace: String!) {\n    translatedMessage(key: $key, namespace: $namespace)\n  }\n": typeof types.TranslatedMessageDocument,
};
const documents: Documents = {
    "\n  query me {\n    me {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n": types.MeDocument,
    "\n  query user($id: String!) {\n    user(id: $id) {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n": types.UserDocument,
    "\n  query users {\n    users {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n": types.UsersDocument,
    "\n  mutation login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n": types.LoginDocument,
    "\n  mutation demoLogin($input: DemoLoginInput!) {\n    demoLogin(input: $input) {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n": types.DemoLoginDocument,
    "\n  mutation logout {\n    logout\n  }\n": types.LogoutDocument,
    "\n  mutation refreshToken {\n    refreshToken {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n": types.RefreshTokenDocument,
    "\n  query dailyScheduleMetrics($date: String!, $teacherId: String) {\n    dailyScheduleMetrics(date: $date, teacherId: $teacherId) {\n      id\n      total\n      regular\n      trial\n      advance\n      rescheduled\n      suspended\n      taken\n      pending\n      activated\n      running\n      absent\n      leave\n    }\n  }\n": types.DailyScheduleMetricsDocument,
    "\n  query dailyScheduleList($date: String!, $teacherId: String) {\n    dailyScheduleList(date: $date, teacherId: $teacherId) {\n      id\n      studentTime\n      yourTime\n      duration\n      status\n      student {\n        id\n        name\n      }\n      teacher {\n        id\n        name\n      }\n    }\n  }\n": types.DailyScheduleListDocument,
    "\n  query teachers($search: String!, $limit: Int!) {\n    teachers(search: $search, limit: $limit) {\n      id\n      name\n    }\n  }\n": types.TeachersDocument,
    "\n  query welcomeMessage {\n    welcomeMessage\n  }\n": types.WelcomeMessageDocument,
    "\n  query translatedMessage($key: String!, $namespace: String!) {\n    translatedMessage(key: $key, namespace: $namespace)\n  }\n": types.TranslatedMessageDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query me {\n    me {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n"): (typeof documents)["\n  query me {\n    me {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query user($id: String!) {\n    user(id: $id) {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n"): (typeof documents)["\n  query user($id: String!) {\n    user(id: $id) {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query users {\n    users {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n"): (typeof documents)["\n  query users {\n    users {\n      createdAt\n      email\n      emailVerifiedAt\n      id\n      name\n      updatedAt\n      permissions\n      role\n      avatarUrl\n      notificationCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation demoLogin($input: DemoLoginInput!) {\n    demoLogin(input: $input) {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation demoLogin($input: DemoLoginInput!) {\n    demoLogin(input: $input) {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation logout {\n    logout\n  }\n"): (typeof documents)["\n  mutation logout {\n    logout\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation refreshToken {\n    refreshToken {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation refreshToken {\n    refreshToken {\n      token\n      user {\n        createdAt\n        email\n        emailVerifiedAt\n        id\n        name\n        updatedAt\n        permissions\n        role\n        avatarUrl\n        notificationCount\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query dailyScheduleMetrics($date: String!, $teacherId: String) {\n    dailyScheduleMetrics(date: $date, teacherId: $teacherId) {\n      id\n      total\n      regular\n      trial\n      advance\n      rescheduled\n      suspended\n      taken\n      pending\n      activated\n      running\n      absent\n      leave\n    }\n  }\n"): (typeof documents)["\n  query dailyScheduleMetrics($date: String!, $teacherId: String) {\n    dailyScheduleMetrics(date: $date, teacherId: $teacherId) {\n      id\n      total\n      regular\n      trial\n      advance\n      rescheduled\n      suspended\n      taken\n      pending\n      activated\n      running\n      absent\n      leave\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query dailyScheduleList($date: String!, $teacherId: String) {\n    dailyScheduleList(date: $date, teacherId: $teacherId) {\n      id\n      studentTime\n      yourTime\n      duration\n      status\n      student {\n        id\n        name\n      }\n      teacher {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query dailyScheduleList($date: String!, $teacherId: String) {\n    dailyScheduleList(date: $date, teacherId: $teacherId) {\n      id\n      studentTime\n      yourTime\n      duration\n      status\n      student {\n        id\n        name\n      }\n      teacher {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query teachers($search: String!, $limit: Int!) {\n    teachers(search: $search, limit: $limit) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query teachers($search: String!, $limit: Int!) {\n    teachers(search: $search, limit: $limit) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query welcomeMessage {\n    welcomeMessage\n  }\n"): (typeof documents)["\n  query welcomeMessage {\n    welcomeMessage\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query translatedMessage($key: String!, $namespace: String!) {\n    translatedMessage(key: $key, namespace: $namespace)\n  }\n"): (typeof documents)["\n  query translatedMessage($key: String!, $namespace: String!) {\n    translatedMessage(key: $key, namespace: $namespace)\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;