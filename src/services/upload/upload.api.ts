import { api } from '../../api/api';
import { env } from '../../config/env';

export const uploadApi = {
  /**
   * Upload an image (from expo-image-picker URI) to the server.
   * Returns absolute URL.
   */
  async uploadReceipt(uri: string): Promise<string> {
    const form = new FormData();
    const filename = uri.split('/').pop() || 'receipt.jpg';
    const ext = filename.includes('.') ? filename.split('.').pop()!.toLowerCase() : 'jpg';
    const mime =
      ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    // React Native FormData accepts this shape — TS doesn't model it.
    form.append('file', {
      uri,
      name: filename,
      type: mime,
    } as unknown as Blob);

    const { data } = await api.post<{ url: string }>('/upload/receipt', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      transformRequest: (d) => d,
    });

    // Server returns relative path like /static/abc.jpg — make absolute.
    if (data.url.startsWith('http')) return data.url;
    const base = env.API_URL.replace(/\/api\/v1\/?$/, '');
    return `${base}${data.url}`;
  },
};
