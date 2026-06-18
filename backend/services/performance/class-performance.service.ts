import { ClassPerformanceRepository } from "@/backend/db/repo/class-performance.repository";
import type { ClassInstancePerformanceInsertType } from "@/backend/types";

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
}
