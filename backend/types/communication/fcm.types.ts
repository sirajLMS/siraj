import type { Messaging } from "firebase-admin/messaging";

export interface FcmPushContext {
  readonly messaging: Messaging;
  readonly projectId: string;
}
