import { StudentStatus } from "@/backend/enum";
import { parseAppLanguage, parseGender, parseStudentStatus } from "@/backend/lib/enum";
import type { StudentReturnType, StudentSelectType } from "@/backend/types";

export namespace StudentUtils {
  export const validateName = async (name: string, _locale?: string): Promise<string | null> => {
    if (name.length < 3 || name.length > 255) {
      return "studentNameLength";
    }
    return null;
  };

  export const mapEntityToDto = (entity: StudentSelectType | null | undefined): StudentReturnType | null => {
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
