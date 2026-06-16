"use server";

import { webcrypto } from "node:crypto";
import type { RecurringClassFormData } from "../recurringClassSchema";

export type CreateRecurringClassResponse =
  | {
      success: true;
      message: string;
      classId: string;
    }
  | {
      success: false;
      message: string;
    };

function secureRandom(): number {
  const array = new Uint32Array(1);
  webcrypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
}

export async function createRecurringClass(_data: RecurringClassFormData): Promise<CreateRecurringClassResponse> {
  await new Promise(resolve => setTimeout(resolve, 800 + secureRandom() * 600));

  const isSuccess = secureRandom() > 0.1;

  if (isSuccess) {
    const randomBytes = new Uint8Array(4);
    webcrypto.getRandomValues(randomBytes);
    const classId = `cls-${Array.from(randomBytes, byte => byte.toString(36)).join("")}`;

    return {
      success: true,
      message: "Recurring class created successfully",
      classId,
    };
  }

  return {
    success: false,
    message: "Failed to create recurring class. Please try again.",
  };
}
