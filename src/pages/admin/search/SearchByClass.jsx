import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── 더미 데이터 ─
const DUMMY_DEPTS = [
  { deptId: 'CS01', deptName: '컴퓨터소프트웨어과' },
  { deptId: 'DS01', deptName: '데이터사이언스과' },
  { deptId: 'ME01', deptName: '기계공학과' },
];

const DUMMY_ADVISORS = [
  { professorId: 'P001', name: '홍길동', email: 'hong@kmgc.ac.kr', phone: '010-1111-2222', deptId: 'CS01' },
  { professorId: 'P002', name: '김영희', email: 'kim@kmgc.ac.kr',  phone: '010-3333-4444', deptId: 'CS01' },
];

// GET /api/v1/search/class?deptId=CS01&classSec=A 시뮬레이션
const DUMMY_CLASS_DATA = {
  'CS01-A': [
    { studentId: '25071001', korName: '응우옌반안',   nationality: '베트남',      grade: 2, weeklyAttend: [1,1,2,1,1,3,1,2,1,1,2,1,1,null,null], totalAbsent: 3, totalLate: 2, totalAttend: 10 },
    { studentId: '25071002', korName: '천샤오민',     nationality: '중국',        grade: 1, weeklyAttend: [1,1,1,1,1,1,1,1,1,1,1,1,1,null,null], totalAbsent: 0, totalLate: 0, totalAttend: 13 },
    { studentId: '25071005', korName: '아마라쿠마르', nationality: '인도',        grade: 1, weeklyAttend: [1,1,1,2,1,1,1,3,1,1,1,1,1,null,null], totalAbsent: 1, totalLate: 1, totalAttend: 11 },
    { studentId: '25071008', korName: '왕레이',       nationality: '중국',        grade: 1, weeklyAttend: [1,1,1,1,1,1,1,1,1,1,1,1,1,null,null], totalAbsent: 0, totalLate: 0, totalAttend: 13 },
    { studentId: '25071006', korName: '호앙민',       nationality: '베트남',      grade: 3, weeklyAttend: [1,2,1,2,1,2,1,2,1,2,1,2,1,null,null], totalAbsent: 6, totalLate: 0, totalAttend: 7  },
  ],
  'CS01-B': [
    { studentId: '25071003', korName: '이반페트로프', nationality: '러시아',      grade: 3, weeklyAttend: [1,1,1,1,1,1,2,1,3,1,1,1,1,null,null], totalAbsent: 1, totalLate: 1, totalAttend: 11 },
    { studentId: '25071004', korName: '파티마알리',   nationality: '우즈베키스탄', grade: 2, weeklyAttend: [2,1,2,1,2,1,2,1,2,1,2,1,2,null,null], totalAbsent: 7, totalLate: 0, totalAttend: 6  },
    { studentId: '25071010', korName: '카마로프',     nationality: '우즈베키스탄', grade: 2, weeklyAttend: [1,1,1,1,1,1,1,1,3,1,1,1,1,null,null], totalAbsent: 0, totalLate: 1, totalAttend: 12 },
  ],
  'CS01-C': [
    { studentId: '25071007', korName: '나탈리아소콜', nationality: '러시아',      grade: 2, weeklyAttend: [2,2,2,1,1,2,2,1,2,2,2,2,2,null,null], totalAbsent: 10, totalLate: 0, totalAttend: 3 },
    { studentId: '25071009', korName: '린다오',       nationality: '중국',        grade: 4, weeklyAttend: [1,1,1,1,1,1,1,3,1,1,1,1,1,null,null], totalAbsent: 0, totalLate: 1, totalAttend: 12 },
  ],
};

const WEEK_LABELS = ['1주','2주','3주','4주','5주','6주','7주','8주','9주','10주','11주','12주','13주','14주','15주'];
const CURRENT_WEEK = 13; // 현재 진행 주차

