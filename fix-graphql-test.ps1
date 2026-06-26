$file = "C:\Users\PC\Projects\siraj\frontend\graphql\test\teacher.test.ts"
$content = [System.IO.File]::ReadAllText($file)

# Fix the queryTeacherDirectory function signature
$content = $content.Replace(
  'async function queryTeacherDirectory(
  token: string,
  search: string | null = null,
  limit: number | null = null,
  offset: number | null = null
) {
  const data = await authenticatedRequest(token, "query", teacherDirectoryQueryDocument, {
    search,
    limit,
    offset,
  });',
  'async function queryTeacherDirectory(
  token: string,
  search: string | null = null,
  paginationArgs: { first: number; page: number; skip: null; after: null; before: null; last: null; maxCount: null } | null = null
) {
  const data = await authenticatedRequest(token, "query", teacherDirectoryQueryDocument, {
    search,
    paginationArgs,
  });'
)

# Fix calls to queryTeacherDirectory
$content = $content.Replace(
  'const directory = await queryTeacherDirectory(authToken, null, 1, 0);',
  'const directory = await queryTeacherDirectory(authToken, null, { first: 1, page: 1, skip: null, after: null, before: null, last: null, maxCount: null });'
)
$content = $content.Replace(
  'const directory = await queryTeacherDirectory(authToken, null, null, null);',
  'const directory = await queryTeacherDirectory(authToken, null, null);'
)
$content = $content.Replace(
  'const directory = await queryTeacherDirectory(authToken, expectedTeacher.name, null, null);',
  'const directory = await queryTeacherDirectory(authToken, expectedTeacher.name, null);'
)

# Fix the unauthorized teacher test variables
$content = $content.Replace(
  '      variables: {
        search: null,
        limit: null,
        offset: null,
      },',
  '      variables: {
        search: null,
        paginationArgs: null,
      },'
)

[System.IO.File]::WriteAllText($file, $content, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done"
