// Helper type to filter out keys ending with "Id"
export type OmitIdRelationFields<T> = {
  [K in keyof T as K extends `${string}Id` ? never : K]: T[K];
};

// omit "id" | "createdAt" | "updatedAt"
export type OmitEntityFields<T> = {
  [K in keyof T as K extends "id" | "createdAt" | "updatedAt" ? never : K]: T[K];
};
