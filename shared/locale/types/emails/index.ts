/**
 * Email translation labels for complaint response emails
 */
export interface ComplaintResponseEmailLabels {
  readonly subject: (params: { complaintTitle: string }) => string;
  readonly greeting: (params: { parentName: string }) => string;
  readonly body: (params: { complaintTitle: string }) => string;
  readonly responseLabel: string;
  readonly dateLabel: string;
  readonly footer: string;
}

/**
 * Email translation labels for suggestion acknowledged emails
 */
export interface SuggestionAcknowledgedEmailLabels {
  readonly subject: string;
  readonly greeting: (params: { parentName: string }) => string;
  readonly body: string;
  readonly suggestionLabel: string;
  readonly dateLabel: string;
  readonly footer: string;
}

/**
 * Top-level emails namespace
 */
export interface EmailsLabels {
  readonly complaintResponse: ComplaintResponseEmailLabels;
  readonly suggestionAcknowledged: SuggestionAcknowledgedEmailLabels;
}
