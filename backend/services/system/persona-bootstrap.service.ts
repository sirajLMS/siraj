import type { DBTransaction } from "@/backend/db/db.types";
import { ParentRepository, TeacherRepository, UserRepository } from "@/backend/db/repo";
import type { AccountStatus } from "@/backend/enum";
import type { ParentStatus } from "@/backend/enum/parents/parent.enum";
import type { ParentEntity, TeacherEntity } from "@/backend/types";

export type PersonaProfileUpsertInput = {
  userId: string;
  timezone: string;
  status?: AccountStatus;
};

export type ParentProfileUpsertInput = {
  userId: string;
  timezone: string;
  status: ParentStatus;
};

function assertNonProduction(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Persona bootstrap operations are not allowed in production.");
  }
}

export namespace PersonaBootstrapService {
  export async function upsertTeacherProfile(
    input: PersonaProfileUpsertInput,
    tx?: DBTransaction
  ): Promise<TeacherEntity> {
    assertNonProduction();
    if (input.status) {
      await UserRepository.updateStatus(input.userId, input.status, tx);
    }
    await UserRepository.updateTimezone(input.userId, input.timezone, tx);
    return TeacherRepository.upsertByUserId(input.userId, tx);
  }

  export async function upsertParentProfile(
    input: ParentProfileUpsertInput,
    tx?: DBTransaction
  ): Promise<ParentEntity> {
    assertNonProduction();
    await UserRepository.updateTimezone(input.userId, input.timezone, tx);
    return ParentRepository.upsertByUserId(input.userId, input.status, tx);
  }

  export async function listTeachersByUserIds(userIds: string[], tx?: DBTransaction): Promise<TeacherEntity[]> {
    const results: TeacherEntity[] = [];
    for (const userId of userIds) {
      const teacher = await TeacherRepository.findByUserId(userId, tx);
      if (teacher) results.push(teacher);
    }
    return results;
  }

  export async function listParentsByUserIds(userIds: string[], tx?: DBTransaction): Promise<ParentEntity[]> {
    const results: ParentEntity[] = [];
    for (const userId of userIds) {
      const parent = await ParentRepository.findByUserId(userId, tx);
      if (parent) results.push(parent);
    }
    return results;
  }
}
