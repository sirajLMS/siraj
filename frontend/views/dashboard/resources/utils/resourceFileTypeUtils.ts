import type { ResourceFileType } from "@/frontend/views/dashboard/resources/types/resourcesTypes";

const EXTENSION_MAP: Record<string, ResourceFileType> = {
  pdf: "pdf",
  pptx: "pptx",
  xlsx: "xlsx",
  docx: "docx",
};

export function inferResourceFileType(fileName: string): ResourceFileType {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

  return EXTENSION_MAP[extension] ?? "pdf";
}
