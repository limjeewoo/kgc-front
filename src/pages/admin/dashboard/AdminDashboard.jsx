import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import TopBar from '../../../components/layout/TopBar.jsx';
import StudentList from '../students/StudentList.jsx';
import ConsultTab from '../students/StudentDetail/ConsultTab.jsx'; 
import SearchByDept from '../search/SearchByDept.jsx';
import SearchByClass from '../search/SearchByClass.jsx';
import SearchByCourse from '../search/SearchByCourse.jsx';
import OnlineViolation from '../search/OnlineViolation.jsx';
import CourseList from '../courses/CourseList.jsx';
import AdminExcelUploadModal from '../courses/AdminExcelUploadModal.jsx';
import AdminVisaExpirePage from '../visa/AdminVisaExpirePage.jsx';
import SearchByStudent from '../search/SearchByStudent.jsx';
import ProfessorList from '../professors/ProfessorList.jsx';
import ProfessorRegister from '../professors/ProfessorRegister.jsx';
import AdvisorAssign from '../professors/AdvisorAssign.jsx';
import JobTab from '../students/StudentDetail/JobTab.jsx';
import MileageTab from '../students/StudentDetail/MileageTab.jsx';
import SemesterManagement from "../semesters/SemestersManagement.jsx";
import JobPending from "../jobs/JobPending.jsx";
import MileageManage from "../jobs/MileageManage.jsx";
import SystemConfig from  "../Config/SystemConfig.jsx";

