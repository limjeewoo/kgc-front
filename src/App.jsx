import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './router/PrivateRoute.jsx';

import Login from './pages/auth/Login.jsx';
import AdminDashboard from './pages/admin/dashboard/AdminDashboard.jsx';
import ProfDashboard from './pages/professor/dashboard/ProfDashboard.jsx';
import MyDashboard from './pages/student/dashboard/MyDashboard.jsx';
import MyStudentList from './pages/professor/students/MyStudentList.jsx';

import StudentList from "./pages/admin/students/StudentList.jsx";
import BasicTab from "./pages/admin/students/StudentDetail/BasicTab.jsx";
import VisaTab from "./pages/admin/students/StudentDetail/VisaTab.jsx";
import TopikTab from "./pages/admin/students/StudentDetail/TopikTab.jsx";
import EnrollTab from "./pages/admin/students/StudentDetail/EnrollTab.jsx";
import AttendTab from "./pages/admin/students/StudentDetail/AttendTab.jsx";

import SearchByDept from './pages/admin/search/SearchByDept.jsx';
import SearchByClass from './pages/admin/search/SearchByClass.jsx';
import CourseList from './pages/admin/courses/CourseList.jsx';
import OnlineViolation from './pages/admin/search/OnlineViolation.jsx';

import ProfStudentDetail from './pages/professor/students/StudentDetail/index.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* --- ADMIN 권한 그룹 --- */}
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
        <Route path="/admin/search/dept" element={
          <PrivateRoute allowedRoles={['ADMIN']}>
            <SearchByDept />
          </PrivateRoute>
        } />
        <Route path="/admin/search/class" element={
          <PrivateRoute allowedRoles={['ADMIN']}>
            <SearchByClass />
          </PrivateRoute>
        } />
        <Route path="/admin/courses" element={
          <PrivateRoute allowedRoles={['ADMIN']}>
            <CourseList />
          </PrivateRoute>
        } />
        <Route path="/admin/search/online-violation" element={
          <PrivateRoute allowedRoles={['ADMIN']}>
            <OnlineViolation />
          </PrivateRoute>
        } />

        {/* ADMIN - 학생 상세 탭 분기 */}
        <Route path="/admin/students/:id" element={<Navigate replace to="basic" />} />
        <Route path="/admin/students/:id/basic" element={
          <PrivateRoute allowedRoles={['ADMIN']}>
            <BasicTab />
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

        {/* --- PROFESSOR 권한 그룹 --- */}
        <Route path="/professor/dashboard" element={
          <PrivateRoute allowedRoles={['PROFESSOR']}>
            <ProfDashboard />
          </PrivateRoute>
        } />
        <Route path="/professor/students" element={
          <PrivateRoute allowedRoles={['PROFESSOR']}>
            <MyStudentList />
          </PrivateRoute>
        } />
        
        {/* 학생 상세조회 클릭 시 StudentDetail/index.jsx로 다이렉트 매핑되는 라우트 */}
        <Route path="/professor/students/:studentId" element={
          <PrivateRoute allowedRoles={['PROFESSOR']}>
            <ProfStudentDetail />
          </PrivateRoute>
        } />

        {/* 💡 추후 출결(/attendance), 상담(/consult), 근로(/jobs) 페이지 컴포넌트 구현 시 반드시 이 와일드카드보다 위에 코드를 작성해야 대시보드로 튕기지 않습니다. */}
        <Route path="/professor/*" element={<Navigate to="/professor/dashboard" replace />} />

        {/* --- STUDENT 권한 그룹 --- */}
        <Route path="/student/dashboard" element={
          <PrivateRoute allowedRoles={['STUDENT']}>
            <MyDashboard />
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;