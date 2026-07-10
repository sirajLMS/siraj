import type { DBTransaction } from "@/backend/db/db.types";
import { ClassPerformanceRepository } from "@/backend/db/repo/classes/class-performance.repository";
import type { ClassInstancePerformanceEntity, ClassInstancePerformanceInsertType } from "@/backend/types";

export namespace ClassPerformanceService {
  export async function getPerformanceForClass(classInstanceId: string) {
    return await ClassPerformanceRepository.getByClassInstanceId(classInstanceId);
  }

  export async function logPerformance(
    classInstanceId: string,
    input: Omit<ClassInstancePerformanceInsertType, "classInstanceId" | "createdAt" | "updatedAt">
  ) {
    return await ClassPerformanceRepository.upsertForClassInstance(classInstanceId, input);
  }
  export async function listPerformanceByClassInstanceIds(
    classInstanceIds: readonly string[],
    tx?: DBTransaction
  ): Promise<Map<string, ClassInstancePerformanceEntity>> {
    return ClassPerformanceRepository.listByClassInstanceIds(classInstanceIds, tx);
  }

  export async function upsertManyPerformance(
    inputs: readonly ClassInstancePerformanceInsertType[],
    tx?: DBTransaction
  ): Promise<ClassInstancePerformanceEntity[]> {
    return ClassPerformanceRepository.upsertManyForSeed(inputs, tx);
  }
}
