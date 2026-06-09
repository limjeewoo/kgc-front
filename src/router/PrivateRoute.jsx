import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

/**
 * 사용법:
 * <PrivateRoute allowedRoles={['ADMIN']}>
 *   <AdminDashboard />
 * </PrivateRoute>
 */
export default function PrivateRoute({ children, allowedRoles }) {
  const { accessToken, role } = useAuthStore();

  // 1. 비로그인 → 로그인 페이지로
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // 2. 권한 없음 → 본인 대시보드로
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'STAFF') return <Navigate to="/staff/dashboard" replace />;
    if (role === 'PROFESSOR') return <Navigate to="/professor/dashboard" replace />;
    if (role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  // 3. 통과
  return children;
}