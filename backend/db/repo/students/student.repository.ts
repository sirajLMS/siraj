import {
  addStudentClasses,
  addStudentCreditHours,
  changeStudentStatus,
  deductStudentClasses,
  deductStudentCreditHours,
  reassignStudentTeacher,
  setStudentClassesRemaining,
} from "@/backend/db/repo/students/student.repository.credit";
import {
  fetchStudentCreditHourBalance,
  fetchStudentDirectoryRows,
  fetchStudentsAssignedToTeacher,
  fetchStudentsWithFilters,
  findActiveStudentById,
  findStudentById,
  findStudentIdByUserId,
  findStudentIdsByParentOrTeacher,
  findStudentProfileById,
  findStudentsByIdempotencyKeys,
  hasStudentTeacherAssignment,
  loadStudentsByIds,
} from "@/backend/db/repo/students/student.repository.reads";
import {
  createStudent,
  createStudentTeacherAssignment,
  deleteStudentById,
  ensureStudentTeacherAssignment,
  partiallyUpdateStudent,
  recalcStudentHoursPerWeekIfSqlite,
  scrubStudentForAnonymization,
  upsertStudentByIdempotencyKey,
} from "@/backend/db/repo/students/student.repository.writes";

export namespace StudentRepository {
  export const findById = findStudentById;
  export const findActiveById = findActiveStudentById;
  export const getStudentIdByUserId = findStudentIdByUserId;
  export const create = createStudent;
  export const createTeacherAssignment = createStudentTeacherAssignment;
  export const loadByIds = loadStudentsByIds;
  export const deleteById = deleteStudentById;
  export const partiallyUpdate = partiallyUpdateStudent;
  export const fetchWithFilters = fetchStudentsWithFilters;
  export const deductClasses = deductStudentClasses;
  export const addClasses = addStudentClasses;
  export const addCreditHours = addStudentCreditHours;
  export const deductCreditHours = deductStudentCreditHours;
  export const getCreditHourBalance = fetchStudentCreditHourBalance;
  export const setClassesRemaining = setStudentClassesRemaining;
  export const reassignTeacher = reassignStudentTeacher;
  export const recalcHoursPerWeekIfSqlite = recalcStudentHoursPerWeekIfSqlite;
  export const changeStatus = changeStudentStatus;
  export const getDirectoryRows = fetchStudentDirectoryRows;
  export const getAssignedToTeacher = fetchStudentsAssignedToTeacher;
  export const findByIdempotencyKeys = findStudentsByIdempotencyKeys;
  export const upsertByIdempotencyKey = upsertStudentByIdempotencyKey;
  export const hasTeacherAssignment = hasStudentTeacherAssignment;
  export const ensureTeacherAssignment = ensureStudentTeacherAssignment;
  export const findProfileById = findStudentProfileById;
  export const findIdsByParentOrTeacher = findStudentIdsByParentOrTeacher;
  export const scrubForAnonymization = scrubStudentForAnonymization;
}
