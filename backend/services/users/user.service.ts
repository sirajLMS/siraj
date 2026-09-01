import { UserRepository } from "@/backend/db/repo/users";
import type { UserReturnType, UserSelectType } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Return type of {@link UserRepository.loadByIds} — a positionally-aligned
 * array of `UserReturnType | Error` (Error entries for IDs not found).
 */
type UserLoadByIdsResult = (UserReturnType | Error)[];

/**
 * UserService — thin service wrapper for user lookups.
 *
 * Resolvers and other GraphQL layer code should call these methods instead of
 * accessing {@link UserRepository} directly. This keeps the service layer as
 * the single entry point for data access, enabling future caching, permission
 * gating, or orchestration without touching every call site.
 */
export namespace UserService {
  export async function findById(id: string): Promise<UserSelectType | null> {
    return UserRepository.findById(id);
  }

  export async function findByEmail(email: string): Promise<UserSelectType | null> {
    return UserRepository.findByEmail(email);
  }

  export async function findSafeById(id: string): Promise<UserSelectType | null> {
    return UserRepository.findSafeById(id);
  }

  export async function findUsers(opts: {
    limit: number;
    offset: number;
    search: string | null;
  }): Promise<UserReturnType[]> {
    return UserRepository.findUsers(opts);
  }

  export async function findDisplayCurrenciesByIds(ids: string[]): Promise<Map<string, CurrencyCode | null>> {
    return UserRepository.findDisplayCurrenciesByIds(ids);
  }

  /**
   * Batch load users by IDs for Pothos DataLoader.
   *
   * Returns a positionally-aligned array (same length and order as `ids`)
   * where each element is either the matching `UserReturnType` or an `Error`
   * (for IDs not found). Delegates to {@link UserRepository.loadByIds}.
   *
   * @param ids    User IDs to fetch.
   * @param locale Locale for the "user not found" error message (default `"en"`).
   */
  export async function loadByIds(ids: string[], locale?: string): Promise<UserLoadByIdsResult> {
    return UserRepository.loadByIds(ids, locale);
  }
}
