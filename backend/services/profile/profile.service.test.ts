import { describe, expect, test } from "bun:test";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import { isRedirect, toParentRepoInput } from "@/backend/services";

describe("ProfileService helpers", () => {
  test("isRedirect identifies redirect resolutions", () => {
    expect(isRedirect({ redirect: "/dashboard" })).toBe(true);
    expect(
      isRedirect({
        scope: "own",
        mode: "view",
        audience: "teacher",
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
      defaultZoomLink: "https://zoom.us/j/123",
      invoiceType: "monthly",
      feeAmount: "500",
      paymentMethod: "bank_transfer",
      currency: "SAR",
      timezone: IanaTimezone.Asia_Riyadh,
    };

    expect(toParentRepoInput(adminInput)).toEqual({
      phone: "+966500000000",
      nationality: "SA",
      address: "Riyadh",
      facebook: "fb.com/parent",
      whatsapp: "+966500000001",
      twitter: "@parent",
      defaultZoomLink: "https://zoom.us/j/123",
      invoiceType: "monthly",
      feeAmount: "500",
      paymentMethod: "bank_transfer",
      currency: "SAR",
      timezone: IanaTimezone.Asia_Riyadh,
    });
  });

  test("maps parent own update input without admin-only fields", () => {
    const ownInput = {
      phone: "+966500000000",
      facebook: "fb.com/parent",
      whatsapp: "+966500000001",
      twitter: "@parent",
      defaultZoomLink: "https://zoom.us/j/123",
    };

    expect(toParentRepoInput(ownInput)).toEqual({
      phone: "+966500000000",
      nationality: undefined,
      address: undefined,
      facebook: "fb.com/parent",
      whatsapp: "+966500000001",
      twitter: "@parent",
      defaultZoomLink: "https://zoom.us/j/123",
      invoiceType: undefined,
      feeAmount: undefined,
      paymentMethod: undefined,
      currency: undefined,
      timezone: undefined,
    });
  });
});
