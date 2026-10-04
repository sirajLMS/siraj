import { TeacherAvailabilityRepository } from "@/backend/db/repo/teachers/teacher-availability.repository";
import { VacationRequestStatus } from "@/backend/enum";
import { ValidationError } from "@/backend/lib/errors";
import { isVacationRequestStatus } from "@/backend/services/scheduling/availability.helpers";
import type { DBTransaction, ProcessVacationRequestInput, TeacherVacationRequestSelectType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export function assertVacationStatus(
  current: TeacherVacationRequestSelectType,
  shouldFail: (status: VacationRequestStatus) => boolean,
  errorKey: "vacationRequestNotPending" | "vacationRequestAlreadyCancelled",
  vacationRequestId: string,
  locale?: string
): void {
  if (!isVacationRequestStatus(current.status) || shouldFail(current.status)) {
    const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new ValidationError(
      errorKey === "vacationRequestNotPending"
        ? errorsTranslations.scheduling.vacationRequestNotPending(vacationRequestId)
        : errorsTranslations.scheduling.vacationRequestAlreadyCancelled(vacationRequestId)
    );
  }
}

export async function processVacationRequest(
  input: ProcessVacationRequestInput,
  status: VacationRequestStatus.APPROVED | VacationRequestStatus.REJECTED,
  processedByUserId: string,
  tx?: DBTransaction,
  locale?: string
): Promise<TeacherVacationRequestSelectType> {
  // Lock + fetch in the same transaction
  const current = await TeacherAvailabilityRepository.fetchVacationRequestForUpdate(input.vacationRequestId, tx);

  assertVacationStatus(
    current,
    s => s !== VacationRequestStatus.PENDING,
    "vacationRequestNotPending",
    input.vacationRequestId,
    locale
  );

  return TeacherAvailabilityRepository.updateVacationRequestStatus(
    input.vacationRequestId,
    { status, processedByUserId },
    tx
  );
}
