import { ClassMeetingConfigRepository } from "@/backend/db/repo/meeting/class-meeting-config.repository";
import { EffectiveMeetingSource } from "@/backend/enum";
import {
  createClassMeetingConfigInternal,
  listScopedConfigs,
  loadConfigForActor,
  resolveAndMaskConfig,
  updateClassMeetingConfigInternal,
} from "@/backend/services/meeting/class-meeting-config.service.helpers";
import {
  buildEffectiveMeetingMap,
  EMPTY_EFFECTIVE_MEETING,
  fromClassConfig,
  resolveTeacherDefault,
} from "@/backend/services/meeting/class-meeting-config.service.parts";
import { getTeacherUserId } from "@/backend/services/meeting/class-meeting-config.service.queries";
import type {
  ClassMeetingConfigReturnType,
  ClassMeetingConfigSubmitInput,
  DBTransaction,
  EffectiveMeetingReturnType,
  UpdateClassMeetingConfigInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace ClassMeetingConfigService {
  export async function listClassMeetingConfigs(
    actorUserId: string,
    classInstanceId: string,
    tErrors: ErrorsLabels
  ): Promise<ClassMeetingConfigReturnType[]> {
    return listScopedConfigs(actorUserId, { classInstanceId }, tErrors);
  }

  export async function listRecurringMeetingConfigs(
    actorUserId: string,
    recurringScheduleId: string,
    tErrors: ErrorsLabels
  ): Promise<ClassMeetingConfigReturnType[]> {
    return listScopedConfigs(actorUserId, { recurringScheduleId }, tErrors);
  }

  export async function getClassMeetingConfig(
    actorUserId: string,
    id: string,
    tErrors: ErrorsLabels
  ): Promise<ClassMeetingConfigReturnType> {
    const config = await loadConfigForActor(actorUserId, id, tErrors);
    return resolveAndMaskConfig(config);
  }

  export async function createClassMeetingConfig(
    actorUserId: string,
    input: ClassMeetingConfigSubmitInput,
    tErrors: ErrorsLabels
  ): Promise<ClassMeetingConfigReturnType> {
    return createClassMeetingConfigInternal(actorUserId, input, tErrors);
  }

  export async function updateClassMeetingConfig(
    actorUserId: string,
    id: string,
    input: UpdateClassMeetingConfigInput & { providerId?: string },
    tErrors: ErrorsLabels
  ): Promise<ClassMeetingConfigReturnType> {
    return updateClassMeetingConfigInternal(actorUserId, id, input, tErrors);
  }

  export async function deleteClassMeetingConfig(
    actorUserId: string,
    id: string,
    tErrors: ErrorsLabels
  ): Promise<{ id: string }> {
    await loadConfigForActor(actorUserId, id, tErrors);
    await ClassMeetingConfigRepository.deleteConfig(id, tErrors);
    return { id };
  }

  export async function setDefaultClassMeetingConfig(
    actorUserId: string,
    id: string,
    tErrors: ErrorsLabels
  ): Promise<ClassMeetingConfigReturnType> {
    await loadConfigForActor(actorUserId, id, tErrors);
    const updated = await ClassMeetingConfigRepository.setDefault(id, tErrors);
    return resolveAndMaskConfig(updated);
  }
}

export namespace EffectiveMeetingService {
  export async function resolveForClassInstances(
    classInstanceIds: readonly string[],
    _tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<Map<string, EffectiveMeetingReturnType>> {
    return buildEffectiveMeetingMap(classInstanceIds, tx);
  }

  export async function resolveForClassInstance(
    classInstanceId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<EffectiveMeetingReturnType> {
    const resultMap = await resolveForClassInstances([classInstanceId], tErrors, tx);
    return resultMap.get(classInstanceId) ?? EMPTY_EFFECTIVE_MEETING;
  }

  export async function resolveForRecurringSchedule(
    recurringScheduleId: string,
    teacherId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<EffectiveMeetingReturnType> {
    const recurringDefault = await ClassMeetingConfigRepository.getDefaultForRecurringSchedule(recurringScheduleId, tx);
    if (recurringDefault) {
      return fromClassConfig(recurringDefault, EffectiveMeetingSource.RECURRING, tErrors, tx);
    }

    const userId = await getTeacherUserId(teacherId, tx);
    if (!userId) {
      return EMPTY_EFFECTIVE_MEETING;
    }

    return resolveTeacherDefault(userId, tErrors, tx);
  }

  export async function resolveForNewBooking(
    teacherId: string,
    options: {
      readonly recurringScheduleId?: string | null;
      readonly tErrors: ErrorsLabels;
      readonly tx?: DBTransaction;
    }
  ): Promise<EffectiveMeetingReturnType> {
    const { recurringScheduleId, tErrors, tx } = options;

    if (recurringScheduleId) {
      return resolveForRecurringSchedule(recurringScheduleId, teacherId, tErrors, tx);
    }

    const userId = await getTeacherUserId(teacherId, tx);
    if (userId) {
      return resolveTeacherDefault(userId, tErrors, tx);
    }

    return EMPTY_EFFECTIVE_MEETING;
  }
}
