import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { TeacherNotesRepository } from "@/backend/db/repo/teachers/teacher-notes.repository";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  TeacherImportantNoteReturnType,
  TeacherImportantNoteSubmitInput,
  TeacherImportantNoteUpdateInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace TeacherNotesService {
  export async function getActiveNotes(
    userId: string,
    tErrors: ErrorsLabels,
    teacherId?: string
  ): Promise<TeacherImportantNoteReturnType[]> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.NOTES_LIST);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }

    return await TeacherNotesRepository.getActiveNotes(teacherId);
  }

  export async function createNote(
    userId: string,
    input: Omit<TeacherImportantNoteSubmitInput, "createdByUserId">,
    tErrors: ErrorsLabels,
    teacherIdOverride?: string | null
  ): Promise<TeacherImportantNoteReturnType> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.NOTES_CREATE);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }

    let teacherId = teacherIdOverride ?? null;
    if (!teacherId) {
      const teacher = await SchedulingRepository.getTeacherByUserId(userId);
      teacherId = teacher?.id ?? null;
    }

    return await TeacherNotesRepository.createNote({ ...input, createdByUserId: userId, teacherId });
  }

  export async function updateNote(
    userId: string,
    id: string,
    input: TeacherImportantNoteUpdateInput,
    tErrors: ErrorsLabels
  ): Promise<TeacherImportantNoteReturnType> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.NOTES_UPDATE);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }

    return await TeacherNotesRepository.updateNote(id, input);
  }

  export async function deleteNote(userId: string, id: string, tErrors: ErrorsLabels): Promise<{ id: string }> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.NOTES_DELETE);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }

    return await TeacherNotesRepository.deleteNote(id);
  }

  // ─── Bootstrap / Seeder Operations (no auth) ──────────────────────────────

  export async function findNotesByTitles(titles: readonly string[]): Promise<TeacherImportantNoteReturnType[]> {
    return TeacherNotesRepository.findByTitles(titles);
  }

  export async function createManyImportantNotes(
    inputs: readonly (TeacherImportantNoteSubmitInput & { createdByUserId: string; teacherId: string | null })[]
  ): Promise<TeacherImportantNoteReturnType[]> {
    return TeacherNotesRepository.createMany(inputs);
  }
}
