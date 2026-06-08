import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';

import MyDashboard from "../dashboard/MyDashboard";
import MyProfile from "../profile/MyProfile";
import MyEnroll from "../enroll/MyEnroll";
import MyAttendance from "../attendance/MyAttendance";
import MyJobs from "../jobs/MyJobs";
import JobUpload from "../jobs/JobUpload";
import MyMileage from "../mileage/MyMileage";

// 1. 레이아웃 전역 CSS 스타일 격리
const LAYOUT_STYLE_CSS = `
  .sl-wrap { 
    display: flex; 
    min-height: 100vh; 
    background: #F8FAFC; 
    font-family: 'DM Sans', 'Noto Sans KR', sans-serif;
    --sidebar-bg: #1A3A5C;
  }
  .sl-sidebar { 
    width: 230px; 
    min-height: 100vh; 
    background: var(--sidebar-bg); 
    display: flex; 
    flex-direction: column; 
    flex-shrink: 0; 
    position: sticky; 
    top: 0; 
    height: 100vh; 
    overflow-y: auto; 
  }
  .sl-logo { display: flex; align-items: center; gap: 10px; padding: 22px 18px 18px; border-bottom: 1px solid rgba(255,255,255,.08); margin-bottom: 8px; cursor: pointer; }
  .sl-logo-img { width: 32px; height: 32px; object-fit: contain; }
  .sl-logo-text { font-size: 12.5px; font-weight: 700; color: #fff; line-height: 1.3; }
  .sl-logo-text span { display: block; font-size: 10px; font-weight: 400; color: rgba(255,255,255,.45); }
  
  .sl-sec { padding: 6px 10px 2px; margin-bottom: 8px; }
  .sl-lbl { font-size: 10px; font-weight: 600; color: rgba(255,255,255,.3); letter-spacing: 1px; text-transform: uppercase; padding: 0 8px; margin-bottom: 5px; }
  
  .sl-ni { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 8px; color: rgba(255,255,255,.6); font-size: 12.5px; cursor: pointer; transition: all .15s; margin-bottom: 2px; user-select: none; }
  .sl-ni:hover { background: rgba(255,255,255,.07); color: #fff; }
  .sl-ni.active { background: #3B82F6; color: #fff; font-weight: 500; }
  
  .sl-sub-menu { display: flex; flex-direction: column; padding-left: 24px; margin-top: 2px; margin-bottom: 6px; gap: 2px; }
  .sl-sub-ni { font-size: 12px; color: rgba(255,255,255,.55); padding: 6px 10px; cursor: pointer; border-radius: 6px; transition: all .15s; display: flex; align-items: center; justify-content: space-between; }
  .sl-sub-ni:hover { background: rgba(255,255,255,.05); color: rgba(255,255,255,.9); }
  .sl-sub-ni.active { color: #60A5FA; font-weight: 600; background: rgba(255,255,255,.03); }
  
  .sl-main-content { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 100vh; overflow-x: hidden; }
  .sl-viewport-gate { padding: 24px 32px; flex: 1; display: flex; flex-direction: column; width: 100%; max-width: 1600px; margin: 0 auto; }
  
  @media (max-width: 768px) {
    .sl-viewport-gate { padding: 16px; }
  }
`;

// 2. 사이드바 서브메뉴 개폐 화살표 컴포넌트
function SidebarArrow({ open }) {
  return (
    <svg 
      viewBox="0 0 20 20" 
      fill="currentColor" 
      style={{ 
        ...styles.arrowIcon,
        transform: open ? 'rotate(90deg)' : 'rotate(0deg)' 
      }}
    >
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
    </svg>
  );
}

// 3. 레이아웃 구조 컴포넌트
function StudentLayoutStructure() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAcademyOpen, setIsAcademyOpen] = useState(true);
  const [isActivityOpen, setIsActivityOpen] = useState(true);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <style>{LAYOUT_STYLE_CSS}</style>
      <div className="sl-wrap">
        
        {/* 사이드바 영역 */}
        <div className="sl-sidebar">
          <div className="sl-logo" onClick={() => navigate('/student/dashboard')}>
            <img 
              src="/logo-fff.png" 
              alt="KMGC Logo" 
              className="sl-logo-img" 
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
            <div className="sl-logo-text">KMGC <span>경민대학교 국제교육원</span></div>
          </div>

          {/* 메인 허브 섹션 */}
          <div className="sl-sec">
            <div className="sl-lbl">Main Hub</div>
            <div className={`sl-ni ${isActive('/student/dashboard') ? 'active' : ''}`} onClick={() => navigate('/student/dashboard')}>
              학생 종합 대시보드
            </div>
            <div className={`sl-ni ${isActive('/student/profile') ? 'active' : ''}`} onClick={() => navigate('/student/profile')}>
              프로필 관리
            </div>
          </div>

          {/* 학업 및 활동 관리 섹션 */}
          <div className="sl-sec">
            <div className="sl-lbl">Academic & Activities</div>

            {/* 학업 서브 레이어 */}
            <div className="sl-ni" onClick={() => setIsAcademyOpen(p => !p)}>
              <span>학업 및 출결 관리</span>
              <SidebarArrow open={isAcademyOpen} />
            </div>
            {isAcademyOpen && (
              <div className="sl-sub-menu">
                <div className={`sl-sub-ni ${isActive('/student/enroll') ? 'active' : ''}`} onClick={() => navigate('/student/enroll')}>
                  수강 신청 / 등록 이력
                </div>
                <div className={`sl-sub-ni ${isActive('/student/attendance') ? 'active' : ''}`} onClick={() => navigate('/student/attendance')}>
                  실시간 출석 현황
                </div>
              </div>
            )}

            {/* 취업 서브 레이어 */}
            <div className="sl-ni" onClick={() => setIsActivityOpen(p => !p)}>
              <span>취업 및 활동 관리</span>
              <SidebarArrow open={isActivityOpen} />
            </div>
            {isActivityOpen && (
              <div className="sl-sub-menu">
                <div className={`sl-sub-ni ${isActive('/student/jobs') || isActive('/student/jobs/upload') ? 'active' : ''}`} onClick={() => navigate('/student/jobs')}>
                  취업 및 채용 정보 채널
                </div>
                <div className={`sl-sub-ni ${isActive('/student/mileage') ? 'active' : ''}`} onClick={() => navigate('/student/mileage')}>
                  KM 마일리지 통합 현황
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 메인 뷰포트 영역 */}
        <div className="sl-main-content">
          <div className="sl-viewport-gate">
            <Outlet />
          </div>
        </div>

      </div>
    </>
  );
}

// 4. 라우터 엔트리 컴포넌트
export default function StudentLayout() {
  return (
    <Routes>
      <Route element={<StudentLayoutStructure />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<MyDashboard />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="enroll" element={<MyEnroll />} />
        <Route path="attendance" element={<MyAttendance />} />
        <Route path="jobs" element={<MyJobs />} />
        <Route path="jobs/upload" element={<JobUpload />} />
        <Route path="mileage" element={<MyMileage />} />
      </Route>
    </Routes>
  );
}

// 5. 컴포넌트 내부 인라인 스타일 자산 격리
const styles = {
  arrowIcon: {
    marginLeft: 'auto', 
    width: 14, 
    height: 14, 
    transition: 'transform .22s cubic-bezier(0.4, 0, 0.2, 1)', 
    opacity: 0.5
  }
};