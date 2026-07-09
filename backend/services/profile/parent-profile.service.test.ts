import { describe, expect, test } from "bun:test";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";

function buildAdminParentInput(formData: {
  phone?: string;
  facebook?: string;
  whatsapp?: string;
  twitter?: string;
  defaultZoomLink?: string;
  nationality?: string;
  address?: string;
  invoiceType?: string;
  feeAmount?: string;
  paymentMethod?: string;
  currency?: string;
  timezone?: string;
}) {
  return {
    phone: formData.phone || null,
    facebook: formData.facebook || null,
    whatsapp: formData.whatsapp || null,
    twitter: formData.twitter || null,
    defaultZoomLink: formData.defaultZoomLink || null,
    nationality: formData.nationality || null,
    address: formData.address || null,
    invoiceType: formData.invoiceType || null,
    feeAmount: formData.feeAmount || null,
    paymentMethod: formData.paymentMethod || null,
    currency: formData.currency || null,
    timezone: formData.timezone || null,
  };
}

describe("parent profile admin input builder", () => {
  test("includes all billing fields for admin update", () => {
    const input = buildAdminParentInput({
      phone: "+966500000000",
      facebook: "fb.com/parent",
      whatsapp: "+966500000001",
      twitter: "@parent",
      defaultZoomLink: "https://zoom.us/j/123",
      nationality: "SA",
      address: "Riyadh",
      invoiceType: "monthly",
      feeAmount: "500",
      paymentMethod: "bank_transfer",
      currency: "SAR",
      timezone: IanaTimezone.Asia_Riyadh,
    });

    expect(input).toEqual({
      phone: "+966500000000",
      facebook: "fb.com/parent",
      whatsapp: "+966500000001",
      twitter: "@parent",
      defaultZoomLink: "https://zoom.us/j/123",
      nationality: "SA",
      address: "Riyadh",
      invoiceType: "monthly",
      feeAmount: "500",
      paymentMethod: "bank_transfer",
      currency: "SAR",
      timezone: IanaTimezone.Asia_Riyadh,
    });
  });
});
