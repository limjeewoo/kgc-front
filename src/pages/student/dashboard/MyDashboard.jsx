import TopBar from '../../../components/layout/TopBar.jsx';

export default function ProfDashboard() {
  const crisisList = [
    { name: 'Wang Xiaoming', date: '2025.03.27', keywords: '초과근로·경제적어려움', level: 'crisis' },
    { name: 'Tran Thi Lan', date: '2025.03.20', keywords: '심리적불안·학업포기', level: 'crisis' },
    { name: 'Liu Yang', date: '2025.03.15', keywords: '결석잦음', level: 'warn' },
  ];

  const absenceList = [
    { name: 'Wang Xiaoming', course: '자료구조', count: 5, level: 'danger' },
    { name: 'Tran Thi Lan', course: '알고리즘', count: 4, level: 'danger' },
    { name: 'Zhang Wei', course: '운영체제', count: 3, level: 'warn' },
    { name: 'Nguyen Van An', course: '자료구조', count: 3, level: 'warn' },
  ];

  const courseList = [
    { id: 'CS201', name: '자료구조', rate: 72, color: '#3B82F6', warning: 3 },
    { id: 'CS301', name: '알고리즘', rate: 88, color: '#10B981', warning: 1 },
    { id: 'CS401', name: '운영체제', rate: 91, color: '#10B981', warning: 0 },
  ];

  const mileageList = [
    { name: 'Wang Xiaoming', job: '음식점 주 20시간', date: '2025.03.27', note: '합법 범위 이내', warn: false },
    { name: 'Nguyen Van An', job: '편의점 주 15시간', date: '2025.03.25', note: '합법 범위 이내', warn: false },
    { name: 'Zhang Wei', job: '물류 주 28시간', date: '2025.03.24', note: '⚠ 허용 한도(25시간) 초과 — 검토 필요', warn: true },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        .prof-wrap { display: flex; min-height: 100vh; background: #F0F2F7; font-family: 'DM Sans','Noto Sans KR',sans-serif; font-size: 14px; color: #111827; }

        .sidebar { width: 220px; min-height: 100vh; background: #1A3A5C; display: flex; flex-direction: column; flex-shrink: 0; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
        .sb-logo { display: flex; align-items: center; gap: 10px; padding: 22px 18px 18px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 8px; }
        .logo-icon { width: 32px; height: 32px; background: #3B82F6; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .logo-text { font-size: 12.5px; font-weight: 700; color: #fff; line-height: 1.3; }
        .logo-text span { display: block; font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.45); }
        .sb-sec { padding: 6px 10px 2px; }
        .sb-lbl { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.3); letter-spacing: 1px; text-transform: uppercase; padding: 0 8px; margin-bottom: 3px; }
        .ni { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px; color: rgba(255,255,255,0.6); font-size: 12.5px; cursor: pointer; transition: all 0.15s; margin-bottom: 1px; }
        .ni:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .ni.active { background: #3B82F6; color: #fff; font-weight: 500; }
        .ni-icon { width: 15px; height: 15px; flex-shrink: 0; }
        .nb { margin-left: auto; background: #EF4444; color: #fff; font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 20px; }
        .sb-bot { margin-top: auto; padding: 10px; border-top: 1px solid rgba(255,255,255,0.08); }
        .urow { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px; }
        .uav { width: 30px; height: 30px; border-radius: 50%; background: #3B82F6; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .un { font-size: 12px; font-weight: 500; color: #fff; }
        .ur { font-size: 10.5px; color: rgba(255,255,255,0.4); margin-top: 1px; }

        .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .content { flex: 1; padding: 22px 24px; overflow-y: auto; }

        .prof-banner { background: linear-gradient(135deg,#1A3A5C,#2563EB); border-radius: 14px; padding: 22px 26px; margin-bottom: 18px; display: flex; align-items: center; gap: 20px; }
        .prof-av { width: 54px; height: 54px; border-radius: 12px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .prof-info { flex: 1; }
        .prof-name { font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 3px; }
        .prof-sub { font-size: 12.5px; color: rgba(255,255,255,0.65); }
        .prof-stats { display: flex; gap: 20px; }
        .pst { text-align: center; background: rgba(255,255,255,0.12); border-radius: 10px; padding: 10px 16px; }
        .pst-val { font-size: 20px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
        .pst-lbl { font-size: 10.5px; color: rgba(255,255,255,0.6); margin-top: 2px; }

        .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 18px; }
        .sc { background: #fff; border-radius: 12px; padding: 16px 18px; border: 1px solid #F3F4F6; }
        .sc-lbl { font-size: 11.5px; color: #9CA3AF; font-weight: 500; margin-bottom: 8px; display: flex; align-items: center; gap: 5px; }
        .sc-dot { width: 6px; height: 6px; border-radius: 50%; }
        .sc-val { font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.5px; line-height: 1; }
        .sc-val span { font-size: 13px; font-weight: 400; color: #9CA3AF; }
        .sc-sub { font-size: 11px; color: #9CA3AF; margin-top: 5px; }

        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
        .card { background: #fff; border-radius: 12px; border: 1px solid #F3F4F6; overflow: hidden; margin-bottom: 14px; }
        .ch { padding: 14px 18px; border-bottom: 1px solid #F3F4F6; display: flex; align-items: center; justify-content: space-between; }
        .ct { font-size: 13px; font-weight: 700; color: #111827; }
        .cbadge { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px; }
        .b-red { background: #FEF2F2; color: #DC2626; }
        .b-amber { background: #FFFBEB; color: #D97706; }
        .b-blue { background: #EFF6FF; color: #1D4ED8; }
        .b-purple { background: #F5F3FF; color: #7C3AED; }

        .li { display: flex; align-items: center; padding: 11px 18px; border-bottom: 1px solid #F9FAFB; gap: 10px; cursor: pointer; transition: background 0.1s; }
        .li:last-child { border-bottom: none; }
        .li:hover { background: #FAFAFA; }
        .lav { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
        .linf { flex: 1; min-width: 0; }
        .lname { font-size: 12.5px; font-weight: 500; color: #111827; }
        .lsub { font-size: 11px; color: #9CA3AF; margin-top: 1px; }
        .lright { text-align: right; flex-shrink: 0; }
        .chip-sm { font-size: 10.5px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }

        .course-row { padding: 12px 18px; border-bottom: 1px solid #F9FAFB; display: flex; align-items: center; gap: 12px; }
        .course-row:last-child { border-bottom: none; }
        .cr-name { font-size: 12.5px; font-weight: 500; color: #111827; width: 130px; flex-shrink: 0; }
        .cr-bar-wrap { flex: 1; display: flex; align-items: center; gap: 8px; }
        .cr-bar-bg { flex: 1; height: 6px; background: #F3F4F6; border-radius: 4px; overflow: hidden; }
        .cr-bar-fill { height: 100%; border-radius: 4px; }
        .cr-pct { font-size: 11.5px; font-weight: 600; width: 32px; text-align: right; }
        .cr-count { font-size: 11px; color: #9CA3AF; width: 60px; text-align: right; flex-shrink: 0; }

        .approve-btn { padding: 4px 10px; background: #1A3A5C; color: #fff; border: none; border-radius: 6px; font-size: 11px; cursor: pointer; font-family: inherit; }
        .reject-btn { padding: 4px 10px; background: #F3F4F6; color: #6B7280; border: none; border-radius: 6px; font-size: 11px; cursor: pointer; font-family: inherit; }
        .reject-btn.danger { background: #FEF2F2; color: #DC2626; }
      `}</style>

      <div className="prof-wrap">
        {/* 사이드바 */}
        <div className="sidebar">
          <div className="sb-logo">
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
            <div className="ni active">
              <svg className="ni-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
              대시보드
            </div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">내 학생</div>
            <div className="ni">
              <svg className="ni-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
              학생 목록
            </div>
            <div className="ni">
              <svg className="ni-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>
              출결 입력
            </div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">상담·활동</div>
            <div className="ni">
              <svg className="ni-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
              상담 작성
            </div>
            <div className="ni">
              <svg className="ni-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/></svg>
              마일리지 승인
              <span className="nb">3</span>
            </div>
          </div>

          {/* 사이드바 하단 — 로그아웃 없이 유저 정보만 (로그아웃은 TopBar에서) */}
          <div className="sb-bot">
            <div className="urow">
              <div className="uav">홍</div>
              <div>
                <div className="un">홍길동 교수</div>
                <div className="ur">지도교수</div>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 */}
        <div className="main">

          {/* TopBar 공통 컴포넌트 */}
          <TopBar title="교수 대시보드" />

          <div className="content">
            {/* 교수 프로필 배너 */}
            <div className="prof-banner">
              <div className="prof-av">홍</div>
              <div className="prof-info">
                <div className="prof-name">홍길동 교수</div>
                <div className="prof-sub">컴퓨터공학과 · 지도교수 · hong@kyungmin.ac.kr</div>
              </div>
              <div className="prof-stats">
                {[{ val: 24, lbl: '담당 학생' }, { val: 3, lbl: '위기 징후' }, { val: 4, lbl: '출결 위험' }, { val: 3, lbl: '승인 대기' }].map((p) => (
                  <div key={p.lbl} className="pst">
                    <div className="pst-val">{p.val}</div>
                    <div className="pst-lbl">{p.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 통계 카드 4개 */}
            <div className="stats-row">
              {[
                { dot: '#3B82F6', label: '담당 학생 수', value: 24, unit: '명', sub: '등록 22 · 휴학 2' },
                { dot: '#EF4444', label: '위기 징후 학생', value: 3, unit: '명', sub: '이번 달 상담 필요' },
                { dot: '#F59E0B', label: '출결 위험군', value: 4, unit: '명', sub: '위험 2 · 주의 2' },
                { dot: '#8B5CF6', label: '마일리지 승인 대기', value: 3, unit: '건', sub: '이번 주 신청' },
              ].map((s) => (
                <div key={s.label} className="sc">
                  <div className="sc-lbl">
                    <div className="sc-dot" style={{ background: s.dot }} />
                    {s.label}
                  </div>
                  <div className="sc-val">{s.value} <span>{s.unit}</span></div>
                  <div className="sc-sub">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* 위기 징후 + 출결 위험군 */}
            <div className="grid2">
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="ch"><div className="ct">위기 징후 학생</div><div className="cbadge b-red">3명</div></div>
                {crisisList.map((s) => (
                  <div key={s.name} className="li">
                    <div className="lav" style={s.level === 'crisis' ? { background: '#FEE2E2', color: '#DC2626' } : { background: '#FFFBEB', color: '#D97706' }}>{s.name[0]}</div>
                    <div className="linf">
                      <div className="lname">{s.name}</div>
                      <div className="lsub">{s.date} 상담 · {s.keywords}</div>
                    </div>
                    <div className="lright">
                      <div className={`chip-sm ${s.level === 'crisis' ? 'b-red' : 'b-amber'}`}>{s.level === 'crisis' ? '위기' : '주의'}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ marginBottom: 0 }}>
                <div className="ch"><div className="ct">출결 위험군</div><div className="cbadge b-amber">위험 2 · 주의 2</div></div>
                {absenceList.map((s) => (
                  <div key={s.name} className="li">
                    <div className="lav" style={s.level === 'danger' ? { background: '#FEE2E2', color: '#DC2626' } : { background: '#FFFBEB', color: '#D97706' }}>{s.name[0]}</div>
                    <div className="linf">
                      <div className="lname">{s.name}</div>
                      <div className="lsub">{s.course} · 결석 {s.count}회</div>
                    </div>
                    <div className="lright">
                      <div className={`chip-sm ${s.level === 'danger' ? 'b-red' : 'b-amber'}`}>{s.level === 'danger' ? '위험' : '주의'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 담당 과목 출석률 */}
            <div className="card">
              <div className="ch"><div className="ct">담당 과목 출석률 현황</div><div className="cbadge b-blue">13주차 기준</div></div>
              {courseList.map((c) => (
                <div key={c.id} className="course-row">
                  <div className="cr-name">{c.name} ({c.id})</div>
                  <div className="cr-bar-wrap">
                    <div className="cr-bar-bg">
                      <div className="cr-bar-fill" style={{ width: `${c.rate}%`, background: c.color }} />
                    </div>
                    <div className="cr-pct" style={{ color: c.color }}>{c.rate}%</div>
                  </div>
                  <div className="cr-count">위험 {c.warning}명</div>
                </div>
              ))}
            </div>

            {/* 마일리지 승인 대기 */}
            <div className="card">
              <div className="ch"><div className="ct">마일리지 승인 대기</div><div className="cbadge b-purple">3건</div></div>
              {mileageList.map((m) => (
                <div key={m.name} className="li">
                  <div className="lav" style={m.warn ? { background: '#FEF3C7', color: '#D97706' } : { background: '#EDE9FE', color: '#7C3AED' }}>{m.name[0]}</div>
                  <div className="linf">
                    <div className="lname">{m.name} · {m.job}</div>
                    <div className="lsub" style={m.warn ? { color: '#D97706' } : {}}>{m.date} 신청 · {m.note}</div>
                  </div>
                  <div className="lright">
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="approve-btn">승인</button>
                      <button className={`reject-btn${m.warn ? ' danger' : ''}`}>반려</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}