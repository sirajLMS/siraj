import { describe, expect, it } from "bun:test";
import { AccountStatus, AppLanguage } from "@/shared/constants/auth.enum";
import { InvoiceStatus, InvoiceType, PaymentDirection, PaymentMethodType } from "@/shared/constants/billing.enum";
import { ClassExecutionState, ClassOutcome, ClassType } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { DayOfWeek } from "@/shared/constants/day-of-week.enum";
import { Gender } from "@/shared/constants/gender.enum";
import { GroupClassAttendanceStatus } from "@/shared/constants/group-class.enum";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { OverrideState } from "@/shared/constants/override-state.enum";
import { ParentStatus } from "@/shared/constants/parent.enum";
import { StudentStatus } from "@/shared/constants/student-lifecycle.enum";
import {
  BookingStatus,
  isAppLocale,
  normalizeContentLocale,
  parseAccountStatus,
  parseAppLanguage,
  parseBookingStatus,
  parseClassExecutionState,
  parseClassOutcome,
  parseClassType,
  parseClassTypeOrNull,
  parseCurrencyCode,
  parseCurrencyCodeOrNull,
  parseDayOfWeek,
  parseGender,
  parseGroupClassAttendanceStatus,
  parseIanaTimezone,
  parseIanaTimezoneOrNull,
  parseInvoiceStatus,
  parseInvoiceType,
  parseOverrideState,
  parseParentStatus,
  parsePaymentDirection,
  parsePaymentMethodType,
  parseStudentStatus,
} from "@/shared/lib/enum";

