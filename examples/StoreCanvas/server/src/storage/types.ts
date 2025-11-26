export interface StorageUploadResult {
  url: string;
  key: string;
}

export interface StorageClient {
  uploadImage(buffer: Buffer, contentType: string): Promise<StorageUploadResult>;
  uploadExport(buffer: Buffer, contentType: string): Promise<StorageUploadResult>;
  deleteObject(key: string): Promise<void>;
}
