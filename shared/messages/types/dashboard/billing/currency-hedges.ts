export interface CurrencyHedgesLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly addHedge: string;
  readonly editHedge: string;
  readonly deleteHedge: string;
  readonly deleteConfirm: string;
  readonly cancel: string;
  readonly save: string;
  readonly createSuccess: string;
  readonly updateSuccess: string;
  readonly deleteSuccess: string;
  readonly saveFailed: string;
  readonly empty: string;
  readonly columns: {
    readonly currency: string;
    readonly amount: string;
    readonly hedgeType: string;
    readonly notes: string;
    readonly updatedAt: string;
    readonly actions: string;
  };
  readonly fields: {
    readonly currency: string;
    readonly amount: string;
    readonly hedgeType: string;
    readonly notes: string;
  };
}
