import logger from "@/backend/lib/logger";
import type {
  ClassInstanceEntity,
  ParentEntity,
  PermissionGroupEntity,
  RecurringScheduleEntity,
  StudentEntity,
  SystemSettingSelectType,
  TeacherEntity,
  TimezoneEntity,
  UserEntity,
} from "@/backend/types";
import { seedOrGet as seedOrGetClassInstances } from "./seed-class-instances";
import { seedOrGet as seedOrGetClasses } from "./seed-classes";
import { seedOrGet as seedOrGetParents } from "./seed-parents";
import { seedOrGet as seedOrGetPermissions } from "./seed-permissions";
import { seedOrGet as seedOrGetStudents } from "./seed-students";
import { seedOrGet as seedOrGetTeachers } from "./seed-teachers";
import { seedOrGet as seedOrGetUsers } from "./seed-users";
import { seedOrGet as seedOrGetSystemSettings } from "./system-settings";
import { seedOrGet as seedOrGetTimezones } from "./timezones";

export type SeedContext = {
  systemSettings?: SystemSettingSelectType[];
  timezones?: TimezoneEntity[];
  permissionGroups?: PermissionGroupEntity[];
  users?: UserEntity[];
  teachers?: TeacherEntity[];
  parents?: ParentEntity[];
  students?: StudentEntity[];
  classes?: RecurringScheduleEntity[];
  classInstances?: ClassInstanceEntity[];
};

export async function runAllSeeds(context: SeedContext = {}): Promise<SeedContext> {
  logger.log("Starting master seed process...");

  if (!context.systemSettings) {
    logger.log("Seeding system settings...");
    context.systemSettings = await seedOrGetSystemSettings();
  }

  if (!context.timezones) {
    logger.log("Seeding common timezones...");
    context.timezones = await seedOrGetTimezones();
  }

  if (!context.permissionGroups) {
    logger.log("Seeding permissions catalog and system permission groups...");
    context.permissionGroups = await seedOrGetPermissions();
  }

  if (!context.users) {
    logger.log("Seeding system users...");
    context.users = await seedOrGetUsers(context.permissionGroups);
  }

  if (!context.teachers) {
    logger.log("Seeding system teachers...");
    context.teachers = await seedOrGetTeachers(context.users, context.timezones);
  }

  if (!context.parents) {
    logger.log("Seeding system parents...");
    context.parents = await seedOrGetParents(context.users);
  }

  if (!context.students) {
    logger.log("Seeding system students...");
    context.students = await seedOrGetStudents(context.parents, context.teachers);
  }

  if (!context.classes) {
    logger.log("Seeding system classes...");
    context.classes = await seedOrGetClasses(context.teachers, context.students);
  }

  if (!context.classInstances) {
    logger.log("Seeding system class instances...");
    context.classInstances = await seedOrGetClassInstances(context.classes, context.teachers, context.students);
  }

  logger.log("Master seed process completed.");
  return context;
}