describe("shared/lib/enum - canonical enum parsing", () => {
  describe("parseAccountStatus", () => {
    it("parses valid ACTIVATED", () => {
      expect(parseAccountStatus("ACTIVATED")).toBe(AccountStatus.ACTIVATED);
    });
    it("parses valid DEACTIVATED", () => {
      expect(parseAccountStatus("DEACTIVATED")).toBe(AccountStatus.DEACTIVATED);
    });
    it("returns fallback for invalid value", () => {
      expect(parseAccountStatus("INVALID", AccountStatus.DEACTIVATED)).toBe(AccountStatus.DEACTIVATED);
    });
    it("returns fallback for null", () => {
      expect(parseAccountStatus(null, AccountStatus.DEACTIVATED)).toBe(AccountStatus.DEACTIVATED);
    });
    it("returns fallback for undefined", () => {
      expect(parseAccountStatus(undefined, AccountStatus.DEACTIVATED)).toBe(AccountStatus.DEACTIVATED);
    });
    it("defaults to ACTIVATED when no fallback provided", () => {
      expect(parseAccountStatus("INVALID")).toBe(AccountStatus.ACTIVATED);
    });
  });

  describe("parseAppLanguage", () => {
    it("parses valid ar", () => {
      expect(parseAppLanguage("ar")).toBe(AppLanguage.ar);
    });
    it("parses valid en", () => {
      expect(parseAppLanguage("en")).toBe(AppLanguage.en);
    });
    it("returns null for invalid value", () => {
      expect(parseAppLanguage("fr")).toBeNull();
    });
    it("returns null for null", () => {
      expect(parseAppLanguage(null)).toBeNull();
    });
    it("returns null for undefined", () => {
      expect(parseAppLanguage(undefined)).toBeNull();
    });
  });

  describe("parseClassExecutionState", () => {
    it("parses valid NOT_ACTIVATED", () => {
      expect(parseClassExecutionState("NOT_ACTIVATED")).toBe(ClassExecutionState.NOT_ACTIVATED);
    });
    it("parses valid ACTIVATED", () => {
      expect(parseClassExecutionState("ACTIVATED")).toBe(ClassExecutionState.ACTIVATED);
    });
    it("parses valid RUNNING", () => {
      expect(parseClassExecutionState("RUNNING")).toBe(ClassExecutionState.RUNNING);
    });
    it("parses valid COMPLETED", () => {
      expect(parseClassExecutionState("COMPLETED")).toBe(ClassExecutionState.COMPLETED);
    });
    it("parses valid ON_DEMAND_PENDING_CREDITS", () => {
      expect(parseClassExecutionState("ON_DEMAND_PENDING_CREDITS")).toBe(ClassExecutionState.ON_DEMAND_PENDING_CREDITS);
    });
    it("parses valid ON_DEMAND_CONFLICT_HELD", () => {
      expect(parseClassExecutionState("ON_DEMAND_CONFLICT_HELD")).toBe(ClassExecutionState.ON_DEMAND_CONFLICT_HELD);
    });
    it("parses valid ON_DEMAND_NO_CREDITS_CANCELLED", () => {
      expect(parseClassExecutionState("ON_DEMAND_NO_CREDITS_CANCELLED")).toBe(
        ClassExecutionState.ON_DEMAND_NO_CREDITS_CANCELLED
      );
    });
    it("parses valid ON_DEMAND_NO_CREDITS_ABSENT", () => {
      expect(parseClassExecutionState("ON_DEMAND_NO_CREDITS_ABSENT")).toBe(
        ClassExecutionState.ON_DEMAND_NO_CREDITS_ABSENT
      );
    });
    it("returns fallback for invalid", () => {
      expect(parseClassExecutionState("INVALID", ClassExecutionState.ACTIVATED)).toBe(ClassExecutionState.ACTIVATED);
    });
    it("defaults to NOT_ACTIVATED", () => {
      expect(parseClassExecutionState("INVALID")).toBe(ClassExecutionState.NOT_ACTIVATED);
    });
  });

  describe("parseClassOutcome", () => {
    it("parses valid PENDING", () => {
      expect(parseClassOutcome("PENDING")).toBe(ClassOutcome.PENDING);
    });
    it("parses valid TAKEN", () => {
      expect(parseClassOutcome("TAKEN")).toBe(ClassOutcome.TAKEN);
    });
    it("parses valid ABSENT", () => {
      expect(parseClassOutcome("ABSENT")).toBe(ClassOutcome.ABSENT);
    });
    it("parses valid LEAVE", () => {
      expect(parseClassOutcome("LEAVE")).toBe(ClassOutcome.LEAVE);
    });
    it("returns fallback for invalid", () => {
      expect(parseClassOutcome("INVALID", ClassOutcome.TAKEN)).toBe(ClassOutcome.TAKEN);
    });
    it("defaults to PENDING", () => {
      expect(parseClassOutcome("INVALID")).toBe(ClassOutcome.PENDING);
    });
  });

  describe("parseClassType", () => {
    it("parses valid REGULAR", () => {
      expect(parseClassType("REGULAR")).toBe(ClassType.REGULAR);
    });
    it("parses valid TRIAL", () => {
      expect(parseClassType("TRIAL")).toBe(ClassType.TRIAL);
    });
    it("parses valid ADVANCE", () => {
      expect(parseClassType("ADVANCE")).toBe(ClassType.ADVANCE);
    });
    it("returns fallback for invalid", () => {
      expect(parseClassType("INVALID", ClassType.TRIAL)).toBe(ClassType.TRIAL);
    });
    it("defaults to REGULAR", () => {
      expect(parseClassType("INVALID")).toBe(ClassType.REGULAR);
    });
  });

  describe("parseClassTypeOrNull", () => {
    it("parses valid REGULAR", () => {
      expect(parseClassTypeOrNull("REGULAR")).toBe(ClassType.REGULAR);
    });
    it("returns null for invalid", () => {
      expect(parseClassTypeOrNull("INVALID")).toBeNull();
    });
    it("returns null for null", () => {
      expect(parseClassTypeOrNull(null)).toBeNull();
    });
  });

  describe("parseCurrencyCode", () => {
    it("parses valid EGP", () => {
      expect(parseCurrencyCode("EGP")).toBe(CurrencyCode.EGP);
    });
    it("parses valid USD", () => {
      expect(parseCurrencyCode("USD")).toBe(CurrencyCode.USD);
    });
    it("parses valid SAR", () => {
      expect(parseCurrencyCode("SAR")).toBe(CurrencyCode.SAR);
    });
    it("parses valid EUR", () => {
      expect(parseCurrencyCode("EUR")).toBe(CurrencyCode.EUR);
    });
    it("returns fallback for invalid", () => {
      expect(parseCurrencyCode("INVALID", CurrencyCode.SAR)).toBe(CurrencyCode.SAR);
    });
    it("defaults to EGP", () => {
      expect(parseCurrencyCode("INVALID")).toBe(CurrencyCode.EGP);
    });
  });

  describe("parseCurrencyCodeOrNull", () => {
    it("parses valid EGP", () => {
      expect(parseCurrencyCodeOrNull("EGP")).toBe(CurrencyCode.EGP);
    });
    it("parses valid USD", () => {
      expect(parseCurrencyCodeOrNull("USD")).toBe(CurrencyCode.USD);
    });
    it("returns null for invalid", () => {
      expect(parseCurrencyCodeOrNull("INVALID")).toBeNull();
    });
    it("returns null for null", () => {
      expect(parseCurrencyCodeOrNull(null)).toBeNull();
    });
    it("returns null for undefined", () => {
      expect(parseCurrencyCodeOrNull(undefined)).toBeNull();
    });
  });

  describe("parseGender", () => {
    it("parses valid MALE", () => {
      expect(parseGender("MALE")).toBe(Gender.MALE);
    });
    it("parses valid FEMALE", () => {
      expect(parseGender("FEMALE")).toBe(Gender.FEMALE);
    });
    it("returns fallback for invalid", () => {
      expect(parseGender("INVALID", Gender.FEMALE)).toBe(Gender.FEMALE);
    });
    it("defaults to MALE", () => {
      expect(parseGender("INVALID")).toBe(Gender.MALE);
    });
  });

  describe("parseInvoiceStatus", () => {
    it("parses valid UNPAID", () => {
      expect(parseInvoiceStatus("UNPAID")).toBe(InvoiceStatus.UNPAID);
    });
    it("parses valid PAYMENT_PENDING", () => {
      expect(parseInvoiceStatus("PAYMENT_PENDING")).toBe(InvoiceStatus.PAYMENT_PENDING);
    });
    it("parses valid PAID", () => {
      expect(parseInvoiceStatus("PAID")).toBe(InvoiceStatus.PAID);
    });
    it("parses valid CANCELLED", () => {
      expect(parseInvoiceStatus("CANCELLED")).toBe(InvoiceStatus.CANCELLED);
    });
    it("returns fallback for invalid", () => {
      expect(parseInvoiceStatus("INVALID", InvoiceStatus.PAID)).toBe(InvoiceStatus.PAID);
    });
    it("defaults to UNPAID", () => {
      expect(parseInvoiceStatus("INVALID")).toBe(InvoiceStatus.UNPAID);
    });
  });

  describe("parseInvoiceType", () => {
    it("parses valid PER_CLASSES", () => {
      expect(parseInvoiceType("PER_CLASSES")).toBe(InvoiceType.PER_CLASSES);
    });
    it("parses valid MONTHLY", () => {
      expect(parseInvoiceType("MONTHLY")).toBe(InvoiceType.MONTHLY);
    });
    it("parses valid MANUAL", () => {
      expect(parseInvoiceType("MANUAL")).toBe(InvoiceType.MANUAL);
    });
    it("returns fallback for invalid", () => {
      expect(parseInvoiceType("INVALID", InvoiceType.PER_CLASSES)).toBe(InvoiceType.PER_CLASSES);
    });
    it("defaults to MONTHLY", () => {
      expect(parseInvoiceType("INVALID")).toBe(InvoiceType.MONTHLY);
    });
  });

  describe("parseParentStatus", () => {
    it("parses valid REGULAR", () => {
      expect(parseParentStatus("REGULAR")).toBe(ParentStatus.REGULAR);
    });
    it("parses valid ON_LEAVE", () => {
      expect(parseParentStatus("ON_LEAVE")).toBe(ParentStatus.ON_LEAVE);
    });
    it("parses valid SUSPENDED", () => {
      expect(parseParentStatus("SUSPENDED")).toBe(ParentStatus.SUSPENDED);
    });
    it("parses valid ON_TRIAL", () => {
      expect(parseParentStatus("ON_TRIAL")).toBe(ParentStatus.ON_TRIAL);
    });
    it("returns null for invalid", () => {
      expect(parseParentStatus("INVALID")).toBeNull();
    });
    it("returns null for null", () => {
      expect(parseParentStatus(null)).toBeNull();
    });
  });

  describe("parsePaymentMethodType", () => {
    it("parses valid MOBILE_WALLET", () => {
      expect(parsePaymentMethodType("MOBILE_WALLET")).toBe(PaymentMethodType.MOBILE_WALLET);
    });
    it("parses valid PAYMENT_LINK", () => {
      expect(parsePaymentMethodType("PAYMENT_LINK")).toBe(PaymentMethodType.PAYMENT_LINK);
    });
    it("parses valid ONLINE_ACCOUNT", () => {
      expect(parsePaymentMethodType("ONLINE_ACCOUNT")).toBe(PaymentMethodType.ONLINE_ACCOUNT);
    });
    it("parses valid BANK_TRANSFER", () => {
      expect(parsePaymentMethodType("BANK_TRANSFER")).toBe(PaymentMethodType.BANK_TRANSFER);
    });
    it("parses valid CASH", () => {
      expect(parsePaymentMethodType("CASH")).toBe(PaymentMethodType.CASH);
    });
    it("parses valid PROOF_UPLOAD", () => {
      expect(parsePaymentMethodType("PROOF_UPLOAD")).toBe(PaymentMethodType.PROOF_UPLOAD);
    });
    it("returns null for invalid", () => {
      expect(parsePaymentMethodType("INVALID")).toBeNull();
    });
  });

  describe("parsePaymentDirection", () => {
    it("parses valid PAYIN", () => {
      expect(parsePaymentDirection("PAYIN")).toBe(PaymentDirection.PAYIN);
    });
    it("parses valid PAYOUT", () => {
      expect(parsePaymentDirection("PAYOUT")).toBe(PaymentDirection.PAYOUT);
    });
    it("parses valid BOTH", () => {
      expect(parsePaymentDirection("BOTH")).toBe(PaymentDirection.BOTH);
    });
    it("returns fallback for invalid", () => {
      expect(parsePaymentDirection("INVALID", PaymentDirection.PAYOUT)).toBe(PaymentDirection.PAYOUT);
    });
    it("defaults to BOTH", () => {
      expect(parsePaymentDirection("INVALID")).toBe(PaymentDirection.BOTH);
    });
  });

  describe("parseStudentStatus", () => {
    it("parses valid REGULAR", () => {
      expect(parseStudentStatus("REGULAR")).toBe(StudentStatus.REGULAR);
    });
    it("parses valid ON_LEAVE", () => {
      expect(parseStudentStatus("ON_LEAVE")).toBe(StudentStatus.ON_LEAVE);
    });
    it("parses valid SUSPENDED", () => {
      expect(parseStudentStatus("SUSPENDED")).toBe(StudentStatus.SUSPENDED);
    });
    it("parses valid ON_TRIAL", () => {
      expect(parseStudentStatus("ON_TRIAL")).toBe(StudentStatus.ON_TRIAL);
    });
    it("parses valid DEACTIVATED", () => {
      expect(parseStudentStatus("DEACTIVATED")).toBe(StudentStatus.DEACTIVATED);
    });
    it("returns null for invalid", () => {
      expect(parseStudentStatus("INVALID")).toBeNull();
    });
  });

  describe("parseDayOfWeek", () => {
    it("parses valid MONDAY", () => {
      expect(parseDayOfWeek("MONDAY")).toBe(DayOfWeek.MONDAY);
    });
    it("parses valid TUESDAY", () => {
      expect(parseDayOfWeek("TUESDAY")).toBe(DayOfWeek.TUESDAY);
    });
    it("parses valid WEDNESDAY", () => {
      expect(parseDayOfWeek("WEDNESDAY")).toBe(DayOfWeek.WEDNESDAY);
    });
    it("parses valid THURSDAY", () => {
      expect(parseDayOfWeek("THURSDAY")).toBe(DayOfWeek.THURSDAY);
    });
    it("parses valid FRIDAY", () => {
      expect(parseDayOfWeek("FRIDAY")).toBe(DayOfWeek.FRIDAY);
    });
    it("parses valid SATURDAY", () => {
      expect(parseDayOfWeek("SATURDAY")).toBe(DayOfWeek.SATURDAY);
    });
    it("parses valid SUNDAY", () => {
      expect(parseDayOfWeek("SUNDAY")).toBe(DayOfWeek.SUNDAY);
    });
    it("returns null for invalid", () => {
      expect(parseDayOfWeek("INVALID")).toBeNull();
    });
    it("returns null for null", () => {
      expect(parseDayOfWeek(null)).toBeNull();
    });
    it("returns null for undefined", () => {
      expect(parseDayOfWeek(undefined)).toBeNull();
    });
  });

  describe("parseIanaTimezone", () => {
    it("parses valid timezone", () => {
      expect(parseIanaTimezone("America/New_York")).toBe(IanaTimezone.America_New_York);
    });
    it("returns fallback for invalid", () => {
      expect(parseIanaTimezone("Invalid/Timezone", IanaTimezone.Europe_London)).toBe(IanaTimezone.Europe_London);
    });
    it("defaults to UTC", () => {
      expect(parseIanaTimezone("Invalid/Timezone")).toBe(IanaTimezone.UTC);
    });
  });

  describe("parseIanaTimezoneOrNull", () => {
    it("parses valid timezone", () => {
      expect(parseIanaTimezoneOrNull("America/New_York")).toBe(IanaTimezone.America_New_York);
    });
    it("returns null for invalid", () => {
      expect(parseIanaTimezoneOrNull("Invalid/Timezone")).toBeNull();
    });
    it("returns null for null", () => {
      expect(parseIanaTimezoneOrNull(null)).toBeNull();
    });
  });

  describe("parseOverrideState", () => {
    it("parses GRANTED", () => {
      expect(parseOverrideState("GRANTED")).toBe(OverrideState.GRANTED);
    });
    it("parses DENIED", () => {
      expect(parseOverrideState("DENIED")).toBe(OverrideState.DENIED);
    });
    it("returns null for invalid", () => {
      expect(parseOverrideState("INVALID")).toBeNull();
    });
    it("returns null for null", () => {
      expect(parseOverrideState(null)).toBeNull();
    });
  });

  describe("parseBookingStatus", () => {
    it("parses CONFIRMED", () => {
      expect(parseBookingStatus("confirmed")).toBe(BookingStatus.CONFIRMED);
    });
    it("parses RESCHEDULED", () => {
      expect(parseBookingStatus("rescheduled")).toBe(BookingStatus.RESCHEDULED);
    });
    it("returns fallback for invalid", () => {
      expect(parseBookingStatus("INVALID", BookingStatus.RESCHEDULED)).toBe(BookingStatus.RESCHEDULED);
    });
    it("defaults to CONFIRMED", () => {
      expect(parseBookingStatus("INVALID")).toBe(BookingStatus.CONFIRMED);
    });
  });

  describe("parseGroupClassAttendanceStatus", () => {
    it("parses PENDING", () => {
      expect(parseGroupClassAttendanceStatus("pending")).toBe(GroupClassAttendanceStatus.PENDING);
    });
    it("parses PRESENT", () => {
      expect(parseGroupClassAttendanceStatus("present")).toBe(GroupClassAttendanceStatus.PRESENT);
    });
    it("parses ABSENT", () => {
      expect(parseGroupClassAttendanceStatus("absent")).toBe(GroupClassAttendanceStatus.ABSENT);
    });
    it("parses LATE", () => {
      expect(parseGroupClassAttendanceStatus("late")).toBe(GroupClassAttendanceStatus.LATE);
    });
    it("returns fallback for invalid", () => {
      expect(parseGroupClassAttendanceStatus("INVALID", GroupClassAttendanceStatus.ABSENT)).toBe(
        GroupClassAttendanceStatus.ABSENT
      );
    });
    it("defaults to PENDING", () => {
      expect(parseGroupClassAttendanceStatus("INVALID")).toBe(GroupClassAttendanceStatus.PENDING);
    });
  });

  describe("isAppLocale", () => {
    it("returns true for ar", () => {
      expect(isAppLocale("ar")).toBe(true);
    });
    it("returns true for en", () => {
      expect(isAppLocale("en")).toBe(true);
    });
    it("returns false for invalid", () => {
      expect(isAppLocale("fr")).toBe(false);
    });
    it("returns false for empty string", () => {
      expect(isAppLocale("")).toBe(false);
    });
  });

  describe("normalizeContentLocale", () => {
    it("returns ar for ar", () => {
      expect(normalizeContentLocale("ar")).toBe("ar");
    });
    it("returns en for en", () => {
      expect(normalizeContentLocale("en")).toBe("en");
    });
    it("returns default ar for invalid", () => {
      expect(normalizeContentLocale("fr")).toBe("ar");
    });
    it("returns default ar for empty string", () => {
      expect(normalizeContentLocale("")).toBe("ar");
    });
  });
});
