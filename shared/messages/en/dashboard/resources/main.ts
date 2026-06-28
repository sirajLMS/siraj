import type { BooksAndBagsLabels, ResourcesLabels } from "../../../types/dashboard/resources";

export const booksAndBags: BooksAndBagsLabels = {
  pageTitle: "Books & Bags",
  pageSubtitle: "Browse and manage books and bags inventory.",
  noEntries: "No books or bags found.",
  statusAvailable: "Available",
  statusOutOfStock: "Out of Stock",
  deleteSuccess: "Book deleted successfully.",
  deleteFailed: "Failed to delete book.",
};

export const resources: ResourcesLabels = {
  pageTitle: "Learning Resources",
  pageSubtitle: "Manage and distribute educational materials for teachers and students.",
  upload: {
    sectionTitle: "Upload New Resource",
    documentName: "Document Name",
    documentNamePlaceholder: "e.g. Advanced Mathematics Guide",
    dropzoneTitle: "Drag and drop file here",
    dropzoneHint: "or browse your computer",
    supportedFormats: "Maximum file size: 25MB (PDF, DOCX, PPTX)",
    submit: "Upload",
    successMessage: "Resource uploaded successfully.",
  },
  guidelines: {
    title: "Upload Guidelines",
    items: [
      "Ensure file names are professional",
      "Check document for copyright compliance",
      "Resource will be visible to all assigned managers",
    ],
  },
  governance: {
    title: "Privacy & Governance",
    body: "Documents uploaded here are visible to Teachers only. Student and Parent access must be manually configured via the Permissions tab.",
  },
  library: {
    title: "Document Library",
    filter: "Filter",
    sortByDate: "Date",
    sortByName: "Name",
    typeAll: "Type: All",
    uploaded: "Uploaded",
    noEntries: "No resources match your filters",
  },
  deleteDialog: {
    title: "Delete Resource?",
    body: "This action cannot be undone. Are you sure you want to permanently delete {title}?",
    confirm: "Yes",
    cancel: "No",
  },
  validation: {
    documentNameRequired: "Please enter a document name.",
    fileRequired: "Please select a file to upload.",
  },
};
