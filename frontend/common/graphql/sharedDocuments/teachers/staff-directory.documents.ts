import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ManagerDirectoryQuery,
  ManagerDirectoryQueryVariables,
  OnboardingMetricsQuery,
  StaffDirectoryQuery,
  StaffDirectoryQueryVariables,
  TeacherDirectoryQuery,
  TeacherDirectoryQueryVariables,
  UpdateManagerProfileMutation,
  UpdateManagerProfileMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const teacherDirectoryQueryDocument: TypedDocumentNode<TeacherDirectoryQuery, TeacherDirectoryQueryVariables> =
  gql`
  query teacherDirectory($search: String, $paginationArgs: PaginationArgs) {
    teacherDirectory(search: $search, paginationArgs: $paginationArgs) {
      id
      metrics {
        id
        activated
        deactivated
      }
      rows {
        id
        userId
        index
        name
        email
        avatarUrl
        status
      }
      totalTeachers
      pageInfo {
        count
        currentPage
        firstItem
        hasMorePages
        lastItem
        lastPage
        perPage
        total
      }
    }
  }
`;

export const managerDirectoryQueryDocument: TypedDocumentNode<ManagerDirectoryQuery, ManagerDirectoryQueryVariables> =
  gql`
  query managerDirectory($paginationArgs: PaginationArgs, $roleFilter: String, $statusFilter: String) {
    managerDirectory(paginationArgs: $paginationArgs, roleFilter: $roleFilter, statusFilter: $statusFilter) {
      id
      metrics {
        id
        totalAdmin
        systemStaff
        activeNow
        alerts
      }
      rows {
        id
        staffProfileId
        name
        email
        avatarUrl
        phone
        status
        roleSlug
        roleName
      }
      totalCount
      pageInfo {
        count
        currentPage
        firstItem
        hasMorePages
        lastItem
        lastPage
        perPage
        total
      }
    }
  }
`;

export const updateManagerProfileMutationDocument: TypedDocumentNode<
  UpdateManagerProfileMutation,
  UpdateManagerProfileMutationVariables
> = gql`
  mutation updateManagerProfile($staffProfileId: ID!, $input: UpdateManagerProfileInput!) {
    updateManagerProfile(staffProfileId: $staffProfileId, input: $input) {
      id
      staffProfileId
      name
      email
      avatarUrl
      phone
      status
      roleSlug
      roleName
    }
  }
`;

export const onboardingMetricsQueryDocument: TypedDocumentNode<OnboardingMetricsQuery> = gql`
  query onboardingMetrics {
    onboardingMetrics {
      id
      activeStaff
      pendingApproval
      avgOnboardingDays
    }
  }
`;

export const staffDirectoryAutocompleteRowFragment = gql`
  fragment StaffDirectoryAutocompleteRow on StaffDirectoryAutocompleteRow {
    id
    name
    avatarUrl
    email
  }
`;

export const staffDirectoryQueryDocument: TypedDocumentNode<StaffDirectoryQuery, StaffDirectoryQueryVariables> = gql`
  ${staffDirectoryAutocompleteRowFragment}
  query staffDirectory($search: String, $limit: Int, $permissionGroupFilter: String) {
    staffDirectory(search: $search, limit: $limit, permissionGroupFilter: $permissionGroupFilter) {
      ...StaffDirectoryAutocompleteRow
    }
  }
`;
