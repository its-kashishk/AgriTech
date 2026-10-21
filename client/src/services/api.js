import axios from 'axios';

export const TOKEN_KEY = 'agritech_token';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api', timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 on a protected call means the token expired/invalid: clear it and tell the app.
api.interceptors.response.use(
  (r) => r,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.startsWith('/auth/login') && !url.startsWith('/auth/register')) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('agritech:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// Turns any axios error into a short, user-friendly message.
export function errMsg(err) {
  if (err.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (!err.response) return 'Cannot reach the server. Check your internet connection and that the API is running.';
  return err.response.data?.message || 'Something went wrong. Please try again.';
}
export default api;
