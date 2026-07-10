import { describe, expect, test } from "bun:test";
import { CurrencyCode, ProfileAudience, ProfileMode, ProfileScope } from "@/backend/enum";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import { isRedirect, toParentRepoInput } from "@/backend/services";

describe("ProfileService helpers", () => {
  test("isRedirect identifies redirect resolutions", () => {
    expect(isRedirect({ redirect: "/dashboard" })).toBe(true);
    expect(
      isRedirect({
        scope: ProfileScope.OWN,
        mode: ProfileMode.VIEW,
        audience: ProfileAudience.TEACHER,
        actorUserId: "user-1",
        targetUserId: "user-1",
        allowedPermissions: [],
      })
    ).toBe(false);
  });
});

describe("toParentRepoInput", () => {
  test("maps parent admin update input including billing fields", () => {
    const adminInput = {
      phone: "+966500000000",
      nationality: "SA",
      address: "Riyadh",
      facebook: "fb.com/parent",
      whatsapp: "+966500000001",
      twitter: "@parent",
      invoiceType: "monthly",
      feeAmount: "500",
      currency: CurrencyCode.SAR,
      timezone: IanaTimezone.Asia_Riyadh,
    };

    expect(toParentRepoInput(adminInput)).toEqual({
      phone: "+966500000000",
      nationality: "SA",
      address: "Riyadh",
      facebook: "fb.com/parent",
      whatsapp: "+966500000001",
      twitter: "@parent",
      invoiceType: "monthly",
      feeAmount: "500",
      currency: CurrencyCode.SAR,
    });
  });

  test("maps parent own update input without admin-only fields", () => {
    const ownInput = {
      phone: "+966500000000",
      facebook: "fb.com/parent",
      whatsapp: "+966500000001",
      twitter: "@parent",
    };

    expect(toParentRepoInput(ownInput)).toEqual({
      phone: "+966500000000",
      nationality: undefined,
      address: undefined,
      facebook: "fb.com/parent",
      whatsapp: "+966500000001",
      twitter: "@parent",
      invoiceType: undefined,
      feeAmount: undefined,
      currency: undefined,
      timezone: undefined,
    });
  });

  test("maps displayCurrency through core profile fields", () => {
    const coreInput = {
      name: "Test User",
      email: "test@example.com",
      displayCurrency: CurrencyCode.USD,
    };

    expect(coreInput.displayCurrency).toBe(CurrencyCode.USD);
  });
});
