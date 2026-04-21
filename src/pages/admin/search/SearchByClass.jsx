import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchByCourse from './SearchByCourse.jsx';

// API 설정
// const BASE_URL = 'https://api.kmgc.world'; // 배포용
const BASE_URL = 'http://localhost:8080'; // 개발용

export default function SearchByClass({ onBack }) {
  const navigate = useNavigate();
  const accessToken = localStorage.getItem('accessToken'); // 로그인 시 저장된 토큰 사용

  // 상태 관리
  const [depts, setDepts] = useState([]);
  const [filters, setFilters] = useState({ deptId: '', classSec: 'A' });
  const [students, setStudents] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quickFilter, setQuickFilter] = useState(false);
  const [showCourse, setShowCourse] = useState(false);

  // 공통 헤더
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  // 1. 전체 학과 목록 조회 (최초 1회)
  const fetchDepts = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/depts`, { headers });
      const json = await res.json();
      if (json.success) {
        setDepts(json.data);
        if (json.data.length > 0 && !filters.deptId) {
          setFilters(prev => ({ ...prev, deptId: json.data[0].deptId }));
        }
      }
    } catch (err) {
      console.error("학과 목록 로드 실패:", err);
    }
  }, []);

  // 2. 학과별 교수(지도교수) 조회
  const fetchAdvisors = useCallback(async (deptId) => {
    if (!deptId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/professors?deptId=${deptId}`, { headers });
      const json = await res.json();
      if (json.success) setAdvisors(json.data);
    } catch (err) {
      console.error("교수 목록 로드 실패:", err);
    }
  }, []);

  // 3. 학과-반별 학생 출결 데이터 조회 (통합 검색 API)
  const fetchClassData = useCallback(async () => {
    if (!filters.deptId || !filters.classSec) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/api/v1/search/class?deptId=${filters.deptId}&classSec=${filters.classSec}`, 
        { headers }
      );
      const json = await res.json();
      if (json.success) {
        // API 명세상 '수강과목 + 과목별 결석일수'가 포함된 학생 리스트 반환
        setStudents(json.data || []);
      }
    } catch (err) {
      console.error("학급 데이터 로드 실패:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // 초기 로드 및 필터 변경 시 호출
  useEffect(() => { fetchDepts(); }, [fetchDepts]);
  useEffect(() => { fetchAdvisors(filters.deptId); }, [filters.deptId, fetchAdvisors]);
  useEffect(() => { fetchClassData(); }, [fetchClassData]);
  useEffect(() => { setShowCourse(false); }, [filters]);

  // 유틸리티 함수들 (기존 로직 유지)
  const getStatusCell = (code) => {
    if (code === 1) return { label:'출', bg:'#EFF6FF', color:'#3B82F6' };
    if (code === 2) return { label:'결', bg:'#FEF2F2', color:'#EF4444' };
    if (code === 3) return { label:'지', bg:'#FFFBEB', color:'#D97706' };
    if (code === 4) return { label:'공', bg:'#F0FDF4', color:'#16A34A' };
    return { label:'-', bg:'#F9FAFB', color:'#D1D5DB' };
  };

  const getAttendRate = (s) => {
    const total = (s.totalAbsent || 0) + (s.totalLate || 0) + (s.totalAttend || 0);
    return total ? Math.round((s.totalAttend / total) * 100) : 0;
  };

  const getRateColor = (rate) => {
    if (rate < 70) return '#EF4444';
    if (rate < 80) return '#D97706';
    return '#16A34A';
  };

  const WEEK_LABELS = ['1주','2주','3주','4주','5주','6주','7주','8주','9주','10주','11주','12주','13주','14주','15주'];
  const CURRENT_WEEK = 13; // 실제 운영시는 학기 정보 API에서 가져오는 것이 좋습니다

  const displayed = quickFilter ? students.filter(s => (s.totalAbsent || 0) >= 3) : students;
  
  const stats = {
    total:   students.length,
    danger:  students.filter(s => (s.totalAbsent || 0) >= 6).length,
    warning: students.filter(s => (s.totalAbsent || 0) >= 3 && (s.totalAbsent || 0) < 6).length,
    avgRate: students.length
      ? Math.round(students.reduce((a, s) => a + getAttendRate(s), 0) / students.length)
      : 0,
  };

  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  if (showCourse) {
    return (
      <SearchByCourse
        deptId={filters.deptId}
        classSec={filters.classSec}
        onBack={() => setShowCourse(false)}
      />
    );
  }

  return (
    <div style={{ fontFamily:"'DM Sans','Noto Sans KR',sans-serif", fontSize:'14px', color:'#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

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
        .sc-btn-danger { background:#FEF2F2; border:1px solid #FECACA; color:#DC2626; }
        .sc-btn-danger:hover { background:#FEE2E2; }

        /* ── 드릴다운 버튼 ── */
        .sc-drilldown-btn {
          display:flex; align-items:center; gap:7px;
          padding:8px 16px; border-radius:9px;
          background:linear-gradient(135deg,#1A3A5C,#2563EB);
          border:none; color:#fff;
          font-size:12.5px; font-weight:600;
          cursor:pointer; font-family:inherit; transition:all 0.2s;
          box-shadow:0 2px 8px rgba(37,99,235,0.25);
        }
        .sc-drilldown-btn:hover {
          transform:translateY(-1px);
          box-shadow:0 4px 14px rgba(37,99,235,0.35);
        }

        .sc-chip { font-size:11px; font-weight:600; padding:3px 9px; border-radius:20px; }
        .sc-chip-blue  { background:#EFF6FF; color:#1D4ED8; }
        .sc-chip-green { background:#F0FDF4; color:#16A34A; }
        .sc-chip-amber { background:#FFFBEB; color:#D97706; }
        .sc-chip-red   { background:#FEF2F2; color:#DC2626; }
        .sc-chip-gray  { background:#F3F4F6; color:#6B7280; }

        .sc-card { background:#fff; border-radius:14px; border:1px solid #F3F4F6; padding:20px 22px; }
        .sc-card-title { font-size:13px; font-weight:700; color:#111827; margin-bottom:16px; padding-bottom:10px; border-bottom:1px solid #F3F4F6; display:flex; align-items:center; justify-content:space-between; gap:8px; }

        .sc-stat-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:18px; }
        .sc-stat-card { background:#fff; border-radius:12px; border:1px solid #F3F4F6; padding:16px 18px; }
        .sc-stat-label { font-size:11px; color:#9CA3AF; margin-bottom:6px; }
        .sc-stat-val { font-size:24px; font-weight:700; letter-spacing:-0.5px; }

        .sc-filter-card { background:#fff; border-radius:14px; border:1px solid #F3F4F6; padding:16px 22px; margin-bottom:18px; display:flex; align-items:flex-end; gap:12px; flex-wrap:wrap; }
        .sc-filter-group { display:flex; flex-direction:column; gap:4px; }
        .sc-filter-label { font-size:11px; font-weight:600; color:#9CA3AF; }
        .sc-select { padding:7px 10px; border-radius:8px; border:1px solid #E5E7EB; font-size:12.5px; font-family:inherit; color:#374151; background:#fff; cursor:pointer; outline:none; min-width:140px; }
        .sc-select:focus { border-color:#3B82F6; }

        .sc-class-tabs { display:flex; gap:6px; }
        .sc-class-tab { padding:8px 18px; border-radius:8px; border:1px solid #E5E7EB; background:#fff; font-size:13px; font-weight:500; color:#6B7280; cursor:pointer; transition:all 0.15s; font-family:inherit; }
        .sc-class-tab:hover { background:#F3F4F6; }
        .sc-class-tab.active { background:#1A3A5C; border-color:#1A3A5C; color:#fff; font-weight:600; }

        .sc-chart-wrap { display:flex; align-items:flex-end; gap:6px; height:80px; padding:0 4px; }
        .sc-bar-col { display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; }
        .sc-bar-track { width:100%; display:flex; align-items:flex-end; height:60px; }
        .sc-bar-fill { width:100%; border-radius:4px 4px 0 0; transition:height 0.4s ease; min-height:3px; }
        .sc-bar-lbl { font-size:9px; color:#9CA3AF; white-space:nowrap; }
        .sc-bar-cnt { font-size:10px; font-weight:600; }

        .sc-grid-wrap { overflow-x:auto; }
        .sc-grid { width:100%; border-collapse:collapse; }
        .sc-grid th { padding:8px 10px; font-size:11px; font-weight:600; color:#9CA3AF; text-align:center; border-bottom:1px solid #F3F4F6; white-space:nowrap; background:#FAFAFA; }
        .sc-grid th.left { text-align:left; }
        .sc-grid td { padding:8px 6px; font-size:12px; text-align:center; border-bottom:1px solid #F9FAFB; vertical-align:middle; }
        .sc-grid td.left { text-align:left; padding-left:10px; }
        .sc-grid tr:last-child td { border-bottom:none; }
        .sc-grid tr.danger-row td  { background:#FFF5F5; }
        .sc-grid tr.warning-row td { background:#FFFBEB; }
        .sc-grid tr:hover td { background:#F8FAFC !important; }

        .sc-week-cell { width:28px; height:24px; border-radius:5px; display:inline-flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; margin:0 auto; }
        .sc-week-future { width:28px; height:24px; border-radius:5px; background:#F9FAFB; display:inline-block; }
        .sc-rate-bar { display:flex; align-items:center; gap:6px; }
        .sc-rate-track { width:44px; height:4px; background:#F3F4F6; border-radius:99px; overflow:hidden; }
        .sc-rate-fill  { height:100%; border-radius:99px; }

        .sc-prof-list { display:flex; flex-direction:column; gap:10px; }
        .sc-prof-row { display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:10px; background:#F8FAFC; border:1px solid #F3F4F6; }
        .sc-prof-avatar { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#3B82F6,#1A3A5C); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#fff; flex-shrink:0; }
        .sc-prof-info { flex:1; }
        .sc-prof-name { font-size:13px; font-weight:600; color:#111827; }
        .sc-prof-sub  { font-size:11.5px; color:#9CA3AF; margin-top:1px; }
        .sc-contact-btns { display:flex; gap:6px; }
        .sc-contact-btn { padding:5px 10px; border-radius:7px; font-size:11.5px; font-weight:500; cursor:pointer; font-family:inherit; transition:all 0.15s; display:flex; align-items:center; gap:4px; text-decoration:none; }
        .sc-contact-email { background:#EFF6FF; border:1px solid #BFDBFE; color:#1D4ED8; }
        .sc-contact-phone { background:#F0FDF4; border:1px solid #BBF7D0; color:#16A34A; }

        .sc-empty { padding:40px; text-align:center; color:#9CA3AF; font-size:13px; }
      `}</style>

      {/* 탑바 */}
      <div className="sc-topbar">
        <div className="sc-topbar-left">
          <button className="sc-back-btn" onClick={onBack ?? (() => navigate(-1))}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="sc-breadcrumb">학사 › <span>출결 관리 · 반별 출결</span></div>
        </div>
        <div className="sc-topbar-right">
          <button className="sc-drilldown-btn" onClick={() => setShowCourse(true)}>
            과목별 출결 보기
          </button>
          <button
            className={`sc-btn ${quickFilter ? 'sc-btn-danger' : 'sc-btn-secondary'}`}
            onClick={() => setQuickFilter(v => !v)}
          >
            {quickFilter ? '▲ 위험군 필터 해제' : '결석 3회+ 필터'}
          </button>
        </div>
      </div>

      {/* 통계 배너 */}
      <div className="sc-stat-row">
        <div className="sc-stat-card">
          <div className="sc-stat-label">반 전체 학생</div>
          <div className="sc-stat-val" style={{ color:'#3B82F6' }}>{stats.total} 명</div>
        </div>
        <div className="sc-stat-card">
          <div className="sc-stat-label">결석 위험 (6회+)</div>
          <div className="sc-stat-val" style={{ color:'#EF4444' }}>{stats.danger} 명</div>
        </div>
        <div className="sc-stat-card">
          <div className="sc-stat-label">결석 주의 (3~5회)</div>
          <div className="sc-stat-val" style={{ color:'#D97706' }}>{stats.warning} 명</div>
        </div>
        <div className="sc-stat-card">
          <div className="sc-stat-label">반 평균 출석률</div>
          <div className="sc-stat-val" style={{ color:getRateColor(stats.avgRate) }}>{stats.avgRate} %</div>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="sc-filter-card">
        <div className="sc-filter-group">
          <span className="sc-filter-label">학과</span>
          <select className="sc-select" value={filters.deptId} onChange={e => setFilter('deptId', e.target.value)}>
            {depts.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
          </select>
        </div>
        <div className="sc-filter-group">
          <span className="sc-filter-label">반 선택</span>
          <div className="sc-class-tabs">
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
        <div className="sc-empty">데이터를 불러오는 중입니다...</div>
      ) : students.length === 0 ? (
        <div className="sc-empty" style={{ background:'#fff', borderRadius:14, border:'1px solid #F3F4F6', padding:'48px'}}>
          조회된 학생 데이터가 없습니다.
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:16, alignItems:'start' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* 출결 그리드 */}
            <div className="sc-card">
              <div className="sc-card-title">
                <span>학생별 출결 현황 {quickFilter && <span className="sc-chip sc-chip-red">필터 적용 중</span>}</span>
              </div>
              <div className="sc-grid-wrap">
                <table className="sc-grid">
                  <thead>
                    <tr>
                      <th className="left">학생 정보</th>
                      {WEEK_LABELS.map((lbl, wi) => (
                        <th key={lbl} style={{ color:(wi+1)===CURRENT_WEEK ? '#1D4ED8':undefined }}>{lbl}</th>
                      ))}
                      <th>출석률</th>
                      <th>결석</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map(s => {
                      const rate = getAttendRate(s);
                      const isDanger = (s.totalAbsent || 0) >= 6;
                      const isWarning = (s.totalAbsent || 0) >= 3 && (s.totalAbsent || 0) < 6;
                      return (
                        <tr key={s.studentId} className={isDanger ? 'danger-row' : isWarning ? 'warning-row' : ''}>
                          <td className="left">
                            <div style={{ fontWeight:600 }}>{s.korName || s.engName}</div>
                            <div style={{ fontSize:11, color:'#9CA3AF' }}>{s.studentId}</div>
                          </td>
                          {/* 주차별 출결: API에서 weeklyAttend 배열을 제공한다고 가정하거나 
                              Section 13의 상세 출결을 맵핑해야 합니다. */}
                          {WEEK_LABELS.map((_, wi) => {
                             const attendance = s.weeklyAttend?.[wi];
                             const cell = getStatusCell(attendance);
                             return (
                               <td key={wi}>
                                 {wi + 1 <= CURRENT_WEEK ? (
                                   <div className="sc-week-cell" style={{ background:cell.bg, color:cell.color }}>{cell.label}</div>
                                 ) : <span className="sc-week-future"/>}
                               </td>
                             );
                          })}
                          <td>
                            <div className="sc-rate-bar">
                              <span style={{ fontWeight:600, color:getRateColor(rate) }}>{rate}%</span>
                            </div>
                          </td>
                          <td><span className={`sc-chip ${isDanger ? 'sc-chip-red' : isWarning ? 'sc-chip-amber' : 'sc-chip-gray'}`}>{s.totalAbsent || 0}회</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 우측 사이드: 지도교수 및 위험군 요약 */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="sc-card">
              <div className="sc-card-title">학과 교수진</div>
              <div className="sc-prof-list">
                {advisors.map(p => (
                  <div key={p.professorId} className="sc-prof-row">
                    <div className="sc-prof-avatar">{p.name[0]}</div>
                    <div className="sc-prof-info">
                      <div className="sc-prof-name">{p.name} 교수</div>
                      <div className="sc-prof-sub">{p.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sc-card">
              <div className="sc-card-title">집중 관리 대상</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {students.filter(s => (s.totalAbsent || 0) >= 3).slice(0, 5).map(s => (
                  <div key={s.studentId} style={{ display:'flex', justifyContent:'space-between', padding:8, background:'#FFF5F5', borderRadius:8 }}>
                    <span style={{ fontWeight:600 }}>{s.korName}</span>
                    <span className="sc-chip sc-chip-red">결석 {s.totalAbsent}회</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}