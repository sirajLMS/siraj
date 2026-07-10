export interface ProfileLabels {
  readonly pageTitle: string;
  readonly editTitle: string;
  readonly notSet: string;
  readonly adminEditHint: string;
  readonly shell: {
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
  };
  readonly role: {
    readonly teacher: string;
    readonly parent: string;
    readonly staff: string;
  };
  readonly actions: {
    readonly edit: string;
    readonly save: string;
    readonly cancel: string;
    readonly retry: string;
  };
  readonly errors: {
    readonly failedToLoad: string;
    readonly notFound: string;
  };
  readonly convertedAmount: string;
  readonly convertedTotalApprox: string;
  readonly fieldAccess: {
    readonly restrictedTitle: string;
    readonly restrictedDescription: string;
  };
  readonly teacher: {
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
    readonly baseSalary: string;
    readonly paymentMethod: string;
    readonly convertedAmount: string;
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
    };
    readonly gender: {
      readonly male: string;
      readonly female: string;
    };
    readonly status: {
      readonly activated: string;
      readonly deactivated: string;
    };
  };
  readonly parent: {
    readonly ownSubtitle: string;
    readonly subtitle: string;
    readonly adminBanner: string;
    readonly convertedAmount: string;
    readonly sections: {
      readonly account: string;
      readonly contact: string;
      readonly social: string;
      readonly identity: string;
      readonly billing: string;
      readonly students: string;
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
    };
    readonly status: {
      readonly regular: string;
      readonly on_trial: string;
      readonly on_leave: string;
      readonly suspended: string;
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
    readonly students: {
      readonly empty: string;
      readonly mobileListLabel: string;
      readonly columns: {
        readonly name: string;
        readonly status: string;
        readonly teacher: string;
        readonly hoursPerWeek: string;
      };
    };
  };
  readonly staff: {
    readonly ownSubtitle: string;
    readonly subtitle: string;
    readonly adminBanner: string;
    readonly sections: {
      readonly account: string;
      readonly contact: string;
      readonly role: string;
      readonly permissions: string;
    };
    readonly fields: {
      readonly fullName: string;
      readonly primaryEmail: string;
      readonly phone: string;
      readonly roleName: string;
      readonly roleSlug: string;
      readonly department: string;
      readonly status: string;
      readonly statusActive: string;
      readonly statusInactive: string;
      readonly displayCurrency: string;
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
  };
  readonly banking: {
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
  };
  readonly students: {
    readonly title: string;
    readonly description: string;
    readonly allClasses: string;
    readonly mobileListLabel: string;
    readonly pagination: string;
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
  };
  readonly notifications: {
    readonly title: string;
    readonly description: string;
    readonly saved: string;
    readonly errorLoading: string;
    readonly errorSaving: string;
    readonly channels: {
      readonly EMAIL: string;
      readonly SMS: string;
      readonly PUSH: string;
      readonly ON_APP: string;
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
    };
  };
}
