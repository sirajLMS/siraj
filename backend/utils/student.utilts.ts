import { StudentStatus } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { parseAppLanguage, parseGender, parseStudentStatus } from "@/backend/lib/enum";
import type { Student, StudentEntity } from "@/backend/types";

export namespace StudentUtils {
  export const validateName = async (name: string, locale?: string): Promise<string | null> => {
    if (name.length < 3 || name.length > 255) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      return t("studentNameLength");
    }
    return null;
  };

  export const mapEntityToDto = (entity: StudentEntity | null | undefined): Student | null => {
    if (!entity) {
      return null;
    }
    return {
      ...entity,
      gender: parseGender(entity.gender),
      language: parseAppLanguage(entity.language),
      status: parseStudentStatus(entity.status) ?? StudentStatus.REGULAR,
      hoursPerWeek: entity.hoursPerWeek ? Number.parseFloat(entity.hoursPerWeek) : 0,
    };
  };
}
