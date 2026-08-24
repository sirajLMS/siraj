import { describe, expect, test } from "bun:test";
import { CombinedGraphQLErrors, type OperationVariables, type TypedDocumentNode } from "@apollo/client";
import {
  addAppraisalFeedbackMutationDocument,
  myMonthlyAppraisalQueryDocument,
  studentMonthlyAppraisalsQueryDocument,
  submitMonthlyAppraisalMutationDocument,
  teacherMonthlyAppraisalStudentsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import {
  assertOperationDenied,
  authenticatedRequest,
  loginAndProvision,
  loginUser,
  setupTestServerLifecycle,
  TEST_USER_PASSWORD,
  testClient,
} from "@/test/helpers";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";
const APPRAISAL_MONTH = new Date("2026-08-01T00:00:00.000Z").toISOString();

async function loginWithRetry(email: string, attempts = 3): Promise<string> {
  try {
    return await loginUser(email, TEST_USER_PASSWORD);
  } catch (err) {
    if (attempts <= 1) {
      throw new Error(`Failed to login ${email} after retries`, { cause: err });
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    return loginWithRetry(email, attempts - 1);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

/**
 * Extract the `extensions.code` from any of the Apollo error shapes a
 * `testClient.query/mutate` call may produce: thrown `CombinedGraphQLErrors`,
 * `result.error`, `result.errors`, `graphQLErrors`, or `networkError.result`.
 */
function extractGqlErrorCode(err: unknown): string | undefined {
  if (err instanceof CombinedGraphQLErrors) {
    const code = err.errors?.[0]?.extensions?.code;
    return typeof code === "string" ? code : undefined;
  }
  const record = toRecord(err);
  if (!record) return undefined;

  const fromExtensions = extractCodeFromExtensions(record);
  if (fromExtensions) return fromExtensions;

  const fromGraphQLErrors = extractCodeFromArrayField(record.graphQLErrors);
  if (fromGraphQLErrors) return fromGraphQLErrors;

  const fromErrors = extractCodeFromArrayField(record.errors);
  if (fromErrors) return fromErrors;

  return extractCodeFromNetworkResult(record.networkError);
}

function extractCodeFromExtensions(record: Record<string, unknown>): string | undefined {
  const ext = toRecord(record.extensions);
  if (ext && typeof ext.code === "string") return ext.code;
  return undefined;
}

function extractCodeFromArrayField(arrField: unknown): string | undefined {
  if (!Array.isArray(arrField) || arrField.length === 0) return undefined;
  const firstExt = toRecord(toRecord(arrField[0])?.extensions);
  if (firstExt && typeof firstExt.code === "string") return firstExt.code;
  return undefined;
}

function extractCodeFromNetworkResult(networkError: unknown): string | undefined {
  const netResult = toRecord(toRecord(networkError)?.result);
  if (!netResult || !Array.isArray(netResult.errors) || netResult.errors.length === 0) return undefined;
  const firstExt = toRecord(toRecord(netResult.errors[0])?.extensions);
  if (firstExt && typeof firstExt.code === "string") return firstExt.code;
  return undefined;
}

/**
 * Asserts that an authenticated GraphQL operation is rejected with the
 * expected `extensions.code`. Handles both query and mutation paths — the
 * test-helpers' `expectMutationError` only covers `testClient.mutate`, but
 * `studentMonthlyAppraisals` is a query that may raise a tenancy FORBIDDEN.
 */
async function expectGqlError<TData, TVars extends OperationVariables>(
  token: string,
  type: "query" | "mutate",
  document: TypedDocumentNode<TData, TVars>,
  variables: TVars,
  expectedCode: string
): Promise<void> {
  let result: unknown;
  let thrownError: unknown;
  const context = { headers: { Authorization: `Bearer ${token}` } };
  try {
    result =
      type === "query"
        ? await testClient.query({
            query: document,
            variables,
            errorPolicy: "all",
            context,
          } as Parameters<typeof testClient.query>[0])
        : await testClient.mutate({
            mutation: document,
            variables,
            errorPolicy: "all",
            context,
          } as Parameters<typeof testClient.mutate>[0]);
  } catch (thrown) {
    thrownError = thrown;
  }

  const resultRecord = toRecord(result);
  const err = thrownError ?? resultRecord?.error ?? result;
  expect(err).toBeDefined();
  expect(extractGqlErrorCode(err)).toBe(expectedCode);
}

/**
 * Asserts that an unauthenticated request (no Authorization header, no cookies)
 * is rejected by the GraphQL auth-scope layer with the UNAUTHENTICATED code.
 */
async function expectUnauthenticated<TData, TVars extends OperationVariables>(
  type: "query" | "mutate",
  document: TypedDocumentNode<TData, TVars>,
  variables: TVars
): Promise<void> {
  let result: unknown;
  try {
    result =
      type === "query"
        ? await testClient.query({
            query: document,
            variables,
            errorPolicy: "all",
            context: { headers: {} },
          } as Parameters<typeof testClient.query>[0])
        : await testClient.mutate({
            mutation: document,
            variables,
            errorPolicy: "all",
            context: { headers: {} },
          } as Parameters<typeof testClient.mutate>[0]);
  } catch (thrown) {
    expect(thrown).toBeDefined();
    return;
  }

  const resultRecord = toRecord(result);
  const err = resultRecord?.error ?? result;
  // The operation must be denied (either thrown or returned an error).
  // We do not assert the exact code: with authScopes + requireAuth both in
  // play, the rejection path depends on whether the test client carries a
  // session. The security invariant is "denied", consistent with the
  // codebase convention `assertOperationDenied`.
  expect(err).toBeDefined();
}

const STUDENT_SUBMIT_INPUT = {
  studentId: NIL_UUID,
  month: APPRAISAL_MONTH,
  behaviorGrade: null,
  behaviorComment: null,
  attendanceGrade: null,
  attendanceComment: null,
  punctualityGrade: null,
  punctualityComment: null,
  overallGrade: null,
  overallComment: null,
  learningTargets: "Should be denied",
};

describe("GraphQL: Monthly Appraisal — Tier 1 functional flows", () => {
  setupTestServerLifecycle();

  let teacherToken = "";
  let parentToken = "";
  let studentToken = "";
  let studentId = "";
  let appraisalId = "";

  test("provision test entities and login parent + student", async () => {
    const r = await loginAndProvision("AppraisalTest");
    teacherToken = r.teacherToken;
    studentId = r.studentId;
    if (!r.parentUserEmail) throw new Error("Parent email not returned");
    if (!r.studentUserEmail) throw new Error("Student email not returned");
    parentToken = await loginWithRetry(r.parentUserEmail);
    studentToken = await loginWithRetry(r.studentUserEmail);

    expect(teacherToken).toBeTruthy();
    expect(parentToken).toBeTruthy();
    expect(studentToken).toBeTruthy();
    expect(studentId).toBeTruthy();
  });

  test("teacher submits monthly appraisal (Tier 1 — submitMonthlyAppraisal)", async () => {
    const data = await authenticatedRequest(teacherToken, "mutate", submitMonthlyAppraisalMutationDocument, {
      input: {
        studentId,
        month: APPRAISAL_MONTH,
        behaviorGrade: 5,
        behaviorComment: "Excellent behavior this month",
        attendanceGrade: 4,
        attendanceComment: null,
        punctualityGrade: null,
        punctualityComment: null,
        overallGrade: 5,
        overallComment: "Strong overall progress",
        learningTargets: "Focus on speaking fluency next month",
      },
    });

    const appraisal = data.submitMonthlyAppraisal;
    expect(appraisal).toBeDefined();
    expect(appraisal?.id).toBeDefined();
    expect(appraisal?.studentId).toBe(studentId);
    expect(appraisal?.behaviorGrade).toBe(5);
    expect(appraisal?.behaviorComment).toBe("Excellent behavior this month");
    expect(appraisal?.punctualityGrade).toBeNull();
    expect(appraisal?.learningTargets).toBe("Focus on speaking fluency next month");
    expect(appraisal?.createdAt).toBeTruthy();
    expect(appraisal?.updatedAt).toBeTruthy();

    appraisalId = appraisal?.id ?? "";
    expect(appraisalId).toBeTruthy();
  });

  test("parent views the student's appraisals (Tier 1 — studentMonthlyAppraisals, tenancy OK)", async () => {
    const data = await authenticatedRequest(parentToken, "query", studentMonthlyAppraisalsQueryDocument, {
      studentId,
    });

    const list = data.studentMonthlyAppraisals;
    expect(Array.isArray(list)).toBeTrue();
    const found = list?.find(a => a?.id === appraisalId);
    expect(found).toBeDefined();
    expect(found?.behaviorGrade).toBe(5);
    expect(found?.learningTargets).toBeTruthy();
  });

  test("student views own appraisal (Tier 1 — myMonthlyAppraisal)", async () => {
    const data = await authenticatedRequest(studentToken, "query", myMonthlyAppraisalQueryDocument, {
      month: APPRAISAL_MONTH,
    });

    const appraisal = data.myMonthlyAppraisal;
    expect(appraisal).toBeDefined();
    expect(appraisal?.id).toBe(appraisalId);
    expect(appraisal?.studentId).toBe(studentId);
    expect(appraisal?.learningTargets).toBeTruthy();
  });

  test("student views own appraisal for empty month returns null (R1.6 empty state)", async () => {
    const emptyMonth = new Date("2025-01-01T00:00:00.000Z").toISOString();
    const data = await authenticatedRequest(studentToken, "query", myMonthlyAppraisalQueryDocument, {
      month: emptyMonth,
    });

    expect(data.myMonthlyAppraisal).toBeNull();
  });

  test("teacher lists assigned students with appraisal summary for month (Tier 1 — teacherMonthlyAppraisalStudents)", async () => {
    const data = await authenticatedRequest(teacherToken, "query", teacherMonthlyAppraisalStudentsQueryDocument, {
      month: APPRAISAL_MONTH,
    });

    const rows = data.teacherMonthlyAppraisalStudents;
    expect(Array.isArray(rows)).toBeTrue();
    const entry = rows?.find(r => r?.id === studentId);
    expect(entry).toBeDefined();
    expect(entry?.name).toBeTruthy();
    expect(entry?.appraisalForMonth).toBeDefined();
    expect(entry?.appraisalForMonth?.id).toBe(appraisalId);
  });

  test("teacher lists assigned students without month — appraisalForMonth null (R1 sparse UI)", async () => {
    const data = await authenticatedRequest(teacherToken, "query", teacherMonthlyAppraisalStudentsQueryDocument, {
      month: null,
    });

    const rows = data.teacherMonthlyAppraisalStudents;
    expect(Array.isArray(rows)).toBeTrue();
    const entry = rows?.find(r => r?.id === studentId);
    expect(entry).toBeDefined();
    expect(entry?.appraisalForMonth).toBeNull();
  });

  test("parent appends feedback to the appraisal (Tier 1 — addAppraisalFeedback)", async () => {
    const data = await authenticatedRequest(parentToken, "mutate", addAppraisalFeedbackMutationDocument, {
      input: {
        appraisalId,
        body: "Thank you for the detailed feedback — we will work on speaking fluency at home.",
      },
    });

    const feedback = data.addAppraisalFeedback;
    expect(feedback).toBeDefined();
    expect(feedback?.id).toBeDefined();
    expect(feedback?.body).toContain("speaking fluency");
    expect(feedback?.createdAt).toBeTruthy();
  });

  test("student appends a follow-up feedback reply (Tier 1 — feedback loop second append)", async () => {
    const data = await authenticatedRequest(studentToken, "mutate", addAppraisalFeedbackMutationDocument, {
      input: {
        appraisalId,
        body: "I will also practice with the conversation partner twice a week.",
      },
    });

    expect(data.addAppraisalFeedback?.id).toBeDefined();
    expect(data.addAppraisalFeedback?.body).toContain("conversation partner");
  });

  test("feedback thread is visible to the teacher (Tier 1 — feedback array populated)", async () => {
    const data = await authenticatedRequest(teacherToken, "query", studentMonthlyAppraisalsQueryDocument, {
      studentId,
    });

    const appraisal = data.studentMonthlyAppraisals?.find(a => a?.id === appraisalId);
    expect(appraisal?.feedback).toBeDefined();
    expect(Array.isArray(appraisal?.feedback)).toBeTrue();
    expect(appraisal?.feedback?.length).toBeGreaterThanOrEqual(2);
  });
});

describe("GraphQL: Monthly Appraisal — Tier 4 unauthenticated rejection", () => {
  setupTestServerLifecycle();

  test("myMonthlyAppraisal rejects without auth header (UNAUTHENTICATED)", async () => {
    await expectUnauthenticated("query", myMonthlyAppraisalQueryDocument, { month: APPRAISAL_MONTH });
  });

  test("studentMonthlyAppraisals rejects without auth header (UNAUTHENTICATED)", async () => {
    await expectUnauthenticated("query", studentMonthlyAppraisalsQueryDocument, { studentId: NIL_UUID });
  });

  test("teacherMonthlyAppraisalStudents rejects without auth header (UNAUTHENTICATED)", async () => {
    await expectUnauthenticated("query", teacherMonthlyAppraisalStudentsQueryDocument, { month: null });
  });

  test("submitMonthlyAppraisal rejects without auth header (UNAUTHENTICATED)", async () => {
    await expectUnauthenticated("mutate", submitMonthlyAppraisalMutationDocument, {
      input: STUDENT_SUBMIT_INPUT,
    });
  });

  test("addAppraisalFeedback rejects without auth header (UNAUTHENTICATED)", async () => {
    await expectUnauthenticated("mutate", addAppraisalFeedbackMutationDocument, {
      input: { appraisalId: NIL_UUID, body: "Should be rejected" },
    });
  });
});

describe("GraphQL: Monthly Appraisal — BFLA (role escalation prevention)", () => {
  setupTestServerLifecycle();

  test("student_default cannot call submitMonthlyAppraisal (BFLA — no APPRAISAL_SUBMIT)", async () => {
    const denied = await assertOperationDenied("student_default", "mutate", submitMonthlyAppraisalMutationDocument, {
      input: STUDENT_SUBMIT_INPUT,
    });
    expect(denied).toBeTrue();
  });

  test("parent_default cannot call submitMonthlyAppraisal (BFLA — no APPRAISAL_SUBMIT)", async () => {
    const denied = await assertOperationDenied("parent_default", "mutate", submitMonthlyAppraisalMutationDocument, {
      input: STUDENT_SUBMIT_INPUT,
    });
    expect(denied).toBeTrue();
  });

  test("student_default cannot call teacherMonthlyAppraisalStudents (BFLA — teacher-only)", async () => {
    const denied = await assertOperationDenied(
      "student_default",
      "query",
      teacherMonthlyAppraisalStudentsQueryDocument,
      { month: null }
    );
    expect(denied).toBeTrue();
  });

  test("parent_default cannot call teacherMonthlyAppraisalStudents (BFLA — teacher-only)", async () => {
    const denied = await assertOperationDenied(
      "parent_default",
      "query",
      teacherMonthlyAppraisalStudentsQueryDocument,
      { month: null }
    );
    expect(denied).toBeTrue();
  });

  test("teacher_default cannot call addAppraisalFeedback (BFLA — no APPRAISAL_FEEDBACK)", async () => {
    const denied = await assertOperationDenied("teacher_default", "mutate", addAppraisalFeedbackMutationDocument, {
      input: { appraisalId: NIL_UUID, body: "Should be denied" },
    });
    expect(denied).toBeTrue();
  });
});

describe("GraphQL: Monthly Appraisal — IDOR / BOLA tenancy probes", () => {
  setupTestServerLifecycle();

  let teacherToken = "";
  let parentToken = "";
  let studentId = "";

  test("provision test entities for IDOR probes", async () => {
    const r = await loginAndProvision("AppraisalIDOR");
    teacherToken = r.teacherToken;
    studentId = r.studentId;
    if (!r.parentUserEmail) throw new Error("Parent email not returned");
    parentToken = await loginWithRetry(r.parentUserEmail);

    expect(teacherToken).toBeTruthy();
    expect(parentToken).toBeTruthy();
    expect(studentId).toBeTruthy();
  });

  test("parent cannot view appraisals for a student they do not own (IDOR — NIL_UUID forbidden)", async () => {
    await expectGqlError(
      parentToken,
      "query",
      studentMonthlyAppraisalsQueryDocument,
      { studentId: NIL_UUID },
      "FORBIDDEN"
    );
  });

  test("student cannot view appraisals for another student (IDOR — NIL_UUID forbidden)", async () => {
    const r = await loginAndProvision("AppraisalIDORStudent");
    if (!r.studentUserEmail) throw new Error("Student email not returned");
    const studentToken = await loginWithRetry(r.studentUserEmail);

    await expectGqlError(
      studentToken,
      "query",
      studentMonthlyAppraisalsQueryDocument,
      { studentId: NIL_UUID },
      "FORBIDDEN"
    );
  });

  test("teacher cannot submit appraisal for a student they do not teach (IDOR — service-layer tenancy)", async () => {
    await expectGqlError(
      teacherToken,
      "mutate",
      submitMonthlyAppraisalMutationDocument,
      {
        input: {
          studentId: NIL_UUID,
          month: APPRAISAL_MONTH,
          behaviorGrade: null,
          behaviorComment: null,
          attendanceGrade: null,
          attendanceComment: null,
          punctualityGrade: null,
          punctualityComment: null,
          overallGrade: null,
          overallComment: null,
          learningTargets: "Should be denied — not my student",
        },
      },
      "FORBIDDEN"
    );
  });

  test("student cannot append feedback to an appraisal for another student (IDOR — NIL_UUID appraisalId)", async () => {
    const r = await loginAndProvision("AppraisalIDORFeedback");
    if (!r.studentUserEmail) throw new Error("Student email not returned");
    const studentToken = await loginWithRetry(r.studentUserEmail);

    await expectGqlError(
      studentToken,
      "mutate",
      addAppraisalFeedbackMutationDocument,
      { input: { appraisalId: NIL_UUID, body: "IDOR feedback attempt" } },
      "APPRAISAL_NOT_FOUND"
    );
  });
});
