export interface ParentDocumentRow {
  readonly id: string;
  readonly fileId: string;
  readonly filePath: string;
  readonly isProtected: boolean;
  readonly usageType: string;
  readonly createdAt: Date;
}

export interface LinkedDocumentResult {
  readonly id: string;
  readonly fileId: string;
  readonly parentId: string;
  readonly usageType: string;
  readonly createdAt: Date;
}
