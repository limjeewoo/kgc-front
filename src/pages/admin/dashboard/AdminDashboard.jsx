import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import TopBar from '../../../components/layout/TopBar.jsx';
import StudentList from '../students/StudentList.jsx';
import SearchByDept from '../search/SearchByDept.jsx';
import SearchByClass from '../search/SearchByClass.jsx';
import SearchByCourse from '../search/SearchByCourse.jsx';
import OnlineViolation from '../search/OnlineViolation.jsx';
import CourseList from '../courses/CourseList.jsx';
import SearchByStudent from '../search/SearchByStudent.jsx';
import ProfessorList from '../professors/ProfessorList.jsx';
import ProfessorRegister from '../professors/ProfessorRegister.jsx';
import AdvisorAssign from '../professors/AdvisorAssign.jsx';

// 교양필수 및 시스템 설정 등 미구현 페이지 핸들링용
const NOT_IMPLEMENTED = new Set(['마일리지 승인', '상담 내역', '교양필수 관리', '학과/학기 관리']);

const SEARCH_SUB_MENUS = ['개인별 검색', '학과별 검색', '학과-반별 검색', '과목별 검색', '온라인 30% 초과 검색'];
const PROF_SUB_MENUS = ['전체 교수 목록', '학생-지도교수 배정 관리'];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('대시보드');
  
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [profDropdownOpen, setProfDropdownOpen] = useState(false);
  
  const [currentSemester, setCurrentSemester] = useState(null);
  const [visaList, setVisaList] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [onlineList, setOnlineList] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pendingJobs, setPendingJobs] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 병렬 API 호출 (수정된 경로 반영)
        const results = await Promise.allSettled([
          api.get('/api/v1/semesters/current'),
          api.get('/api/v1/students'), // 전교생 조회 (deptId 없이 가능)
          api.get('/api/v1/visas/expiring', { params: { days: 30 } }),
          api.get('/api/v1/attend/warnings'), // 수정된 출결 위험군 API
          api.get('/api/v1/search/online-violations'), // 수정된 온라인 위반 API
          // api.get('/api/v1/mileage/pending').catch(() => ({ data: { data: [] } })) // 마일리지 대기(예시)
        ]);

        const [semRes, studentsRes, visaRes, attendRes, onlineRes, jobsRes] = results;

        // 옵셔널 체이닝(?.)을 추가하여 변수가 undefined일 때 발생하는 에러를 원천 차단합니다.
        if (semRes?.status === 'fulfilled' && semRes.value?.data?.success) {
          setCurrentSemester(semRes.value.data.data);
        }
        
        if (studentsRes?.status === 'fulfilled' && studentsRes.value?.data?.success) {
          const students = studentsRes.value.data.data || [];
          setTotalStudents(students.length);
        }

        if (visaRes?.status === 'fulfilled' && visaRes.value?.data?.success) {
          setVisaList(visaRes.value.data.data || []);
        }

        if (attendRes?.status === 'fulfilled' && attendRes.value?.data?.success) {
          // attendRes가 배열을 바로 주거나 data.data에 담겨오는 경우 대응
          setAttendanceList(attendRes.value.data.data || []);
        }

        if (onlineRes?.status === 'fulfilled' && onlineRes.value?.data?.success) {
          setOnlineList(onlineRes.value.data.data || []);
        }

        if (jobsRes?.status === 'fulfilled' && jobsRes.value?.data?.success) {
          setPendingJobs(jobsRes.value.data.data?.length || 0);
        }

      } catch (error) {
        console.error('대시보드 데이터 로드 중 에러:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeMenu === '대시보드') {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [activeMenu]);

  const isSearchMenuActive = SEARCH_SUB_MENUS.includes(activeMenu);
  const isProfMenuActive = PROF_SUB_MENUS.includes(activeMenu) || activeMenu === '교수 등록';

  const handleMenuClick = (menuName) => {
    if (menuName === '통합 검색') {
      setSearchDropdownOpen(prev => !prev);
      setProfDropdownOpen(false);
      return;
    }
    
    if (menuName === '교수 관리') {
      setProfDropdownOpen(prev => !prev);
      setSearchDropdownOpen(false);
      return;
    }

    setActiveMenu(menuName);
    if (!SEARCH_SUB_MENUS.includes(menuName)) setSearchDropdownOpen(false);
    if (!PROF_SUB_MENUS.includes(menuName) && menuName !== '교수 등록') setProfDropdownOpen(false);
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#1A3A5C' }}>데이터 동기화 중...</div>;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
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
        .content { flex: 1; padding: 1.5rem 1.75rem; overflow-y: auto; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .stat-card { background: #fff; border-radius: 0.875rem; padding: 1.25rem; border: none; cursor: pointer; transition: 0.2s; text-align: left; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
        .stat-label { font-size: 0.75rem; color: #6B7280; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem; }
        .stat-dot { width: 6px; height: 6px; border-radius: 50%; }
        .stat-value { font-size: 1.75rem; font-weight: 700; }
        .stat-value span { font-size: 0.875rem; font-weight: 400; color: #9CA3AF; }
        .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .card { background: #fff; border-radius: 0.875rem; border: 1px solid #F3F4F6; overflow: hidden; }
        .card-header { padding: 1rem 1.25rem; border-bottom: 1px solid #F3F4F6; font-weight: 700; font-size: 0.875rem; display: flex; justify-content: space-between; }
        .list-btn { width: 100%; border: none; background: transparent; display: flex; align-items: center; padding: 0.875rem 1.25rem; border-bottom: 1px solid #F9FAFB; gap: 0.75rem; cursor: pointer; text-align: left; }
        .list-btn:hover { background: #F9FAFB; }
        .item-avatar { width: 2.25rem; height: 2.25rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; }
        .item-info { flex: 1; }
        .item-name { font-size: 0.8125rem; font-weight: 600; }
        .item-sub { font-size: 0.75rem; color: #9CA3AF; }
        .badge-red { background: #FEF2F2; color: #EF4444; font-size: 0.68rem; padding: 2px 8px; border-radius: 4px; font-weight: 700; }
        .online-row { display: flex; align-items: center; padding: 0.75rem 1.25rem; border-bottom: 1px solid #F9FAFB; gap: 1rem; }
        .progress-bar { flex: 1; height: 6px; background: #F3F4F6; border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; background: #EF4444; }
        .empty-state { padding: 2rem 1.25rem; text-align: center; color: #9CA3AF; font-size: 0.8125rem; }
        .not-impl { padding: 4rem; text-align: center; background: #fff; border-radius: 1rem; }
        .not-impl h2 { font-size: 1.25rem; margin-bottom: 0.75rem; color: #374151; }
        .not-impl p  { color: #9CA3AF; font-size: 0.875rem; }
      `}</style>

      <div className="admin-wrap">
        <div className="sidebar">
          <div className="sidebar-logo" onClick={() => setActiveMenu('대시보드')}>
            <img src="/logo-fff.png" alt="Logo" className="logo-img" />
            <div className="logo-text">KMGC <span>경민대학교 국제교육원</span></div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">메인</div>
            <button className={`nav-btn ${activeMenu === '대시보드' ? 'active' : ''}`} onClick={() => handleMenuClick('대시보드')}>대시보드</button>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">학생 관리</div>
            <button className={`nav-btn ${activeMenu === '학생 목록' ? 'active' : ''}`} onClick={() => handleMenuClick('학생 목록')}>학생 목록</button>
            <button className={`nav-btn ${isSearchMenuActive ? 'parent-active' : ''}`} onClick={() => handleMenuClick('통합 검색')}>
              통합 검색 <span className={`nav-arrow ${searchDropdownOpen ? 'open' : ''}`}>▼</span>
            </button>
            <div className={`sub-menu ${searchDropdownOpen ? 'open' : ''}`}>
              {SEARCH_SUB_MENUS.map(sub => (
                <button key={sub} className={`sub-nav-btn ${activeMenu === sub ? 'active' : ''}`} onClick={() => setActiveMenu(sub)}>{sub}</button>
              ))}
            </div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">학사</div>
            <button className={`nav-btn ${activeMenu === '출결 관리' ? 'active' : ''}`} onClick={() => handleMenuClick('출결 관리')}>출결 관리</button>
            <button className={`nav-btn ${activeMenu === '과목 관리' ? 'active' : ''}`} onClick={() => handleMenuClick('과목 관리')}>과목 관리</button>
            <button className={`nav-btn ${activeMenu === '교양필수 관리' ? 'active' : ''}`} onClick={() => handleMenuClick('교양필수 관리')}>교양필수 관리</button>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">활동 및 시스템</div>
            <button className={`nav-btn ${activeMenu === '마일리지 승인' ? 'active' : ''}`} onClick={() => handleMenuClick('마일리지 승인')}>
              마일리지 승인 {pendingJobs > 0 && <span className="nav-badge">{pendingJobs}</span>}
            </button>
            <button className={`nav-btn ${isProfMenuActive ? 'parent-active' : ''}`} onClick={() => handleMenuClick('교수 관리')}>
              교수 관리 <span className={`nav-arrow ${profDropdownOpen ? 'open' : ''}`}>▼</span>
            </button>
            <div className={`sub-menu ${profDropdownOpen ? 'open' : ''}`}>
              {PROF_SUB_MENUS.map(sub => (
                <button key={sub} className={`sub-nav-btn ${activeMenu === sub ? 'active' : ''}`} onClick={() => setActiveMenu(sub)}>{sub}</button>
              ))}
            </div>
            <button className={`nav-btn ${activeMenu === '학과/학기 관리' ? 'active' : ''}`} onClick={() => handleMenuClick('학과/학기 관리')}>학과/학기 관리</button>
          </div>
        </div>

        <div className="main">
          <TopBar title={activeMenu} />
          <div className="content">
            {activeMenu === '대시보드' && (
              <>
                <div className="stats-grid">
                  <button className="stat-card" onClick={() => setActiveMenu('학생 목록')}>
                    <div className="stat-label"><div className="stat-dot" style={{background:'#3B82F6'}}/>전체 재학생</div>
                    <div className="stat-value">{totalStudents} 명</div>
                  </button>
                  <button className="stat-card" onClick={() => setActiveMenu('개인별 검색')}>
                    <div className="stat-label"><div className="stat-dot" style={{background:'#EF4444'}}/>비자 만료 임박</div>
                    <div className="stat-value" style={{color:'#EF4444'}}>{visaList.length} 명</div>
                  </button>
                  <button className="stat-card" onClick={() => setActiveMenu('출결 관리')}>
                    <div className="stat-label"><div className="stat-dot" style={{background:'#F59E0B'}}/>출결 위험군</div>
                    <div className="stat-value" style={{color:'#F59E0B'}}>{attendanceList.length} 명</div>
                  </button>
                  <button className="stat-card" onClick={() => setActiveMenu('마일리지 승인')}>
                    <div className="stat-label"><div className="stat-dot" style={{background:'#8B5CF6'}}/>마일리지 대기</div>
                    <div className="stat-value">{pendingJobs} 건</div>
                  </button>
                </div>

                <div className="bottom-grid">
                  <div className="card">
                    <div className="card-header">비자 만료 임박 학생 (D-30) <span>{visaList.length}명</span></div>
                    {visaList.length === 0 ? <div style={{padding:'2rem', textAlign:'center', color:'#9CA3AF'}}>만료 임박 학생이 없습니다.</div> : 
                      visaList.map(v => (
                        <button key={v.studentId} className="list-btn">
                          <div className="item-avatar" style={{background:'#FEF2F2', color:'#EF4444'}}>{v.studentName?.[0]}</div>
                          <div className="item-info">
                            <div className="item-name">{v.studentName}</div>
                            <div className="item-sub">비자: {v.visaType} · {v.expiryDate}</div>
                          </div>
                          <div className="badge-red">D-{v.dDay}</div>
                        </button>
                      ))
                    }
                  </div>

                  <div className="card">
                    <div className="card-header">출결 위험군 학생 <span>{attendanceList.length}명</span></div>
                    {attendanceList.length === 0 ? <div style={{padding:'2rem', textAlign:'center', color:'#9CA3AF'}}>출결 위험군이 없습니다.</div> : 
                      attendanceList.map(a => (
                        <button key={a.enrollId || a.studentId} className="list-btn">
                          <div className="item-avatar" style={{background:'#FFFBEB', color:'#D97706'}}>{a.studentName?.[0]}</div>
                          <div className="item-info">
                            <div className="item-name">{a.studentName}</div>
                            <div className="item-sub">{a.courseName || a.deptName}</div>
                          </div>
                          <div className="badge-red" style={{background:'#FEE2E2'}}>결석 {a.totalAbsent || a.absenceCount}회</div>
                        </button>
                      ))
                    }
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">순수 온라인 수업 비율 30% 초과</div>
                  {onlineList.length === 0 ? <div style={{padding:'2rem', textAlign:'center', color:'#9CA3AF'}}>초과 학생이 없습니다.</div> : 
                    onlineList.map(o => (
                      <div key={o.studentId} style={{display:'flex', alignItems:'center', padding:'0.75rem 1.25rem', borderBottom:'1px solid #F9FAFB'}}>
                        <div style={{width:'100px', fontSize:'0.81rem', fontWeight:600}}>{o.korName}</div>
                        <div className="progress-bar"><div className="progress-fill" style={{width:`${Math.min((o.onlineRatio || 0)*100, 100)}%`}} /></div>
                        <div style={{width:'60px', textAlign:'right', fontSize:'0.75rem', color:'#EF4444', fontWeight:'bold'}}>{((o.onlineRatio || 0)*100).toFixed(1)}%</div>
                      </div>
                    ))
                  }
                </div>
              </>
            )}

            {/* 라우팅 컴포넌트들 */}
            {activeMenu === '학생 목록' && <StudentList />}
            {activeMenu === '개인별 검색' && <SearchByStudent onBack={() => setActiveMenu('대시보드')} />}
            {activeMenu === '학과별 검색' && <SearchByDept onBack={() => setActiveMenu('대시보드')} />}
            {activeMenu === '학과-반별 검색' && <SearchByClass onBack={() => setActiveMenu('대시보드')} />}
            {activeMenu === '과목별 검색' && <SearchByCourse onBack={() => setActiveMenu('대시보드')} />}
            {activeMenu === '온라인 30% 초과 검색' && <OnlineViolation onBack={() => setActiveMenu('대시보드')} />}
            {activeMenu === '출결 관리' && <SearchByClass onBack={() => setActiveMenu('대시보드')} />}
            {activeMenu === '과목 관리' && <CourseList onBack={() => setActiveMenu('대시보드')} />}
            {activeMenu === '전체 교수 목록' && <ProfessorList onRegisterClick={() => setActiveMenu('교수 등록')} />}
            {activeMenu === '학생-지도교수 배정 관리' && <AdvisorAssign />}
            {activeMenu === '교수 등록' && <ProfessorRegister onComplete={() => setActiveMenu('전체 교수 목록')} onCancel={() => setActiveMenu('전체 교수 목록')} />}

            {NOT_IMPLEMENTED.has(activeMenu) && (
              <div className="not-impl">
                <h2>{activeMenu} 기능 준비 중</h2>
                <p>중간고사 이후 업데이트될 예정입니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}