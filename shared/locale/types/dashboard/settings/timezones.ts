export interface SettingsTimezonesLabels {
  readonly emptyMessage: string;
  readonly searchPlaceholder: string;
  readonly searchingLabel: string;
  readonly columns: {
    readonly ianaId: string;
    readonly name: string;
    readonly offsetMinutes: string;
    readonly isDstSupported: string;
  };
  readonly dstSupportedYes: string;
  readonly dstSupportedNo: string;
  readonly offsetUtcPrefix: string;
}
