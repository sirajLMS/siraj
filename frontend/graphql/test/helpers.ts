import { demoLoginMutationDocument } from "../sharedDocuments/auth.documents";
import { dailyScheduleListQueryDocument } from "../sharedDocuments/schedule.documents";
import { testClient } from "./testClient";

/**
 * Logs in a demo user using their group slug and returns the auth token.
 */
export async function loginDemoUser(groupSlug: string): Promise<string> {
  const result = await testClient.mutate({
    mutation: demoLoginMutationDocument,
    variables: {
      input: {
        groupSlug,
      },
    },
  });
  const token = result.data?.demoLogin?.token;
  if (!token) {
    throw new Error(`Failed to login demo user: ${groupSlug}`);
  }
  return token;
}

/**
 * Fetches the daily schedule list and returns the first student and teacher ID pair.
 */
export async function fetchFirstStudentTeacherPair(
  adminToken: string,
  date: string
): Promise<{ studentId: string; teacherId: string }> {
  const result = await testClient.query({
    query: dailyScheduleListQueryDocument,
    variables: {
      date,
      teacherId: null,
      search: null,
    },
    context: {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    },
  });

  const list = result.data?.dailyScheduleList;
  if (!Array.isArray(list)) {
    throw new TypeError("No daily schedule list returned");
  }

  const found = list.find(item => item?.student?.id && item?.teacher?.id);
  if (!found?.student?.id || !found?.teacher?.id) {
    throw new Error("Could not find matching student/teacher pair");
  }

  return {
    studentId: found.student.id,
    teacherId: found.teacher.id,
  };
}
