// ProfileLabels — the profile namespace type schema
// All fields that used {param} placeholders in the old next-intl system
// are now typed as functions. Fields with no params remain plain strings.

export interface ProfileShellLabels {
  readonly tabs: {
    readonly profile: string;
    readonly paymentMethods: string;
    readonly meeting: string;
    readonly students: string;
    readonly notifications: string;
    readonly permissions: string;
  };
  readonly loading: string;
  readonly error: {
    readonly retry: string;
  };
}

export interface ProfileRoleLabels {
  readonly teacher: string;
  readonly parent: string;
  readonly staff: string;
  readonly student: string;
}

export interface ProfileActionsLabels {
  readonly edit: string;
  readonly save: string;
  readonly cancel: string;
  readonly retry: string;
  readonly saveSuccess: string;
  readonly saveError: string;
  readonly manageLifecycle: string;
}

export interface ProfileErrorsLabels {
  readonly failedToLoad: string;
  readonly notFound: string;
}

export interface ProfileFieldAccessLabels {
  readonly restrictedTitle: string;
  readonly restrictedDescription: string;
}

export interface ProfileTeacherLabels {
  readonly ownSubtitle: string;
  readonly subtitle: string;
  readonly adminBanner: string;
  readonly sections: {
    readonly account: string;
    readonly contact: string;
    readonly zoom: string;
    readonly compensation: string;
    readonly identity: string;
    readonly professional: string;
    readonly stats: string;
    readonly adminOnly: string;
  };
  readonly baseSalary: (amount: string, currency: string) => string;
  readonly paymentMethod: (method: string) => string;
  readonly convertedAmount: (
    lockedAmount: string,
    lockedCurrency: string,
    convertedApprox: string,
    displayCurrency: string
  ) => string;
  readonly stats: {
    readonly totalClasses: string;
    readonly avgEngagement: string;
  };
  readonly fields: {
    readonly fullName: string;
    readonly primaryEmail: string;
    readonly phone: string;
    readonly address: string;
    readonly timezone: string;
    readonly nationalId: string;
    readonly dateOfBirth: string;
    readonly gender: string;
    readonly qualifications: string;
    readonly hourlyRate: string;
    readonly currency: string;
    readonly paymentMethod: string;
    readonly status: string;
    readonly displayCurrency: string;
    readonly avatar: string;
  };
  readonly gender: {
    readonly male: string;
    readonly female: string;
  };
  readonly status: {
    readonly activated: string;
    readonly deactivated: string;
  };
  readonly nationalIdCompletion: {
    readonly banner: string;
    readonly action: string;
  };
  readonly validation: {
    readonly nationalIdRequired: string;
    readonly nationalIdInvalid: string;
  };
  readonly shell: ProfileShellLabels;
  readonly actions: ProfileActionsLabels;
  readonly errors: ProfileErrorsLabels;
}

export interface ProfileParentLabels {
  readonly ownSubtitle: string;
  readonly subtitle: string;
  readonly adminBanner: string;
  readonly convertedAmount: (
    lockedAmount: string,
    lockedCurrency: string,
    convertedApprox: string,
    displayCurrency: string
  ) => string;
  readonly sections: {
    readonly account: string;
    readonly contact: string;
    readonly social: string;
    readonly identity: string;
    readonly billing: string;
    readonly students: string;
    readonly adminOnly: string;
  };
  readonly fields: {
    readonly fullName: string;
    readonly primaryEmail: string;
    readonly phone: string;
    readonly whatsapp: string;
    readonly facebook: string;
    readonly twitter: string;
    readonly nationality: string;
    readonly address: string;
    readonly invoiceType: string;
    readonly feeAmount: string;
    readonly paymentMethod: string;
    readonly currency: string;
    readonly displayCurrency: string;
    readonly timezone: string;
    readonly lifecycleStatus: string;
    readonly accountStatus: string;
    readonly avatar: string;
  };
  readonly status: {
    readonly regular: string;
    readonly on_trial: string;
    readonly on_leave: string;
    readonly suspended: string;
    readonly deactivated: string;
  };
  readonly accountStatus: {
    readonly activated: string;
    readonly deactivated: string;
  };
  readonly actions: {
    readonly deactivateAccount: string;
    readonly deactivateDialogTitle: string;
    readonly deactivateConfirmText: string;
    readonly reactivateAccount: string;
    readonly reactivateDialogTitle: string;
    readonly reactivateConfirmText: string;
    readonly cancel: string;
    readonly deactivating: string;
    readonly reactivating: string;
    readonly deactivateSuccess: string;
    readonly reactivateSuccess: string;
    readonly manageLifecycle: string;
  };
  readonly common: {
    readonly student: {
      readonly fallbackInitial: string;
    };
    readonly teacher: {
      readonly fallbackInitial: string;
    };
  };
  readonly students: {
    readonly empty: string;
    readonly mobileListLabel: string;
    readonly columns: {
      readonly name: string;
      readonly status: string;
      readonly teacher: string;
      readonly hoursPerWeek: string;
    };
    readonly statusLabel: {
      readonly regular: string;
      readonly on_trial: string;
      readonly on_leave: string;
      readonly suspended: string;
      readonly deactivated: string;
    };
  };
  readonly notSet: string;
}

