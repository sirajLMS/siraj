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
import { LeaveRequestService } from "@/backend/services/schedule/leave-request.service";
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

type LeaveRequestContext = {
  teacherUserMap: Map<string, string>;
  studentParentUserMap: Map<string, string>;
  adminUserId: string | undefined;
  fakerSeed: number;
};

function buildApprovedLeaveInputs(leaveInstances: ClassInstanceEntity[], maxLeaves: number, ctx: LeaveRequestContext) {
  const inputs = [];
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
    inputs.push({
      classInstanceId: instance.id,
      requestedByUserId: actorUserId,
      requesterType,
      reason: faker.lorem.sentence(),
      status: LeaveRequestStatus.APPROVED,
      createdAt: instance.scheduledStartAt,
      processedAt: instance.scheduledEndAt,
      processedByUserId: ctx.adminUserId ?? null,
    });
  }
  return inputs;
}

function buildSupplementalLeaveInputs(
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
  const inputs = [];
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
    inputs.push({
      classInstanceId: instance.id,
      requestedByUserId: actorUserId,
      requesterType,
      reason: faker.lorem.sentence(),
      status,
      createdAt: instance.scheduledStartAt,
      processedAt: isProcessed ? instance.scheduledStartAt : null,
      processedByUserId: isProcessed ? (ctx.adminUserId ?? null) : null,
    });
  }
  return inputs;
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

  const approvedInputs = buildApprovedLeaveInputs(leaveInstances, maxLeaves, ctx);
  const supplementalInputs = buildSupplementalLeaveInputs(pendingFutureInstances, supplementalCount, maxLeaves, ctx);
  const results = await LeaveRequestService.createManyIfMissing([...approvedInputs, ...supplementalInputs]);

  logger.info(`Leave requests seeded (${results.length} rows).`);
  return results;
}
