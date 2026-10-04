import type { HandleUploadBody, HandleUploadOptions } from "@vercel/blob/client";

export type VercelUploadUrlClientPlayload = {
  sessionId: string;
  fileSize: number;
  contentType: string;
};

export type UploadRequestContext = {
  body: HandleUploadBody;
  clientPlayload: VercelUploadUrlClientPlayload;
  pathName: string;
  userId: string;
};

export type UploadCompletedPayload = Parameters<NonNullable<HandleUploadOptions["onUploadCompleted"]>>[0];

export type BeforeGenerateTokenContext = {
  pathName: string;
  sessionId: string;
  userId: string;
  contentType: string;
};