export interface ProfileStaffLabels {
  readonly ownSubtitle: string;
  readonly subtitle: string;
  readonly adminBanner: string;
  readonly sections: {
    readonly account: string;
    readonly contact: string;
    readonly role: string;
    readonly compensation: string;
    readonly permissions: string;
  };
  readonly fields: {
    readonly fullName: string;
    readonly primaryEmail: string;
    readonly phone: string;
    readonly timezone: string;
    readonly roleName: string;
    readonly roleSlug: string;
    readonly department: string;
    readonly status: string;
    readonly statusActive: string;
    readonly statusInactive: string;
    readonly displayCurrency: string;
    readonly hourlyRate: string;
    readonly currency: string;
    readonly avatar: string;
  };
  readonly permissions: {
    readonly inheritedGroups: string;
    readonly directOverrides: string;
    readonly empty: {
      readonly title: string;
      readonly description: string;
      readonly ownDescription: string;
    };
    readonly columns: {
      readonly resource: string;
      readonly action: string;
      readonly state: string;
    };
    readonly states: {
      readonly granted: string;
      readonly denied: string;
    };
  };
}

export interface ProfileBankingLabels {
  readonly title: string;
  readonly adminOnly: string;
  readonly encryptedNotice: string;
  readonly sections: {
    readonly banking: string;
    readonly verification: string;
  };
  readonly fields: {
    readonly beneficiaryName: string;
    readonly bankName: string;
    readonly accountNumber: string;
    readonly routingNumber: string;
    readonly swiftBic: string;
    readonly iban: string;
    readonly verifiedAt: string;
    readonly verifiedBy: string;
  };
  readonly verified: string;
  readonly notVerified: string;
  readonly notProvided: string;
  readonly empty: {
    readonly title: string;
    readonly description: string;
  };
  readonly actions: {
    readonly manage: string;
    readonly editHint: string;
  };
}

export interface ProfileStudentsLabels {
  readonly title: string;
  readonly description: string;
  readonly allClasses: string;
  readonly mobileListLabel: string;
  readonly pagination: (start: number, end: number, total: number) => string;
  readonly noRows: string;
  readonly columns: {
    readonly studentName: string;
    readonly parent: string;
    readonly class: string;
    readonly status: string;
    readonly hoursPerWeek: string;
    readonly classes: string;
  };
  readonly classUnknown: string;
  readonly parentUnknown: string;
  readonly empty: {
    readonly title: string;
    readonly description: string;
  };
  readonly errors: {
    readonly failedToLoad: string;
    readonly retry: string;
  };
}

