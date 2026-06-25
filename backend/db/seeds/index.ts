import { db } from "@/backend/db/drizzleDb";
import { permissionGroups as permissionGroupsSchema } from "@/backend/db/schema";
import logger from "@/backend/lib/logger";
import type {
  ClassInstanceEntity,
  ParentEntity,
  PermissionGroupEntity,
  RecurringScheduleDayEntity,
  RecurringScheduleEntity,
  StudentEntity,
  SystemSettingSelectType,
  TeacherEntity,
  TimezoneEntity,
  UserEntity,
} from "@/backend/types";
import { loadSeedConfig, type SeedConfig } from "./lib";
import { seedOrGet as seedOrGetClassInstances } from "./seed-class-instances";
import { seedOrGet as seedOrGetClassPerformance } from "./seed-class-performance";
import { seedOrGet as seedOrGetClassStatusEvents } from "./seed-class-status-events";
import { seedOrGet as seedOrGetClasses } from "./seed-classes";
import { seedOrGet as seedOrGetParents } from "./seed-parents";
import { seedOrGet as seedOrGetRecurringScheduleDays } from "./seed-recurring-schedule-days";
import { seedOrGet as seedOrGetStudents } from "./seed-students";
import { seedOrGet as seedOrGetTeachers } from "./seed-teachers";
import { seedOrGet as seedOrGetUsers } from "./seed-users";
import { seedOrGet as seedOrGetSystemSettings } from "./system-settings";
import { seedOrGet as seedOrGetTimezones } from "./timezones";

export type SeedContext = {
  config?: SeedConfig;
  systemSettings?: SystemSettingSelectType[];
  timezones?: TimezoneEntity[];
  permissionGroups?: PermissionGroupEntity[];
  users?: UserEntity[];
  teachers?: TeacherEntity[];
  parents?: ParentEntity[];
  students?: StudentEntity[];
  classes?: RecurringScheduleEntity[];
  recurringScheduleDays?: RecurringScheduleDayEntity[];
  classInstances?: ClassInstanceEntity[];
};

export async function runAllSeeds(context: SeedContext = {}): Promise<SeedContext> {
  logger.log("Starting master seed process...");

  if (!context.config) {
    context.config = loadSeedConfig();
    logger.log(`Seed profile: ${context.config.profile} (anchor: ${context.config.anchorDate.toISOString()})`);
  }

  const config = context.config;

  if (!context.systemSettings) {
    logger.log("Seeding system settings...");
    context.systemSettings = await seedOrGetSystemSettings();
  }

  if (!context.timezones) {
    logger.log("Seeding common timezones...");
    context.timezones = await seedOrGetTimezones();
  }

  if (!context.permissionGroups) {
    logger.log("Fetching system permission groups...");
    context.permissionGroups = await db.select().from(permissionGroupsSchema);
  }

  if (!context.users) {
    logger.log("Seeding system users...");
    context.users = await seedOrGetUsers(context.permissionGroups, config);
  }

  if (!context.teachers) {
    logger.log("Seeding system teachers...");
    context.teachers = await seedOrGetTeachers(context.users, context.timezones, config);
  }

  if (!context.parents) {
    logger.log("Seeding system parents...");
    context.parents = await seedOrGetParents(context.users, config);
  }

  if (!context.students) {
    logger.log("Seeding system students...");
    context.students = await seedOrGetStudents(context.parents, context.teachers, config);
  }

  if (!context.classes) {
    logger.log("Seeding system classes...");
    context.classes = await seedOrGetClasses(context.teachers, context.students, config);
  }

  if (!context.recurringScheduleDays) {
    logger.log("Seeding recurring schedule days...");
    context.recurringScheduleDays = await seedOrGetRecurringScheduleDays(context.classes, config);
  }

  if (!context.classInstances) {
    logger.log("Seeding system class instances...");
    context.classInstances = await seedOrGetClassInstances(context.classes, context.teachers, context.students, config);
  }

  logger.log("Seeding class performance and status events...");
  await seedOrGetClassPerformance(context.classInstances, config);
  await seedOrGetClassStatusEvents(context.classInstances, context.teachers, config);

  logger.log("Master seed process completed.");
  return context;
}
