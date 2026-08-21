import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ParentAssignedStudentsQuery,
  ParentHandbookUrlQuery,
  ParentOwnProfileQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const parentAssignedStudentsQueryDocument: TypedDocumentNode<ParentAssignedStudentsQuery> = gql`
  query parentAssignedStudents {
    parentAssignedStudents {
      id
      totalCount
      rows {
        id
        name
        studentAvatarUrl
        status
        teacherName
        hoursPerWeek
        classesRemaining
        classesTotal
      }
    }
  }
`;

export const parentOwnProfileQueryDocument: TypedDocumentNode<ParentOwnProfileQuery> = gql`
  query parentOwnProfile {
    parentOwnProfile {
      id
      name
      email
      phone
      facebook
      whatsapp
      twitter
    }
  }
`;

export const parentHandbookUrlQueryDocument: TypedDocumentNode<ParentHandbookUrlQuery> = gql`
  query parentHandbookUrl {
    parentHandbookUrl {
      id
      url
    }
  }
`;
