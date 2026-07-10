import type { DBTransaction } from "@/backend/db/db.types";
import {
  type AvailabilityWindowUpsertInput,
  type RecurringUnavailabilityCreateInput,
  TeacherAvailabilityBootstrapRepository,
  type VacationRequestCreateInput,
} from "@/backend/db/repo/teachers/teacher-availability-bootstrap.repository";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";
import type {
  TeacherAvailabilityWindowSelectType,
  TeacherRecurringUnavailabilitySelectType,
  TeacherVacationRequestSelectType,
} from "@/backend/types";

function assertNonProduction(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Teacher availability bootstrap operations are not allowed in production.");
  }
}

export namespace TeacherAvailabilityService {
  export async function upsertAvailabilityWindow(
    input: AvailabilityWindowUpsertInput,
    tx?: DBTransaction
  ): Promise<TeacherAvailabilityWindowSelectType> {
    assertNonProduction();
    try {
      return await TeacherAvailabilityBootstrapRepository.upsertAvailabilityWindow(input, tx);
    } catch (error) {
      if (!isDuplicateError(error)) throw error;
      const existing = await TeacherAvailabilityBootstrapRepository.findWindowByTeacherAndDay(
        input.teacherId,
        input.dayOfWeek,
        tx
      );
      if (!existing) throw error;
      return existing;
    }
  }

  export async function upsertManyAvailabilityWindows(
    inputs: readonly AvailabilityWindowUpsertInput[],
    tx?: DBTransaction
  ): Promise<TeacherAvailabilityWindowSelectType[]> {
    const results: TeacherAvailabilityWindowSelectType[] = [];
    for (const input of inputs) {
      results.push(await upsertAvailabilityWindow(input, tx));
    }
    return results;
  }

  export async function createRecurringUnavailabilityIfMissing(
    input: RecurringUnavailabilityCreateInput,
    tx?: DBTransaction
  ): Promise<TeacherRecurringUnavailabilitySelectType> {
    assertNonProduction();
    try {
      return await TeacherAvailabilityBootstrapRepository.createRecurringIfMissing(input, tx);
    } catch (error) {
      if (!isDuplicateError(error)) throw error;
      const existing = await TeacherAvailabilityBootstrapRepository.findRecurringByTeacherAndDay(
        input.teacherId,
        input.dayOfWeek,
        tx
      );
      if (!existing) throw error;
      return existing;
    }
  }

  export async function createVacationRequestIfMissing(
    input: VacationRequestCreateInput,
    tx?: DBTransaction
  ): Promise<TeacherVacationRequestSelectType> {
    assertNonProduction();
    try {
      return await TeacherAvailabilityBootstrapRepository.createVacationIfMissing(input, tx);
    } catch (error) {
      if (!isDuplicateError(error)) throw error;
      const existing = await TeacherAvailabilityBootstrapRepository.findVacationByTeacherId(input.teacherId, tx);
      if (!existing) throw error;
      return existing;
    }
  }
}
