export interface MeetingConfigDisplayLabels {
  readonly defaultBadge: string;
  readonly meetingUrl: string;
  readonly username: string;
  readonly tenantId: string;
  readonly provider: string;
  readonly label: string;
  readonly meetingId: string;
  readonly source: string;
  readonly sourceClass: string;
  readonly sourceRecurring: string;
  readonly sourceTeacher: string;
  readonly sourceNone: string;
  readonly noMeeting: string;
  readonly passwordProtected: string;
}

export interface MeetingConfigJoinLabels {
  readonly joinMeeting: string;
  readonly joinUnavailable: string;
  readonly openInNewTab: string;
  readonly emptyTeacher: string;
  readonly emptyParent: string;
  readonly emptyClass: string;
  readonly setupLink: string;
  readonly providerTooltip: string;
}

export interface MeetingConfigManagerLabels {
  readonly add: string;
  readonly addTitle: string;
  readonly editTitle: string;
  readonly listTitle: string;
  readonly empty: string;
  readonly label: string;
  readonly provider: string;
  readonly cancel: string;
  readonly save: string;
  readonly deleteTitle: string;
  readonly deleteBody: string;
  readonly deleteConfirm: string;
  readonly loadError: string;
  readonly retry: string;
  readonly saved: string;
  readonly passwordHint: string;
  readonly passwordLeaveBlank: string;
  readonly providerChangeWarning: string;
  readonly urlNotAllowed: string;
  readonly setDefault: string;
  readonly setAsDefault: string;
  readonly edit: string;
  readonly delete: string;
  readonly saveError: string;
  readonly deleteError: string;
  readonly postCreateFailure: string;
}

export interface MeetingConfigFieldsLabels {
  readonly meetingUrl: string;
  readonly username: string;
  readonly password: string;
  readonly tenantId: string;
}

export interface MeetingConfigClassScopeLabels {
  readonly sectionTitle: string;
  readonly sectionSubtitle: string;
  readonly selectLabel: string;
  readonly selectPlaceholder: string;
  readonly useTeacherDefault: string;
  readonly noConfigs: string;
  readonly inheritedFromTeacher: string;
  readonly overrideActive: string;
  readonly effectiveSourceBanner: string;
  readonly recurringSectionTitle: string;
  readonly recurringSectionSubtitle: string;
  readonly createNewConfig: string;
  readonly recurringFieldsRequired: string;
  readonly seriesSectionTitle: string;
  readonly seriesSectionSubtitle: string;
  readonly manageSeriesLink: string;
}

export interface MeetingConfigProviderSelectLabels {
  readonly emptyCatalogTitle: string;
  readonly emptyCatalogBody: string;
  readonly emptyCatalogAdminLink: string;
  readonly emptyCatalogContactAdmin: string;
}

export interface MeetingConfigSummaryLabels {
  readonly sectionTitle: string;
  readonly loading: string;
  readonly empty: string;
  readonly manageLink: string;
}

export interface MeetingConfigRecurringScheduleLabels {
  readonly pageTitle: string;
  readonly scheduleSummary: string;
  readonly invalidId: string;
  readonly breadcrumbDashboard: string;
  readonly breadcrumbClasses: string;
  readonly goToClass: string;
}

export type MeetingConfigLabels = {
  readonly sectionTitle: string;
  readonly addConfig: string;
  readonly editConfig: string;
  readonly label: string;
  readonly provider: string;
  readonly cancel: string;
  readonly save: string;
  readonly loading: string;
  readonly empty: string;
  readonly display: MeetingConfigDisplayLabels;
  readonly join: MeetingConfigJoinLabels;
  readonly manager: MeetingConfigManagerLabels;
  readonly fields: MeetingConfigFieldsLabels;
  readonly classScope: MeetingConfigClassScopeLabels;
  readonly summary: MeetingConfigSummaryLabels;
  readonly providerSelect: MeetingConfigProviderSelectLabels;
  readonly recurringSchedule: MeetingConfigRecurringScheduleLabels;
};
