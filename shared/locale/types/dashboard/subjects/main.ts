export interface SubjectDetailLabels {
  readonly pageTitle: (name: string) => string;
  readonly resourcesTitle: string;
  readonly resourcesSubtitle: (count: number) => string;
  readonly noResources: string;
  readonly notFound: string;
  readonly untitledResource: string;
  readonly download: string;
}

export interface SubjectsLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly addSubject: string;
  readonly allCategories: string;
  readonly categoriesTitle: string;
  readonly manageCategories: string;
  readonly hideCategories: string;
  readonly noSubjects: string;
  readonly loading: string;
  readonly inactive: string;
  readonly resourceCount: (count: number) => string;
  readonly nameLabel: string;
  readonly nameRequired: string;
  readonly slugLabel: string;
  readonly slugRequired: string;
  readonly categoryLabel: string;
  readonly categoryRequired: string;
  readonly selectCategory: string;
  readonly descriptionLabel: string;
  readonly activeLabel: string;
  readonly avatarLabel: string;
  readonly hourlyRateLabel: string;
  readonly currencyLabel: string;
  readonly createSubject: string;
  readonly editSubject: string;
  readonly deleteSubject: string;
  readonly deleteSubjectConfirm: (name: string) => string;
  readonly createCategory: string;
  readonly editCategory: string;
  readonly deleteCategory: string;
  readonly deleteCategoryConfirm: (name: string) => string;
  readonly cancel: string;
  readonly saveChanges: string;
  readonly saving: string;
  readonly subjectCreated: string;
  readonly subjectUpdated: string;
  readonly subjectDeleted: string;
  readonly categoryCreated: string;
  readonly categoryUpdated: string;
  readonly categoryDeleted: string;
  readonly detail: SubjectDetailLabels;
}
