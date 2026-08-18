/**
 * Seed-only teacher/parent persona provisioning.
 *
 * Creates or updates teacher and parent profile rows linked to demo users.
 * Used by `bun db seed` and `ensureDemoUsers` test helper.
 *
 * **Not a production domain service.** Writes blocked on real production via
 * {@link assertSeedWriteAllowed}.
 *
 * @see backend/db/seeds/teachers/seed-teachers.ts
 * @see backend/db/seeds/parents/seed-parents.ts
 */

import { ParentRepository } from "@/backend/db/repo/parents";
import { TeacherRepository } from "@/backend/db/repo/teachers";
import { UserRepository } from "@/backend/db/repo/users";
import { assertSeedWriteAllowed } from "@/backend/lib/bootstrap-gate";
import type {
  DBTransaction,
  ParentSelectType,
  SeedParentProfileInput,
  SeedTeacherProfileInput,
  TeacherSelectType,
} from "@/backend/types";

export namespace PersonaSeedService {
  /** Idempotently upsert a teacher profile for a demo user. */
  export async function seedTeacherProfile(
    input: SeedTeacherProfileInput,
    tx?: DBTransaction
  ): Promise<TeacherSelectType> {
    assertSeedWriteAllowed("Persona seed writes");
    if (input.status) {
      await UserRepository.updateStatus(input.userId, input.status, tx);
    }
    await UserRepository.updateTimezone(input.userId, input.timezone, tx);
    return TeacherRepository.upsertByUserId(
      input.userId,
      input.hourlyRate || input.rateCurrency
        ? { hourlyRate: input.hourlyRate, rateCurrency: input.rateCurrency }
        : undefined,
      tx
    );
  }

  /** Idempotently upsert a parent profile for a demo user. */
  export async function seedParentProfile(
    input: SeedParentProfileInput,
    tx?: DBTransaction
  ): Promise<ParentSelectType> {
    assertSeedWriteAllowed("Persona seed writes");
    await UserRepository.updateTimezone(input.userId, input.timezone, tx);
    return ParentRepository.upsertByUserId(input.userId, input.status, tx);
  }

  /** Read helper for seed / test-helper scripts. */
  export async function listTeachersByUserIds(userIds: string[], tx?: DBTransaction): Promise<TeacherSelectType[]> {
    const teachers = await Promise.all(userIds.map(userId => TeacherRepository.findByUserId(userId, tx)));
    return teachers.filter((teacher): teacher is TeacherSelectType => teacher !== null);
  }

  /** Read helper for seed / test-helper scripts. */
  export async function listParentsByUserIds(userIds: string[], tx?: DBTransaction): Promise<ParentSelectType[]> {
    const parents = await Promise.all(userIds.map(userId => ParentRepository.findByUserId(userId, tx)));
    return parents.filter((parent): parent is ParentSelectType => parent !== null);
  }
}
