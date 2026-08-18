export interface FeedbackManageParentLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly tabNavAriaLabel: string;
  readonly tabs: {
    readonly complaints: string;
    readonly suggestions: string;
  };
}
