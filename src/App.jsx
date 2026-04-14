// 화면 연결
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './router/PrivateRoute.jsx';
import Login from './pages/auth/Login.jsx';
import AdminDashboard from './pages/admin/dashboard/AdminDashboard.jsx';
import ProfDashboard from './pages/professor/dashboard/ProfDashboard.jsx';
import MyDashboard from './pages/student/dashboard/MyDashboard.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* 로그인 라우트 */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* 대시보드 라우트 - PrivateRoute로 보호 */}
        <Route path="/admin/dashboard" element={
          <PrivateRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </PrivateRoute>
        } />

        <Route path="/professor/dashboard" element={
          <PrivateRoute allowedRoles={['PROFESSOR']}>
            <ProfDashboard />
          </PrivateRoute>
        } />

        <Route path="/student/dashboard" element={
          <PrivateRoute allowedRoles={['STUDENT']}>
            <MyDashboard />
          </PrivateRoute>
        } />

        {/* 예외 처리 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;