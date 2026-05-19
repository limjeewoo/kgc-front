import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

export default function ProfessorLayout() {
  const navigate = useNavigate();
  
  // 사이드바 서브메뉴 토글 상태 관리
  const [isStudentMenuOpen, setIsStudentMenuOpen] = useState(false);
  const [isAttendConsultOpen, setIsAttendConsultOpen] = useState(false);
  const [isJobMenuOpen, setIsJobMenuOpen] = useState(false);

  // 근로 승인 대기 건수 상태 (사이드바 배지 표시용)
  const [pendingCount, setPendingCount] = useState(0);
  const token = localStorage.getItem('accessToken');
  const professorId = localStorage.getItem('userId') || 'PROF001';

  // 사이드바 전용 실시간 알림 데이터 패칭
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        const [studentsRes, jobsRes] = await Promise.all([
          fetch(`/api/v1/advisors/professor/${professorId}`, { headers }).then(res => res.json()),
          fetch('/api/v1/jobs/pending', { headers }).then(res => res.json())
        ]);
        const assignedStudents = studentsRes.data || [];
        const myPendingJobs = (jobsRes.data || []).filter(j => 
          assignedStudents.some(s => s.studentId === j.studentId)
        );
        setPendingCount(myPendingJobs.length);
      } catch (error) {
        console.error("사이드바 알림 개수 로드 실패:", error);
      }
    };
    if (token) fetchPendingCount();
  }, [token, professorId]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        
        .prof-wrap { display: flex; min-height: 100vh; background: #F0F2F7; font-family: 'DM Sans','Noto Sans KR',sans-serif; font-size: 14px; color: #111827; width: 100%; }
        .sidebar { width: 230px; min-height: 100vh; background: #1A3A5C; display: flex; flex-direction: column; flex-shrink: 0; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
        .sb-logo { display: flex; align-items: center; gap: 10px; padding: 22px 18px 18px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 8px; cursor: pointer; }
        .logo-icon { width: 32px; height: 32px; background: #3B82F6; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .logo-text { font-size: 12.5px; font-weight: 700; color: #fff; line-height: 1.3; }
        .logo-text span { display: block; font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.45); }
        .sb-sec { padding: 6px 10px 2px; margin-bottom: 8px; }
        .sb-lbl { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.3); letter-spacing: 1px; text-transform: uppercase; padding: 0 8px; margin-bottom: 5px; }
        
        .ni { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 8px; color: rgba(255,255,255,0.6); font-size: 12.5px; cursor: pointer; transition: all 0.15s; margin-bottom: 2px; user-select: none; }
        .ni:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .ni.active { background: #3B82F6; color: #fff; font-weight: 500; }
        .ni-icon { width: 15px; height: 15px; flex-shrink: 0; opacity: 0.7; }
        .ni.active .ni-icon { opacity: 1; }
        .arrow-icon { margin-left: auto; width: 12px; height: 12px; transition: transform 0.2s; opacity: 0.5; }
        .arrow-icon.open { transform: rotate(90deg); opacity: 0.9; }

        .sub-menu { display: flex; flex-direction: column; padding-left: 24px; margin-top: 2px; margin-bottom: 6px; gap: 2px; }
        .sub-ni { font-size: 12px; color: rgba(255,255,255,0.55); padding: 6px 10px; cursor: pointer; border-radius: 6px; transition: all 0.15s; display: flex; align-items: center; justify-content: space-between; }
        .sub-ni:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.9); }
        
        .nb { margin-left: auto; background: #EF4444; color: #fff; font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 20px; }
        
        .main { flex: 1; display: flex; flex-direction: column; min-width: 0; height: 100vh; overflow: hidden; }
      `}</style>

      <div className="prof-wrap">
        {/* 고정 사이드바 */}
        <div className="sidebar">
          <div className="sb-logo" onClick={() => navigate('/professor/dashboard')}>
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" width="16" height="16">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="logo-text">KMGC <span>경민대학교 국제교육원</span></div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">메인</div>
            <div className="ni" onClick={() => navigate('/professor/dashboard')}>
              <svg className="ni-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
              교수 대시보드
            </div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">업무 메뉴</div>
            
            <div className="ni" onClick={() => setIsStudentMenuOpen(!isStudentMenuOpen)}>
              <span>지도학생 관리</span>
              <svg className={`arrow-icon ${isStudentMenuOpen ? 'open' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            {isStudentMenuOpen && (
              <div className="sub-menu">
                <div className="sub-ni" onClick={() => navigate('/professor/students')}>담당 학생 목록</div>
                <div className="sub-ni" onClick={() => navigate('/professor/students/detail')}>학생 상세 조회</div>
              </div>
            )}

            <div className="ni" onClick={() => setIsAttendConsultOpen(!isAttendConsultOpen)}>
              <span>출결 및 상담 관리</span>
              <svg className={`arrow-icon ${isAttendConsultOpen ? 'open' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            {isAttendConsultOpen && (
              <div className="sub-menu">
                <div className="sub-ni" onClick={() => navigate('/professor/attendance')}>출결 입력</div>
                <div className="sub-ni" onClick={() => navigate('/professor/consult')}>상담 목록</div>
                <div className="sub-ni" onClick={() => navigate('/professor/consult/write')}>상담 일지 작성</div>
              </div>
            )}

            <div className="ni" onClick={() => setIsJobMenuOpen(!isJobMenuOpen)}>
              <span>근로 및 마일리지 관리</span>
              <svg className={`arrow-icon ${isJobMenuOpen ? 'open' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            {isJobMenuOpen && (
              <div className="sub-menu">
                <div className="sub-ni" onClick={() => navigate('/professor/jobs')}>
                  교수 1차 승인 
                  {pendingCount > 0 && <span className="nb">{pendingCount}</span>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 중첩 라우팅 콘텐츠가 렌더링되는 우측 본문 영역 */}
        <div className="main">
          <Outlet />
        </div>
      </div>
    </>
  );
}