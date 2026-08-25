import { type PrepareUploadFn, performClientStorageUpload } from "@/frontend/common/utils/storage/uploadClientFile";

export type { PrepareUploadFn };

function sanitizeFileName(fileName: string): string {
  return fileName.replaceAll(/[/\\]/g, "_");
}

export async function uploadAvatarFile(params: {
  readonly file: File;
  readonly storageOwnerKey: string;
  readonly prepareUpload: PrepareUploadFn;
}): Promise<{ url: string }> {
  const sanitizedName = sanitizeFileName(params.file.name);
  const filePath = `public/avatars/${params.storageOwnerKey}/${sanitizedName}`;
  const contentType = params.file.type || "application/octet-stream";

  const url = await performClientStorageUpload({
    file: params.file,
    filePath,
    contentType,
    prepareUpload: params.prepareUpload,
  });

  return { url };
}
