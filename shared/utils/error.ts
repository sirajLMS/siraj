import { parseUnknownPayload } from "./parseUnknown";

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause;

    if (cause !== undefined && cause !== null) {
      // If the cause is another Error instance, grab its message.
      // Otherwise, pass it to our safe payload parser.
      return cause instanceof Error ? cause.message : parseUnknownPayload(cause);
    }

    return error.message;
  }

  // If the top-level error isn't an Error instance, run it through the parser
  return parseUnknownPayload(error);
}
