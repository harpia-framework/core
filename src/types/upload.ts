export type FileChecker = {
  maxSize: number;
  allowedExtensions: string[];
  allowedTypes: string[];
};

export type UploadConstructor = {
  path?: string;
  fieldName?: string;
  prefix?: string;
  fileName?: string;
  options?: Partial<FileChecker>;
};

export type CheckReturnObject = {
  status: number;
  message: string;
} | null;