const NOT_IMPLEMENTED = new Set(['상담 내역']);
const SEARCH_SUB_MENUS = ['개인별 검색', '학과별 검색', '학과-반별 검색', '과목별 검색', '온라인 30% 초과 검색'];
const JOB_SUB_MENUS   = ['학생 근로', '학생 근로 현황'];
const PROF_SUB_MENUS  = ['전체 교수 목록', '학생-지도교수 배정 관리'];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('대시보드');

  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [jobDropdownOpen,    setJobDropdownOpen]    = useState(false);
  const [profDropdownOpen,   setProfDropdownOpen]   = useState(false);

  const [currentSemester, setCurrentSemester] = useState(null);
  const [visaList,        setVisaList]        = useState([]);
  const [attendanceList,  setAttendanceList]  = useState([]);
  const [onlineList,      setOnlineList]      = useState([]);
  const [totalStudents,   setTotalStudents]   = useState(0);
  const [pendingJobs,     setPendingJobs]     = useState(0);

  const [isExcelModalOpen,     setIsExcelModalOpen]     = useState(false);
  const [courseListRefreshKey, setCourseListRefreshKey] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          api.get('/api/v1/semesters/current'),
          api.get('/api/v1/students'),
          api.get('/api/v1/visas/expiring', { params: { days: 30 } }),
          api.get('/api/v1/attend/warnings'),
          api.get('/api/v1/search/online-violations'),
          api.get('/api/v1/jobs/pending'),
        ]);
        const [semRes, studentsRes, visaRes, attendRes, onlineRes, jobsRes] = results;
        if (semRes?.status === 'fulfilled' && semRes.value?.data?.success)
          setCurrentSemester(semRes.value.data.data);
        if (studentsRes?.status === 'fulfilled' && studentsRes.value?.data?.success)
          setTotalStudents((studentsRes.value.data.data || []).length);
        if (visaRes?.status === 'fulfilled' && visaRes.value?.data?.success)
          setVisaList(visaRes.value.data.data || []);
        if (attendRes?.status === 'fulfilled' && attendRes.value?.data?.success)
          setAttendanceList(attendRes.value.data.data || []);
        if (onlineRes?.status === 'fulfilled' && onlineRes.value?.data?.success)
          setOnlineList(onlineRes.value.data.data || []);
        if (jobsRes?.status === 'fulfilled' && jobsRes.value?.data?.success)
          setPendingJobs((jobsRes.value.data.data || []).filter(j => j.approvalStatus === 'PENDING').length);
      } catch (error) {
        console.error('대시보드 데이터 로드 중 에러:', error);
      } finally {
        setLoading(false);
      }
    };
    if (activeMenu === '대시보드') fetchDashboardData();
    else setLoading(false);
  }, [activeMenu]);

  const isSearchMenuActive = SEARCH_SUB_MENUS.includes(activeMenu);
  const isJobMenuActive    = JOB_SUB_MENUS.includes(activeMenu);
  const isProfMenuActive   = PROF_SUB_MENUS.includes(activeMenu) || activeMenu === '교수 등록';

  const handleMenuClick = (menuName) => {
    if (menuName === '통합 검색') { setSearchDropdownOpen(p => !p); setJobDropdownOpen(false); setProfDropdownOpen(false); return; }
    if (menuName === '학생 근로')  { setJobDropdownOpen(p => !p);    setSearchDropdownOpen(false); setProfDropdownOpen(false); return; }
    if (menuName === '교수 관리')  { setProfDropdownOpen(p => !p);   setSearchDropdownOpen(false); setJobDropdownOpen(false); return; }
    setActiveMenu(menuName);
    if (!SEARCH_SUB_MENUS.includes(menuName)) setSearchDropdownOpen(false);
    if (!JOB_SUB_MENUS.includes(menuName) && menuName !== '학생 근로') setJobDropdownOpen(false);
    if (!PROF_SUB_MENUS.includes(menuName) && menuName !== '교수 등록') setProfDropdownOpen(false);
  };

  // 출결 위험/주의
  const attendDanger  = attendanceList.filter(a => a.warningLevel === '위험');
  const attendWarning = attendanceList.filter(a => a.warningLevel === '주의');
  // 비자 위험/주의
  const visaDanger  = visaList.filter(v => v.dDay <= 14);
  const visaWarning = visaList.filter(v => v.dDay > 14);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#F0F2F7' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid #E5E7EB', borderTopColor:'#1A3A5C', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
        <div style={{ color:'#6B7280', fontSize:'0.875rem' }}>데이터 동기화 중...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght=300;400;500;700&family=DM+Sans:wght=300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        :root { font-size: 16px; --primary: #3B82F6; --sidebar-bg: #1A3A5C; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', 'Noto Sans KR', sans-serif; background: #F0F2F7; color: #111827; }
        .admin-wrap { display: flex; min-height: 100vh; }
        .sidebar { width: 14.375rem; background: var(--sidebar-bg); display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; flex-shrink: 0; overflow-y: auto; }
        .sidebar-logo { display: flex; align-items: center; gap: 0.625rem; padding: 1.5rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); cursor: pointer; }
        .logo-img { width: 2.2rem; height: auto; object-fit: contain; flex-shrink: 0; }
        .logo-text { font-size: 0.8125rem; font-weight: 700; color: #fff; line-height: 1.3; }
        .logo-text span { display: block; font-size: 0.625rem; font-weight: 400; color: rgba(255,255,255,0.4); }
        .sb-sec { padding: 0.75rem 0.75rem 0.25rem; }
        .sb-lbl { font-size: 0.625rem; font-weight: 600; color: rgba(255,255,255,0.3); text-transform: uppercase; padding: 0 0.5rem; margin-bottom: 0.3rem; }
        .nav-btn { display: flex; align-items: center; width: 100%; border: none; background: transparent; padding: 0.625rem 0.75rem; border-radius: 0.5rem; color: rgba(255,255,255,0.65); font-size: 0.8125rem; cursor: pointer; transition: 0.2s; margin-bottom: 2px; text-align: left; }
        .nav-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .nav-btn.active { background: var(--primary); color: #fff; font-weight: 600; }
        .nav-btn.parent-active { background: rgba(59,130,246,0.15); color: #fff; }
        .nav-badge { margin-left: auto; background: #EF4444; color: #fff; font-size: 0.625rem; padding: 1px 6px; border-radius: 10px; font-weight: 700; }
        .nav-arrow { margin-left: auto; font-size: 0.625rem; transition: transform 0.2s; color: rgba(255,255,255,0.4); }
        .nav-arrow.open { transform: rotate(180deg); }
        .sub-menu { overflow: hidden; transition: max-height 0.25s ease, opacity 0.2s ease; max-height: 0; opacity: 0; }
        .sub-menu.open { max-height: 300px; opacity: 1; }
        .sub-nav-btn { display: flex; align-items: center; width: 100%; border: none; background: transparent; padding: 0.5rem 0.75rem 0.5rem 1.5rem; border-radius: 0.5rem; color: rgba(255,255,255,0.5); font-size: 0.75rem; cursor: pointer; transition: 0.2s; margin-bottom: 1px; text-align: left; gap: 0.4rem; }
        .sub-nav-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85); }
        .sub-nav-btn.active { color: #60A5FA; font-weight: 600; }
        .sidebar-bottom { margin-top: auto; padding: 0.75rem; border-top: 1px solid rgba(255,255,255,0.08); }
        .user-info { display: flex; align-items: center; gap: 0.625rem; padding: 0.625rem; border-radius: 0.5rem; }
        .user-avatar { width: 2rem; height: 2rem; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: #fff; flex-shrink: 0; }
        .user-name { font-size: 0.8125rem; font-weight: 600; color: #fff; }
        .user-role { font-size: 0.6875rem; color: rgba(255,255,255,0.4); margin-top: 0.125rem; }
        .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .content { flex: 1; padding: 1.75rem 2rem; overflow-y: auto; animation: fadeUp 0.28s ease; }
        .dash-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.75rem; gap: 1rem; }
        .dash-title { font-size: 1.375rem; font-weight: 700; color: #0F172A; }
        .dash-subtitle { font-size: 0.8125rem; color: #94A3B8; margin-top: 0.25rem; }
        .dash-actions { display: flex; gap: 0.5rem; align-items: center; flex-shrink: 0; }
        .btn { display: inline-flex; align-items: center; gap: 0.375rem; border: none; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; transition: all 0.18s; padding: 0.5625rem 1rem; white-space: nowrap; font-family: inherit; }
        .btn-excel { background: #ECFDF5; color: #059669; border: 1.5px solid #6EE7B7; }
        .btn-excel:hover { background: #D1FAE5; border-color: #34D399; box-shadow: 0 4px 12px rgba(5,150,105,0.18); transform: translateY(-1px); }
        .section-label { font-size: 0.6875rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.75rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.75rem; }
        .stat-card { background: #fff; border-radius: 1rem; padding: 1.375rem 1.25rem 1.125rem; border: 1px solid #F1F5F9; cursor: pointer; transition: all 0.2s; text-align: left; position: relative; overflow: hidden; }
        .stat-card::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
        .stat-card.c-blue::after { background: #3B82F6; }
        .stat-card.c-red::after { background: #EF4444; }
        .stat-card.c-amber::after { background: #F59E0B; }
        .stat-card.c-purple::after { background: #8B5CF6; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px -6px rgba(0,0,0,0.09); border-color: #E2E8F0; }
        .stat-icon-wrap { width: 2.25rem; height: 2.25rem; border-radius: 0.625rem; display: flex; align-items: center; justify-content: center; font-size: 1rem; margin-bottom: 0.875rem; }
        .stat-icon-wrap.c-blue { background: #EFF6FF; }
        .stat-icon-wrap.c-red { background: #FEF2F2; }
        .stat-icon-wrap.c-amber { background: #FFFBEB; }
        .stat-icon-wrap.c-purple { background: #F5F3FF; }
        .stat-lbl { font-size: 0.75rem; color: #64748B; margin-bottom: 0.3rem; font-weight: 500; }
        .stat-val { font-size: 1.875rem; font-weight: 700; color: #0F172A; line-height: 1; }
        .stat-val .unit { font-size: 0.875rem; font-weight: 400; color: #94A3B8; margin-left: 3px; }
        .stat-hint { font-size: 0.6875rem; color: #CBD5E1; margin-top: 0.375rem; }
        .quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1.75rem; }
        .qa-card { background: #fff; border: 1px solid #F1F5F9; border-radius: 0.875rem; padding: 1rem; cursor: pointer; transition: all 0.18s; display: flex; align-items: center; gap: 0.75rem; text-align: left; }
        .qa-card:hover { border-color: #BFDBFE; background: #F8FBFF; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(59,130,246,0.08); }
        .qa-icon { width: 2rem; height: 2rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; font-size: 0.9375rem; flex-shrink: 0; }
        .qa-text { font-size: 0.8125rem; font-weight: 600; color: #1E293B; }
        .qa-sub { font-size: 0.6875rem; color: #94A3B8; margin-top: 2px; }
        .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .data-card { background: #fff; border-radius: 1rem; border: 1px solid #F1F5F9; overflow: hidden; }
        .card-hd { padding: 0.9375rem 1.25rem; border-bottom: 1px solid #F8FAFC; display: flex; justify-content: space-between; align-items: center; }
        .card-hd-title { font-size: 0.875rem; font-weight: 700; color: #0F172A; }
        .count-pill { font-size: 0.6875rem; font-weight: 600; color: #64748B; background: #F1F5F9; padding: 2px 9px; border-radius: 20px; }
        .list-row { width: 100%; border: none; background: transparent; display: flex; align-items: center; padding: 0.8125rem 1.25rem; border-bottom: 1px solid #F8FAFC; gap: 0.75rem; cursor: pointer; text-align: left; transition: background 0.13s; }
        .list-row:last-child { border-bottom: none; }
        .list-row:hover { background: #FAFBFD; }
        .avatar { width: 2.125rem; height: 2.125rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
        .row-info { flex: 1; min-width: 0; }
        .row-name { font-size: 0.8125rem; font-weight: 600; color: #111827; }
        .row-sub { font-size: 0.6875rem; color: #9CA3AF; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pill { font-size: 0.6875rem; padding: 3px 9px; border-radius: 6px; font-weight: 700; white-space: nowrap; }
        .pill-red { background: #FEF2F2; color: #EF4444; }
        .pill-amber { background: #FFFBEB; color: #B45309; }
        .empty-box { padding: 2.5rem 1.25rem; text-align: center; color: #CBD5E1; font-size: 0.8125rem; }
        .summary-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F9FAFB; }
        .summary-row:last-child { border-bottom: none; }
        .online-card { margin-bottom: 1rem; }
        .online-row { display: flex; align-items: center; padding: 0.75rem 1.25rem; border-bottom: 1px solid #F8FAFC; gap: 1rem; }
        .online-row:last-child { border-bottom: none; }
        .online-name { width: 88px; font-size: 0.8125rem; font-weight: 600; color: #374151; flex-shrink: 0; }
        .prog-bar { flex: 1; height: 5px; background: #F1F5F9; border-radius: 3px; overflow: hidden; }
        .prog-fill { height: 100%; background: linear-gradient(90deg, #FCA5A5, #EF4444); border-radius: 3px; }
        .prog-pct { width: 50px; text-align: right; font-size: 0.75rem; color: #EF4444; font-weight: 700; flex-shrink: 0; }
        .not-impl { padding: 4rem; text-align: center; background: #fff; border-radius: 1rem; }
        .not-impl h2 { font-size: 1.25rem; margin-bottom: 0.75rem; color: #374151; }
        .not-impl p { color: #9CA3AF; font-size: 0.875rem; }
      `}</style>

      <div className="admin-wrap">
        <div className="sidebar">
          <div className="sidebar-logo" onClick={() => setActiveMenu('대시보드')}>
            <img src="/logo-fff.png" alt="Logo" className="logo-img" />
            <div className="logo-text">KGC <span>경민대학교 국제교육원</span></div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">메인</div>
            <button className={`nav-btn ${activeMenu === '대시보드' ? 'active' : ''}`} onClick={() => handleMenuClick('대시보드')}>대시보드</button>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">학생 관리</div>
            <button className={`nav-btn ${activeMenu === '학생 목록' ? 'active' : ''}`} onClick={() => handleMenuClick('학생 목록')}>학생 목록</button>
            <button className={`nav-btn ${activeMenu === '학생 상담 이력' ? 'active' : ''}`} onClick={() => handleMenuClick('학생 상담 이력')}>학생 상담 이력</button>
            <button className={`nav-btn ${isSearchMenuActive ? 'parent-active' : ''}`} onClick={() => handleMenuClick('통합 검색')}>
              통합 검색
              <span className={`nav-arrow ${searchDropdownOpen ? 'open' : ''}`}>▼</span>
            </button>
            <div className={`sub-menu ${searchDropdownOpen ? 'open' : ''}`}>
              {SEARCH_SUB_MENUS.map(sub => (
                <button key={sub} className={`sub-nav-btn ${activeMenu === sub ? 'active' : ''}`} onClick={() => setActiveMenu(sub)}>{sub}</button>
              ))}
            </div>
            <button className={`nav-btn ${isJobMenuActive ? 'parent-active' : ''}`} onClick={() => handleMenuClick('학생 근로')}>
              학생 근로
              {pendingJobs > 0 && <span className="nav-badge">{pendingJobs}</span>}
              <span className={`nav-arrow ${jobDropdownOpen ? 'open' : ''}`} style={{ marginLeft: pendingJobs > 0 ? '0.25rem' : 'auto' }}>▼</span>
            </button>
            <div className={`sub-menu ${jobDropdownOpen ? 'open' : ''}`}>
              {JOB_SUB_MENUS.map(sub => (
                <button key={sub} className={`sub-nav-btn ${activeMenu === sub ? 'active' : ''}`} onClick={() => setActiveMenu(sub)}>{sub}</button>
              ))}
            </div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">학사</div>
            <button className={`nav-btn ${activeMenu === '출결 관리' ? 'active' : ''}`} onClick={() => handleMenuClick('출결 관리')}>출결 관리</button>
            <button className={`nav-btn ${activeMenu === '과목 관리' ? 'active' : ''}`} onClick={() => handleMenuClick('과목 관리')}>과목 관리</button>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">활동 및 시스템</div>
            <button className={`nav-btn ${activeMenu === '마일리지 승인' ? 'active' : ''}`} onClick={() => handleMenuClick('마일리지 승인')}>마일리지 승인</button>
            <button className={`nav-btn ${activeMenu === '마일리지 조회' ? 'active' : ''}`} onClick={() => handleMenuClick('마일리지 조회')}>마일리지 조회</button>
            <button className={`nav-btn ${isProfMenuActive ? 'parent-active' : ''}`} onClick={() => handleMenuClick('교수 관리')}>
              교수 관리
              <span className={`nav-arrow ${profDropdownOpen ? 'open' : ''}`}>▼</span>
            </button>
            <div className={`sub-menu ${profDropdownOpen ? 'open' : ''}`}>
              {PROF_SUB_MENUS.map(sub => (
                <button key={sub} className={`sub-nav-btn ${activeMenu === sub ? 'active' : ''}`} onClick={() => setActiveMenu(sub)}>{sub}</button>
              ))}
            </div>
            <button className={`nav-btn ${activeMenu === '학과/학기 관리' ? 'active' : ''}`} onClick={() => handleMenuClick('학과/학기 관리')}>학과/학기 관리</button>
          </div>

          {/* 권한 관리 별도 카테고리 */}
          <div className="sb-sec">
            <div className="sb-lbl" style={{ color:'rgba(239,68,68,0.6)' }}>시스템 관리</div>
            <button
              className={`nav-btn ${activeMenu === '권한 관리' ? 'active' : ''}`}
              onClick={() => handleMenuClick('권한 관리')}
              style={{ background: activeMenu === '권한 관리' ? '#EF4444' : 'rgba(239,68,68,0.12)', color: activeMenu === '권한 관리' ? '#fff' : '#FCA5A5' }}
            >
              🔐 권한 관리
            </button>
          </div>

          <div className="sidebar-bottom">
            <div className="user-info">
              <div className="user-avatar">A</div>
              <div>
                <div className="user-name">관리자</div>
                <div className="user-role">ADMIN</div>
              </div>
            </div>
          </div>
        </div>

        <div className="main">
          <TopBar title={activeMenu} />
          <div className="content">

            {activeMenu === '대시보드' && (
              <>
                <div className="dash-header">
                  <div>
                    <div className="dash-title">대시보드</div>
                    <div className="dash-subtitle">
                      {currentSemester ? `${currentSemester.year}년 ${currentSemester.term}학기 · 실시간 현황` : '실시간 현황'}
                    </div>
                  </div>
                  <div className="dash-actions">
                    <button className="btn btn-excel" onClick={() => setIsExcelModalOpen(true)}>
                      📥 엑셀 일괄 등록
                    </button>
                  </div>
                </div>

                <div className="section-label">주요 지표</div>
                <div className="stats-grid">
                  <button className="stat-card c-blue" onClick={() => setActiveMenu('학생 목록')}>
                    <div className="stat-icon-wrap c-blue">👥</div>
                    <div className="stat-lbl">전체 재학생</div>
                    <div className="stat-val">{totalStudents}<span className="unit">명</span></div>
                    <div className="stat-hint">전체 등록 학생 수</div>
                  </button>
                  <button className="stat-card c-red" onClick={() => setActiveMenu('비자 만료 현황')}>
                    <div className="stat-icon-wrap c-red">🛂</div>
                    <div className="stat-lbl">비자 만료 임박</div>
                    <div className="stat-val" style={{color:'#EF4444'}}>{visaList.length}<span className="unit">명</span></div>
                    <div className="stat-hint">D-30 이내 · 위험 {visaDanger.length}명</div>
                  </button>
                  <button className="stat-card c-amber" onClick={() => setActiveMenu('출결 관리')}>
                    <div className="stat-icon-wrap c-amber">⚠️</div>
                    <div className="stat-lbl">출결 위험군</div>
                    <div className="stat-val" style={{color:'#F59E0B'}}>{attendanceList.length}<span className="unit">명</span></div>
                    <div className="stat-hint">위험 {attendDanger.length}명 · 주의 {attendWarning.length}명</div>
                  </button>
                  <button className="stat-card c-purple" onClick={() => setActiveMenu('학생 근로')}>
                    <div className="stat-icon-wrap c-purple">📋</div>
                    <div className="stat-lbl">근로 승인 대기</div>
                    <div className="stat-val">{pendingJobs}<span className="unit">건</span></div>
                    <div className="stat-hint">승인 처리 필요</div>
                  </button>
                </div>

                <div className="section-label">빠른 이동</div>
                <div className="quick-grid" style={{gridTemplateColumns:'repeat(2,1fr)'}}>
                  <button className="qa-card" onClick={() => setIsExcelModalOpen(true)}>
                    <div className="qa-icon" style={{background:'#ECFDF5'}}>📥</div>
                    <div><div className="qa-text">엑셀 업로드</div><div className="qa-sub">일괄 데이터 등록</div></div>
                  </button>
                  <button className="qa-card" onClick={() => setActiveMenu('권한 관리')}>
                    <div className="qa-icon" style={{background:'#FEF2F2'}}>🔐</div>
                    <div><div className="qa-text">권한 관리</div><div className="qa-sub">역할별 기능 제어</div></div>
                  </button>
                </div>

                <div className="section-label">알림 현황</div>
                <div className="bottom-grid">
                  <div className="data-card">
                    <div className="card-hd" style={{cursor:'pointer'}} onClick={() => setActiveMenu('비자 만료 현황')}>
                      <span className="card-hd-title">비자 만료 임박 (D-30)</span>
                      <div style={{display:'flex', gap:6, alignItems:'center'}}>
                        {visaDanger.length > 0 && <span className="count-pill" style={{background:'#FEF2F2', color:'#DC2626'}}>위험 {visaDanger.length}명</span>}
                        {visaWarning.length > 0 && <span className="count-pill" style={{background:'#FFFBEB', color:'#D97706'}}>주의 {visaWarning.length}명</span>}
                        {visaList.length === 0 && <span className="count-pill">이상 없음</span>}
                        <span style={{fontSize:'0.75rem', color:'#9CA3AF'}}>→</span>
                      </div>
                    </div>
                    <div style={{padding:'16px 18px'}}>
                      {visaList.length === 0 ? (
                        <div className="empty-box">만료 임박 학생이 없습니다. ✅</div>
                      ) : (
                        <>
                          <div className="summary-row"><span style={{fontSize:'0.8125rem', color:'#374151', fontWeight:500}}>위험 (D-14 이내)</span><span style={{fontSize:'0.6875rem', fontWeight:700, padding:'3px 10px', borderRadius:20, background:'#FEF2F2', color:'#DC2626'}}>{visaDanger.length}명</span></div>
                          <div className="summary-row"><span style={{fontSize:'0.8125rem', color:'#374151', fontWeight:500}}>주의 (D-15~30)</span><span style={{fontSize:'0.6875rem', fontWeight:700, padding:'3px 10px', borderRadius:20, background:'#FFFBEB', color:'#D97706'}}>{visaWarning.length}명</span></div>
                          <div className="summary-row"><span style={{fontSize:'0.8125rem', color:'#374151', fontWeight:500}}>전체 대상</span><span style={{fontSize:'0.6875rem', fontWeight:700, padding:'3px 10px', borderRadius:20, background:'#F3F4F6', color:'#6B7280'}}>{visaList.length}명</span></div>
                        </>
                      )}
                    </div>
                    {visaList.length > 0 && (
                      <div style={{padding:'10px 18px', fontSize:'0.75rem', color:'#3B82F6', cursor:'pointer', borderTop:'1px solid #F3F4F6', textAlign:'right'}} onClick={() => setActiveMenu('비자 만료 현황')}>전체 목록 보기 →</div>
                    )}
                  </div>

                  <div className="data-card">
                    <div className="card-hd" style={{cursor:'pointer'}} onClick={() => setActiveMenu('출결 관리')}>
                      <span className="card-hd-title">출결 위험군</span>
                      <div style={{display:'flex', gap:6, alignItems:'center'}}>
                        {attendDanger.length > 0 && <span className="count-pill" style={{background:'#FEF2F2', color:'#DC2626'}}>위험 {attendDanger.length}명</span>}
                        {attendWarning.length > 0 && <span className="count-pill" style={{background:'#FFFBEB', color:'#D97706'}}>주의 {attendWarning.length}명</span>}
                        {attendanceList.length === 0 && <span className="count-pill">이상 없음</span>}
                        <span style={{fontSize:'0.75rem', color:'#9CA3AF'}}>→</span>
                      </div>
                    </div>
                    <div style={{padding:'16px 18px'}}>
                      {attendanceList.length === 0 ? (
                        <div className="empty-box">출결 위험군이 없습니다. ✅</div>
                      ) : (
                        <>
                          <div className="summary-row"><span style={{fontSize:'0.8125rem', color:'#374151', fontWeight:500}}>위험 (결석 4회+)</span><span style={{fontSize:'0.6875rem', fontWeight:700, padding:'3px 10px', borderRadius:20, background:'#FEF2F2', color:'#DC2626'}}>{attendDanger.length}명</span></div>
                          <div className="summary-row"><span style={{fontSize:'0.8125rem', color:'#374151', fontWeight:500}}>주의 (결석 2~3회)</span><span style={{fontSize:'0.6875rem', fontWeight:700, padding:'3px 10px', borderRadius:20, background:'#FFFBEB', color:'#D97706'}}>{attendWarning.length}명</span></div>
                          <div className="summary-row"><span style={{fontSize:'0.8125rem', color:'#374151', fontWeight:500}}>전체 대상</span><span style={{fontSize:'0.6875rem', fontWeight:700, padding:'3px 10px', borderRadius:20, background:'#F3F4F6', color:'#6B7280'}}>{attendanceList.length}명</span></div>
                        </>
                      )}
                    </div>
                    {attendanceList.length > 0 && (
                      <div style={{padding:'10px 18px', fontSize:'0.75rem', color:'#3B82F6', cursor:'pointer', borderTop:'1px solid #F3F4F6', textAlign:'right'}} onClick={() => setActiveMenu('출결 관리')}>출결 관리로 이동 →</div>
                    )}
                  </div>
                </div>

                <div className="data-card online-card">
                  <div className="card-hd">
                    <span className="card-hd-title">순수 온라인 수업 비율 30% 초과</span>
                    <span className="count-pill">{onlineList.length}명</span>
                  </div>
                  {onlineList.length === 0
                    ? <div className="empty-box">초과 학생이 없습니다. ✅</div>
                    : onlineList.map(o => (
                      <div key={o.studentId} className="online-row">
                        <div className="online-name">{o.korName}</div>
                        <div className="prog-bar"><div className="prog-fill" style={{width:`${Math.min((o.onlineRatio||0)*100,100)}%`}} /></div>
                        <div className="prog-pct">{((o.onlineRatio||0)*100).toFixed(1)}%</div>
                      </div>
                    ))
                  }
                </div>
              </>
            )}

            {activeMenu === '학생 목록'               && <StudentList />}
            {activeMenu === '학생 상담 이력'           && <ConsultTab />}
            {activeMenu === '비자 만료 현황'           && <AdminVisaExpirePage />}
            {activeMenu === '개인별 검색'              && <SearchByStudent onBack={() => setActiveMenu('대시보드')} />}
            {activeMenu === '학과별 검색'              && <SearchByDept    onBack={() => setActiveMenu('대시보드')} />}
            {activeMenu === '학과-반별 검색'           && <SearchByClass   onBack={() => setActiveMenu('대시보드')} />}
            {activeMenu === '과목별 검색'              && <SearchByCourse  onBack={() => setActiveMenu('대시보드')} />}
            {activeMenu === '온라인 30% 초과 검색'     && <OnlineViolation onBack={() => setActiveMenu('대시보드')} />}
            {activeMenu === '학생 근로'                && <JobPending      onBack={() => setActiveMenu('대시보드')} />}
            {activeMenu === '학생 근로 현황'           && <JobTab          onBack={() => setActiveMenu('대시보드')} />}
            {activeMenu === '출결 관리'                && <SearchByClass   onBack={() => setActiveMenu('대시보드')} />}
            {activeMenu === '과목 관리'                && <CourseList      key={courseListRefreshKey} onBack={() => setActiveMenu('대시보드')} />}
            {activeMenu === '전체 교수 목록'           && <ProfessorList   onRegisterClick={() => setActiveMenu('교수 등록')} />}
            {activeMenu === '학생-지도교수 배정 관리'  && <AdvisorAssign />}
            {activeMenu === '교수 등록'                && <ProfessorRegister onComplete={() => setActiveMenu('전체 교수 목록')} onCancel={() => setActiveMenu('전체 교수 목록')} />}
            {activeMenu === '마일리지 승인'            && <MileageTab      onBack={() => setActiveMenu('대시보드')} />}
            {activeMenu === '마일리지 조회'            && <MileageManage />}
            {activeMenu === '학과/학기 관리'           && <SemesterManagement />}
            {activeMenu === '권한 관리'                && <SystemConfig />}

            {NOT_IMPLEMENTED.has(activeMenu) && (
              <div className="not-impl">
                <h2>{activeMenu} 기능 준비 중</h2>
                <p>중간고사 이후 업데이트될 예정입니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AdminExcelUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={(key) => {
          setIsExcelModalOpen(false);
          if (key === 'course') {
            setActiveMenu('과목 관리');
            setCourseListRefreshKey(prev => prev + 1);
          }
        }}
      />
    </>
  );
}
