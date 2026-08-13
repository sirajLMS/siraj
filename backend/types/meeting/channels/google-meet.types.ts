export interface GoogleMeetServiceAccountJson {
  readonly type: string;
  readonly project_id?: string;
  readonly private_key_id?: string;
  readonly private_key: string;
  readonly client_email: string;
  readonly client_id?: string;
}

export interface GoogleMeetTokenResponse {
  readonly access_token: string;
  readonly token_type: string;
  readonly expires_in: number;
}

export interface GoogleMeetSpaceResponse {
  readonly name: string;
  readonly meetingUri: string;
  readonly meetingCode: string;
  readonly config?: {
    readonly accessType?: number;
    readonly entryPointAccess?: string;
  };
}

export interface GoogleMeetErrorResponse {
  readonly error?: {
    readonly code: number;
    readonly message: string;
    readonly status?: string;
  };
}
