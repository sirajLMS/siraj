$file = "C:\Users\PC\Projects\siraj\backend\db\test\repo\teacher.repository.test.ts"
$content = [System.IO.File]::ReadAllText($file)

# Add PaginationArgs import
$content = $content.Replace(
  'import { TeacherRepository } from "@/backend/db/repo";',
  'import { PaginationArgs } from "@/backend/types";' + "`n" + 'import { TeacherRepository } from "@/backend/db/repo";'
)

# Fix direct directory calls - replace getTeacherDirectory(undefined, tx)
$content = $content.Replace(
  'const directory = await TeacherRepository.getTeacherDirectory(undefined, tx);',
  'const { rows: directory } = await TeacherRepository.getTeacherDirectory(null, undefined, tx);'
)

# Fix search by name call
$content = $content.Replace(
  'const nameSearchResult = await TeacherRepository.getTeacherDirectory({ search: "SearchName" }, tx);',
  'const nameSearchResult = await TeacherRepository.getTeacherDirectory(null, "SearchName", tx);'
)

# Fix search by email call
$content = $content.Replace(
  'const emailSearchResult = await TeacherRepository.getTeacherDirectory({ search: "searchemail@example.com" }, tx);',
  'const emailSearchResult = await TeacherRepository.getTeacherDirectory(null, "searchemail@example.com", tx);'
)

# Fix property access on search results (now .rows instead of direct array)
$content = $content.Replace('expect(nameSearchResult.length).toBe(1);', 'expect(nameSearchResult.rows.length).toBe(1);')
$content = $content.Replace('expect(nameSearchResult[0].id).toBe(t1.teacher.id);', 'expect(nameSearchResult.rows[0].id).toBe(t1.teacher.id);')
$content = $content.Replace('expect(emailSearchResult.length).toBe(1);', 'expect(emailSearchResult.rows.length).toBe(1);')
$content = $content.Replace('expect(emailSearchResult[0].id).toBe(t2.teacher.id);', 'expect(emailSearchResult.rows[0].id).toBe(t2.teacher.id);')

# Fix limit/offset test - replace with PaginationArgs test
$content = $content.Replace(
  'it("getTeacherDirectory supports limit and offset", async () => {
    await runInRollback(async tx => {
      await setupTeacher(tx, { name: "Teacher A" }, { status: "ACTIVATED" });
      await setupTeacher(tx, { name: "Teacher B" }, { status: "ACTIVATED" });
      await setupTeacher(tx, { name: "Teacher C" }, { status: "ACTIVATED" });

      const limited = await TeacherRepository.getTeacherDirectory({ limit: 1 }, tx);
      expect(limited.length).toBe(1);

      const offsetResult = await TeacherRepository.getTeacherDirectory({ limit: 1, offset: 1 }, tx);
      expect(offsetResult.length).toBe(1);
      expect(offsetResult[0].id).not.toBe(limited[0].id);
    });
  });',
  'it("getTeacherDirectory supports pagination via PaginationArgs", async () => {
    await runInRollback(async tx => {
      await setupTeacher(tx, { name: "Teacher A" }, { status: "ACTIVATED" });
      await setupTeacher(tx, { name: "Teacher B" }, { status: "ACTIVATED" });
      await setupTeacher(tx, { name: "Teacher C" }, { status: "ACTIVATED" });

      const firstPageArgs = new PaginationArgs({ first: 1, page: 1 });
      const limited = await TeacherRepository.getTeacherDirectory(firstPageArgs, undefined, tx);
      expect(limited.rows.length).toBe(1);

      const secondPageArgs = new PaginationArgs({ first: 1, page: 2 });
      const offsetResult = await TeacherRepository.getTeacherDirectory(secondPageArgs, undefined, tx);
      expect(offsetResult.rows.length).toBe(1);
      expect(offsetResult.rows[0].id).not.toBe(limited.rows[0].id);
    });
  });'
)

# Fix soft-deleted search calls
$content = $content.Replace(
  'const beforeDelete = await TeacherRepository.getTeacherDirectory({ search: "SoftDeleted" }, tx);',
  'const beforeDelete = await TeacherRepository.getTeacherDirectory(null, "SoftDeleted", tx);'
)
$content = $content.Replace('expect(beforeDelete.length).toBe(1);', 'expect(beforeDelete.rows.length).toBe(1);')
$content = $content.Replace(
  'const afterDelete = await TeacherRepository.getTeacherDirectory({ search: "SoftDeleted" }, tx);',
  'const afterDelete = await TeacherRepository.getTeacherDirectory(null, "SoftDeleted", tx);'
)
$content = $content.Replace('expect(afterDelete.length).toBe(0);', 'expect(afterDelete.rows.length).toBe(0);')

# Fix non-transactional fallback
$content = $content.Replace(
  'const directory = await TeacherRepository.getTeacherDirectory({ limit: 1 });',
  'const directory = await TeacherRepository.getTeacherDirectory(new PaginationArgs({ first: 1, page: 1 }));'
)
$content = $content.Replace('expect(directory.length).toBeGreaterThanOrEqual(0);', 'expect(directory.rows.length).toBeGreaterThanOrEqual(0);')

[System.IO.File]::WriteAllText($file, $content, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done"
