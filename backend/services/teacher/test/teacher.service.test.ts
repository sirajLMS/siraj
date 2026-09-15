import { describe, expect, spyOn, test } from "bun:test";
import { TeacherRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { ForbiddenError } from "@/backend/lib/errors";
import { TeacherService } from "@/backend/services/teacher/teacher.service";
import { errorsEn } from "@/shared/locale/en/errors";

const tErrors = errorsEn.errorsTranslations;

function permissionContext(
  overrides: Partial<{ permissions: AppPermission[]; isSuperAdmin: boolean }> = {}
): { permissions: AppPermission[]; isSuperAdmin: boolean } {
  return { permissions: [], isSuperAdmin: false, ...overrides };
}

describe("TeacherService.searchTeachers", () => {
  test("allows super admin with empty permissions", async () => {
    const stubTeachers = [{ id: "teacher-1", name: "Stub Teacher" }];
    const repoSpy = spyOn(TeacherRepository, "searchTeachers").mockResolvedValue(stubTeachers);

    const result = await TeacherService.searchTeachers(
      "user-1",
      "stub",
      10,
      "en",
      permissionContext({ isSuperAdmin: true })
    );

    expect(result).toEqual(stubTeachers);
    expect(repoSpy).toHaveBeenCalledTimes(1);

    repoSpy.mockRestore();
  });

  test("allows user holding TEACHERS_LIST", async () => {
    const repoSpy = spyOn(TeacherRepository, "searchTeachers").mockResolvedValue([]);

    await TeacherService.searchTeachers(
      "user-1",
      "stub",
      10,
      "en",
      permissionContext({ permissions: [AppPermission.TEACHERS_LIST] })
    );

    expect(repoSpy).toHaveBeenCalledTimes(1);

    repoSpy.mockRestore();
  });

  test("allows user holding STAFF_VIEW_DIRECTORY", async () => {
    const repoSpy = spyOn(TeacherRepository, "searchTeachers").mockResolvedValue([]);

    await TeacherService.searchTeachers(
      "user-1",
      "stub",
      10,
      "en",
      permissionContext({ permissions: [AppPermission.STAFF_VIEW_DIRECTORY] })
    );

    expect(repoSpy).toHaveBeenCalledTimes(1);

    repoSpy.mockRestore();
  });

  test("denies plain parent with no permissions and skips the repository", async () => {
    const repoSpy = spyOn(TeacherRepository, "searchTeachers");

    let error: unknown = null;
    try {
      await TeacherService.searchTeachers("user-1", "stub", 10, "en", permissionContext());
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    expect(error).toBeInstanceOf(ForbiddenError);
    if (!(error instanceof ForbiddenError)) throw new Error(String(error));
    expect(error.message).toContain(tErrors.insufficientPermissions);
    expect(repoSpy).not.toHaveBeenCalled();

    repoSpy.mockRestore();
  });
});
