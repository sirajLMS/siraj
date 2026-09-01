import { ClassPerformanceRepository } from "@/backend/db/repo/classes/class-performance.repository";
import type {
  ClassInstancePerformanceInsertType,
  ClassInstancePerformanceSelectType,
  DBTransaction,
} from "@/backend/types";

export namespace ClassPerformanceService {
  export async function getPerformanceForClass(classInstanceId: string) {
    return await ClassPerformanceRepository.getByClassInstanceId(classInstanceId);
  }

  export async function upsertManyPerformance(
    inputs: readonly ClassInstancePerformanceInsertType[],
    tx?: DBTransaction
  ): Promise<ClassInstancePerformanceSelectType[]> {
    return ClassPerformanceRepository.upsertMany(inputs, tx);
  }
}
