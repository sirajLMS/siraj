import { TeacherRepository } from "@/backend/db/repo/teacher.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";

export namespace TeacherService {
  export async function searchTeachers(
    userId: string | undefined,
    search: string,
    limit: number,
    locale?: string
  ) {
    try {
      if (!userId) {
        logger.error("Unauthorized access to searchTeachers - user not logged in");
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }

      const teachers = await TeacherRepository.searchTeachers(search, limit);
      return teachers;
    } catch (error) {
      logger.error("Error searching teachers", { userId, search, limit, error });
      throw error;
    }
  }
}
