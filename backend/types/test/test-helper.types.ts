export type TestEntitiesReturnType = {
  studentUserEmail: string;
  studentUserId: string;
  studentId: string;
  studentName: string;
  parentUserEmail: string;
  parentUserId: string;
  parentId: string;
  parentName: string;
  teacherUserEmail: string;
  teacherUserId: string;
  teacherId: string;
  teacherName: string;
};

export type TestEntitiesCleanupInput = {
  studentUserId: string;
  teacherUserId: string;
  parentUserId: string;
  studentId: string;
  teacherId: string;
  parentId: string;
};

export type TestGroupClassReturnType = {
  groupClassId: string;
};

export type TestSuperAdminReturnType = {
  userId: string;
  email: string;
};
