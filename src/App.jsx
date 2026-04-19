import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './router/PrivateRoute.jsx';

// 페이지 컴포넌트 임포트
import Login from './pages/auth/Login.jsx';
import AdminDashboard from './pages/admin/dashboard/AdminDashboard.jsx';
import ProfDashboard from './pages/professor/dashboard/ProfDashboard.jsx';
import MyDashboard from './pages/student/dashboard/MyDashboard.jsx';

import StudentList from "./pages/admin/students/StudentList.jsx";
import BasicTab from "./pages/admin/students/StudentDetail/BasicTab.jsx";
import VisaTab from "./pages/admin/students/StudentDetail/VisaTab.jsx";
import TopikTab from "./pages/admin/students/StudentDetail/TopikTab.jsx";
import EnrollTab from "./pages/admin/students/StudentDetail/EnrollTab.jsx";
import AttendTab from "./pages/admin/students/StudentDetail/AttendTab.jsx";

// 통합 검색 관련 페이지 임포트 추가
import SearchByDept from './pages/admin/search/SearchByDept.jsx';
import SearchByClass from './pages/admin/search/SearchByClass.jsx';
import CourseList from './pages/admin/courses/CourseList.jsx';
import OnlineViolation from './pages/admin/search/OnlineViolation.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* 공통 라우트 */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* --- ADMIN 전용 라우트 --- */}
        <Route path="/admin/dashboard" element={
          <PrivateRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </PrivateRoute>
        } />

        <Route path="/admin/students" element={
          <PrivateRoute allowedRoles={['ADMIN']}>
            <StudentList />
          </PrivateRoute>
        } />

        {/* 통합 검색 (학과별) 라우트 추가 */}
        <Route path="/admin/search/dept" element={
          <PrivateRoute allowedRoles={['ADMIN']}>
            <SearchByDept />
          </PrivateRoute>
        } />

        {/* 출결 관리 (반별 결석 파악) 라우트 추가 */}
        <Route path="/admin/search/class" element={
          <PrivateRoute allowedRoles={['ADMIN']}>
            <SearchByClass />
          </PrivateRoute>
        } />

        {/* --- 학생 상세 페이지 모음 --- */}
        {/* /admin/students/:id 로 들어오면 기본적으로 basic 탭으로 이동 */}
        <Route path="/admin/students/:id" element={<Navigate replace to="basic" />} />

        <Route path="/admin/students/:id/basic" element={
          <PrivateRoute allowedRoles={['ADMIN']}>
            <BasicTab />
          </PrivateRoute>
        } />

        {/* 과목 관리 라우트 추가 */}
        <Route path="/admin/courses" element={
          <PrivateRoute allowedRoles={['ADMIN']}>
            <CourseList />
          </PrivateRoute>
        } />
        
        {/* 온라인 30% 위반 확인 라우트 추가 */}
        <Route path="/admin/search/online-violation" element={
          <PrivateRoute allowedRoles={['ADMIN']}>
            <OnlineViolation />
          </PrivateRoute>
        } />

        <Route path="/admin/students/:id/visa" element={
          <PrivateRoute allowedRoles={['ADMIN']}>
            <VisaTab />
          </PrivateRoute>
        } />

        <Route path="/admin/students/:id/topik" element={
          <PrivateRoute allowedRoles={['ADMIN']}>
            <TopikTab />
          </PrivateRoute>
        } />

        <Route path="/admin/students/:id/enroll" element={
          <PrivateRoute allowedRoles={['ADMIN']}>
            <EnrollTab />
          </PrivateRoute>
        } />

        <Route path="/admin/students/:id/attendance" element={
          <PrivateRoute allowedRoles={['ADMIN']}>
            <AttendTab />
          </PrivateRoute>
        } />

        {/* --- PROFESSOR 전용 라우트 --- */}
        <Route path="/professor/dashboard" element={
          <PrivateRoute allowedRoles={['PROFESSOR']}>
            <ProfDashboard />
          </PrivateRoute>
        } />

        {/* --- STUDENT 전용 라우트 --- */}
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