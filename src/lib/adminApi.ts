import axios from 'axios';

// Create an axios instance configured for admin API requests
const adminApi = axios.create({
  headers: {
    'x-admin-auth': 'true'
  }
});

export const adminApiGet = (url: string, params?: any) => {
  return adminApi.get(url, { params });
};

export const adminApiPost = (url: string, data: any) => {
  return adminApi.post(url, data);
};

export const adminApiPut = (url: string, data: any) => {
  return adminApi.put(url, data);
};

export const adminApiPatch = (url: string, data: any) => {
  return adminApi.patch(url, data);
};

export const adminApiDelete = (url: string, params?: any) => {
  return adminApi.delete(url, { params });
};

export default adminApi; 