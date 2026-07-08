import { TeacherNotesRepository } from "@/backend/db/repo/teacher-notes.repository";
import { AppPermission } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  TeacherImportantNoteReturnType,
  TeacherImportantNoteSubmitInput,
  TeacherImportantNoteUpdateInput,
} from "@/backend/types";

export namespace TeacherNotesService {
  export async function getActiveNotes(
    userId: string,
    teacherId?: string,
    locale?: string
  ): Promise<TeacherImportantNoteReturnType[]> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.NOTES_LIST);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }

    return await TeacherNotesRepository.getActiveNotes(teacherId);
  }

  export async function createNote(
    userId: string,
    input: TeacherImportantNoteSubmitInput,
    teacherId: string | null,
    locale?: string
  ): Promise<TeacherImportantNoteReturnType> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.NOTES_CREATE);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }

    return await TeacherNotesRepository.createNote({ ...input, createdByUserId: userId, teacherId }, locale);
  }

  export async function updateNote(
    userId: string,
    id: string,
    input: TeacherImportantNoteUpdateInput,
    locale?: string
  ): Promise<TeacherImportantNoteReturnType> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.NOTES_UPDATE);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }

    return await TeacherNotesRepository.updateNote(id, input, locale);
  }

  export async function deleteNote(userId: string, id: string, locale?: string): Promise<{ id: string }> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.NOTES_DELETE);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("unauthorizedAction"));
    }

    return await TeacherNotesRepository.deleteNote(id, locale);
  }
}
