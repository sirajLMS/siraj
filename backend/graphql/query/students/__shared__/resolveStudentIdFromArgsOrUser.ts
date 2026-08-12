import { StudentRepository } from "@/backend/db/repo/students/student.repository";
import type { BaseContext } from "@/backend/graphql/gqlContext";

type ErrorsTranslations = ReturnType<BaseContext["t"]>["errorsTranslations"];

/**
 * Resolves a student ID from GraphQL query args, falling back to the
 * authenticated user's associated student ID when no explicit studentId arg
 * is provided. Throws if the user is unauthenticated or has no student record.
 *
 * Used by student-history.query.ts and student-profile.query.ts.
 */
export async function resolveStudentIdFromArgsOrUser(
  argsStudentId: string | null | undefined,
  ctx: BaseContext
): Promise<string> {
  const tErrors: ErrorsTranslations = ctx.t().errorsTranslations;
  if (!ctx.user) {
    throw new Error(tErrors.unauthorized);
  }
  let studentId = argsStudentId;
  if (!studentId) {
    studentId = await StudentRepository.getStudentIdByUserId(ctx.user.id);
    if (!studentId) {
      throw new Error(tErrors.studentNotFound(ctx.user.id));
    }
  }
  return studentId;
}
