import type { BaseContext } from "@/backend/graphql/gqlContext";
import { StudentManagementService } from "@/backend/services";

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
    studentId = await StudentManagementService.getStudentIdByUserId(ctx.user.id);
    if (!studentId) {
      throw new Error(tErrors.studentNotFound(ctx.user.id));
    }
  }
  return studentId;
}
