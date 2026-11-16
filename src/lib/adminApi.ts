import axios from "axios";

/**
 * Admin API client. Relies on NextAuth HTTP-only session cookies.
 * Never sends spoofable x-admin-auth headers.
 */
const adminApi = axios.create({
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const adminApiGet = (url: string, params?: Record<string, unknown>) => {
  return adminApi.get(url, { params });
};

export const adminApiPost = (url: string, data: unknown) => {
  return adminApi.post(url, data);
};

export const adminApiPut = (url: string, data: unknown) => {
  return adminApi.put(url, data);
};

export const adminApiPatch = (url: string, data: unknown) => {
  return adminApi.patch(url, data);
};

export const adminApiDelete = (url: string, params?: Record<string, unknown>) => {
  return adminApi.delete(url, { params });
};

export default adminApi;
