import { TeacherRepository } from "@/backend/db/repo/teachers/teacher.repository";
import { logger } from "@/backend/lib/logger";
import { getServerTranslations } from "@/shared/locale";

export namespace TeacherService {
  export async function searchTeachers(userId: string | undefined, search: string, limit: number, locale?: string) {
    try {
      if (!userId) {
        logger.warn("Unauthorized access to searchTeachers - user not logged in");
        const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
        throw new Error(tFunc.unauthorized);
      }

      const teachers = await TeacherRepository.searchTeachers(search, limit);
      return teachers;
    } catch (error) {
      logger.error("Error searching teachers", { userId, search, limit, error });
      throw error;
    }
  }
}
