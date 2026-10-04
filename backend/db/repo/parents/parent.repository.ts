import {
  changeLifecycleStatusImpl,
  createParentImpl,
  deactivateParentImpl,
  reactivateParentImpl,
  updateParentProfileImpl,
  upsertByUserIdImpl,
} from "@/backend/db/repo/parents/parent.repository.commands";
import {
  getParentDashboardMetricsImpl,
  getParentDashboardScheduleImpl,
} from "@/backend/db/repo/parents/parent.repository.dashboard";
import {
  findParentsDirectoryLiteImpl,
  getParentDirectoryImpl,
  getStudentsForParentImpl,
  getStudentsForParentsImpl,
} from "@/backend/db/repo/parents/parent.repository.directory";
import {
  findByUserIdImpl,
  findByUserIdsImpl,
  findUserIdByParentIdImpl,
  getParentProfileImpl,
  listByUserIdsImpl,
} from "@/backend/db/repo/parents/parent.repository.profile";
import {
  getAssociatedStudentByIdImpl,
  getAssociatedStudentsImpl,
  getParentStudentProgressImpl,
  getParentWorkshopPromoImpl,
} from "@/backend/db/repo/parents/parent.repository.students";

export namespace ParentRepository {
  export const create = createParentImpl;
  export const getParentDirectory = getParentDirectoryImpl;
  export const findParentsDirectoryLite = findParentsDirectoryLiteImpl;
  export const getStudentsForParent = getStudentsForParentImpl;
  export const getStudentsForParents = getStudentsForParentsImpl;
  export const getParentProfile = getParentProfileImpl;
  export const updateParentProfile = updateParentProfileImpl;
  export const findByUserId = findByUserIdImpl;
  export const listByUserIds = listByUserIdsImpl;
  export const findUserIdByParentId = findUserIdByParentIdImpl;
  export const findByUserIds = findByUserIdsImpl;
  export const deactivateParent = deactivateParentImpl;
  export const reactivateParent = reactivateParentImpl;
  export const changeLifecycleStatus = changeLifecycleStatusImpl;
  export const getAssociatedStudents = getAssociatedStudentsImpl;
  export const getAssociatedStudentById = getAssociatedStudentByIdImpl;
  export const getParentDashboardSchedule = getParentDashboardScheduleImpl;
  export const getParentDashboardMetrics = getParentDashboardMetricsImpl;
  export const getParentStudentProgress = getParentStudentProgressImpl;
  export const getParentWorkshopPromo = getParentWorkshopPromoImpl;
  export const upsertByUserId = upsertByUserIdImpl;
}
