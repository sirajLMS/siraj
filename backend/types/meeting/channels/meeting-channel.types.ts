export interface GenerateMeetingInput {
  readonly topic: string;
  readonly startDateTime?: string;
  readonly durationMinutes?: number;
  readonly actorUserId?: string;
  readonly providerUserId?: string;
}

export interface GenerateMeetingResult {
  readonly joinUrl: string;
  readonly meetingId?: string;
  readonly password?: string;
  readonly hostUrl?: string;
  readonly providerMetadata: Record<string, unknown>;
}

export interface IMeetingChannel {
  generateMeeting(input: GenerateMeetingInput): Promise<GenerateMeetingResult>;
  deleteMeeting?(meetingId: string): Promise<void>;
  validateConfig(): Promise<boolean>;
  disconnect(token?: { accessToken: string; refreshToken: string | null }): Promise<void>;
}

/** Cached OAuth token used by meeting adapter base. */
export interface CachedToken {
  readonly accessToken: string;
  readonly expiresAt: number;
}

