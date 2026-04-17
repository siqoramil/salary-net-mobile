import { uploadApi } from './upload.api';

export const uploadService = {
  uploadReceipt(uri: string): Promise<string> {
    return uploadApi.uploadReceipt(uri);
  },
};

export { uploadApi };
