import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { storage, StorageKeys } from '../lib/storage';

export const api = axios.create({
  baseURL: env.API_URL,
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  const token = storage.getString(StorageKeys.ACCESS_TOKEN);
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pending: Array<(token: string | null) => void> = [];

function flushQueue(token: string | null) {
  pending.forEach((cb) => cb(token));
  pending = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    const refreshToken = storage.getString(StorageKeys.REFRESH_TOKEN);
    if (!refreshToken) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pending.push((token) => {
          if (!token) return reject(error);
          original.headers = original.headers ?? {};
          (original.headers as Record<string, string>).Authorization = `Bearer ${token}`;
          original._retry = true;
          resolve(api(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;
    try {
      const { data } = await axios.post(`${env.API_URL}/auth/refresh`, { refreshToken });
      storage.set(StorageKeys.ACCESS_TOKEN, data.accessToken);
      storage.set(StorageKeys.REFRESH_TOKEN, data.refreshToken);
      flushQueue(data.accessToken);
      original.headers = original.headers ?? {};
      (original.headers as Record<string, string>).Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (err) {
      flushQueue(null);
      storage.delete(StorageKeys.ACCESS_TOKEN);
      storage.delete(StorageKeys.REFRESH_TOKEN);
      storage.delete(StorageKeys.USER);
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);
