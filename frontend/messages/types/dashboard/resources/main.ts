export interface ResourceValidationLabels {
  readonly documentNameRequired: string;
  readonly fileRequired: string;
}

export interface ResourcesLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly upload: {
    readonly sectionTitle: string;
    readonly documentName: string;
    readonly documentNamePlaceholder: string;
    readonly dropzoneTitle: string;
    readonly dropzoneHint: string;
    readonly supportedFormats: string;
    readonly submit: string;
    readonly successMessage: string;
  };
  readonly guidelines: {
    readonly title: string;
    readonly items: readonly string[];
  };
  readonly governance: {
    readonly title: string;
    readonly body: string;
  };
  readonly library: {
    readonly title: string;
    readonly filter: string;
    readonly sortByDate: string;
    readonly sortByName: string;
    readonly typeAll: string;
    readonly uploaded: string;
    readonly noEntries: string;
  };
  readonly deleteDialog: {
    readonly title: string;
    readonly body: string;
    readonly confirm: string;
    readonly cancel: string;
  };
  readonly validation: ResourceValidationLabels;
}
