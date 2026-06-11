import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

export default function ProfessorLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isStudentMenuOpen, setIsStudentMenuOpen] = useState(true);
  const [isAttendConsultOpen, setIsAttendConsultOpen] = useState(true);

  // 현재 경로 활성화 표시용 헬퍼 함수
  const isActive = (path) => location.pathname === path;
  const isSubActive = (path) => location.pathname.startsWith(path);

  const SidebarArrow = ({ open }) => (
    <svg className={`arrow-icon ${open ? 'open' : ''}`} viewBox="0 0 20 20" fill="currentColor" style={{ marginLeft:'auto', width:12, height:12, transition:'transform .2s', opacity:.5, transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
    </svg>
  );

  return (
    <div className="pl-wrap" style={{ display: 'flex', minHeight: '100vh', background: '#F0F2F7', fontFamily: "'DM Sans', 'Noto Sans KR', sans-serif" }}>
      <style>{`
        .pl-sidebar { width:230px; min-height:100vh; background:#1A3A5C; display:flex; flex-direction:column; flex-shrink:0; position:sticky; top:0; height:100vh; overflow-y:auto; }
        .pl-logo { display:flex; align-items:center; gap:10px; padding:22px 18px 18px; border-bottom:1px solid rgba(255,255,255,.08); margin-bottom:8px; cursor:pointer; }
        .pl-logo-img { width: 32px; height: 32px; object-fit: contain; }
        .pl-logo-text { font-size:12.5px; font-weight:700; color:#fff; line-height:1.3; }
        .pl-logo-text span { display:block; font-size:10px; font-weight:400; color:rgba(255,255,255,.45); }
        .pl-sec { padding:6px 10px 2px; margin-bottom:8px; }
        .pl-lbl { font-size:10px; font-weight:600; color:rgba(255,255,255,.3); letter-spacing:1px; text-transform:uppercase; padding:0 8px; margin-bottom:5px; }
        .pl-ni { display:flex; align-items:center; gap:8px; padding:9px 10px; border-radius:8px; color:rgba(255,255,255,.6); font-size:12.5px; cursor:pointer; transition:all .15s; margin-bottom:2px; user-select:none; }
        .pl-ni:hover { background:rgba(255,255,255,.07); color:#fff; }
        .pl-ni.active { background:#3B82F6; color:#fff; font-weight:500; }
        .pl-sub-menu { display:flex; flex-direction:column; padding-left:24px; margin-top:2px; margin-bottom:6px; gap:2px; }
        .pl-sub-ni { font-size:12px; color:rgba(255,255,255,.55); padding:6px 10px; cursor:pointer; border-radius:6px; transition:all .15s; display:flex; align-items:center; justify-content:space-between; }
        .pl-sub-ni:hover { background:rgba(255,255,255,.05); color:rgba(255,255,255,.9); }
        .pl-sub-ni.active { color:#60A5FA; font-weight:600; background:rgba(255,255,255,.03); }
        .pl-main-content { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 100vh; overflow-x: hidden; }
      `}</style>

      {/* ── 고정 왼쪽 사이드바 ── */}
      <div className="pl-sidebar">
        <div className="pl-logo" onClick={() => navigate('/professor/dashboard')}>
          <img src="/logo-fff.png" alt="Logo" className="pl-logo-img" onError={(e) => e.target.style.display='none'} />
          <div className="pl-logo-text">KGC <span>경민대학교 국제교육원</span></div>
        </div>

        <div className="pl-sec">
          <div className="pl-lbl">메인</div>
          <div className={`pl-ni ${isActive('/professor/dashboard') ? 'active' : ''}`} onClick={() => navigate('/professor/dashboard')}>
            교수 대시보드
          </div>
        </div>

        <div className="pl-sec">
          <div className="pl-lbl">업무 메뉴</div>

          {/* 대메뉴 1 */}
          <div className="pl-ni" onClick={() => setIsStudentMenuOpen(p => !p)}>
            지도학생 관리 <SidebarArrow open={isStudentMenuOpen} />
          </div>
          {isStudentMenuOpen && (
            <div className="pl-sub-menu">
              <div className={`pl-sub-ni ${isSubActive('/professor/students') ? 'active' : ''}`} onClick={() => navigate('/professor/students')}>
                담당 학생 목록
              </div>
            </div>
          )}

          {/* 대메뉴 2 */}
          <div className="pl-ni" onClick={() => setIsAttendConsultOpen(p => !p)}>
            출결 및 상담 관리 <SidebarArrow open={isAttendConsultOpen} />
          </div>
          {isAttendConsultOpen && (
            <div className="pl-sub-menu">
              <div className={`pl-sub-ni ${isActive('/professor/attendance') ? 'active' : ''}`} onClick={() => navigate('/professor/attendance')}>
                출결 입력
              </div>
              <div className={`pl-sub-ni ${isActive('/professor/consult') ? 'active' : ''}`} onClick={() => navigate('/professor/consult')}>
                상담 이력 관리
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 우측 가변 메인 컨텐츠 컴포넌트 출력 영역 ── */}
      <div className="pl-main-content">
        <Outlet />
      </div>
    </div>
  );
}