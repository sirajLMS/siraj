import type { DBTransaction } from "@/backend/db/db.types";
import { ClassPerformanceRepository } from "@/backend/db/repo/classes/class-performance.repository";
import type { ClassInstancePerformanceInsertType, ClassInstancePerformanceSelectType } from "@/backend/types";

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
  ): Promise<Map<string, ClassInstancePerformanceSelectType>> {
    return ClassPerformanceRepository.listByClassInstanceIds(classInstanceIds, tx);
  }

  export async function upsertManyPerformance(
    inputs: readonly ClassInstancePerformanceInsertType[],
    tx?: DBTransaction
  ): Promise<ClassInstancePerformanceSelectType[]> {
    return ClassPerformanceRepository.upsertMany(inputs, tx);
  }
}
