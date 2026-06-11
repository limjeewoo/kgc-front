import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 5000,
});

// [요청 인터셉터] 모든 요청에 토큰 부착
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// [응답 인터셉터] 401/403 에러(만료) 시 자동 Refresh
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // 401 또는 403 에러이고 재시도한 적이 없을 때
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        alert('세션이 만료되었습니다. 다시 로그인해주세요.');
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const res = await axios.post(`${baseURL}/api/v1/auth/refresh`, { refreshToken });
        const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;

        localStorage.setItem('accessToken', newAccess);
        localStorage.setItem('refreshToken', newRefresh);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return instance(originalRequest);
      } catch (refreshError) {
        alert('세션이 만료되었습니다. 다시 로그인해주세요.');
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default instance;