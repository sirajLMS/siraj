import { getBackendTranslations } from "@/backend/lib/intl";
import type { AppLanguage, Gender, StudentStatus } from "@/shared/lib/enum";
import type { Student, StudentEntity } from "../types";

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
      gender: entity.gender ? (entity.gender as Gender) : null,
      language: entity.language ? (entity.language as AppLanguage) : null,
      status: entity.status as StudentStatus,
      hoursPerWeek: entity.hoursPerWeek ? Number.parseFloat(entity.hoursPerWeek) : 0,
    };
  };
}
