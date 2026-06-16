import type { AppLanguage, Gender, StudentStatus } from "@/shared/lib/enum";
import type { StudentDto, StudentEntity } from "../types";

export namespace StudentUtils {
  export const validateName = (name: string): Promise<string | null> => {
    if (name.length < 3 || name.length > 255) {
      return Promise.resolve("Student name must be between 3 and 255 characters long.");
    }
    return Promise.resolve(null);
  };

  export const mapEntityToDto = (entity: StudentEntity | null | undefined): StudentDto | null => {
    if (!entity) {
      return null;
    }
    return {
      id: entity.id,
      parentId: entity.parentId,
      primaryTeacherId: entity.primaryTeacherId,
      name: entity.name,
      dateOfBirth: entity.dateOfBirth,
      gender: entity.gender ? (entity.gender as Gender) : null,
      language: entity.language ? (entity.language as AppLanguage) : null,
      status: entity.status as StudentStatus,
      classesTotal: entity.classesTotal,
      classesRemaining: entity.classesRemaining,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  };
}
