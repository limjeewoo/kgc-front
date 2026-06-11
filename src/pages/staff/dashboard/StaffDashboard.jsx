import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import useAuthStore from '../../../store/authStore';

import StaffStudentList    from '../students/StaffStudentList.jsx';
import StaffStudentDetail  from '../students/StudentDetail/StaffStudentDetail.jsx';
import StaffAttendPage     from '../attend/StaffAttendPage.jsx';
import StaffVisaExpirePage from '../visa/StaffVisaExpirePage.jsx';

import SearchByStudent  from '../../admin/search/SearchByStudent.jsx';
import SearchByDept     from '../../admin/search/SearchByDept.jsx';
import SearchByClass    from '../../admin/search/SearchByClass.jsx';
import SearchByCourse   from '../../admin/search/SearchByCourse.jsx';
import OnlineViolation  from '../../admin/search/OnlineViolation.jsx';
import StaffJobPendingPage from '../jobs/StaffJobPendingPage.jsx';
import StaffMileagePage    from '../jobs/StaffMileagePage.jsx';

const SEARCH_SUB_MENUS = [
  '개인별 검색', '학과별 검색', '학과-반별 검색', '과목별 검색', '온라인 30% 초과 검색',
];

export default function StaffDashboard() {
  const [activeMenu, setActiveMenu]               = useState('대시보드');
  const [loading, setLoading]                     = useState(true);
  const [searchOpen, setSearchOpen]               = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedStudentName, setSelectedStudentName] = useState(null);
  const [selectedStudentTab, setSelectedStudentTab]   = useState('basic');
  const [permissions, setPermissions]             = useState([]);

  const { clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try { await api.post('/api/v1/auth/logout'); } catch {}
    finally { clearAuth(); window.location.replace('/login'); }
  };

  const [currentSemester, setCurrentSemester] = useState(null);
  const [totalStudents, setTotalStudents]     = useState(0);
  const [visaList, setVisaList]               = useState([]);
  const [attendanceList, setAttendanceList]   = useState([]);
  const [pendingJobs, setPendingJobs]         = useState([]);

  // 엑셀 업로드 모달
  const [uploadModal, setUploadModal]   = useState(null); // 'student' | 'foreign' | 'attend'
  const [uploadFile, setUploadFile]     = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [currentSemesterId, setCurrentSemesterId] = useState('');

  useEffect(() => {
    api.get('/api/v1/semesters/current')
      .then(res => { if (res.data?.success) setCurrentSemesterId(res.data.data?.semesterId || ''); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/api/v1/admin/role-permissions/STAFF')
      .then(res => { if (res.data?.success) setPermissions(res.data.data || []); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeMenu !== '대시보드') { setLoading(false); return; }
    const fetchData = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          api.get('/api/v1/semesters/current'),
          api.get('/api/v1/students'),
          api.get('/api/v1/visas/expiring', { params: { days: 60 } }),
          api.get('/api/v1/attend/warnings'),
          api.get('/api/v1/jobs/pending'),
        ]);
        const [semRes, stuRes, visaRes, attendRes, jobsRes] = results;
        if (semRes.status    === 'fulfilled' && semRes.value?.data?.success)    setCurrentSemester(semRes.value.data.data);
        if (stuRes.status    === 'fulfilled' && stuRes.value?.data?.success)    setTotalStudents((stuRes.value.data.data || []).length);
        if (visaRes.status   === 'fulfilled' && visaRes.value?.data?.success)   setVisaList(visaRes.value.data.data || []);
        if (attendRes.status === 'fulfilled' && attendRes.value?.data?.success) setAttendanceList(attendRes.value.data.data || []);
        if (jobsRes.status   === 'fulfilled' && jobsRes.value?.data?.success)   setPendingJobs(jobsRes.value.data.data || []);
      } catch (e) { console.error('대시보드 로드 오류:', e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [activeMenu]);

  const handleUploadSubmit = async () => {
    if (!uploadFile) { alert('파일을 선택해주세요.'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      let res;
      if (uploadModal === 'student') {
        res = await api.post('/api/v1/students/bulk-upload', fd, { headers:{'Content-Type':'multipart/form-data'} });
      } else if (uploadModal === 'foreign') {
        res = await api.post('/api/v1/students/bulk-update-foreign', fd, { headers:{'Content-Type':'multipart/form-data'} });
      } else if (uploadModal === 'attend') {
        if (!currentSemesterId) { alert('현재 학기 정보를 불러올 수 없습니다.'); setUploading(false); return; }
        res = await api.post(`/api/v1/attend/upload?semesterId=${currentSemesterId}`, fd, { headers:{'Content-Type':'multipart/form-data'}, timeout:30000 });
      }
      if (res?.data?.success) {
        const msgs = { student:'학생 일괄 등록이 완료되었습니다.', foreign:'외국인현황 업데이트가 완료되었습니다.', attend:'출결 업로드가 완료되었습니다.' };
        alert(msgs[uploadModal]);
        setUploadModal(null); setUploadFile(null);
      } else { alert(res?.data?.message || '업로드 실패'); }
    } catch(e) { alert(e.response?.data?.message || '업로드 중 오류가 발생했습니다.'); }
    finally { setUploading(false); }
  };

  const UPLOAD_META = {
    student: {
      title: '학생 일괄 등록',
      notices: [
        '1행은 헤더로 건너뛰고 2행부터 데이터를 읽습니다.',
        '학과명은 DB에 등록된 학과명과 정확히 일치해야 합니다.',
        '이미 등록된 학번은 스킵됩니다 (덮어쓰기 안 함).',
        '컬럼 순서를 변경하지 마세요.',
      ],
      columns: '4열: 학번 / 5열: 이름 / 6열: 성별 / 7열: 연락처 / 8열: 학적상태 / 9열: 소속학과 / 11열: 학년 / 12열: 분반',
    },
    foreign: {
      title: '외국인현황 업데이트',
      notices: [
        '1행은 헤더로 건너뛰고 2행부터 데이터를 읽습니다.',
        '학생정보 엑셀로 학생이 먼저 등록된 상태여야 합니다 (없는 학번은 스킵).',
        '체류자격만료일자는 YYYYMMDD 형식이어야 합니다 (예: 20260930).',
        '주민등록번호/외국인등록번호는 저장되지 않고 비밀번호 설정에만 사용됩니다.',
        '컬럼 순서를 변경하지 마세요.',
      ],
      columns: '4열: 학번 / 6열: 주민등록번호(비번설정용) / 8열: 국적 / 18열: 연락처 / 20열: 체류자격만료일 / 21열: TOPIK급수',
    },
    attend: {
      title: '출결 파일 업로드',
      notices: [
        '파일명 형식 필수: 과목명 (학과명(N년제)과-학년-반)_attendance.xlsx',
        '예: Java기초 (컴퓨터소프트웨어(3년제)과-2-D)_attendance.xlsx',
        '파일명의 과목명/학과명이 DB에 등록된 것과 정확히 일치해야 합니다.',
        '출석: O / 결석: X / 지각: ▲ / 공결: 빈칸',
        '수강정보가 먼저 등록된 상태여야 합니다.',
        '같은 파일 재업로드 시 기존 출결 데이터를 삭제 후 덮어씁니다.',
      ],
      columns: `2열: 학번 / 5~19열: 1~15주차 출결 상태 / 현재 학기: ${currentSemesterId || '불러오는 중...'}`,
    },
  };

  const handleMenuClick = (name) => {
    if (name === '통합 검색') { setSearchOpen(p => !p); return; }
    setSelectedStudentId(null); setSelectedStudentName(null); setSelectedStudentTab('basic');
    setActiveMenu(name);
    if (!SEARCH_SUB_MENUS.includes(name)) setSearchOpen(false);
  };

  if (loading && activeMenu === '대시보드') return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#F0F2F7' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid #E5E7EB', borderTopColor:'#1A3A5C', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
        <div style={{ color:'#6B7280', fontSize:'0.875rem' }}>데이터 동기화 중...</div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );

  const semLabel = currentSemester ? `${currentSemester.year}년 ${currentSemester.term}학기` : '학기 정보 없음';
  const isSearchActive = SEARCH_SUB_MENUS.includes(activeMenu);
  const can = (key) => permissions.find(p => p.permissionKey === key)?.isEnabled === true;

  // 비자 위험/주의 분류
  const visaDanger  = visaList.filter(v => v.dDay <= 30);
  const visaWarning = visaList.filter(v => v.dDay > 30 && v.dDay <= 60);

  // 출결 위험/주의 분류 (백엔드 warningLevel 필드 사용)
  const attendDanger  = attendanceList.filter(a => a.warningLevel === '위험');
  const attendWarning = attendanceList.filter(a => a.warningLevel === '주의');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes spin   { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

        :root { --primary:#3B82F6; --sidebar:#1A3A5C; }
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'DM Sans','Noto Sans KR',sans-serif; background:#F0F2F7; color:#111827; }

        .sw-wrap { display:flex; min-height:100vh; }
        .sw-sidebar { width:230px; background:var(--sidebar); display:flex; flex-direction:column; position:sticky; top:0; height:100vh; flex-shrink:0; overflow-y:auto; }
        .sw-logo { display:flex; align-items:center; gap:10px; padding:24px 20px; border-bottom:1px solid rgba(255,255,255,0.08); }
        .sw-logo-icon { width:34px; height:34px; background:rgba(255,255,255,0.12); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1rem; color:#fff; font-weight:700; }
        .sw-logo-txt { font-size:0.8125rem; font-weight:700; color:#fff; line-height:1.3; }
        .sw-logo-txt span { display:block; font-size:0.625rem; font-weight:400; color:rgba(255,255,255,0.4); margin-top:2px; }
        .sw-sec { padding:12px 12px 4px; }
        .sw-lbl { font-size:0.625rem; font-weight:600; color:rgba(255,255,255,0.3); text-transform:uppercase; padding:0 8px; margin-bottom:4px; letter-spacing:0.06em; }
        .sw-nav { display:flex; align-items:center; width:100%; border:none; background:transparent; padding:10px 12px; border-radius:8px; color:rgba(255,255,255,0.65); font-size:0.8125rem; cursor:pointer; transition:0.2s; margin-bottom:2px; text-align:left; gap:8px; font-family:inherit; }
        .sw-nav:hover { background:rgba(255,255,255,0.08); color:#fff; }
        .sw-nav.active { background:var(--primary); color:#fff; font-weight:600; }
        .sw-nav.parent-active { background:rgba(59,130,246,0.15); color:#fff; }
        .sw-nav-badge { margin-left:auto; background:#EF4444; color:#fff; font-size:0.625rem; padding:1px 6px; border-radius:10px; font-weight:700; }
        .sw-nav-arrow { margin-left:auto; font-size:0.625rem; color:rgba(255,255,255,0.4); transition:transform 0.2s; }
        .sw-nav-arrow.open { transform:rotate(180deg); }
        .sw-sub { overflow:hidden; transition:max-height 0.25s ease, opacity 0.2s; max-height:0; opacity:0; }
        .sw-sub.open { max-height:300px; opacity:1; }
        .sw-sub-btn { display:flex; align-items:center; width:100%; border:none; background:transparent; padding:8px 12px 8px 32px; border-radius:8px; color:rgba(255,255,255,0.5); font-size:0.75rem; cursor:pointer; transition:0.15s; margin-bottom:1px; font-family:inherit; text-align:left; }
        .sw-sub-btn:hover { background:rgba(255,255,255,0.06); color:#fff; }
        .sw-sub-btn.active { color:#93C5FD; font-weight:600; }
        .sw-sidebar-footer { margin-top:auto; padding:16px; border-top:1px solid rgba(255,255,255,0.08); font-size:0.6875rem; color:rgba(255,255,255,0.3); line-height:1.6; }
        .sw-sidebar-footer strong { color:rgba(255,255,255,0.6); display:block; margin-bottom:2px; }

        .sw-main { flex:1; overflow-y:auto; }
        .sw-topbar { background:#fff; padding:0 28px; height:56px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #E5E7EB; position:sticky; top:0; z-index:10; }
        .sw-topbar-title { font-size:0.9375rem; font-weight:700; color:#111827; }
        .sw-semester-badge { font-size:0.75rem; background:#EFF6FF; color:#1D4ED8; padding:4px 12px; border-radius:20px; font-weight:600; }
        .sw-content { padding:24px 28px; animation:fadeUp 0.25s ease; }

        .stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:28px; }
        .stat-card { background:#fff; border-radius:14px; border:1px solid #F3F4F6; padding:20px; cursor:pointer; transition:0.2s; text-align:left; position:relative; overflow:hidden; }
        .stat-card::after { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
        .stat-card.c-blue::after   { background:#3B82F6; }
        .stat-card.c-red::after    { background:#EF4444; }
        .stat-card.c-amber::after  { background:#F59E0B; }
        .stat-card.c-purple::after { background:#8B5CF6; }
        .stat-card:hover { border-color:#CBD5E1; transform:translateY(-2px); box-shadow:0 8px 20px -4px rgba(0,0,0,0.08); }
        .stat-icon-wrap { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.25rem; margin-bottom:14px; }
        .stat-icon-wrap.c-blue   { background:#EFF6FF; }
        .stat-icon-wrap.c-red    { background:#FEF2F2; }
        .stat-icon-wrap.c-amber  { background:#FFFBEB; }
        .stat-icon-wrap.c-purple { background:#F5F3FF; }
        .stat-lbl { font-size:0.75rem; color:#9CA3AF; margin-bottom:6px; font-weight:500; }
        .stat-val { font-size:1.75rem; font-weight:700; color:#111827; line-height:1; }
        .stat-val .unit { font-size:0.875rem; font-weight:400; color:#9CA3AF; margin-left:3px; }
        .stat-hint { font-size:0.6875rem; color:#CBD5E1; margin-top:6px; }

        .section-label { font-size:0.6875rem; font-weight:700; color:#9CA3AF; text-transform:uppercase; letter-spacing:0.08em; margin:0 0 12px; }

        .quick-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:28px; }
        .qa-card { background:#fff; border-radius:12px; border:1px solid #F3F4F6; padding:16px; display:flex; align-items:center; gap:12px; cursor:pointer; transition:0.15s; text-align:left; font-family:inherit; border:none; }
        .qa-card:hover { border-color:#CBD5E1; box-shadow:0 4px 12px -2px rgba(0,0,0,0.06); }
        .qa-icon { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.125rem; flex-shrink:0; }
        .qa-text { font-size:0.8125rem; font-weight:700; color:#111827; }
        .qa-sub  { font-size:0.6875rem; color:#9CA3AF; margin-top:2px; }

        .bottom-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; }
        .data-card { background:#fff; border-radius:14px; border:1px solid #F3F4F6; overflow:hidden; }
        .card-hd { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid #F3F4F6; cursor:pointer; transition:background 0.12s; }
        .card-hd:hover { background:#F8FAFC; }
        .card-hd-title { font-size:0.875rem; font-weight:700; color:#111827; }
        .card-hd-right { display:flex; align-items:center; gap:8px; }
        .count-pill { font-size:0.6875rem; font-weight:700; padding:3px 10px; border-radius:20px; background:#F3F4F6; color:#374151; }
        .count-pill.red    { background:#FEF2F2; color:#DC2626; }
        .count-pill.amber  { background:#FFFBEB; color:#D97706; }
        .count-pill.purple { background:#F5F3FF; color:#7C3AED; }

        .summary-body { padding:16px 18px; }
        .summary-row  { display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid #F9FAFB; }
        .summary-row:last-child { border-bottom:none; }
        .summary-label { font-size:0.8125rem; color:#374151; font-weight:500; }
        .summary-badge { font-size:0.6875rem; font-weight:700; padding:3px 10px; border-radius:20px; }
        .badge-red    { background:#FEF2F2; color:#DC2626; }
        .badge-amber  { background:#FFFBEB; color:#D97706; }
        .badge-gray   { background:#F3F4F6; color:#6B7280; }
        .card-link { padding:10px 18px; font-size:0.75rem; color:#3B82F6; cursor:pointer; border-top:1px solid #F3F4F6; display:flex; align-items:center; justify-content:flex-end; gap:4px; }
        .card-link:hover { background:#F8FAFC; }

        .job-row { display:flex; align-items:center; gap:12px; padding:12px 18px; border-bottom:1px solid #F9FAFB; cursor:pointer; transition:background 0.12s; }
        .job-row:last-child { border-bottom:none; }
        .job-row:hover { background:#F8FAFC; }
        .job-info { flex:1; min-width:0; }
        .job-name { font-size:0.8125rem; font-weight:600; color:#111827; }
        .job-meta { font-size:0.6875rem; color:#9CA3AF; margin-top:2px; }
        .avatar { width:34px; height:34px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:0.875rem; font-weight:700; flex-shrink:0; }
        .empty-box { padding:28px; text-align:center; color:#9CA3AF; font-size:0.8125rem; }

        @media (max-width:1100px) { .stat-grid { grid-template-columns:repeat(2,1fr); } .quick-grid { grid-template-columns:repeat(2,1fr); } .bottom-grid { grid-template-columns:1fr; } }
        @media (max-width:720px)  { .sw-sidebar { width:200px; } .stat-grid { grid-template-columns:1fr 1fr; } }
      `}</style>

      <div className="sw-wrap">
        {/* ══ 사이드바 ══ */}
        <aside className="sw-sidebar">
          <div className="sw-logo">
            <div className="sw-logo-icon">K</div>
            <div className="sw-logo-txt">KGC 조교 시스템<span>경민대학교 유학생 관리</span></div>
          </div>

          <div className="sw-sec">
            <div className="sw-lbl">메인</div>
            <button className={`sw-nav ${activeMenu==='대시보드'?'active':''}`} onClick={() => handleMenuClick('대시보드')}>대시보드</button>
          </div>

          {can('STUDENT_VIEW') && (
            <div className="sw-sec">
              <div className="sw-lbl">학생</div>
              <button className={`sw-nav ${activeMenu==='학생 목록'?'active':''}`} onClick={() => handleMenuClick('학생 목록')}>학생 목록</button>
            </div>
          )}

          {can('VISA_VIEW') && (
            <div className="sw-sec">
              <div className="sw-lbl">비자</div>
              <button className={`sw-nav ${activeMenu==='비자 만료 현황'?'active':''}`} onClick={() => handleMenuClick('비자 만료 현황')}>
                비자 만료 현황
                {visaDanger.length > 0 && <span className="sw-nav-badge">{visaDanger.length}</span>}
              </button>
            </div>
          )}

          {(can('JOB_VIEW') || can('MILEAGE_VIEW')) && (
            <div className="sw-sec">
              <div className="sw-lbl">근로·마일리지</div>
              {can('JOB_VIEW') && (
                <button className={`sw-nav ${activeMenu==='근로 승인'?'active':''}`} onClick={() => handleMenuClick('근로 승인')}>
                  근로 승인
                  {pendingJobs.length > 0 && <span className="sw-nav-badge">{pendingJobs.length}</span>}
                </button>
              )}
              {can('MILEAGE_VIEW') && (
                <button className={`sw-nav ${activeMenu==='마일리지'?'active':''}`} onClick={() => handleMenuClick('마일리지')}>마일리지</button>
              )}
            </div>
          )}

          {can('ATTEND_VIEW') && (
            <div className="sw-sec">
              <div className="sw-lbl">출결</div>
              <button className={`sw-nav ${activeMenu==='출결 관리'?'active':''}`} onClick={() => handleMenuClick('출결 관리')}>출결 관리</button>
            </div>
          )}

          <div className="sw-sec">
            <div className="sw-lbl">통합 검색</div>
            <button className={`sw-nav ${isSearchActive?'parent-active':''}`} onClick={() => handleMenuClick('통합 검색')}>
              통합 검색
              <span className={`sw-nav-arrow ${searchOpen?'open':''}`}>▼</span>
            </button>
            <div className={`sw-sub ${searchOpen?'open':''}`}>
              {SEARCH_SUB_MENUS.map(m => (
                <button key={m} className={`sw-sub-btn ${activeMenu===m?'active':''}`} onClick={() => handleMenuClick(m)}>{m}</button>
              ))}
            </div>
          </div>

          <div className="sw-sidebar-footer">
            <strong>STAFF 계정</strong>
            {semLabel} 운영 중
          </div>
        </aside>

        {/* ══ 메인 ══ */}
        <main className="sw-main">
          <div className="sw-topbar">
            <div className="sw-topbar-title">{activeMenu === '대시보드' ? '조교 대시보드' : activeMenu}</div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span className="sw-semester-badge">{semLabel}</span>
              <button onClick={handleLogout} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid #E5E7EB', background:'#fff', color:'#374151', fontSize:'0.8125rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
                onMouseOver={e => e.currentTarget.style.background='#F9FAFB'}
                onMouseOut={e => e.currentTarget.style.background='#fff'}>
                로그아웃
              </button>
            </div>
          </div>

          {activeMenu === '대시보드' && (
            <div className="sw-content">

              {/* ── stat 카드 */}
              <div className="stat-grid">
                {can('STUDENT_VIEW') && (
                  <button className="stat-card c-blue" onClick={() => handleMenuClick('학생 목록')}>
                    <div className="stat-icon-wrap c-blue">🎓</div>
                    <div className="stat-lbl">전체 유학생</div>
                    <div className="stat-val">{totalStudents}<span className="unit">명</span></div>
                    <div className="stat-hint">전체 등록 학생 수</div>
                  </button>
                )}
                {can('VISA_VIEW') && (
                  <button className="stat-card c-red" onClick={() => handleMenuClick('비자 만료 현황')}>
                    <div className="stat-icon-wrap c-red">🛂</div>
                    <div className="stat-lbl">비자 만료 임박</div>
                    <div className="stat-val" style={{ color: visaList.length > 0 ? '#EF4444' : '#111827' }}>{visaList.length}<span className="unit">명</span></div>
                    <div className="stat-hint">D-60 이내 · 위험 {visaDanger.length}명</div>
                  </button>
                )}
                {can('ATTEND_VIEW') && (
                  <button className="stat-card c-amber" onClick={() => handleMenuClick('출결 관리')}>
                    <div className="stat-icon-wrap c-amber">⚠️</div>
                    <div className="stat-lbl">출결 위험군</div>
                    <div className="stat-val" style={{ color: attendanceList.length > 0 ? '#F59E0B' : '#111827' }}>{attendanceList.length}<span className="unit">명</span></div>
                    <div className="stat-hint">위험 {attendDanger.length}명 · 주의 {attendWarning.length}명</div>
                  </button>
                )}
                {can('JOB_VIEW') && (
                  <button className="stat-card c-purple" onClick={() => handleMenuClick('근로 승인')}>
                    <div className="stat-icon-wrap c-purple">📋</div>
                    <div className="stat-lbl">근로 승인 대기</div>
                    <div className="stat-val" style={{ color: pendingJobs.length > 0 ? '#7C3AED' : '#111827' }}>{pendingJobs.length}<span className="unit">건</span></div>
                    <div className="stat-hint">승인 처리 필요</div>
                  </button>
                )}
              </div>

              {/* ── 빠른 이동 */}
              {(() => {
                const quickItems = [
                  can('ATTEND_VIEW') && { key:'attend', icon:'📅', bg:'#FFFBEB', text:'출결 관리', sub:'출결 현황 조회', menu:'출결 관리' },
                  (can('JOB_VIEW') && can('JOB_APPROVAL')) && { key:'job', icon:'📋', bg:'#F5F3FF', text:'근로 승인', sub:'승인 대기 처리', menu:'근로 승인' },
                  { key:'search', icon:'🔍', bg:'#F0FDF4', text:'개인별 검색', sub:'학번으로 통합 조회', menu:'개인별 검색' },
                ].filter(Boolean);
                return (
                  <>
                    <div className="section-label">빠른 이동</div>
                    <div style={{ display:'grid', gridTemplateColumns:`repeat(${quickItems.length},1fr)`, gap:10, marginBottom:28 }}>
                      {quickItems.map(item => (
                        <button key={item.key} style={{ background:'#fff', border:'1px solid #F3F4F6', borderRadius:12, padding:16, display:'flex', alignItems:'center', gap:12, cursor:'pointer', transition:'0.15s', fontFamily:'inherit' }}
                          onClick={() => handleMenuClick(item.menu)}
                          onMouseOver={e => { e.currentTarget.style.borderColor='#CBD5E1'; e.currentTarget.style.boxShadow='0 4px 12px -2px rgba(0,0,0,0.06)'; }}
                          onMouseOut={e => { e.currentTarget.style.borderColor='#F3F4F6'; e.currentTarget.style.boxShadow='none'; }}>
                          <div style={{ width:36, height:36, borderRadius:8, background:item.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.125rem', flexShrink:0 }}>{item.icon}</div>
                          <div><div style={{ fontSize:'0.8125rem', fontWeight:700, color:'#111827' }}>{item.text}</div><div style={{ fontSize:'0.6875rem', color:'#9CA3AF', marginTop:2 }}>{item.sub}</div></div>
                        </button>
                      ))}
                    </div>
                  </>
                );
              })()}

              {/* ── 엑셀 업로드 */}
              {(can('STUDENT_UPLOAD') || can('ATTEND_UPLOAD')) && (() => {
                const uploadItems = [
                  can('STUDENT_UPLOAD') && { key:'student', icon:'📥', bg:'#EFF6FF', title:'학생 일괄 등록', sub:'학생정보 엑셀 파일 업로드' },
                  can('STUDENT_UPLOAD') && { key:'foreign', icon:'🛂', bg:'#F0FDF4', title:'외국인현황 업데이트', sub:'외국인등록번호·여권번호 일괄 업데이트' },
                  can('ATTEND_UPLOAD')  && { key:'attend',  icon:'📅', bg:'#FFFBEB', title:'출결 파일 업로드',  sub:'출결 엑셀 파일 업로드' },
                ].filter(Boolean);
                return (
                  <>
                    <div className="section-label">엑셀 업로드</div>
                    <div style={{ display:'grid', gridTemplateColumns:`repeat(${uploadItems.length},1fr)`, gap:14, marginBottom:28 }}>
                      {uploadItems.map(item => (
                        <button key={item.key}
                          style={{ padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', gap:16, cursor:'pointer', border:'1.5px dashed #CBD5E1', background:'#fff', fontFamily:'inherit', textAlign:'left', borderRadius:14 }}
                          onClick={() => { setUploadModal(item.key); setUploadFile(null); }}>
                          <div style={{ width:44, height:44, borderRadius:10, background:item.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>{item.icon}</div>
                          <div>
                            <div style={{ fontWeight:700, fontSize:'0.9375rem', color:'#111827' }}>{item.title}</div>
                            <div style={{ fontSize:'0.75rem', color:'#9CA3AF', marginTop:3 }}>{item.sub}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                );
              })()}

              {/* ── 알림 현황 */}
              <div className="section-label">알림 현황</div>
              <div className="bottom-grid">
                {can('VISA_VIEW') && (
                  <div className="data-card">
                    <div className="card-hd" onClick={() => handleMenuClick('비자 만료 현황')}>
                      <span className="card-hd-title">비자 만료 임박</span>
                      <div className="card-hd-right">
                        {visaDanger.length > 0 && <span className="count-pill red">위험 {visaDanger.length}명</span>}
                        {visaWarning.length > 0 && <span className="count-pill amber">주의 {visaWarning.length}명</span>}
                        {visaList.length === 0 && <span className="count-pill">이상 없음</span>}
                        <span style={{ fontSize:'0.75rem', color:'#9CA3AF' }}>→</span>
                      </div>
                    </div>
                    <div className="summary-body">
                      {visaList.length === 0 ? (
                        <div style={{ textAlign:'center', padding:'1rem', color:'#9CA3AF', fontSize:'0.8125rem' }}>만료 임박 학생이 없습니다. ✅</div>
                      ) : (
                        <>
                          <div className="summary-row">
                            <span className="summary-label">위험 (D-30 이내)</span>
                            <span className="summary-badge badge-red">{visaDanger.length}명</span>
                          </div>
                          <div className="summary-row">
                            <span className="summary-label">주의 (D-31~60)</span>
                            <span className="summary-badge badge-amber">{visaWarning.length}명</span>
                          </div>
                          <div className="summary-row">
                            <span className="summary-label">전체 대상</span>
                            <span className="summary-badge badge-gray">{visaList.length}명</span>
                          </div>
                        </>
                      )}
                    </div>
                    {visaList.length > 0 && (
                      <div className="card-link" onClick={() => handleMenuClick('비자 만료 현황')}>
                        전체 목록 보기 →
                      </div>
                    )}
                  </div>
                )}

                {can('ATTEND_VIEW') && (
                  <div className="data-card">
                    <div className="card-hd" onClick={() => handleMenuClick('출결 관리')}>
                      <span className="card-hd-title">출결 위험군</span>
                      <div className="card-hd-right">
                        {attendDanger.length > 0 && <span className="count-pill red">위험 {attendDanger.length}명</span>}
                        {attendWarning.length > 0 && <span className="count-pill amber">주의 {attendWarning.length}명</span>}
                        {attendanceList.length === 0 && <span className="count-pill">이상 없음</span>}
                        <span style={{ fontSize:'0.75rem', color:'#9CA3AF' }}>→</span>
                      </div>
                    </div>
                    <div className="summary-body">
                      {attendanceList.length === 0 ? (
                        <div style={{ textAlign:'center', padding:'1rem', color:'#9CA3AF', fontSize:'0.8125rem' }}>출결 위험군이 없습니다. ✅</div>
                      ) : (
                        <>
                          <div className="summary-row">
                            <span className="summary-label">위험 (결석 4회+)</span>
                            <span className="summary-badge badge-red">{attendDanger.length}명</span>
                          </div>
                          <div className="summary-row">
                            <span className="summary-label">주의 (결석 2~3회)</span>
                            <span className="summary-badge badge-amber">{attendWarning.length}명</span>
                          </div>
                          <div className="summary-row">
                            <span className="summary-label">전체 대상</span>
                            <span className="summary-badge badge-gray">{attendanceList.length}명</span>
                          </div>
                        </>
                      )}
                    </div>
                    {attendanceList.length > 0 && (
                      <div className="card-link" onClick={() => handleMenuClick('출결 관리')}>
                        출결 관리로 이동 →
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── 근로 승인 대기 */}
              {can('JOB_VIEW') && (
                <>
                  <div className="section-label">근로 승인 대기</div>
                  <div className="data-card">
                    <div className="card-hd" onClick={() => handleMenuClick('근로 승인')}>
                      <span className="card-hd-title">승인 처리가 필요한 근로 신청</span>
                      <div className="card-hd-right">
                        <span className={`count-pill ${pendingJobs.length > 0 ? 'purple' : ''}`}>{pendingJobs.length}건</span>
                        <span style={{ fontSize:'0.75rem', color:'#9CA3AF' }}>→</span>
                      </div>
                    </div>
                    {pendingJobs.length === 0 ? (
                      <div className="empty-box">처리 대기 중인 근로 신청이 없습니다. ✅</div>
                    ) : pendingJobs.slice(0,5).map(job => (
                      <div key={job.jobId} className="job-row" onClick={() => handleMenuClick('근로 승인')}>
                        <div className="avatar" style={{ background:'#F5F3FF', color:'#7C3AED' }}>{job.studentName?.[0] ?? '?'}</div>
                        <div className="job-info">
                          <div className="job-name">{job.studentName}</div>
                          <div className="job-meta">
                            {job.companyName ?? job.workplace ?? '-'}
                            {job.weeklyHours ? ` · 주 ${job.weeklyHours}시간` : ''}
                            {job.createdAt ? ` · ${job.createdAt.slice(0,10)}` : ''}
                          </div>
                        </div>
                        <span style={{ fontSize:'0.75rem', color:'#9CA3AF', flexShrink:0 }}>상세 보기 →</span>
                      </div>
                    ))}
                    {pendingJobs.length > 5 && (
                      <div className="card-link" onClick={() => handleMenuClick('근로 승인')}>
                        +{pendingJobs.length - 5}건 더 보기 →
                      </div>
                    )}
                  </div>
                </>
              )}

            </div>
          )}

          {activeMenu === '학생 목록' && !selectedStudentId && (
            <StaffStudentList permissions={permissions} onStudentClick={(id, name) => { setSelectedStudentId(id); setSelectedStudentName(name); setSelectedStudentTab('basic'); }} />
          )}
          {activeMenu === '학생 목록' && selectedStudentId && (
            <StaffStudentDetail
              studentId={selectedStudentId} studentName={selectedStudentName}
              permissions={permissions} activeTab={selectedStudentTab} onTabChange={setSelectedStudentTab}
              onBack={() => { setSelectedStudentId(null); setSelectedStudentName(null); setSelectedStudentTab('basic'); }}
            />
          )}
          {activeMenu === '비자 만료 현황'         && <StaffVisaExpirePage />}
          {activeMenu === '출결 관리'              && <StaffAttendPage     permissions={permissions} />}
          {activeMenu === '근로 승인'              && <StaffJobPendingPage permissions={permissions} />}
          {activeMenu === '마일리지'               && <StaffMileagePage    permissions={permissions} />}
          {activeMenu === '개인별 검색'            && <div style={{ padding:'1.25rem 1.75rem' }}><SearchByStudent   onBack={() => setActiveMenu('대시보드')} /></div>}
          {activeMenu === '학과별 검색'            && <SearchByDept        onBack={() => setActiveMenu('대시보드')} />}
          {activeMenu === '학과-반별 검색'         && <SearchByClass       onBack={() => setActiveMenu('대시보드')} />}
          {activeMenu === '과목별 검색'            && <div style={{ padding:'1.25rem 1.75rem' }}><SearchByCourse    onBack={() => setActiveMenu('대시보드')} /></div>}
          {activeMenu === '온라인 30% 초과 검색'   && <div style={{ padding:'1.25rem 1.75rem' }}><OnlineViolation   onBack={() => setActiveMenu('대시보드')} /></div>}

          {/* ── 엑셀 업로드 모달 ── */}
          {uploadModal && UPLOAD_META[uploadModal] && (() => {
            const meta = UPLOAD_META[uploadModal];
            return (
              <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(2px)' }}
                onClick={() => { setUploadModal(null); setUploadFile(null); }}>
                <div style={{ background:'#fff', borderRadius:16, width:'36rem', maxWidth:'95vw', boxShadow:'0 20px 40px rgba(0,0,0,0.15)', overflow:'hidden' }}
                  onClick={e => e.stopPropagation()}>

                  {/* 헤더 */}
                  <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontWeight:700, fontSize:'1rem', color:'#0F172A' }}>{meta.title}</div>
                    <button onClick={() => { setUploadModal(null); setUploadFile(null); }}
                      style={{ width:28, height:28, borderRadius:'50%', border:'1px solid #E2E8F0', background:'#F8FAFC', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748B', fontSize:14 }}>✕</button>
                  </div>

                  {/* 유의사항 */}
                  <div style={{ padding:'1.25rem 1.5rem 0' }}>
                    <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:10, padding:'12px 14px', marginBottom:'1rem' }}>
                      <div style={{ fontWeight:700, fontSize:'0.75rem', color:'#C2410C', marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
                        ⚠️ 업로드 전 반드시 확인하세요
                      </div>
                      <ul style={{ paddingLeft:16, margin:0 }}>
                        {meta.notices.map((n, i) => (
                          <li key={i} style={{ fontSize:'0.75rem', color:'#9A3412', marginBottom:4, lineHeight:1.5 }}>{n}</li>
                        ))}
                      </ul>
                    </div>
                    <div style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:8, padding:'8px 12px', marginBottom:'1.25rem' }}>
                      <div style={{ fontSize:'0.6875rem', fontWeight:600, color:'#64748B', marginBottom:4 }}>📋 필수 컬럼 위치</div>
                      <div style={{ fontSize:'0.6875rem', color:'#475569', lineHeight:1.6 }}>{meta.columns}</div>
                    </div>
                  </div>

                  {/* 드롭존 */}
                  <div style={{ padding:'0 1.5rem 1.25rem' }}>
                    <div
                      style={{ border:`2px dashed ${uploadFile ? '#10B981' : '#CBD5E1'}`, borderRadius:12, padding:'2rem', textAlign:'center', cursor:'pointer', background: uploadFile ? '#F0FDF4' : '#F8FAFC', transition:'0.2s' }}
                      onClick={() => document.getElementById('upload-modal-file').click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setUploadFile(f); }}
                    >
                      {uploadFile ? (
                        <>
                          <div style={{ fontSize:'2rem', marginBottom:8 }}>📄</div>
                          <div style={{ fontWeight:600, color:'#065F46', fontSize:'0.875rem' }}>{uploadFile.name}</div>
                          <div style={{ fontSize:'0.75rem', color:'#6EE7B7', marginTop:4 }}>파일을 변경하려면 클릭하거나 다시 드래그하세요</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize:'2.5rem', marginBottom:8 }}>📂</div>
                          <div style={{ fontWeight:600, color:'#374151', fontSize:'0.875rem' }}>파일을 드래그하거나 클릭하여 선택하세요</div>
                          <div style={{ fontSize:'0.75rem', color:'#9CA3AF', marginTop:4 }}>.xlsx 또는 .xls 파일 · 최대 10MB</div>
                        </>
                      )}
                      <input id="upload-modal-file" type="file" hidden accept=".xlsx,.xls"
                        onChange={e => { if (e.target.files[0]) setUploadFile(e.target.files[0]); }} />
                    </div>
                  </div>

                  {/* 푸터 */}
                  <div style={{ padding:'1rem 1.5rem', background:'#F8FAFC', borderTop:'1px solid #F1F5F9', display:'flex', justifyContent:'flex-end', gap:8 }}>
                    <button onClick={() => { setUploadModal(null); setUploadFile(null); }} disabled={uploading}
                      style={{ padding:'8px 18px', borderRadius:8, border:'1px solid #E2E8F0', background:'#fff', color:'#475569', fontSize:'0.8125rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                      취소
                    </button>
                    <button onClick={handleUploadSubmit} disabled={uploading || !uploadFile}
                      style={{ padding:'8px 18px', borderRadius:8, border:'none', background: (!uploadFile || uploading) ? '#94A3B8' : '#10B981', color:'#fff', fontSize:'0.8125rem', fontWeight:600, cursor: (!uploadFile || uploading) ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                      {uploading ? '업로드 중...' : '업로드 시작'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </main>
      </div>
    </>
  );
}
