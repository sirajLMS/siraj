import type { DBTransaction } from "@/backend/db/db.types";
import { AuditRepository } from "@/backend/db/repo";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";
import type {
  AdminAuditLogSelectType,
  AuditLogSelectType,
  CreateAdminAuditLogInput,
  CreateAuditLogInput,
} from "@/backend/types";

export namespace AuditService {
  export async function listAuditLogs(limit = 50, tx?: DBTransaction): Promise<AuditLogSelectType[]> {
    return AuditRepository.getRecentAuditLogs(limit, tx);
  }

  export async function countAuditLogs(tx?: DBTransaction): Promise<number> {
    return AuditRepository.countAuditLogs(tx);
  }

  export async function listAdminAuditLogs(limit = 50, tx?: DBTransaction): Promise<AdminAuditLogSelectType[]> {
    return AuditRepository.getRecentAdminAuditLogs(limit, tx);
  }

  export async function countAdminAuditLogs(tx?: DBTransaction): Promise<number> {
    return AuditRepository.countAdminAuditLogs(tx);
  }

  export async function createManyAuditLogs(
    inputs: readonly CreateAuditLogInput[],
    tx?: DBTransaction
  ): Promise<AuditLogSelectType[]> {
    if (inputs.length === 0) return [];

    try {
      return await AuditRepository.createManyAuditLogs(inputs, tx);
    } catch (error) {
      if (isDuplicateError(error)) {
        await AuditRepository.upsertManyAuditLogs(inputs, tx);
        return [];
      }
      throw error;
    }
  }

  export async function upsertManyAuditLogs(inputs: readonly CreateAuditLogInput[], tx?: DBTransaction): Promise<void> {
    return AuditRepository.upsertManyAuditLogs(inputs, tx);
  }

  export async function createManyAdminAuditLogs(
    inputs: readonly CreateAdminAuditLogInput[],
    tx?: DBTransaction
  ): Promise<AdminAuditLogSelectType[]> {
    if (inputs.length === 0) return [];

    try {
      return await AuditRepository.createManyAdminAuditLogs(inputs, tx);
    } catch (error) {
      if (isDuplicateError(error)) {
        await AuditRepository.upsertManyAdminAuditLogs(inputs, tx);
        return [];
      }
      throw error;
    }
  }

  export async function upsertManyAdminAuditLogs(
    inputs: readonly CreateAdminAuditLogInput[],
    tx?: DBTransaction
  ): Promise<void> {
    return AuditRepository.upsertManyAdminAuditLogs(inputs, tx);
  }
}
