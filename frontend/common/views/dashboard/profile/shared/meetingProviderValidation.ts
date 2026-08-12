import type { z } from "zod";

export interface MeetingValidationMessages {
  readonly meetingProviderRequired: string;
  readonly meetingUrlRequired: string;
  readonly meetingUrlInvalid: string;
}

export function validateMeetingProviderFields(
  data: { meetingUrl?: string | null; meetingProvider?: { id: string | null } | null },
  ctx: z.RefinementCtx,
  messages: MeetingValidationMessages
): void {
  const hasUrl = Boolean(data.meetingUrl?.trim());
  const hasProvider = Boolean(data.meetingProvider?.id);
  if (hasUrl && !hasProvider) {
    ctx.addIssue({ code: "custom", message: messages.meetingProviderRequired, path: ["meetingProvider"] });
  }
  if (hasProvider && !hasUrl) {
    ctx.addIssue({ code: "custom", message: messages.meetingUrlRequired, path: ["meetingUrl"] });
  }
  if (hasUrl && data.meetingUrl) {
    const isValidUrl = (() => {
      try {
        return Boolean(new URL(data.meetingUrl));
      } catch {
        return false;
      }
    })();
    if (!isValidUrl) {
      ctx.addIssue({ code: "custom", message: messages.meetingUrlInvalid, path: ["meetingUrl"] });
    }
  }
}
