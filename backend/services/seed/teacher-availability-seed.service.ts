/**
 * Seed-only teacher availability demo data.
 *
 * Seeds availability windows, recurring unavailability, and vacation requests for
 * demo teachers during `bun db seed`. Production scheduling uses teacher
 * availability domain services — **not this module**.
 *
 * Writes blocked on real production via {@link assertSeedWriteAllowed}.
 *
 * @see backend/db/seeds/teachers/seed-teacher-availability-windows.ts
 * @see backend/db/seeds/teachers/seed-teacher-recurring-unavailability.ts
 * @see backend/db/seeds/teachers/seed-teacher-vacation-requests.ts
 */
import type { DBTransaction } from "@/backend/db/db.types";
import {
  type AvailabilityWindowUpsertInput,
  type RecurringUnavailabilityCreateInput,
  TeacherAvailabilityBootstrapRepository,
  type VacationRequestCreateInput,
} from "@/backend/db/repo/teachers/teacher-availability-bootstrap.repository";
import { assertSeedWriteAllowed } from "@/backend/lib/bootstrap-gate";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";
import type {
  TeacherAvailabilityWindowSelectType,
  TeacherRecurringUnavailabilitySelectType,
  TeacherVacationRequestSelectType,
} from "@/backend/types";

export namespace TeacherAvailabilitySeedService {
  /** Idempotently upsert one availability window for a demo teacher. */
  export async function seedAvailabilityWindow(
    input: AvailabilityWindowUpsertInput,
    tx?: DBTransaction
  ): Promise<TeacherAvailabilityWindowSelectType> {
    assertSeedWriteAllowed("Teacher availability seed writes");
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

  /** Idempotently upsert many availability windows. */
  export async function seedManyAvailabilityWindows(
    inputs: readonly AvailabilityWindowUpsertInput[],
    tx?: DBTransaction
  ): Promise<TeacherAvailabilityWindowSelectType[]> {
    return inputs.reduce(
      async (accumulated, input) => {
        const acc = await accumulated;
        acc.push(await seedAvailabilityWindow(input, tx));
        return acc;
      },
      Promise.resolve([] as TeacherAvailabilityWindowSelectType[])
    );
  }

  /** Idempotently create recurring unavailability for a demo teacher. */
  export async function seedRecurringUnavailabilityIfMissing(
    input: RecurringUnavailabilityCreateInput,
    tx?: DBTransaction
  ): Promise<TeacherRecurringUnavailabilitySelectType> {
    assertSeedWriteAllowed("Teacher availability seed writes");
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

  /** Idempotently create a vacation request for a demo teacher. */
  export async function seedVacationRequestIfMissing(
    input: VacationRequestCreateInput,
    tx?: DBTransaction
  ): Promise<TeacherVacationRequestSelectType> {
    assertSeedWriteAllowed("Teacher availability seed writes");
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
