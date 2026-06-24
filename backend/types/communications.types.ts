import type { NotificationEventType } from "@/shared/lib/enum";

export type CommunicationPayload = {
  readonly userId: string;
  readonly title: string;
  readonly body: string | null;
  readonly channel: "on_app" | "email";
  readonly eventType: NotificationEventType;
};
