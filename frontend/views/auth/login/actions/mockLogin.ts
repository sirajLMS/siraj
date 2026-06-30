"use server";

import type { LoginFormData } from "../schemas/loginSchema";

export type LoginResponse =
  | {
      success: true;
      message: string;
      user: {
        id: string;
        email: string;
        role: string;
      };
    }
  | {
      success: false;
      message: string;
    };

/**
 * Generate a cryptographically secure random number between 0 and 1
 */
function secureRandom(): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / 4294967295; // Normalize to 0-1 range
}

/**
 * Mock login action that simulates authentication with random responses
 * This is for UI demonstration purposes only
 */
export async function mockLogin(data: LoginFormData): Promise<LoginResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + secureRandom() * 1000));

  // Random success/failure (70% success rate)
  const isSuccess = secureRandom() > 0.3;

  if (isSuccess) {
    // Generate random role
    const roles = ["admin", "teacher", "parent"];
    const randomRole = roles[Math.floor(secureRandom() * roles.length)];

    // Generate secure random ID
    const randomBytes = new Uint8Array(4);
    crypto.getRandomValues(randomBytes);
    const id = Array.from(randomBytes, byte => byte.toString(36)).join("");

    return {
      success: true,
      message: "Login successful!",
      user: {
        id,
        email: data.email,
        role: randomRole,
      },
    };
  }

  return {
    success: false,
    message: "Invalid email or password",
  };
}
