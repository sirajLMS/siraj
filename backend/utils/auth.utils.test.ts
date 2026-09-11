import { describe, expect, test } from "bun:test";
import { AccountStatus, UserRole } from "@/backend/enum";
import type { SanitizedUserSelectType, UserReturnType } from "@/backend/types";
import { AuthUtils } from "@/backend/utils/auth.utils";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

describe("AuthUtils", () => {
  describe("validateUserName", () => {
    test("accepts valid username lengths", () => {
      expect(() => AuthUtils.validateUserName("abc")).not.toThrow();
      expect(() => AuthUtils.validateUserName("John Doe")).not.toThrow();
      expect(() => AuthUtils.validateUserName("a".repeat(255))).not.toThrow();
    });

    test("throws error for usernames shorter than 3 characters", () => {
      expect(() => AuthUtils.validateUserName("")).toThrow("User name must be between 3 and 255 characters long.");
      expect(() => AuthUtils.validateUserName("a")).toThrow("User name must be between 3 and 255 characters long.");
      expect(() => AuthUtils.validateUserName("ab")).toThrow("User name must be between 3 and 255 characters long.");
    });

    test("throws error for usernames longer than 255 characters", () => {
      expect(() => AuthUtils.validateUserName("a".repeat(256))).toThrow(
        "User name must be between 3 and 255 characters long."
      );
    });
  });

  describe("toUserReturnType", () => {
    const mockSanitizedUser: SanitizedUserSelectType & { deletedAt?: Date | null } = {
      id: "usr_123456789",
      name: "Alice Smith",
      email: "alice@example.com",
      status: AccountStatus.ACTIVATED,
      isSuperAdmin: false,
      timezone: IanaTimezone.UTC,
      displayCurrency: null,
      phone: "+1234567890",
      avatarFilePath: null,
      avatarUrl: null,
      emailVerifiedAt: new Date("2025-01-01"),
      lastLoginAt: new Date("2025-01-02"),
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
      deletedAt: new Date("2025-01-03"),
    };

    test("maps user with default resolved values and strips deletedAt", () => {
      const result = AuthUtils.toUserReturnType(mockSanitizedUser);

      expect(result.id).toBe("usr_123456789");
      expect(result.name).toBe("Alice Smith");
      expect(result.email).toBe("alice@example.com");
      expect(result.role).toBe(UserRole.USER);
      expect(result.status).toBe(AccountStatus.ACTIVATED);
      expect(result.teacherId).toBeNull();
      expect(result.parentId).toBeNull();
      expect(result.displayCurrency).toBeNull();
      expect(result.timezone).toBe(IanaTimezone.UTC);

      // Verify deletedAt is stripped
      expect("deletedAt" in result).toBe(false);
      expect((result as Record<string, unknown>).deletedAt).toBeUndefined();
    });

    test("maps user with custom resolved fields", () => {
      const resolvedFields = {
        role: UserRole.SUPERVISOR,
        status: AccountStatus.DEACTIVATED,
        teacherId: "tch_111",
        parentId: "prt_222",
        displayCurrency: CurrencyCode.USD,
      };

      const result = AuthUtils.toUserReturnType(mockSanitizedUser, resolvedFields);

      expect(result.role).toBe(UserRole.SUPERVISOR);
      expect(result.status).toBe(AccountStatus.DEACTIVATED);
      expect(result.teacherId).toBe("tch_111");
      expect(result.parentId).toBe("prt_222");
      expect(result.displayCurrency).toBe(CurrencyCode.USD);
    });
  });

  describe("toSafeUser", () => {
    test("returns shallow clone when input is already a UserReturnType (contains role and status)", () => {
      const fullUser: UserReturnType = {
        id: "usr_999",
        name: "Bob Builder",
        email: "bob@example.com",
        status: AccountStatus.ACTIVATED,
        role: UserRole.TEACHER,
        isSuperAdmin: false,
        timezone: IanaTimezone.UTC,
        displayCurrency: CurrencyCode.EUR,
        teacherId: "tch_999",
        parentId: null,
        phone: null,
        avatarFilePath: null,
        avatarUrl: null,
        emailVerifiedAt: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const safeUser = AuthUtils.toSafeUser(fullUser);

      expect(safeUser).toEqual(fullUser);
      expect(safeUser).not.toBe(fullUser); // Ensure shallow copy
    });

    test("converts SanitizedUserSelectType to UserReturnType when role and status are missing", () => {
      const sanitizedUser: SanitizedUserSelectType = {
        id: "usr_888",
        name: "Charlie Brown",
        email: "charlie@example.com",
        status: AccountStatus.ACTIVATED,
        isSuperAdmin: false,
        timezone: IanaTimezone.UTC,
        displayCurrency: null,
        phone: null,
        avatarFilePath: null,
        avatarUrl: null,
        emailVerifiedAt: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const safeUser = AuthUtils.toSafeUser(sanitizedUser);

      expect(safeUser.id).toBe("usr_888");
      expect(safeUser.role).toBe(UserRole.USER);
      expect(safeUser.status).toBe(AccountStatus.ACTIVATED);
      expect(safeUser.teacherId).toBeNull();
      expect(safeUser.parentId).toBeNull();
    });
  });
});
