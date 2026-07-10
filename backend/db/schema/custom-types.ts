import { customType } from "drizzle-orm/pg-core";
import { decryptField, encryptField } from "@/backend/lib/field-encryption";

export const encryptedText = (name: string) =>
  customType<{ data: string | null; driverData: string }>({
    dataType() {
      return "text";
    },
    toDriver(value: string | null): string {
      if (value === null) return "";
      return encryptField(value);
    },
    fromDriver(value: string): string | null {
      return decryptField(value);
    },
  })(name);
