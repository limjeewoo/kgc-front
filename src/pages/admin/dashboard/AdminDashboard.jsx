// src/pages/admin/dashboard/AdminDashboard.jsx
export default function AdminDashboard() {
  const visaList = [
    { name: 'Wang Xiaoming', dept: '컴퓨터공학과', nation: '중국', dday: 7, level: 'danger' },
    { name: 'Nguyen Van An', dept: '경영학과', nation: '베트남', dday: 14, level: 'danger' },
    { name: 'Kim Jisoo', dept: '호텔경영학과', nation: '중국', dday: 21, level: 'warn' },
    { name: 'Park Minh', dept: '유아교육학과', nation: '베트남', dday: 28, level: 'warn' },
  ];

  const attendanceList = [
    { name: 'Liu Yang', dept: '컴퓨터공학과', course: '자료구조', count: 5, level: 'danger' },
    { name: 'Tran Thi Lan', dept: '경영학과', course: '경영학원론', count: 4, level: 'danger' },
    { name: 'Zhang Wei', dept: '호텔경영학과', course: '식음료관리', count: 3, level: 'warn' },
    { name: 'Hoang Duc', dept: '유아교육학과', course: '아동발달', count: 3, level: 'warn' },
  ];

  const onlineList = [
    { name: 'Chen Lihua', dept: '컴퓨터공학', ratio: 56, level: 'over' },
    { name: 'Nguyen Hoa', dept: '경영학', ratio: 44, level: 'over' },
    { name: 'Kim Seojun', dept: '호텔경영', ratio: 33, level: 'border' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        .admin-wrap { display: flex; min-height: 100vh; background: #F0F2F7; font-family: 'DM Sans','Noto Sans KR',sans-serif; font-size: 14px; color: #111827; }

        /* 사이드바 */
        .sidebar { width: 230px; min-height: 100vh; background: #1A3A5C; display: flex; flex-direction: column; flex-shrink: 0; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
        .sidebar-logo { display: flex; align-items: center; gap: 10px; padding: 24px 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 8px; }
        .logo-icon { width: 34px; height: 34px; background: #3B82F6; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .logo-text { font-size: 13px; font-weight: 700; color: #fff; letter-spacing: 0.2px; line-height: 1.3; }
        .logo-text span { display: block; font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.45); }
        .sb-sec { padding: 8px 12px 4px; }
        .sb-lbl { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.3); letter-spacing: 1px; text-transform: uppercase; padding: 0 8px; margin-bottom: 4px; }
        .nav-item { display: flex; align-items: center; gap: 9px; padding: 9px 10px; border-radius: 8px; color: rgba(255,255,255,0.6); font-size: 13px; font-weight: 400; cursor: pointer; transition: all 0.15s; margin-bottom: 1px; }
        .nav-item:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .nav-item.active { background: #3B82F6; color: #fff; font-weight: 500; }
        .nav-icon { width: 16px; height: 16px; flex-shrink: 0; opacity: 0.85; }
        .nav-badge { margin-left: auto; background: #EF4444; color: #fff; font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 20px; }
        .sidebar-bottom { margin-top: auto; padding: 12px; border-top: 1px solid rgba(255,255,255,0.08); }
        .user-info { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; cursor: pointer; }
        .user-info:hover { background: rgba(255,255,255,0.07); }
        .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: #3B82F6; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .user-name { font-size: 12.5px; font-weight: 500; color: #fff; }
        .user-role { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 1px; }

        /* 메인 */
        .main { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
        .topbar { background: #fff; padding: 0 28px; height: 58px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E5E7EB; flex-shrink: 0; }
        .topbar-title { font-size: 16px; font-weight: 700; color: #111827; letter-spacing: -0.2px; }
        .topbar-right { display: flex; align-items: center; gap: 14px; }
        .semester-badge { background: #EFF6FF; color: #1D4ED8; font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 20px; }
        .notif-btn { width: 34px; height: 34px; border-radius: 8px; background: #F3F4F6; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; position: relative; }
        .notif-dot { width: 7px; height: 7px; background: #EF4444; border-radius: 50%; position: absolute; top: 7px; right: 7px; border: 1.5px solid #fff; }

        /* 콘텐츠 */
        .content { flex: 1; padding: 24px 28px; overflow-y: auto; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 22px; }
        .stat-card { background: #fff; border-radius: 14px; padding: 20px 22px; border: 1px solid #F3F4F6; }
        .stat-label { font-size: 12px; color: #9CA3AF; font-weight: 500; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .stat-dot { width: 7px; height: 7px; border-radius: 50%; }
        .stat-value { font-size: 28px; font-weight: 700; color: #111827; letter-spacing: -1px; line-height: 1; margin-bottom: 6px; }
        .stat-value span { font-size: 14px; font-weight: 400; color: #9CA3AF; }
        .stat-sub { font-size: 11.5px; color: #9CA3AF; }
        .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .card { background: #fff; border-radius: 14px; border: 1px solid #F3F4F6; overflow: hidden; }
        .card-header { padding: 18px 20px 14px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F3F4F6; }
        .card-title { font-size: 13.5px; font-weight: 700; color: #111827; }
        .card-badge { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px; }
        .badge-red { background: #FEF2F2; color: #EF4444; }
        .badge-amber { background: #FFFBEB; color: #D97706; }
        .badge-blue { background: #EFF6FF; color: #3B82F6; }
        .list-item { display: flex; align-items: center; padding: 12px 20px; border-bottom: 1px solid #F9FAFB; gap: 12px; transition: background 0.1s; cursor: pointer; }
        .list-item:last-child { border-bottom: none; }
        .list-item:hover { background: #FAFAFA; }
        .item-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
        .item-info { flex: 1; min-width: 0; }
        .item-name { font-size: 13px; font-weight: 500; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .item-sub { font-size: 11.5px; color: #9CA3AF; margin-top: 1px; }
        .item-right { text-align: right; flex-shrink: 0; }
        .dday-chip { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; }
        .dday-danger { background: #FEF2F2; color: #DC2626; }
        .dday-warn { background: #FFFBEB; color: #D97706; }
        .absence-chip { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; background: #FEF2F2; color: #DC2626; }
        .absence-warn { background: #FFFBEB; color: #D97706; }
        .violation-card { margin-bottom: 16px; }
        .violation-row { display: flex; align-items: center; padding: 11px 20px; border-bottom: 1px solid #F9FAFB; gap: 14px; cursor: pointer; transition: background 0.1s; }
        .violation-row:hover { background: #FAFAFA; }
        .violation-row:last-child { border-bottom: none; }
        .v-name { font-size: 13px; font-weight: 500; color: #111827; width: 100px; flex-shrink: 0; }
        .v-dept { font-size: 12px; color: #9CA3AF; width: 90px; flex-shrink: 0; }
        .progress-wrap { flex: 1; display: flex; align-items: center; gap: 10px; }
        .progress-bar-bg { flex: 1; height: 6px; background: #F3F4F6; border-radius: 4px; overflow: hidden; }
        .progress-bar-fill { height: 100%; border-radius: 4px; background: #EF4444; }
        .v-ratio { font-size: 12px; font-weight: 700; width: 36px; text-align: right; color: #EF4444; }
        .v-chip { font-size: 10.5px; font-weight: 600; padding: 3px 8px; border-radius: 20px; flex-shrink: 0; }
      `}</style>

      <div className="admin-wrap">
        {/* 사이드바 */}
        <div className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" width="18" height="18">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="logo-text">KMGC <span>경민대학교 국제교육원</span></div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">메인</div>
            <div className="nav-item active">
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
              대시보드
            </div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">학생 관리</div>
            <div className="nav-item">
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
              학생 목록
            </div>
            <div className="nav-item">
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg>
              통합 검색
            </div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">학사</div>
            <div className="nav-item">
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>
              출결 관리
            </div>
            <div className="nav-item">
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
              온라인 30% 확인
              <span className="nav-badge">3</span>
            </div>
            <div className="nav-item">
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zm5.99 7.176A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z"/></svg>
              과목 관리
            </div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">활동</div>
            <div className="nav-item">
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/></svg>
              마일리지 승인
              <span className="nav-badge">5</span>
            </div>
            <div className="nav-item">
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
              상담 내역
            </div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">시스템</div>
            <div className="nav-item">
              <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
              교수 관리
            </div>
          </div>

          <div className="sidebar-bottom">
            <div className="user-info">
              <div className="user-avatar">관</div>
              <div>
                <div className="user-name">국제교육원</div>
                <div className="user-role">관리자</div>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 */}
        <div className="main">
          <div className="topbar">
            <div className="topbar-title">대시보드</div>
            <div className="topbar-right">
              <div className="semester-badge">2025학년도 1학기</div>
              <button className="notif-btn">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="#6B7280"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
                <div className="notif-dot" />
              </button>
            </div>
          </div>

          <div className="content">
            {/* 요약 카드 4개 */}
            <div className="stats-grid">
              {[
                { dot: '#3B82F6', label: '전체 재학생', value: 187, unit: '명', sub: '등록 179 · 휴학 8' },
                { dot: '#EF4444', label: '비자 만료 임박', value: 12, unit: '명', sub: 'D-30 이내 12명' },
                { dot: '#F59E0B', label: '출결 위험군', value: 8, unit: '명', sub: '위험 3 · 주의 5' },
                { dot: '#8B5CF6', label: '마일리지 승인 대기', value: 5, unit: '건', sub: '이번 주 신청 5건' },
              ].map((s) => (
                <div key={s.label} className="stat-card">
                  <div className="stat-label">
                    <div className="stat-dot" style={{ background: s.dot }} />
                    {s.label}
                  </div>
                  <div className="stat-value">{s.value} <span>{s.unit}</span></div>
                  <div className="stat-sub">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* 비자 만료 + 출결 위험군 */}
            <div className="bottom-grid">
              <div className="card">
                <div className="card-header">
                  <div className="card-title">비자 만료 임박</div>
                  <div className="card-badge badge-red">D-30 이내 12명</div>
                </div>
                {visaList.map((s) => (
                  <div key={s.name} className="list-item">
                    <div className="item-avatar" style={s.level === 'danger' ? { background: '#FEE2E2', color: '#DC2626' } : { background: '#FFFBEB', color: '#D97706' }}>
                      {s.name[0]}
                    </div>
                    <div className="item-info">
                      <div className="item-name">{s.name}</div>
                      <div className="item-sub">{s.dept} · {s.nation}</div>
                    </div>
                    <div className="item-right">
                      <div className={`dday-chip ${s.level === 'danger' ? 'dday-danger' : 'dday-warn'}`}>D-{s.dday}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">출결 위험군</div>
                  <div className="card-badge badge-amber">위험 3 · 주의 5</div>
                </div>
                {attendanceList.map((s) => (
                  <div key={s.name} className="list-item">
                    <div className="item-avatar" style={s.level === 'danger' ? { background: '#FEE2E2', color: '#DC2626' } : { background: '#FFFBEB', color: '#D97706' }}>
                      {s.name[0]}
                    </div>
                    <div className="item-info">
                      <div className="item-name">{s.name}</div>
                      <div className="item-sub">{s.dept} · {s.course}</div>
                    </div>
                    <div className="item-right">
                      <div className={`absence-chip ${s.level === 'warn' ? 'absence-warn' : ''}`}>결석 {s.count}회 · {s.level === 'danger' ? '위험' : '주의'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 온라인 30% 초과 */}
            <div className="card violation-card">
              <div className="card-header">
                <div className="card-title">순수 온라인 30% 초과 학생</div>
                <div className="card-badge badge-blue">2025-1학기 기준 3명</div>
              </div>
              {onlineList.map((s) => (
                <div key={s.name} className="violation-row">
                  <div className="v-name">{s.name}</div>
                  <div className="v-dept">{s.dept}</div>
                  <div className="progress-wrap">
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${s.ratio}%` }} />
                    </div>
                    <div className="v-ratio">{s.ratio}%</div>
                  </div>
                  <div className="v-chip badge-red">{s.level === 'over' ? '정정 필요' : '경계'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}