import { TeacherBankingRepository, UserRepository } from "@/backend/db";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { ProfileAudience, ProfileScope } from "@/backend/types/profile/profile.types";
import type {
  TeacherBankingDetailsHistorySelectType,
  TeacherBankingSummaryReturnType,
} from "@/backend/types/teachers/teacher.types";

function maskNumericBankingField(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length <= 4) {
    return "****";
  }

  return `****${trimmed.slice(-4)}`;
}

function maskTextBankingField(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length <= 1) {
    return "*";
  }

  if (trimmed.length <= 4) {
    return `${trimmed[0]}${"*".repeat(trimmed.length - 1)}`;
  }

  return `${trimmed[0]}${"*".repeat(Math.min(trimmed.length - 2, 6))}${trimmed.slice(-1)}`;
}

function maskSwiftBic(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length <= 4) {
    return "****";
  }

  return `${trimmed.slice(0, 2)}${"*".repeat(Math.max(trimmed.length - 4, 2))}${trimmed.slice(-2)}`;
}

export function buildMaskedBankingSummary(
  record: TeacherBankingDetailsHistorySelectType,
  verifiedByName: string | null
): TeacherBankingSummaryReturnType {
  return {
    id: record.id,
    beneficiaryName: maskTextBankingField(record.beneficiaryName) ?? "",
    bankName: maskTextBankingField(record.bankName) ?? "",
    accountNumber: maskNumericBankingField(record.accountNumber) ?? "",
    routingNumber: maskNumericBankingField(record.routingNumber),
    swiftBic: maskSwiftBic(record.swiftBic) ?? "",
    iban: maskNumericBankingField(record.iban),
    verifiedAt: record.verifiedAt?.toISOString() ?? null,
    verifiedByUserId: record.verifiedByUserId,
    verifiedByName,
  };
}

export async function loadTeacherBankingSummary(
  actorUserId: string,
  scope: ProfileScope,
  audience: ProfileAudience,
  teacherId: string | null
): Promise<TeacherBankingSummaryReturnType | null> {
  if (scope === "own" || audience !== "teacher" || !teacherId) {
    return null;
  }

  const canViewBanking = await PermissionsService.hasPermission(actorUserId, AppPermission.USER_EDIT_PROFILE);
  if (!canViewBanking) {
    return null;
  }

  const record = await TeacherBankingRepository.getActiveBankingDetails(teacherId);
  if (!record) {
    return null;
  }

  let verifiedByName: string | null = null;
  if (record.verifiedByUserId) {
    const verifier = await UserRepository.findSafeById(record.verifiedByUserId);
    verifiedByName = verifier?.name ?? null;
  }

  return buildMaskedBankingSummary(record, verifiedByName);
}
