import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  AddAppraisalFeedbackMutation,
  AddAppraisalFeedbackMutationVariables,
  MyMonthlyAppraisalQuery,
  MyMonthlyAppraisalQueryVariables,
  StudentAppraisalDetailForFormQuery,
  StudentAppraisalDetailForFormQueryVariables,
  StudentMonthlyAppraisalsQuery,
  StudentMonthlyAppraisalsQueryVariables,
  SubmitMonthlyAppraisalMutation,
  SubmitMonthlyAppraisalMutationVariables,
  TeacherMonthlyAppraisalStudentsQuery,
  TeacherMonthlyAppraisalStudentsQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

// ─── Query: studentAppraisalDetailForForm ───────────────────────────────────

export const studentAppraisalDetailForFormQueryDocument: TypedDocumentNode<
  StudentAppraisalDetailForFormQuery,
  StudentAppraisalDetailForFormQueryVariables
> = gql`
  query StudentAppraisalDetailForForm($studentId: String!) {
    studentMonthlyAppraisals(studentId: $studentId) {
      id
      behaviorGrade
      behaviorComment
      attendanceGrade
      attendanceComment
      punctualityGrade
      punctualityComment
      overallGrade
      overallComment
      learningTargets
    }
  }
`;

// ─── Query: myMonthlyAppraisal ──────────────────────────────────────────────

export const myMonthlyAppraisalQueryDocument: TypedDocumentNode<
  MyMonthlyAppraisalQuery,
  MyMonthlyAppraisalQueryVariables
> = gql`
  query MyMonthlyAppraisal($month: DateTime!) {
    myMonthlyAppraisal(month: $month) {
      id
      studentId
      teacherId
      month
      behaviorGrade
      behaviorComment
      attendanceGrade
      attendanceComment
      punctualityGrade
      punctualityComment
      overallGrade
      overallComment
      learningTargets
      feedback {
        id
        body
        authorName
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

// ─── Query: studentMonthlyAppraisals ────────────────────────────────────────

export const studentMonthlyAppraisalsQueryDocument: TypedDocumentNode<
  StudentMonthlyAppraisalsQuery,
  StudentMonthlyAppraisalsQueryVariables
> = gql`
  query StudentMonthlyAppraisals($studentId: String!) {
    studentMonthlyAppraisals(studentId: $studentId) {
      id
      studentId
      teacherId
      month
      behaviorGrade
      behaviorComment
      attendanceGrade
      attendanceComment
      punctualityGrade
      punctualityComment
      overallGrade
      overallComment
      learningTargets
      feedback {
        id
        body
        authorName
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

// ─── Query: teacherMonthlyAppraisalStudents ─────────────────────────────────

export const teacherMonthlyAppraisalStudentsQueryDocument: TypedDocumentNode<
  TeacherMonthlyAppraisalStudentsQuery,
  TeacherMonthlyAppraisalStudentsQueryVariables
> = gql`
  query TeacherMonthlyAppraisalStudents($month: DateTime) {
    teacherMonthlyAppraisalStudents(month: $month) {
      id
      name
      studentAvatarUrl
      appraisalForMonth {
        id
        month
        updatedAt
      }
    }
  }
`;

// ─── Mutation: submitMonthlyAppraisal ───────────────────────────────────────

export const submitMonthlyAppraisalMutationDocument: TypedDocumentNode<
  SubmitMonthlyAppraisalMutation,
  SubmitMonthlyAppraisalMutationVariables
> = gql`
  mutation SubmitMonthlyAppraisal($input: SubmitMonthlyAppraisalInput!) {
    submitMonthlyAppraisal(input: $input) {
      id
      studentId
      teacherId
      month
      behaviorGrade
      behaviorComment
      attendanceGrade
      attendanceComment
      punctualityGrade
      punctualityComment
      overallGrade
      overallComment
      learningTargets
      feedback {
        id
        body
        authorName
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

// ─── Mutation: addAppraisalFeedback ─────────────────────────────────────────

export const addAppraisalFeedbackMutationDocument: TypedDocumentNode<
  AddAppraisalFeedbackMutation,
  AddAppraisalFeedbackMutationVariables
> = gql`
  mutation AddAppraisalFeedback($input: AddAppraisalFeedbackInput!) {
    addAppraisalFeedback(input: $input) {
      id
      body
      authorName
      createdAt
    }
  }
`;
