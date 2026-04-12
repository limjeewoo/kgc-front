import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
  // --- 1. 상태 관리 ---
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('대시보드');
  const [currentSemester, setCurrentSemester] = useState(null);
  const [visaList, setVisaList] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [onlineList, setOnlineList] = useState([]);

  // --- 2. API 데이터 호출 ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      try {
        setLoading(true);
        const [semRes, visaRes, attendRes, onlineRes] = await Promise.all([
          fetch('https://api.kmgc.world/api/v1/semesters/current', { headers }).then(r => r.json()),
          fetch('https://api.kmgc.world/api/v1/visas/expiring?days=30', { headers }).then(r => r.json()),
          fetch('https://api.kmgc.world/api/v1/academic/attendance-warnings', { headers }).then(r => r.json()),
          fetch('https://api.kmgc.world/api/v1/academic/online-violations', { headers }).then(r => r.json())
        ]);

        if (semRes.success) setCurrentSemester(semRes.data);
        if (visaRes.success) setVisaList(visaRes.data);
        if (attendRes.success) setAttendanceList(attendRes.data);
        if (onlineRes.success) setOnlineList(onlineRes.data);

      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleMenuClick = (menuName) => {
    setActiveMenu(menuName);
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

        /* --- 사이드바 --- */
        .sidebar { width: 14.375rem; background: var(--sidebar-bg); display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; flex-shrink: 0; }
        
        .sidebar-logo { 
          display: flex; align-items: center; gap: 0.625rem; 
          padding: 1.5rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); 
          cursor: pointer; 
        }
        
        /* 로고 이미지 스타일 */
        .logo-img { 
          width: 2.2rem; 
          height: auto; 
          object-fit: contain;
          flex-shrink: 0;
        }

        .logo-text { font-size: 0.8125rem; font-weight: 700; color: #fff; line-height: 1.3; }
        .logo-text span { display: block; font-size: 0.625rem; font-weight: 400; color: rgba(255,255,255,0.4); }

        .sb-sec { padding: 0.75rem 0.75rem 0.25rem; }
        .sb-lbl { font-size: 0.625rem; font-weight: 600; color: rgba(255,255,255,0.3); text-transform: uppercase; padding: 0 0.5rem; margin-bottom: 0.3rem; }

        .nav-btn { 
          display: flex; align-items: center; width: 100%; border: none; background: transparent;
          padding: 0.625rem 0.75rem; border-radius: 0.5rem; color: rgba(255,255,255,0.65); 
          font-size: 0.8125rem; cursor: pointer; transition: 0.2s; margin-bottom: 2px; text-align: left;
        }
        .nav-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .nav-btn.active { background: var(--primary); color: #fff; font-weight: 600; }
        .nav-badge { margin-left: auto; background: #EF4444; color: #fff; font-size: 0.625rem; padding: 1px 6px; border-radius: 10px; font-weight: 700; }

        /* --- 사이드바 하단 유저 정보 (추가된 부분) --- */
        .sidebar-bottom { margin-top: auto; padding: 0.75rem; border-top: 1px solid rgba(255,255,255,0.08); }
        .user-info { display: flex; align-items: center; gap: 0.625rem; padding: 0.625rem; border-radius: 0.5rem; cursor: pointer; border: none; background: transparent; width: 100%; text-align: left; transition: 0.2s; }
        .user-info:hover { background: rgba(255,255,255,0.08); }
        .user-avatar { width: 2rem; height: 2rem; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: #fff; flex-shrink: 0; }
        .user-name { font-size: 0.8125rem; font-weight: 600; color: #fff; }
        .user-role { font-size: 0.6875rem; color: rgba(255,255,255,0.4); margin-top: 0.125rem; }

        /* --- 메인 영역 --- */
        .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .topbar { background: #fff; padding: 0 1.75rem; height: 3.625rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E5E7EB; }
        .topbar-title { font-weight: 700; font-size: 1rem; }
        .semester-badge { background: #EFF6FF; color: #1D4ED8; font-size: 0.75rem; font-weight: 600; padding: 0.3rem 0.75rem; border-radius: 1rem; }

        .content { flex: 1; padding: 1.5rem 1.75rem; overflow-y: auto; }

        /* 대시보드 요약 카드 */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .stat-card { background: #fff; border-radius: 0.875rem; padding: 1.25rem; border: none; cursor: pointer; transition: 0.2s; text-align: left; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
        .stat-label { font-size: 0.75rem; color: #6B7280; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem; }
        .stat-dot { width: 6px; height: 6px; border-radius: 50%; }
        .stat-value { font-size: 1.75rem; font-weight: 700; }
        .stat-value span { font-size: 0.875rem; font-weight: 400; color: #9CA3AF; }

        /* 리스트 카드 스타일 */
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
      `}</style>

      <div className="admin-wrap">
        {/* --- 왼쪽 사이드바 --- */}
        <div className="sidebar">
          <div className="sidebar-logo" onClick={() => handleMenuClick('대시보드')}>
            {/* public 폴더의 logo-fff.png를 불러옴 */}
            <img src="/logo-fff.png" alt="KMGC Logo" className="logo-img" />
            <div className="logo-text">KMGC <span>경민대학교 국제교육원</span></div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">메인</div>
            <button className={`nav-btn ${activeMenu === '대시보드' ? 'active' : ''}`} onClick={() => handleMenuClick('대시보드')}>대시보드</button>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">학생 관리</div>
            <button className={`nav-btn ${activeMenu === '학생 목록' ? 'active' : ''}`} onClick={() => handleMenuClick('학생 목록')}>학생 목록</button>
            <button className={`nav-btn ${activeMenu === '통합 검색' ? 'active' : ''}`} onClick={() => handleMenuClick('통합 검색')}>통합 검색</button>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">학사</div>
            <button className={`nav-btn ${activeMenu === '출결 관리' ? 'active' : ''}`} onClick={() => handleMenuClick('출결 관리')}>출결 관리</button>
            <button className={`nav-btn ${activeMenu === '온라인 30% 확인' ? 'active' : ''}`} onClick={() => handleMenuClick('온라인 30% 확인')}>
              온라인 30% 확인 <span className="nav-badge">{onlineList.length}</span>
            </button>
            <button className={`nav-btn ${activeMenu === '과목 관리' ? 'active' : ''}`} onClick={() => handleMenuClick('과목 관리')}>과목 관리</button>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">활동</div>
            <button className={`nav-btn ${activeMenu === '마일리지 승인' ? 'active' : ''}`} onClick={() => handleMenuClick('마일리지 승인')}>
              마일리지 승인 <span className="nav-badge">0</span>
            </button>
            <button className={`nav-btn ${activeMenu === '상담 내역' ? 'active' : ''}`} onClick={() => handleMenuClick('상담 내역')}>상담 내역</button>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">시스템</div>
            <button className={`nav-btn ${activeMenu === '교수 관리' ? 'active' : ''}`} onClick={() => handleMenuClick('교수 관리')}>교수 관리</button>
          </div>

          {/* --- 사이드바 하단 프로필 (추가된 부분) --- */}
          <div className="sidebar-bottom">
            <button className="user-info">
              <div className="user-avatar">관</div>
              <div>
                <div className="user-name">국제교육원</div>
                <div className="user-role">관리자</div>
              </div>
            </button>
          </div>
        </div>

        {/* --- 메인 영역 --- */}
        <div className="main">
          <div className="topbar">
            <div className="topbar-title">{activeMenu}</div>
            <div className="semester-badge">
              {currentSemester ? `${currentSemester.year}-${currentSemester.term}학기` : '학기 정보 로딩중'}
            </div>
          </div>

          <div className="content">
            {activeMenu === '대시보드' ? (
              <>
                <div className="stats-grid">
                  <button className="stat-card" onClick={() => handleMenuClick('학생 목록')}>
                    <div className="stat-label"><div className="stat-dot" style={{background:'#3B82F6'}}/>전체 재학생</div>
                    <div className="stat-value">0 <span>명</span></div>
                  </button>
                  <button className="stat-card" onClick={() => handleMenuClick('학생 목록')}>
                    <div className="stat-label"><div className="stat-dot" style={{background:'#EF4444'}}/>비자 만료 임박</div>
                    <div className="stat-value" style={{color: '#EF4444'}}>{visaList.length} <span>명</span></div>
                  </button>
                  <button className="stat-card" onClick={() => handleMenuClick('출결 관리')}>
                    <div className="stat-label"><div className="stat-dot" style={{background:'#F59E0B'}}/>출결 위험군</div>
                    <div className="stat-value" style={{color: '#F59E0B'}}>{attendanceList.length} <span>명</span></div>
                  </button>
                  <button className="stat-card" onClick={() => handleMenuClick('마일리지 승인')}>
                    <div className="stat-label"><div className="stat-dot" style={{background:'#8B5CF6'}}/>마일리지 대기</div>
                    <div className="stat-value">0 <span>건</span></div>
                  </button>
                </div>

                <div className="bottom-grid">
                  <div className="card">
                    <div className="card-header">비자 만료 임박 학생 (D-30) <span>{visaList.length}명</span></div>
                    {visaList.map(v => (
                      <button key={v.studentId} className="list-btn">
                        <div className="item-avatar" style={{color: '#EF4444', background:'#FEF2F2'}}>{v.korName[0]}</div>
                        <div className="item-info">
                          <div className="item-name">{v.korName} ({v.engName})</div>
                          <div className="item-sub">{v.nationality} · {v.visaType}</div>
                        </div>
                        <div className="badge-red">D-{v.dDay}</div>
                      </button>
                    ))}
                  </div>

                  <div className="card">
                    <div className="card-header">출결 위험군 학생 <span>{attendanceList.length}명</span></div>
                    {attendanceList.map(a => (
                      <button key={a.enrollId} className="list-btn">
                        <div className="item-avatar" style={{color: '#D97706', background:'#FFFBEB'}}>{a.studentName[0]}</div>
                        <div className="item-info">
                          <div className="item-name">{a.studentName}</div>
                          <div className="item-sub">{a.courseName}</div>
                        </div>
                        <div className="badge-red" style={{background:'#FEE2E2'}}>결석 {a.totalAbsent}회</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">순수 온라인 수업 비율 30% 초과</div>
                  {onlineList.map(o => (
                    <div key={o.studentId} className="online-row">
                      <div style={{width: '80px', fontSize: '0.81rem', fontWeight: '600'}}>{o.korName}</div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{width: `${o.onlineRatio * 100}%`}}></div>
                      </div>
                      <div style={{width: '50px', fontSize: '0.75rem', fontWeight: 'bold', color: '#EF4444', textAlign: 'right'}}>
                        {(o.onlineRatio * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: '4rem', textAlign: 'center', background: '#fff', borderRadius: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{activeMenu} 페이지</h2>
                <p style={{ color: '#6B7280' }}>이곳에 {activeMenu} 관련 기능을 구현해 주세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}