export interface ProfileNotificationsLabels {
  readonly title: string;
  readonly description: string;
  readonly saved: string;
  readonly errorLoading: string;
  readonly errorSaving: string;
  readonly autoGeneration: {
    readonly title: string;
    readonly summary: string;
    readonly onSave: string;
    readonly preview: string;
    readonly booking: string;
    readonly learnMore: string;
    readonly learnLess: string;
    readonly createConfig: string;
    readonly step1Title: string;
    readonly step1Description: string;
    readonly step2Title: string;
    readonly step2Description: string;
    readonly step3Title: string;
    readonly step3Description: string;
  };
  readonly categories: {
    readonly info: string;
    readonly reminder: string;
    readonly urgent: string;
    readonly digest: string;
  };
  readonly channels: {
    readonly EMAIL: string;
    readonly SMS: string;
    readonly PUSH: string;
    readonly ON_APP: string;
    readonly WHATSAPP: string;
  };
  readonly events: {
    readonly CLASS_REMINDER: string;
    readonly INVOICE_GENERATED: string;
    readonly COMPLAINT_RESPONSE: string;
    readonly PAYMENT_METHOD_CHANGED: string;
    readonly NEW_COMPLAINT: string;
    readonly NEW_SUGGESTION: string;
    readonly SUGGESTION_ACKNOWLEDGED: string;
    readonly SUGGESTION_DUPLICATE_MARKED: string;
    // Student matrix (class lifecycle)
    readonly CLASS_SCHEDULED: string;
    readonly CLASS_ACTIVATED: string;
    readonly CLASS_STARTED: string;
    readonly CLASS_COMPLETED: string;
    readonly CLASS_MARKED_ABSENT: string;
    readonly CLASS_MARKED_MISSED: string;
    readonly CLASS_LEAVE_REQUESTED: string;
    readonly CLASS_RESCHEDULED: string;
    readonly CLASS_CANCELLED: string;
    readonly CLASS_RESET: string;
    // Supervisor / lesson-report matrix
    readonly LESSON_REPORT_SUBMITTED: string;
    readonly LESSON_REPORT_REVIEWED: string;
    // Quota & on-demand events
    readonly QUOTA_EXPIRING_SOON: string;
    readonly QUOTA_EXPIRED: string;
    readonly QUOTA_LOW_BALANCE: string;
    readonly ON_DEMAND_INSTANCE_PENDING_CREDIT: string;
    readonly ON_DEMAND_INSTANCE_REMINDER_T3: string;
    readonly ON_DEMAND_INSTANCE_REMINDER_T1: string;
    readonly ON_DEMAND_TEACHER_DAILY_DIGEST: string;
  };
  readonly connectAccount: {
    readonly connectButton: string;
    readonly connectingLabel: string;
    readonly connectedAs: (email: string) => string;
    readonly disconnectButton: string;
    readonly disconnectConfirmTitle: string;
    readonly disconnectConfirm: string;
    readonly confirmDisconnect: string;
    readonly cancel: string;
    readonly reconnectButton: string;
    readonly reconnectCallout: string;
    readonly statusConnected: string;
    readonly statusExpiring: string;
    readonly statusExpired: string;
    readonly statusDisconnected: string;
  };
}

export interface ProfileChangePasswordLabels {
  readonly title: string;
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly confirmPassword: string;
  readonly submit: string;
  readonly success: string;
}

export interface ProfileAdminResetPasswordLabels {
  readonly title: string;
  readonly description: (userName: string, userEmail: string) => string;
  readonly newPassword: string;
  readonly confirmPassword: string;
  readonly showPassword: string;
  readonly hidePassword: string;
  readonly sendEmail: string;
  readonly sendEmailLabel: string;
  readonly resetButton: string;
  readonly resettingButton: string;
  readonly cancelButton: string;
  readonly success: string;
  readonly error: string;
  readonly passwordRequired: string;
  readonly passwordMinLength: string;
  readonly passwordsDoNotMatch: string;
  readonly accountStatus: string;
  readonly statusActivated: string;
  readonly statusDeactivated: string;
  readonly cannotResetOwnPasswordViaAdmin: string;
}

export interface ProfileLabels {
  readonly shell: ProfileShellLabels;
  readonly pageTitle: string;
  readonly editTitle: string;
  readonly editAvatarTitle: string;
  readonly avatar: string;
  readonly notSet: string;
  readonly adminEditHint: string;
  readonly role: ProfileRoleLabels;
  readonly actions: ProfileActionsLabels;
  readonly errors: ProfileErrorsLabels;
  readonly changePassword: ProfileChangePasswordLabels;
  readonly convertedAmount: (
    lockedAmount: string,
    lockedCurrency: string,
    convertedApprox: string,
    displayCurrency: string
  ) => string;
  readonly convertedTotalApprox: (convertedApprox: string, displayCurrency: string) => string;
  readonly fieldAccess: ProfileFieldAccessLabels;
  readonly banking: ProfileBankingLabels;
  readonly students: ProfileStudentsLabels;
  readonly adminResetPassword: ProfileAdminResetPasswordLabels;
}
