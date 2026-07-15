/**
 * SMS translation labels for complaint response
 */
export interface ComplaintResponseSmsLabels {
  readonly urgentResponse: (params: { parentName: string; complaintTitle: string; responseSummary: string }) => string;
}

/**
 * SMS translation labels for suggestion acknowledged
 */
export interface SuggestionAcknowledgedSmsLabels {
  readonly acknowledged: (params: { parentName: string; suggestionTitle: string }) => string;
}

/**
 * Top-level SMS namespace
 */
export interface SmsLabels {
  readonly complaintResponse: ComplaintResponseSmsLabels;
  readonly suggestionAcknowledged: SuggestionAcknowledgedSmsLabels;
}
