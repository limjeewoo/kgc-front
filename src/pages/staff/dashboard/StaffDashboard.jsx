import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import useAuthStore from '../../../store/authStore';

// ── 조교 전용 컴포넌트
import StaffStudentList   from '../students/StaffStudentList.jsx';
import StaffStudentDetail from '../students/StudentDetail/StaffStudentDetail.jsx';
import StaffAttendPage  from '../attend/StaffAttendPage.jsx';

// ── 관리자 컴포넌트 재사용
import SearchByStudent   from '../../admin/search/SearchByStudent.jsx';
import SearchByDept      from '../../admin/search/SearchByDept.jsx';
import SearchByClass     from '../../admin/search/SearchByClass.jsx';
import SearchByCourse    from '../../admin/search/SearchByCourse.jsx';
import OnlineViolation   from '../../admin/search/OnlineViolation.jsx';
import StaffJobPendingPage from '../jobs/StaffJobPendingPage.jsx';
import StaffMileagePage    from '../jobs/StaffMileagePage.jsx';

// ── 메뉴 구성 상수
const SEARCH_SUB_MENUS = [
  '개인별 검색', '학과별 검색', '학과-반별 검색', '과목별 검색',
  '온라인 30% 초과 검색',
];

export default function StaffDashboard() {
  const [activeMenu, setActiveMenu]         = useState('대시보드');
  const [loading, setLoading]               = useState(true);
  const [searchOpen, setSearchOpen]         = useState(false);
  const [studentOpen, setStudentOpen]       = useState(false);
  const [selectedStudentId, setSelectedStudentId]     = useState(null);
  const [selectedStudentName, setSelectedStudentName] = useState(null);
  const [selectedStudentTab, setSelectedStudentTab]   = useState('basic');
  const [permissions, setPermissions]       = useState([]);

  const { clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch (e) {
      // 실패해도 로컬 클리어
    } finally {
      clearAuth();
      window.location.replace('/login');
    }
  };

  // ── 대시보드 데이터
  const [currentSemester, setCurrentSemester] = useState(null);
  const [totalStudents, setTotalStudents]     = useState(0);
  const [visaList, setVisaList]               = useState([]);
  const [attendanceList, setAttendanceList]   = useState([]);
  const [pendingJobs, setPendingJobs]         = useState([]);

  // ── 대시보드 데이터 fetch (관리자와 동일한 API 사용)
  useEffect(() => {
    if (activeMenu !== '대시보드') { setLoading(false); return; }
    const fetchData = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          api.get('/api/v1/semesters/current'),
          api.get('/api/v1/students'),
          api.get('/api/v1/visas/expiring', { params: { days: 30 } }),
          api.get('/api/v1/attend/warnings'),
          api.get('/api/v1/jobs/pending'),
          api.get('/api/v1/admin/role-permissions/STAFF'),
        ]);
        const [semRes, stuRes, visaRes, attendRes, jobsRes, permRes] = results;

        if (semRes.status   === 'fulfilled' && semRes.value?.data?.success)
          setCurrentSemester(semRes.value.data.data);
        if (stuRes.status   === 'fulfilled' && stuRes.value?.data?.success)
          setTotalStudents((stuRes.value.data.data || []).length);
        if (visaRes.status  === 'fulfilled' && visaRes.value?.data?.success)
          setVisaList(visaRes.value.data.data || []);
        if (attendRes.status === 'fulfilled' && attendRes.value?.data?.success)
          setAttendanceList(attendRes.value.data.data || []);
        if (jobsRes.status  === 'fulfilled' && jobsRes.value?.data?.success)
          setPendingJobs(jobsRes.value.data.data || []);
        if (permRes.status  === 'fulfilled' && permRes.value?.data?.success)
          setPermissions(permRes.value.data.data || []);
      } catch (e) {
        console.error('대시보드 로드 오류:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeMenu]);

  // ── 근로 승인/반려 (STAFF 권한 보유)
  const handleJobApproval = async (jobId, approved, reason = '') => {
    const body = approved ? { approved: true } : { approved: false, reason };
    try {
      const res = await api.patch(`/api/v1/jobs/${jobId}/approval`, body);
      if (res.data.success) {
        setPendingJobs(prev => prev.filter(j => j.jobId !== jobId));
      }
    } catch (e) {
      alert(e.response?.data?.message || '처리 중 오류가 발생했습니다.');
    }
  };

  const handleMenuClick = (name) => {
    if (name === '통합 검색') { setSearchOpen(p => !p); return; }
    setSelectedStudentId(null);
    setSelectedStudentName(null);
    setSelectedStudentTab('basic');
    setActiveMenu(name);
    if (!SEARCH_SUB_MENUS.includes(name)) setSearchOpen(false);
  };

  // ── 로딩 스피너
  if (loading && activeMenu === '대시보드') return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#F0F2F7' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid #E5E7EB', borderTopColor:'#1A3A5C', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
        <div style={{ color:'#6B7280', fontSize:'0.875rem' }}>데이터 동기화 중...</div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );

  const semLabel = currentSemester
    ? `${currentSemester.year}년 ${currentSemester.term}학기`
    : '학기 정보 없음';

  const isSearchActive = SEARCH_SUB_MENUS.includes(activeMenu);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

        :root { --primary:#3B82F6; --sidebar:#1A3A5C; }
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'DM Sans','Noto Sans KR',sans-serif; background:#F0F2F7; color:#111827; }

        /* ── 레이아웃 */
        .sw-wrap   { display:flex; min-height:100vh; }
        .sw-sidebar {
          width:230px; background:var(--sidebar); display:flex; flex-direction:column;
          position:sticky; top:0; height:100vh; flex-shrink:0; overflow-y:auto;
        }
        .sw-logo {
          display:flex; align-items:center; gap:10px;
          padding:24px 20px; border-bottom:1px solid rgba(255,255,255,0.08);
        }
        .sw-logo-icon {
          width:34px; height:34px; background:rgba(255,255,255,0.12); border-radius:8px;
          display:flex; align-items:center; justify-content:center; font-size:1rem; color:#fff; font-weight:700;
        }
        .sw-logo-txt   { font-size:0.8125rem; font-weight:700; color:#fff; line-height:1.3; }
        .sw-logo-txt span { display:block; font-size:0.625rem; font-weight:400; color:rgba(255,255,255,0.4); margin-top:2px; }

        .sw-sec  { padding:12px 12px 4px; }
        .sw-lbl  { font-size:0.625rem; font-weight:600; color:rgba(255,255,255,0.3); text-transform:uppercase; padding:0 8px; margin-bottom:4px; letter-spacing:0.06em; }
        .sw-nav  {
          display:flex; align-items:center; width:100%; border:none; background:transparent;
          padding:10px 12px; border-radius:8px; color:rgba(255,255,255,0.65); font-size:0.8125rem;
          cursor:pointer; transition:0.2s; margin-bottom:2px; text-align:left; gap:8px;
          font-family:inherit;
        }
        .sw-nav:hover          { background:rgba(255,255,255,0.08); color:#fff; }
        .sw-nav.active         { background:var(--primary); color:#fff; font-weight:600; }
        .sw-nav.parent-active  { background:rgba(59,130,246,0.15); color:#fff; }
        .sw-nav-badge {
          margin-left:auto; background:#EF4444; color:#fff;
          font-size:0.625rem; padding:1px 6px; border-radius:10px; font-weight:700;
        }
        .sw-nav-arrow { margin-left:auto; font-size:0.625rem; color:rgba(255,255,255,0.4); transition:transform 0.2s; }
        .sw-nav-arrow.open { transform:rotate(180deg); }

        .sw-sub { overflow:hidden; transition:max-height 0.25s ease, opacity 0.2s; max-height:0; opacity:0; }
        .sw-sub.open { max-height:300px; opacity:1; }
        .sw-sub-btn {
          display:flex; align-items:center; width:100%; border:none; background:transparent;
          padding:8px 12px 8px 32px; border-radius:8px; color:rgba(255,255,255,0.5);
          font-size:0.75rem; cursor:pointer; transition:0.15s; margin-bottom:1px; font-family:inherit; text-align:left;
        }
        .sw-sub-btn:hover  { background:rgba(255,255,255,0.06); color:#fff; }
        .sw-sub-btn.active { color:#93C5FD; font-weight:600; }

        .sw-sidebar-footer {
          margin-top:auto; padding:16px; border-top:1px solid rgba(255,255,255,0.08);
          font-size:0.6875rem; color:rgba(255,255,255,0.3); line-height:1.6;
        }
        .sw-sidebar-footer strong { color:rgba(255,255,255,0.6); display:block; margin-bottom:2px; }

        /* ── 메인 */
        .sw-main { flex:1; overflow-y:auto; }
        .sw-topbar {
          background:#fff; padding:0 28px; height:56px;
          display:flex; align-items:center; justify-content:space-between;
          border-bottom:1px solid #E5E7EB; position:sticky; top:0; z-index:10;
        }
        .sw-topbar-title { font-size:0.9375rem; font-weight:700; color:#111827; }
        .sw-semester-badge {
          font-size:0.75rem; background:#EFF6FF; color:#1D4ED8;
          padding:4px 12px; border-radius:20px; font-weight:600;
        }

        /* ── 콘텐츠 영역 */
        .sw-content { padding:24px 28px; animation:fadeUp 0.25s ease; }

        /* ── 요약 stat 카드 */
        .sw-stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; }
        .sw-stat {
          background:#fff; border-radius:14px; border:1px solid #F3F4F6;
          padding:18px 20px; cursor:pointer; transition:0.2s; text-align:left;
        }
        .sw-stat:hover { border-color:#CBD5E1; transform:translateY(-1px); }
        .sw-stat-lbl  { font-size:0.75rem; color:#9CA3AF; margin-bottom:6px; }
        .sw-stat-val  { font-size:1.625rem; font-weight:700; color:#111827; line-height:1; }
        .sw-stat-val .unit { font-size:0.875rem; font-weight:400; color:#9CA3AF; margin-left:3px; }
        .sw-stat-hint { font-size:0.6875rem; color:#CBD5E1; margin-top:4px; }

        /* ── 섹션 레이블 */
        .sw-sec-label {
          font-size:0.6875rem; font-weight:700; color:#9CA3AF;
          text-transform:uppercase; letter-spacing:0.08em;
          margin:24px 0 12px;
        }

        /* ── 위젯 카드 */
        .sw-card {
          background:#fff; border-radius:14px; border:1px solid #F3F4F6;
          overflow:hidden; margin-bottom:14px;
        }
        .sw-card-hd {
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 18px; border-bottom:1px solid #F3F4F6;
        }
        .sw-card-title { font-size:0.875rem; font-weight:700; color:#111827; }
        .sw-count-pill {
          font-size:0.6875rem; font-weight:700; padding:3px 10px;
          border-radius:20px; background:#F3F4F6; color:#374151;
        }
        .sw-count-pill.red    { background:#FEF2F2; color:#DC2626; }
        .sw-count-pill.amber  { background:#FFFBEB; color:#D97706; }
        .sw-count-pill.purple { background:#F5F3FF; color:#7C3AED; }

        .sw-list-row {
          display:flex; align-items:center; gap:12px;
          padding:11px 18px; border-bottom:1px solid #F9FAFB;
          cursor:pointer; transition:background 0.12s; width:100%; border:none; background:transparent;
          text-align:left; font-family:inherit;
        }
        .sw-list-row:last-child { border-bottom:none; }
        .sw-list-row:hover { background:#FAFAFA; }
        .sw-avatar {
          width:34px; height:34px; border-radius:8px;
          display:flex; align-items:center; justify-content:center;
          font-size:0.875rem; font-weight:700; flex-shrink:0;
        }
        .sw-row-name { font-size:0.8125rem; font-weight:600; color:#111827; }
        .sw-row-sub  { font-size:0.6875rem; color:#9CA3AF; margin-top:1px; }
        .sw-pill {
          margin-left:auto; font-size:0.6875rem; font-weight:700;
          padding:3px 10px; border-radius:20px; flex-shrink:0;
        }
        .sw-pill-red    { background:#FEF2F2; color:#DC2626; }
        .sw-pill-amber  { background:#FFFBEB; color:#D97706; }
        .sw-empty { padding:28px; text-align:center; color:#9CA3AF; font-size:0.8125rem; }

        /* ── 근로 승인 위젯 */
        .sw-job-row {
          display:flex; align-items:center; gap:12px;
          padding:12px 18px; border-bottom:1px solid #F9FAFB;
        }
        .sw-job-row:last-child { border-bottom:none; }
        .sw-job-info  { flex:1; min-width:0; }
        .sw-job-name  { font-size:0.8125rem; font-weight:600; color:#111827; }
        .sw-job-meta  { font-size:0.6875rem; color:#9CA3AF; margin-top:2px; }
        .sw-job-btns  { display:flex; gap:6px; flex-shrink:0; }
        .sw-btn-approve {
          padding:5px 12px; border-radius:6px; font-size:0.75rem; font-weight:600;
          border:none; cursor:pointer; background:#1A3A5C; color:#fff; transition:0.15s; font-family:inherit;
        }
        .sw-btn-approve:hover { background:#112740; }
        .sw-btn-reject {
          padding:5px 12px; border-radius:6px; font-size:0.75rem; font-weight:600;
          border:1px solid #FECACA; cursor:pointer; background:#fff; color:#DC2626;
          transition:0.15s; font-family:inherit;
        }
        .sw-btn-reject:hover { background:#FEF2F2; }

        /* ── 2열 그리드 */
        .sw-bottom-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

        /* ── 반응형 */
        @media (max-width: 1100px) {
          .sw-stat-grid { grid-template-columns:repeat(2,1fr); }
          .sw-bottom-grid { grid-template-columns:1fr; }
        }
        @media (max-width: 720px) {
          .sw-sidebar { width:200px; }
          .sw-stat-grid { grid-template-columns:1fr 1fr; }
        }
      `}</style>

      <div className="sw-wrap">
        {/* ════════════════════ 사이드바 ════════════════════ */}
        <aside className="sw-sidebar">
          <div className="sw-logo">
            <div className="sw-logo-icon">K</div>
            <div className="sw-logo-txt">
              KGC 조교 시스템
              <span>경민대학교 유학생 관리</span>
            </div>
          </div>

          <div className="sw-sec">
            <div className="sw-lbl">메인</div>
            <button
              className={`sw-nav ${activeMenu === '대시보드' ? 'active' : ''}`}
              onClick={() => handleMenuClick('대시보드')}
            >
              🏠 대시보드
            </button>
          </div>

          <div className="sw-sec">
            <div className="sw-lbl">학생</div>
            <button
              className={`sw-nav ${activeMenu === '학생 목록' ? 'active' : ''}`}
              onClick={() => handleMenuClick('학생 목록')}
            >
              🎓 학생 목록
            </button>
          </div>

          <div className="sw-sec">
            <div className="sw-lbl">근로·마일리지</div>
            <button
              className={`sw-nav ${activeMenu === '근로 승인' ? 'active' : ''}`}
              onClick={() => handleMenuClick('근로 승인')}
            >
              📋 근로 승인
              {pendingJobs.length > 0 && (
                <span className="sw-nav-badge">{pendingJobs.length}</span>
              )}
            </button>
            <button
              className={`sw-nav ${activeMenu === '마일리지' ? 'active' : ''}`}
              onClick={() => handleMenuClick('마일리지')}
            >
              ⭐ 마일리지
            </button>
          </div>

          <div className="sw-sec">
            <div className="sw-lbl">출결</div>
            <button
              className={`sw-nav ${activeMenu === '출결 관리' ? 'active' : ''}`}
              onClick={() => handleMenuClick('출결 관리')}
            >
              📅 출결 관리
            </button>
          </div>

          <div className="sw-sec">
            <div className="sw-lbl">통합 검색</div>
            <button
              className={`sw-nav ${isSearchActive ? 'parent-active' : ''}`}
              onClick={() => handleMenuClick('통합 검색')}
            >
              🔍 통합 검색
              <span className={`sw-nav-arrow ${searchOpen ? 'open' : ''}`}>▼</span>
            </button>
            <div className={`sw-sub ${searchOpen ? 'open' : ''}`}>
              {SEARCH_SUB_MENUS.map(m => (
                <button
                  key={m}
                  className={`sw-sub-btn ${activeMenu === m ? 'active' : ''}`}
                  onClick={() => handleMenuClick(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="sw-sidebar-footer">
            <strong>STAFF 계정</strong>
            {semLabel} 운영 중
          </div>
        </aside>

        {/* ════════════════════ 메인 영역 ════════════════════ */}
        <main className="sw-main">
          {/* 탑바 */}
          <div className="sw-topbar">
            <div className="sw-topbar-title">
              {activeMenu === '대시보드' ? '조교 대시보드' : activeMenu}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span className="sw-semester-badge">{semLabel}</span>
              <button
                onClick={handleLogout}
                style={{
                  padding:'6px 14px', borderRadius:8, border:'1px solid #E5E7EB',
                  background:'#fff', color:'#374151', fontSize:'0.8125rem',
                  fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                  transition:'background 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.background='#F9FAFB'}
                onMouseOut={e => e.currentTarget.style.background='#fff'}
              >
                로그아웃
              </button>
            </div>
          </div>

          {/* ── 대시보드 본문 */}
          {activeMenu === '대시보드' && (
            <div className="sw-content">

              {/* stat 요약 카드 4개 */}
              <div className="sw-stat-grid">
                <button className="sw-stat" onClick={() => handleMenuClick('학생 목록')}>
                  <div className="sw-stat-lbl">전체 유학생</div>
                  <div className="sw-stat-val">{totalStudents}<span className="unit">명</span></div>
                  <div className="sw-stat-hint">전체 등록 학생 수</div>
                </button>

                <button className="sw-stat" onClick={() => handleMenuClick('개인별 검색')}>
                  <div className="sw-stat-lbl">비자 만료 임박</div>
                  <div className="sw-stat-val" style={{ color: visaList.length > 0 ? '#EF4444' : '#111827' }}>
                    {visaList.length}<span className="unit">명</span>
                  </div>
                  <div className="sw-stat-hint">D-30 이내</div>
                </button>

                <button className="sw-stat" onClick={() => handleMenuClick('출결 관리')}>
                  <div className="sw-stat-lbl">출결 위험군</div>
                  <div className="sw-stat-val" style={{ color: attendanceList.length > 0 ? '#F59E0B' : '#111827' }}>
                    {attendanceList.length}<span className="unit">명</span>
                  </div>
                  <div className="sw-stat-hint">결석 기준 초과</div>
                </button>

                <button className="sw-stat" onClick={() => handleMenuClick('근로 승인 대기')}>
                  <div className="sw-stat-lbl">근로 승인 대기</div>
                  <div className="sw-stat-val" style={{ color: pendingJobs.length > 0 ? '#7C3AED' : '#111827' }}>
                    {pendingJobs.length}<span className="unit">건</span>
                  </div>
                  <div className="sw-stat-hint">승인 처리 필요</div>
                </button>
              </div>

              {/* 알림 현황 */}
              <div className="sw-sec-label">알림 현황</div>
              <div className="sw-bottom-grid">
                {/* 비자 만료 임박 */}
                <div className="sw-card">
                  <div className="sw-card-hd">
                    <span className="sw-card-title">비자 만료 임박 (D-30)</span>
                    <span className={`sw-count-pill ${visaList.length > 0 ? 'red' : ''}`}>
                      {visaList.length}명
                    </span>
                  </div>
                  {visaList.length === 0 ? (
                    <div className="sw-empty">만료 임박 학생이 없습니다. ✅</div>
                  ) : (
                    visaList.slice(0, 6).map(v => (
                      <button key={v.studentId} className="sw-list-row">
                        <div className="sw-avatar" style={{ background:'#FEF2F2', color:'#EF4444' }}>
                          {v.studentName?.[0] ?? '?'}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div className="sw-row-name">{v.studentName}</div>
                          <div className="sw-row-sub">비자: {v.visaType} · {v.expiryDate}</div>
                        </div>
                        <span className="sw-pill sw-pill-red">D-{v.dDay}</span>
                      </button>
                    ))
                  )}
                  {visaList.length > 6 && (
                    <div style={{ padding:'10px 18px', fontSize:'0.75rem', color:'#3B82F6', cursor:'pointer' }}
                      onClick={() => handleMenuClick('개인별 검색')}>
                      +{visaList.length - 6}명 더 보기 →
                    </div>
                  )}
                </div>

                {/* 출결 위험군 */}
                <div className="sw-card">
                  <div className="sw-card-hd">
                    <span className="sw-card-title">출결 위험군</span>
                    <span className={`sw-count-pill ${attendanceList.length > 0 ? 'amber' : ''}`}>
                      {attendanceList.length}명
                    </span>
                  </div>
                  {attendanceList.length === 0 ? (
                    <div className="sw-empty">출결 위험군이 없습니다. ✅</div>
                  ) : (
                    attendanceList.slice(0, 6).map(a => (
                      <button key={a.enrollId ?? a.studentId} className="sw-list-row">
                        <div className="sw-avatar" style={{ background:'#FFFBEB', color:'#D97706' }}>
                          {a.studentName?.[0] ?? '?'}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div className="sw-row-name">{a.studentName}</div>
                          <div className="sw-row-sub">{a.courseName ?? a.deptName}</div>
                        </div>
                        <span className="sw-pill sw-pill-amber">
                          결석 {a.totalAbsent ?? a.absenceCount}회
                        </span>
                      </button>
                    ))
                  )}
                  {attendanceList.length > 6 && (
                    <div style={{ padding:'10px 18px', fontSize:'0.75rem', color:'#3B82F6', cursor:'pointer' }}
                      onClick={() => handleMenuClick('출결 관리')}>
                      +{attendanceList.length - 6}명 더 보기 →
                    </div>
                  )}
                </div>
              </div>

              {/* 근로 승인 대기 위젯 — 조교 전용 */}
              <div className="sw-sec-label">근로 승인 대기</div>
              <div className="sw-card">
                <div className="sw-card-hd">
                  <span className="sw-card-title">승인 처리가 필요한 근로 신청</span>
                  <span className={`sw-count-pill ${pendingJobs.length > 0 ? 'purple' : ''}`}>
                    {pendingJobs.length}건
                  </span>
                </div>
                {pendingJobs.length === 0 ? (
                  <div className="sw-empty">처리 대기 중인 근로 신청이 없습니다. ✅</div>
                ) : (
                  pendingJobs.slice(0, 8).map(job => (
                    <div key={job.jobId} className="sw-job-row">
                      <div className="sw-avatar" style={{ background:'#F5F3FF', color:'#7C3AED' }}>
                        {job.studentName?.[0] ?? '?'}
                      </div>
                      <div className="sw-job-info">
                        <div className="sw-job-name">{job.studentName}</div>
                        <div className="sw-job-meta">
                          {job.workplace ?? '-'} · {job.weeklyHours ?? '-'}시간/주
                          {job.createdAt ? ` · ${job.createdAt.slice(0, 10)}` : ''}
                        </div>
                      </div>
                      <div className="sw-job-btns">
                        <button
                          className="sw-btn-approve"
                          onClick={() => handleJobApproval(job.jobId, true)}
                        >
                          승인
                        </button>
                        <button
                          className="sw-btn-reject"
                          onClick={() => {
                            const reason = window.prompt('반려 사유를 입력하세요:');
                            if (reason !== null) handleJobApproval(job.jobId, false, reason);
                          }}
                        >
                          반려
                        </button>
                      </div>
                    </div>
                  ))
                )}
                {pendingJobs.length > 8 && (
                  <div style={{ padding:'10px 18px', fontSize:'0.75rem', color:'#3B82F6', cursor:'pointer' }}
                    onClick={() => handleMenuClick('근로 승인 대기')}>
                    +{pendingJobs.length - 8}건 더 보기 →
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ── 서브 화면 라우팅 */}
          {activeMenu === '학생 목록' && !selectedStudentId && <StaffStudentList permissions={permissions} onStudentClick={(id, name) => { setSelectedStudentId(id); setSelectedStudentName(name); setSelectedStudentTab('basic'); }} />}
          {activeMenu === '학생 목록' && selectedStudentId && (
            <StaffStudentDetail
              studentId={selectedStudentId}
              studentName={selectedStudentName}
              permissions={permissions}
              activeTab={selectedStudentTab}
              onTabChange={setSelectedStudentTab}
              onBack={() => { setSelectedStudentId(null); setSelectedStudentName(null); setSelectedStudentTab('basic'); }}
            />
          )}


          {activeMenu === '출결 관리' && (
            <StaffAttendPage permissions={permissions} />
          )}
          {activeMenu === '근로 승인' && <StaffJobPendingPage permissions={permissions} />}
          {activeMenu === '마일리지'  && <StaffMileagePage    permissions={permissions} />}
          {activeMenu === '개인별 검색'       && <SearchByStudent onBack={() => setActiveMenu('대시보드')} />}
          {activeMenu === '학과별 검색'       && <SearchByDept onBack={() => setActiveMenu('대시보드')} />}
          {activeMenu === '학과-반별 검색'    && <SearchByClass onBack={() => setActiveMenu('대시보드')} />}
          {activeMenu === '과목별 검색'       && <SearchByCourse onBack={() => setActiveMenu('대시보드')} />}
          {activeMenu === '온라인 30% 초과 검색' && <OnlineViolation onBack={() => setActiveMenu('대시보드')} />}
        </main>
      </div>
    </>
  );
}
