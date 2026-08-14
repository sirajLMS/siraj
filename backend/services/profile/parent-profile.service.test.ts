import { describe, expect, test } from "bun:test";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

function buildAdminParentInput(formData: {
  phone?: string;
  facebook?: string;
  whatsapp?: string;
  twitter?: string;
  nationality?: string;
  address?: string;
  invoiceType?: string;
  feeAmount?: string;
  currency?: CurrencyCode;
  timezone?: string;
}) {
  return {
    phone: formData.phone ?? null,
    facebook: formData.facebook ?? null,
    whatsapp: formData.whatsapp ?? null,
    twitter: formData.twitter ?? null,
    nationality: formData.nationality ?? null,
    address: formData.address ?? null,
    invoiceType: formData.invoiceType ?? null,
    feeAmount: formData.feeAmount ?? null,
    currency: formData.currency ?? null,
    timezone: formData.timezone ?? null,
  };
}

describe("parent profile admin input builder", () => {
  test("includes billing fields for admin update", () => {
    const input = buildAdminParentInput({
      phone: "+966500000000",
      facebook: "fb.com/parent",
      whatsapp: "+966500000001",
      twitter: "@parent",
      nationality: "SA",
      address: "Riyadh",
      invoiceType: "monthly",
      feeAmount: "500",
      currency: CurrencyCode.SAR,
      timezone: IanaTimezone.Asia_Riyadh,
    });

    expect(input).toEqual({
      phone: "+966500000000",
      facebook: "fb.com/parent",
      whatsapp: "+966500000001",
      twitter: "@parent",
      nationality: "SA",
      address: "Riyadh",
      invoiceType: "monthly",
      feeAmount: "500",
      currency: CurrencyCode.SAR,
      timezone: IanaTimezone.Asia_Riyadh,
    });
  });
});
