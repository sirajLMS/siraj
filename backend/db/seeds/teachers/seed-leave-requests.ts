import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { leaveRequests } from "@/backend/db/schema/classes/scheduling";
import {
  ALL_LEAVE_REQUESTER_TYPES,
  cycleAtIndex,
  findAdminUser,
  getFakerForIndex,
  loadSeedConfig,
  type SeedConfig,
  startOfDay,
} from "@/backend/db/seeds/lib";
import { ClassOutcome, LeaveRequesterType, LeaveRequestStatus } from "@/backend/enum";
import logger from "@/backend/lib/logger";
import type { ClassInstanceEntity, ParentEntity, StudentEntity, TeacherEntity, UserSelectType } from "@/backend/types";

function resolveRequesterUserId(
  requesterType: LeaveRequesterType,
  instance: ClassInstanceEntity,
  teacherUserMap: Map<string, string>,
  studentParentUserMap: Map<string, string>,
  adminUserId: string | undefined
): string | undefined {
  if (requesterType === LeaveRequesterType.ADMIN) {
    return adminUserId;
  }
  if (requesterType === LeaveRequesterType.PARENT) {
    return studentParentUserMap.get(instance.studentId);
  }
  return teacherUserMap.get(instance.teacherId);
}

async function upsertLeaveRequest(
  instance: ClassInstanceEntity,
  values: {
    requestedByUserId: string;
    requesterType: LeaveRequesterType;
    reason: string;
    status: LeaveRequestStatus;
    createdAt: Date;
    processedAt: Date | null;
    processedByUserId: string | null;
  }
) {
  const [existing] = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.classInstanceId, instance.id))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [inserted] = await db
    .insert(leaveRequests)
    .values({
      classInstanceId: instance.id,
      ...values,
    })
    .returning();

  return inserted;
}

type LeaveRequestContext = {
  teacherUserMap: Map<string, string>;
  studentParentUserMap: Map<string, string>;
  adminUserId: string | undefined;
  fakerSeed: number;
};

async function seedApprovedLeaves(leaveInstances: ClassInstanceEntity[], maxLeaves: number, ctx: LeaveRequestContext) {
  const results = [];
  for (let i = 0; i < maxLeaves; i++) {
    const instance = leaveInstances[i];
    const requesterType = cycleAtIndex(ALL_LEAVE_REQUESTER_TYPES, i);
    const actorUserId = resolveRequesterUserId(
      requesterType,
      instance,
      ctx.teacherUserMap,
      ctx.studentParentUserMap,
      ctx.adminUserId
    );
    if (!actorUserId) continue;

    const faker = getFakerForIndex(ctx.fakerSeed, instance.id.length);
    const inserted = await upsertLeaveRequest(instance, {
      requestedByUserId: actorUserId,
      requesterType,
      reason: faker.lorem.sentence(),
      status: LeaveRequestStatus.APPROVED,
      createdAt: instance.scheduledStartAt,
      processedAt: instance.scheduledEndAt,
      processedByUserId: ctx.adminUserId ?? null,
    });
    results.push(inserted);
  }
  return results;
}

async function seedSupplementalLeaves(
  pendingFutureInstances: ClassInstanceEntity[],
  supplementalCount: number,
  offsetIndex: number,
  ctx: LeaveRequestContext
) {
  const supplementalStatuses = [
    LeaveRequestStatus.PENDING,
    LeaveRequestStatus.RESCHEDULED,
    LeaveRequestStatus.CANCELLED,
  ] as const;
  const results = [];
  for (let i = 0; i < supplementalCount; i++) {
    const instance = pendingFutureInstances[i];
    const status = supplementalStatuses[i];
    const requesterType = cycleAtIndex(ALL_LEAVE_REQUESTER_TYPES, offsetIndex + i);
    const actorUserId = resolveRequesterUserId(
      requesterType,
      instance,
      ctx.teacherUserMap,
      ctx.studentParentUserMap,
      ctx.adminUserId
    );
    if (!actorUserId) continue;

    const faker = getFakerForIndex(ctx.fakerSeed, 8000 + i);
    const isProcessed = status !== LeaveRequestStatus.PENDING;
    const inserted = await upsertLeaveRequest(instance, {
      requestedByUserId: actorUserId,
      requesterType,
      reason: faker.lorem.sentence(),
      status,
      createdAt: instance.scheduledStartAt,
      processedAt: isProcessed ? instance.scheduledStartAt : null,
      processedByUserId: isProcessed ? (ctx.adminUserId ?? null) : null,
    });
    results.push(inserted);
  }
  return results;
}

export async function seedOrGet(
  classInstancesList: ClassInstanceEntity[],
  teachersList: TeacherEntity[],
  usersList: UserSelectType[],
  studentsList: StudentEntity[],
  parentsList: ParentEntity[],
  config?: SeedConfig
) {
  logger.info("Seeding leave requests...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableExtendedScheduling || !classInstancesList?.length) {
    return [];
  }

  const leaveInstances = classInstancesList.filter(ci => ci.outcome === ClassOutcome.LEAVE);
  const pendingFutureInstances = classInstancesList.filter(
    ci =>
      ci.outcome === ClassOutcome.PENDING &&
      startOfDay(ci.scheduledStartAt).getTime() > startOfDay(seedConfig.anchorDate).getTime()
  );
  const teacherUserMap = new Map(teachersList.map(t => [t.id, t.userId]));
  const parentById = new Map(parentsList.map(p => [p.id, p]));
  const studentParentUserMap = new Map(
    studentsList
      .map(s => [s.id, parentById.get(s.parentId)?.userId])
      .filter((entry): entry is [string, string] => !!entry[1])
  );
  const adminUser = findAdminUser(usersList);
  const ctx: LeaveRequestContext = {
    teacherUserMap,
    studentParentUserMap,
    adminUserId: adminUser?.id,
    fakerSeed: seedConfig.fakerSeed,
  };
  const maxLeaves = seedConfig.profile === "standard" ? leaveInstances.length : Math.min(2, leaveInstances.length);
  const supplementalCount =
    seedConfig.profile === "standard"
      ? Math.min(3, pendingFutureInstances.length)
      : Math.min(1, pendingFutureInstances.length);

  const approved = await seedApprovedLeaves(leaveInstances, maxLeaves, ctx);
  const supplemental = await seedSupplementalLeaves(pendingFutureInstances, supplementalCount, maxLeaves, ctx);
  const results = [...approved, ...supplemental];

  logger.info(`Leave requests seeded (${results.length} rows).`);
  return results;
}
