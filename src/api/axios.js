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

// ── refresh 단일화용 상태 ──
// 동시에 여러 요청이 401을 받아도 refresh는 딱 한 번만 실행하고,
// 나머지 요청들은 새 토큰이 나올 때까지 대기 큐에 모았다가 일괄 재시도한다.
let isRefreshing = false;
let pendingQueue = []; // { resolve, reject } 목록

// refresh 완료 후 대기 중인 요청들을 깨운다.
function flushQueue(error, newToken = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(newToken);
  });
  pendingQueue = [];
}

function forceLogout(message = '세션이 만료되었습니다. 다시 로그인해주세요.') {
  alert(message);
  localStorage.clear();
  window.location.href = '/login';
}

// [응답 인터셉터] 401(토큰 만료) 시 자동 Refresh
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // 401만 refresh 트리거. 403(권한 없음)은 refresh로 해결되지 않으므로 그대로 반환.
    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // refresh 엔드포인트 자체가 401이면 더 시도하지 않고 즉시 로그아웃.
    if (originalRequest.url?.includes('/api/v1/auth/refresh')) {
      forceLogout();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // 이미 다른 요청이 refresh를 진행 중이면, 끝날 때까지 대기했다가 새 토큰으로 재시도.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(instance(originalRequest));
          },
          reject: (err) => reject(err),
        });
      });
    }

    // 이 요청이 refresh를 대표로 수행한다.
    isRefreshing = true;
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      isRefreshing = false;
      forceLogout();
      return Promise.reject(error);
    }

    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      // 인터셉터 재귀를 피하려고 인스턴스가 아닌 순수 axios로 호출.
      const res = await axios.post(`${baseURL}/api/v1/auth/refresh`, { refreshToken });
      const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;

      localStorage.setItem('accessToken', newAccess);
      localStorage.setItem('refreshToken', newRefresh);

      // 대기 중이던 요청들을 새 토큰으로 깨운다.
      flushQueue(null, newAccess);

      // 대표 요청도 새 토큰으로 재시도.
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return instance(originalRequest);
    } catch (refreshError) {
      // refresh 실패 → 대기 요청 전부 실패 처리하고 로그아웃.
      flushQueue(refreshError, null);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default instance;