// ─── 유틸 ────
const getStatusCell = (code) => {
  if (code === 1) return { label: '출', bg: '#EFF6FF', color: '#3B82F6' };
  if (code === 2) return { label: '결', bg: '#FEF2F2', color: '#EF4444' };
  if (code === 3) return { label: '지', bg: '#FFFBEB', color: '#D97706' };
  if (code === 4) return { label: '공', bg: '#F0FDF4', color: '#16A34A' };
  return { label: '-', bg: '#F9FAFB', color: '#D1D5DB' };
};

const getAttendRate = (s) => {
  const total = s.totalAbsent + s.totalLate + s.totalAttend;
  if (!total) return 0;
  return Math.round((s.totalAttend / total) * 100);
};

const getRateColor = (rate) => {
  if (rate < 70) return '#EF4444';
  if (rate < 80) return '#D97706';
  return '#16A34A';
};

// 주차별 반 전체 결석 수 계산
const calcWeeklyAbsents = (students) =>
  WEEK_LABELS.map((_, wi) =>
    students.filter(s => s.weeklyAttend[wi] === 2).length
  );

export default function SearchByClass({ onBack }) {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ deptId: 'CS01', classSec: 'A' });
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quickFilter, setQuickFilter] = useState(false); // 결석 3회 이상만

  // GET /api/v1/search/class?deptId=&classSec=
  const fetchClass = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      const key = `${filters.deptId}-${filters.classSec}`;
      setStudents(DUMMY_CLASS_DATA[key] || []);
      setIsLoading(false);
    }, 300);
  }, [filters]);

  useEffect(() => { fetchClass(); }, [fetchClass]);

  // 표시할 학생 (Quick Filter 적용)
  const displayed = quickFilter
    ? students.filter(s => s.totalAbsent >= 3)
    : students;

  // 통계
  const stats = {
    total:      students.length,
    danger:     students.filter(s => s.totalAbsent >= 6).length,
    warning:    students.filter(s => s.totalAbsent >= 3 && s.totalAbsent < 6).length,
    avgRate:    students.length
      ? Math.round(students.reduce((a, s) => a + getAttendRate(s), 0) / students.length)
      : 0,
  };

  const weeklyAbsents = calcWeeklyAbsents(students);
  const maxAbsent = Math.max(...weeklyAbsents, 1);

  // 담당 교수 (GET /api/v1/advisors/professor/{professorId} 연계)
  const advisors = DUMMY_ADVISORS.filter(a => a.deptId === filters.deptId);

  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  return (
    <div style={{ fontFamily: "'DM Sans','Noto Sans KR',sans-serif", fontSize: '14px', color: '#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        /* ── 공통 ── */
        .sc-topbar { background:#fff; padding:0 28px; height:58px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #E5E7EB; margin-bottom:24px; }
        .sc-topbar-left  { display:flex; align-items:center; gap:10px; }
        .sc-topbar-right { display:flex; align-items:center; gap:8px; }
        .sc-back-btn { width:30px; height:30px; border-radius:7px; background:#F3F4F6; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#374151; transition:background 0.15s; }
        .sc-back-btn:hover { background:#E5E7EB; }
        .sc-breadcrumb { font-size:13px; color:#9CA3AF; }
        .sc-breadcrumb span { color:#111827; font-weight:600; }

        .sc-btn { padding:7px 14px; border-radius:8px; font-size:12.5px; font-weight:500; cursor:pointer; font-family:inherit; display:flex; align-items:center; gap:5px; transition:all 0.15s; border:none; }
        .sc-btn-secondary { background:#F9FAFB; border:1px solid #E5E7EB; color:#374151; }
        .sc-btn-secondary:hover { background:#F3F4F6; }
        .sc-btn-primary   { background:#1A3A5C; border:1px solid #1A3A5C; color:#fff; }
        .sc-btn-primary:hover { background:#153150; }
        .sc-btn-danger    { background:#FEF2F2; border:1px solid #FECACA; color:#DC2626; }
        .sc-btn-danger:hover { background:#FEE2E2; }
        .sc-btn-active    { background:#EFF6FF; border:1px solid #BFDBFE; color:#1D4ED8; font-weight:600; }

        .sc-chip { font-size:11px; font-weight:600; padding:3px 9px; border-radius:20px; }
        .sc-chip-blue  { background:#EFF6FF; color:#1D4ED8; }
        .sc-chip-green { background:#F0FDF4; color:#16A34A; }
        .sc-chip-amber { background:#FFFBEB; color:#D97706; }
        .sc-chip-red   { background:#FEF2F2; color:#DC2626; }
        .sc-chip-gray  { background:#F3F4F6; color:#6B7280; }

        .sc-card { background:#fff; border-radius:14px; border:1px solid #F3F4F6; padding:20px 22px; }
        .sc-card-title { font-size:13px; font-weight:700; color:#111827; margin-bottom:16px; padding-bottom:10px; border-bottom:1px solid #F3F4F6; display:flex; align-items:center; justify-content:space-between; gap:8px; }

        /* ── 통계 배너 ── */
        .sc-stat-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:18px; }
        .sc-stat-card { background:#fff; border-radius:12px; border:1px solid #F3F4F6; padding:16px 18px; }
        .sc-stat-label { font-size:11px; color:#9CA3AF; margin-bottom:6px; }
        .sc-stat-val { font-size:24px; font-weight:700; letter-spacing:-0.5px; }

        /* ── 필터 ── */
        .sc-filter-card { background:#fff; border-radius:14px; border:1px solid #F3F4F6; padding:16px 22px; margin-bottom:18px; display:flex; align-items:flex-end; gap:12px; flex-wrap:wrap; }
        .sc-filter-group { display:flex; flex-direction:column; gap:4px; }
        .sc-filter-label { font-size:11px; font-weight:600; color:#9CA3AF; }
        .sc-select { padding:7px 10px; border-radius:8px; border:1px solid #E5E7EB; font-size:12.5px; font-family:inherit; color:#374151; background:#fff; cursor:pointer; outline:none; min-width:140px; }
        .sc-select:focus { border-color:#3B82F6; }

        /* ── 클래스 탭 (반 선택기) ── */
        .sc-class-tabs { display:flex; gap:6px; margin-bottom:18px; }
        .sc-class-tab { padding:8px 18px; border-radius:8px; border:1px solid #E5E7EB; background:#fff; font-size:13px; font-weight:500; color:#6B7280; cursor:pointer; transition:all 0.15s; font-family:inherit; }
        .sc-class-tab:hover { background:#F3F4F6; }
        .sc-class-tab.active { background:#1A3A5C; border-color:#1A3A5C; color:#fff; font-weight:600; }

        /* ── 바 차트 ── */
        .sc-chart-wrap { display:flex; align-items:flex-end; gap:6px; height:80px; padding:0 4px; }
        .sc-bar-col { display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; }
        .sc-bar-track { width:100%; display:flex; align-items:flex-end; height:60px; }
        .sc-bar-fill { width:100%; border-radius:4px 4px 0 0; transition:height 0.4s ease; min-height:3px; }
        .sc-bar-lbl { font-size:9px; color:#9CA3AF; white-space:nowrap; }
        .sc-bar-cnt { font-size:10px; font-weight:600; }

        /* ── 주차별 그리드 테이블 ── */
        .sc-grid-wrap { overflow-x:auto; }
        .sc-grid { width:100%; border-collapse:collapse; }
        .sc-grid th { padding:8px 10px; font-size:11px; font-weight:600; color:#9CA3AF; text-align:center; border-bottom:1px solid #F3F4F6; white-space:nowrap; background:#FAFAFA; }
        .sc-grid th.left { text-align:left; }
        .sc-grid td { padding:8px 6px; font-size:12px; text-align:center; border-bottom:1px solid #F9FAFB; vertical-align:middle; }
        .sc-grid td.left { text-align:left; padding-left:10px; }
        .sc-grid tr:last-child td { border-bottom:none; }
        .sc-grid tr.danger-row td { background:#FFF5F5; }
        .sc-grid tr.warning-row td { background:#FFFBEB; }
        .sc-grid tr:hover td { background:#F8FAFC !important; }

        .sc-week-cell { width:28px; height:24px; border-radius:5px; display:inline-flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; margin:0 auto; }
        .sc-week-future { width:28px; height:24px; border-radius:5px; background:#F9FAFB; display:inline-block; }

        .sc-name { font-weight:600; color:#111827; font-size:13px; }
        .sc-id   { font-size:11px; color:#9CA3AF; }

        .sc-rate-bar { display:flex; align-items:center; gap:6px; }
        .sc-rate-track { width:44px; height:4px; background:#F3F4F6; border-radius:99px; overflow:hidden; }
        .sc-rate-fill  { height:100%; border-radius:99px; }

        /* ── 교수 카드 ── */
        .sc-prof-list { display:flex; flex-direction:column; gap:10px; }
        .sc-prof-row { display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:10px; background:#F8FAFC; border:1px solid #F3F4F6; }
        .sc-prof-avatar { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#3B82F6,#1A3A5C); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#fff; flex-shrink:0; }
        .sc-prof-info { flex:1; }
        .sc-prof-name { font-size:13px; font-weight:600; color:#111827; }
        .sc-prof-sub  { font-size:11.5px; color:#9CA3AF; margin-top:1px; }
        .sc-contact-btns { display:flex; gap:6px; }
        .sc-contact-btn { padding:5px 10px; border-radius:7px; font-size:11.5px; font-weight:500; cursor:pointer; font-family:inherit; transition:all 0.15s; display:flex; align-items:center; gap:4px; }
        .sc-contact-email { background:#EFF6FF; border:1px solid #BFDBFE; color:#1D4ED8; }
        .sc-contact-phone { background:#F0FDF4; border:1px solid #BBF7D0; color:#16A34A; }

        /* ── 빈 상태 ── */
        .sc-empty { padding:40px; text-align:center; color:#9CA3AF; font-size:13px; }

        @media (max-width:900px) {
          .sc-stat-row { grid-template-columns:repeat(2,1fr); }
          .sc-bottom-grid { grid-template-columns:1fr; }
        }
      `}</style>

      {/* 탑바 */}
      <div className="sc-topbar">
        <div className="sc-topbar-left">
          <button className="sc-back-btn" onClick={onBack ?? (() => navigate(-1))}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="sc-breadcrumb">학생 관리 › <span>반별 출결 현황</span></div>
        </div>
        <div className="sc-topbar-right">
          <button
            className={`sc-btn ${quickFilter ? 'sc-btn-danger' : 'sc-btn-secondary'}`}
            onClick={() => setQuickFilter(v => !v)}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 4h18M7 8h10M11 12h4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {quickFilter ? '▲ 위험군만 보는 중' : '결석 3회+ 필터'}
          </button>
        </div>
      </div>

      {/* 통계 배너 */}
      <div className="sc-stat-row">
        <div className="sc-stat-card">
          <div className="sc-stat-label">반 전체 학생</div>
          <div className="sc-stat-val" style={{ color: '#3B82F6' }}>{stats.total}<span style={{fontSize:13,color:'#9CA3AF',fontWeight:400}}> 명</span></div>
        </div>
        <div className="sc-stat-card">
          <div className="sc-stat-label">결석 위험 (6회+)</div>
          <div className="sc-stat-val" style={{ color: '#EF4444' }}>{stats.danger}<span style={{fontSize:13,color:'#9CA3AF',fontWeight:400}}> 명</span></div>
        </div>
        <div className="sc-stat-card">
          <div className="sc-stat-label">결석 주의 (3~5회)</div>
          <div className="sc-stat-val" style={{ color: '#D97706' }}>{stats.warning}<span style={{fontSize:13,color:'#9CA3AF',fontWeight:400}}> 명</span></div>
        </div>
        <div className="sc-stat-card">
          <div className="sc-stat-label">반 평균 출석률</div>
          <div className="sc-stat-val" style={{ color: getRateColor(stats.avgRate) }}>{stats.avgRate}<span style={{fontSize:13,color:'#9CA3AF',fontWeight:400}}> %</span></div>
        </div>
      </div>

      {/* 필터 + 반 선택기 */}
      <div className="sc-filter-card">
        {/* 학과 — GET /api/v1/depts */}
        <div className="sc-filter-group">
          <span className="sc-filter-label">학과</span>
          <select className="sc-select" value={filters.deptId} onChange={e => setFilter('deptId', e.target.value)}>
            {DUMMY_DEPTS.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
          </select>
        </div>
        {/* 반 선택 탭 — GET /api/v1/search/class?deptId=&classSec= */}
        <div className="sc-filter-group">
          <span className="sc-filter-label">반 선택</span>
          <div className="sc-class-tabs" style={{ margin: 0 }}>
            {['A','B','C','D'].map(sec => (
              <button
                key={sec}
                className={`sc-class-tab ${filters.classSec === sec ? 'active' : ''}`}
                onClick={() => setFilter('classSec', sec)}
              >
                {sec}반
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="sc-empty">데이터 로딩 중...</div>
      ) : students.length === 0 ? (
        <div style={{background:'#fff', borderRadius:14, border:'1px solid #F3F4F6', padding:'48px', textAlign:'center', color:'#9CA3AF', fontSize:'13px'}}>
          해당 반 데이터가 없습니다.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>

          {/* 좌측: 주차별 현황 + 차트 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* 주차별 결석 Bar Chart */}
            <div className="sc-card">
              <div className="sc-card-title">
                <span>주차별 반 전체 결석 인원 추이</span>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9CA3AF' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: '#EF4444', display: 'inline-block' }}/>결석 인원
                  </span>
                  <span className="sc-chip sc-chip-gray">현재 {CURRENT_WEEK}주차</span>
                </div>
              </div>
              <div className="sc-chart-wrap">
                {WEEK_LABELS.map((lbl, wi) => {
                  const cnt = weeklyAbsents[wi];
                  const isPast = (wi + 1) <= CURRENT_WEEK;
                  const barH = isPast ? Math.round((cnt / maxAbsent) * 52) : 0;
                  const barColor = cnt >= 3 ? '#EF4444' : cnt >= 1 ? '#F59E0B' : '#BFDBFE';
                  return (
                    <div key={lbl} className="sc-bar-col">
                      <span className="sc-bar-cnt" style={{ color: isPast && cnt > 0 ? barColor : '#D1D5DB' }}>
                        {isPast ? cnt : ''}
                      </span>
                      <div className="sc-bar-track">
                        {isPast && (
                          <div className="sc-bar-fill" style={{ height: barH, background: barColor, marginTop: 'auto', width: '100%' }} />
                        )}
                      </div>
                      <span className="sc-bar-lbl" style={{ color: (wi + 1) === CURRENT_WEEK ? '#1D4ED8' : '#9CA3AF', fontWeight: (wi + 1) === CURRENT_WEEK ? 700 : 400 }}>
                        {lbl}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 주차별 개인 출결 그리드 */}
            <div className="sc-card">
              <div className="sc-card-title">
                <span>
                  학생별 주차 출결 현황
                  {quickFilter && <span className="sc-chip sc-chip-red" style={{marginLeft:8}}>결석 3회+ 필터 중</span>}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { label: '출석', bg: '#EFF6FF', color: '#3B82F6' },
                    { label: '결석', bg: '#FEF2F2', color: '#EF4444' },
                    { label: '지각', bg: '#FFFBEB', color: '#D97706' },
                    { label: '공결', bg: '#F0FDF4', color: '#16A34A' },
                  ].map(l => (
                    <span key={l.label} style={{ fontSize: 11, color: l.color, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: l.bg, border: `1px solid ${l.color}`, display: 'inline-block' }}/>
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>

              {displayed.length === 0 ? (
                <div className="sc-empty">결석 3회 이상 학생이 없습니다. 👍</div>
              ) : (
                <div className="sc-grid-wrap">
                  <table className="sc-grid">
                    <thead>
                      <tr>
                        <th className="left" style={{ minWidth: 130 }}>학생</th>
                        {WEEK_LABELS.map((lbl, wi) => (
                          <th key={lbl} style={{ color: (wi + 1) === CURRENT_WEEK ? '#1D4ED8' : undefined }}>
                            {lbl}
                          </th>
                        ))}
                        <th>출석률</th>
                        <th>결석</th>
                        <th>지각</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayed.map(s => {
                        const rate = getAttendRate(s);
                        const isDanger  = s.totalAbsent >= 6;
                        const isWarning = s.totalAbsent >= 3 && s.totalAbsent < 6;
                        return (
                          <tr key={s.studentId} className={isDanger ? 'danger-row' : isWarning ? 'warning-row' : ''}>
                            <td className="left">
                              <div className="sc-name">{s.korName}</div>
                              <div className="sc-id">{s.studentId}</div>
                            </td>
                            {s.weeklyAttend.map((code, wi) => {
                              const isPast = (wi + 1) <= CURRENT_WEEK;
                              if (!isPast) return <td key={wi}><span className="sc-week-future"/></td>;
                              const cell = getStatusCell(code);
                              return (
                                <td key={wi}>
                                  <div className="sc-week-cell" style={{ background: cell.bg, color: cell.color }}>
                                    {cell.label}
                                  </div>
                                </td>
                              );
                            })}
                            <td>
                              <div className="sc-rate-bar">
                                <div className="sc-rate-track">
                                  <div className="sc-rate-fill" style={{ width: `${rate}%`, background: getRateColor(rate) }}/>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: getRateColor(rate) }}>{rate}%</span>
                              </div>
                            </td>
                            <td>
                              <span className={`sc-chip ${isDanger ? 'sc-chip-red' : isWarning ? 'sc-chip-amber' : 'sc-chip-gray'}`}>
                                {s.totalAbsent}회
                              </span>
                            </td>
                            <td>
                              <span className={`sc-chip ${s.totalLate > 0 ? 'sc-chip-amber' : 'sc-chip-gray'}`}>
                                {s.totalLate}회
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* 우측: 담당 교수 카드 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* 담당 교수 — GET /api/v1/advisors/professor/{professorId} */}
            <div className="sc-card">
              <div className="sc-card-title">
                <span>담당 지도교수</span>
                <span className="sc-chip sc-chip-blue">{advisors.length}명</span>
              </div>
              <div className="sc-prof-list">
                {advisors.map(p => (
                  <div key={p.professorId} className="sc-prof-row">
                    <div className="sc-prof-avatar">{p.name[0]}</div>
                    <div className="sc-prof-info">
                      <div className="sc-prof-name">{p.name} 교수</div>
                      <div className="sc-prof-sub">{p.professorId}</div>
                    </div>
                    <div className="sc-contact-btns">
                      <a href={`mailto:${p.email}`} className="sc-contact-btn sc-contact-email" title={p.email}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round"/>
                        </svg>
                        메일
                      </a>
                      <a href={`tel:${p.phone}`} className="sc-contact-btn sc-contact-phone" title={p.phone}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round"/>
                        </svg>
                        전화
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 위험/주의 요약 */}
            <div className="sc-card">
              <div className="sc-card-title">위험군 요약</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {students
                  .filter(s => s.totalAbsent >= 3)
                  .sort((a, b) => b.totalAbsent - a.totalAbsent)
                  .map(s => {
                    const isDanger = s.totalAbsent >= 6;
                    return (
                      <div key={s.studentId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: isDanger ? '#FFF5F5' : '#FFFBEB', border: `1px solid ${isDanger ? '#FECACA' : '#FDE68A'}` }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.korName}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{s.nationality}</div>
                        </div>
                        <span className={`sc-chip ${isDanger ? 'sc-chip-red' : 'sc-chip-amber'}`}>
                          결석 {s.totalAbsent}회 {isDanger ? '⚠' : ''}
                        </span>
                      </div>
                    );
                  })}
                {students.filter(s => s.totalAbsent >= 3).length === 0 && (
                  <div style={{ textAlign: 'center', color: '#16A34A', fontSize: 13, padding: '16px 0' }}>
                    위험군 학생이 없습니다 ✅
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}