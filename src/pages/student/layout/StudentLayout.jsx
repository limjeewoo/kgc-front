import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

export default function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAcademyOpen, setIsAcademyOpen] = useState(true);
  const [isActivityOpen, setIsActivityOpen] = useState(true);

  const isActive = (path) => location.pathname === path;
  const isSubActive = (path) => location.pathname.startsWith(path);

  const userName = localStorage.getItem('userName') || '학생';
  const userId   = localStorage.getItem('userId')   || '';

  const toggleAcademy = (e) => {
    e.preventDefault();
    setIsAcademyOpen(p => !p);
  };

  const toggleActivity = (e) => {
    e.preventDefault();
    setIsActivityOpen(p => !p);
  };

  const SidebarArrow = ({ open }) => (
    <svg 
      className={`arrow-icon ${open ? 'open' : ''}`} 
      viewBox="0 0 20 20" 
      fill="currentColor" 
      style={{ 
        marginLeft: 'auto', 
        width: 12, 
        height: 12, 
        transition: 'transform .2s', 
        opacity: .5, 
        transform: open ? 'rotate(90deg)' : 'rotate(0deg)' 
      }}
    >
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
    </svg>
  );

  return (
    <div className="sl-wrap" style={{ display: 'flex', minHeight: '100vh', background: '#F0F2F7', fontFamily: "'DM Sans', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        .sl-sidebar { width:230px; min-height:100vh; background:#1A3A5C; display:flex; flex-direction:column; flex-shrink:0; position:sticky; top:0; height:100vh; overflow-y:auto; }
        .sl-logo { display:flex; align-items:center; gap:10px; padding:22px 18px 18px; border-bottom:1px solid rgba(255,255,255,.08); margin-bottom:8px; cursor:pointer; }
        .sl-logo-img { width: 32px; height: 32px; object-fit: contain; }
        .sl-logo-text { font-size:12.5px; font-weight:700; color:#fff; line-height:1.3; }
        .sl-logo-text span { display:block; font-size:10px; font-weight:400; color:rgba(255,255,255,.45); }
        .sl-sec { padding:6px 10px 2px; margin-bottom:8px; }
        .sl-lbl { font-size:10px; font-weight:600; color:rgba(255,255,255,.3); letter-spacing:1px; text-transform:uppercase; padding:0 8px; margin-bottom:5px; }
        .sl-ni { display:flex; align-items:center; gap:8px; padding:9px 10px; border-radius:8px; color:rgba(255,255,255,.6); font-size:12.5px; cursor:pointer; transition:all .15s; margin-bottom:2px; user-select:none; }
        .sl-ni:hover { background:rgba(255,255,255,.07); color:#fff; }
        .sl-ni.active { background:#3B82F6; color:#fff; font-weight:500; }
        .sl-sub-menu { display:flex; flex-direction:column; padding-left:24px; margin-top:2px; margin-bottom:6px; gap:2px; }
        .sl-sub-ni { font-size:12px; color:rgba(255,255,255,.55); padding:6px 10px; cursor:pointer; border-radius:6px; transition:all .15s; display:flex; align-items:center; justify-content:space-between; user-select:none; }
        .sl-sub-ni:hover { background:rgba(255,255,255,.05); color:rgba(255,255,255,.9); }
        .sl-sub-ni.active { color:#60A5FA; font-weight:600; background:rgba(255,255,255,.03); }
        .sl-sidebar-bottom { margin-top:auto; padding:0.75rem; border-top:1px solid rgba(255,255,255,0.08); }
        .sl-user-info { display:flex; align-items:center; gap:0.625rem; padding:0.625rem; border-radius:0.5rem; }
        .sl-user-avatar { width:2rem; height:2rem; border-radius:50%; background:#3B82F6; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; color:#fff; flex-shrink:0; }
        .sl-user-name { font-size:0.8125rem; font-weight:600; color:#fff; }
        .sl-user-role { font-size:0.6875rem; color:rgba(255,255,255,0.4); margin-top:0.125rem; }
        .sl-main-content { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 100vh; overflow-x: hidden; }
      `}</style>

      <div className="sl-sidebar">
        <div className="sl-logo" onClick={() => navigate('/student/dashboard')}>
          <img 
            src="/logo-fff.png" 
            alt="Logo" 
            className="sl-logo-img" 
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
          <div className="sl-logo-text">KGC <span>경민대학교 국제교육원</span></div>
        </div>

        <div className="sl-sec">
          <div className="sl-lbl">메인</div>
          <div className={`sl-ni ${isActive('/student/dashboard') ? 'active' : ''}`} onClick={() => navigate('/student/dashboard')}>
            학생 종합 대시보드
          </div>
          <div className={`sl-ni ${isActive('/student/profile') ? 'active' : ''}`} onClick={() => navigate('/student/profile')}>
            프로필 관리
          </div>
        </div>

        <div className="sl-sec">
          <div className="sl-lbl">메뉴</div>

          <div className="sl-ni" onClick={toggleAcademy}>
            학업 및 출결 관리 <SidebarArrow open={isAcademyOpen} />
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

          <div className="sl-ni" onClick={toggleActivity}>
            근로 및 마일리지 관리 <SidebarArrow open={isActivityOpen} />
          </div>
          {isActivityOpen && (
            <div className="sl-sub-menu">
              <div className={`sl-sub-ni ${isSubActive('/student/jobs') ? 'active' : ''}`} onClick={() => navigate('/student/jobs')}>
                근로 신청서 제출
              </div>
              <div className={`sl-sub-ni ${isActive('/student/mileage') ? 'active' : ''}`} onClick={() => navigate('/student/mileage')}>
                KM 마일리지 통합 현황
              </div>
            </div>
          )}
        </div>

        {/* ── 사이드바 하단 로그인 계정 ── */}
        <div className="sl-sidebar-bottom">
          <div className="sl-user-info">
            <div className="sl-user-avatar">{userName.charAt(0)}</div>
            <div>
              <div className="sl-user-name">{userName}</div>
              <div className="sl-user-role">STUDENT{userId ? ` · ${userId}` : ''}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="sl-main-content">
        <Outlet />
      </div>
    </div>
  );
}