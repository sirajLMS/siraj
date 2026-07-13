const STUDENT_ID_DISPLAY_PREFIXES = ["SRJ-", "STU-"] as const;

export function formatStudentDisplayId(studentId: string): string {
  for (const prefix of STUDENT_ID_DISPLAY_PREFIXES) {
    if (studentId.startsWith(prefix)) {
      return studentId.slice(prefix.length);
    }
  }
  return studentId;
}
