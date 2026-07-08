export interface ParentProfileLabels {
  readonly pageTitle: string;
  readonly status: {
    readonly regular: string;
  };
  readonly actions: {
    readonly editPicture: string;
    readonly editProfile: string;
    readonly uploadDocs: string;
    readonly addNewStudent: string;
    readonly viewInvoices: string;
    readonly deactivateAccount: string;
    readonly deactivateDialogTitle: string;
    readonly deactivateConfirmText: string;
    readonly cancel: string;
    readonly deactivating: string;
    readonly deactivateSuccess: string;
    readonly selectPicture: string;
    readonly changePicture: string;
    readonly upload: string;
    readonly avatarFileTypeError: string;
    readonly avatarFileSizeError: string;
    readonly avatarUploadSuccess: string;
  };
  readonly errors: {
    readonly invalidId: string;
    readonly notFound: string;
    readonly invalidData: string;
  };
  readonly sections: {
    readonly parentInfo: string;
    readonly socialMedia: string;
    readonly feesDetails: string;
    readonly parentStudents: string;
  };
  readonly fields: {
    readonly nationality: string;
    readonly email: string;
    readonly phone: string;
    readonly address: string;
    readonly facebook: string;
    readonly whatsapp: string;
    readonly zoomLink: string;
    readonly invoiceType: string;
    readonly feeAmount: string;
    readonly paymentMethod: string;
    readonly currency: string;
  };
  readonly table: {
    readonly studentName: string;
    readonly teacher: string;
    readonly hoursPerWeek: string;
    readonly classesLeft: string;
    readonly language: string;
    readonly gender: string;
    readonly info: string;
    readonly options: string;
    readonly status: string;
    readonly viewAllStudents: string;
  };
  readonly students: {
    readonly reassignTeacherTitle: string;
    readonly currentTeacher: string;
    readonly selectNewTeacher: string;
    readonly selectTeacherPlaceholder: string;
    readonly cancel: string;
    readonly reassigning: string;
    readonly confirmReassign: string;
    readonly reassignSuccess: string;
    readonly changeStatusTitle: string;
    readonly currentStatus: string;
    readonly selectNewStatus: string;
    readonly noStatusTransitionsAvailable: string;
    readonly changingStatus: string;
    readonly confirmStatusChange: string;
    readonly statusChangeSuccess: string;
    readonly statusLabel: {
      readonly regular: string;
      readonly suspended: string;
      readonly on_leave: string;
      readonly deactivated: string;
      readonly on_trial: string;
    };
  };
}
