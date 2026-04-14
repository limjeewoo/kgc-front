import { create } from 'zustand';

const useAuthStore = create((set) => ({
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  role: localStorage.getItem('role') || null,
  userId: localStorage.getItem('userId') || null,

  // 로그인 성공 시 호출
  setAuth: ({ accessToken, refreshToken, role, userId }) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('role', role);
    localStorage.setItem('userId', userId);
    set({ accessToken, refreshToken, role, userId });
  },

  // 로그아웃 시 호출
  clearAuth: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    set({ accessToken: null, refreshToken: null, role: null, userId: null });
  },
}));

export default useAuthStore;