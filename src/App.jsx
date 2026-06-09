import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './router/PrivateRoute.jsx';

// 레이아웃
import ProfessorLayout from './pages/professor/layout/ProfessorLayout.jsx';
import StudentLayout from './pages/student/layout/StudentLayout.jsx'; 

// 공통 및 인증
import Login from './pages/auth/Login.jsx';

// 어드민 컴포넌트
import AdminDashboard from './pages/admin/dashboard/AdminDashboard.jsx';
// 조교 컴포넌트
import StaffDashboard   from './pages/staff/dashboard/StaffDashboard.jsx';
import StaffStudentList from './pages/staff/students/StaffStudentList.jsx';
import StaffBasicTab    from './pages/staff/students/StudentDetail/StaffBasicTab.jsx';
import SemesterManagement from "./pages/admin/semesters/SemestersManagement.jsx"; 
import BasicTab from "./pages/admin/students/StudentDetail/BasicTab.jsx";
import VisaTab from "./pages/admin/students/StudentDetail/VisaTab.jsx";
import TopikTab from "./pages/admin/students/StudentDetail/TopikTab.jsx";
import EnrollTab from "./pages/admin/students/StudentDetail/EnrollTab.jsx";
import AttendTab from "./pages/admin/students/StudentDetail/AttendTab.jsx";
import SearchByDept from './pages/admin/search/SearchByDept.jsx';
import SearchByClass from './pages/admin/search/SearchByClass.jsx';
import CourseList from './pages/admin/courses/CourseList.jsx';
import StudentList from "./pages/admin/students/StudentList.jsx";
import OnlineViolation from './pages/admin/search/OnlineViolation.jsx';

// 교수 컴포넌트
import ProfDashboard from './pages/professor/dashboard/ProfDashboard.jsx';
import MyStudentList from './pages/professor/students/MyStudentList.jsx';
import ProfStudentDetail from './pages/professor/students/StudentDetail/index.jsx';
import AttendanceInput from './pages/professor/attendance/AttendanceInput.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* --- STAFF 권한 그룹 --- */}
        <Route path="/staff/dashboard" element={<PrivateRoute allowedRoles={['STAFF']}><StaffDashboard /></PrivateRoute>} />
        <Route path="/staff/students"  element={<PrivateRoute allowedRoles={['STAFF']}><StaffStudentList /></PrivateRoute>} />
        <Route path="/staff/students/:id" element={<Navigate replace to="basic" />} />
        <Route path="/staff/students/:id/basic" element={<PrivateRoute allowedRoles={['STAFF']}><StaffBasicTab /></PrivateRoute>} />

        {/* --- ADMIN 권한 그룹 --- */}
        <Route path="/admin/dashboard" element={<PrivateRoute allowedRoles={['ADMIN']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/semesters" element={<PrivateRoute allowedRoles={['ADMIN']}><SemesterManagement /></PrivateRoute>} /> 
        <Route path="/admin/students" element={<PrivateRoute allowedRoles={['ADMIN']}><StudentList /></PrivateRoute>} />
        <Route path="/admin/search/dept" element={<PrivateRoute allowedRoles={['ADMIN']}><SearchByDept /></PrivateRoute>} />
        <Route path="/admin/search/class" element={<PrivateRoute allowedRoles={['ADMIN']}><SearchByClass /></PrivateRoute>} />
        <Route path="/admin/courses" element={<PrivateRoute allowedRoles={['ADMIN']}><CourseList /></PrivateRoute>} />
        <Route path="/admin/search/online-violation" element={<PrivateRoute allowedRoles={['ADMIN']}><OnlineViolation /></PrivateRoute>} />

        {/* ADMIN - 학생 상세 탭 분기 */}
        <Route path="/admin/students/:id" element={<Navigate replace to="basic" />} />
        <Route path="/admin/students/:id/basic" element={<PrivateRoute allowedRoles={['ADMIN']}><BasicTab /></PrivateRoute>} />
        <Route path="/admin/students/:id/visa" element={<PrivateRoute allowedRoles={['ADMIN']}><VisaTab /></PrivateRoute>} />
        <Route path="/admin/students/:id/topik" element={<PrivateRoute allowedRoles={['ADMIN']}><TopikTab /></PrivateRoute>} />
        <Route path="/admin/students/:id/enroll" element={<PrivateRoute allowedRoles={['ADMIN']}><EnrollTab /></PrivateRoute>} />
        <Route path="/admin/students/:id/attendance" element={<PrivateRoute allowedRoles={['ADMIN']}><AttendTab /></PrivateRoute>} />

        {/* ─── PROFESSOR 권한 그룹 (사이드바 레이아웃 일괄 적용) ─── */}
        <Route 
          path="/professor" 
          element={
            <PrivateRoute allowedRoles={['PROFESSOR']}>
              <ProfessorLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          
          <Route path="dashboard" element={<ProfDashboard />} />
          <Route path="students" element={<MyStudentList />} />
          <Route path="students/:studentId" element={<ProfStudentDetail />} />
          <Route path="attendance" element={<AttendanceInput />} />
          
          <Route path="consult" element={<div style={{ padding: '2rem' }}>상담 목록 준비 중</div>} />
          <Route path="consult/write" element={<div style={{ padding: '2rem' }}>상담 일지 작성 준비 중</div>} />
          <Route path="jobs" element={<div style={{ padding: '2rem' }}>교수 1차 승인 준비 중</div>} />
        </Route>

        <Route path="/professor/*" element={<Navigate to="/professor/dashboard" replace />} />

        {/* ─── STUDENT 권한 그룹 (내부 라우터 연동 모듈형 레이아웃) ─── */}
        <Route 
          path="/student/*" 
          element={
            <PrivateRoute allowedRoles={['STUDENT']}>
              <StudentLayout />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;