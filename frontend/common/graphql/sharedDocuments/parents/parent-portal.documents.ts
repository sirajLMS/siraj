import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const parentAssignedStudentsQueryDocument: TypedDocumentNode<Operations.ParentAssignedStudentsQuery> = gql`
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

export const parentOwnProfileQueryDocument: TypedDocumentNode<Operations.ParentOwnProfileQuery> = gql`
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

export const parentHandbookUrlQueryDocument: TypedDocumentNode<Operations.ParentHandbookUrlQuery> = gql`
  query parentHandbookUrl {
    parentHandbookUrl {
      id
      url
    }
  }
`;
