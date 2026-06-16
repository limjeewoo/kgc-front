import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchByCourse from './SearchByCourse.jsx';

const BASE_URL = 'http://localhost:8080';

export default function SearchByClass({ onBack }) {
  const navigate = useNavigate();
  const accessToken = localStorage.getItem('accessToken');

  const [depts, setDepts] = useState([]);
  const [filters, setFilters] = useState({ deptId: '', classSec: 'A' });
  const [students, setStudents] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quickFilter, setQuickFilter] = useState(false);
  const [showCourse, setShowCourse] = useState(false);

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  const fetchDepts = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/depts`, { headers });
      const json = await res.json();
      if (json.success && json.data) {
        setDepts(json.data);
        if (json.data.length > 0 && !filters.deptId) {
          setFilters(prev => ({ ...prev, deptId: json.data[0].deptId }));
        }
      }
    } catch (err) {
      console.error("학과 목록 로드 실패:", err);
    }
  }, [filters.deptId]);

  const fetchAdvisors = useCallback(async (deptId) => {
    if (!deptId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/professors?deptId=${deptId}`, { headers });
      const json = await res.json();
      if (json.success && json.data) setAdvisors(json.data);
    } catch (err) {
      console.error("교수 목록 로드 실패:", err);
    }
  }, []);

  const fetchClassData = useCallback(async () => {
    if (!filters.deptId || !filters.classSec) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/api/v1/search/class?deptId=${filters.deptId}&classSec=${filters.classSec}&_t=${Date.now()}`,
        { headers }
      );
      const json = await res.json();

      if (json.success && json.data) {
        const parsedStudents = json.data.map(student => {
          const courses = student.courses || [];
          const totalAbsent = courses.reduce((sum, c) => sum + (c.totalAbsent || 0), 0);
          const totalLate   = courses.reduce((sum, c) => sum + (c.totalLate   || 0), 0);
          return { ...student, courses, totalAbsent, totalLate };
        });
        setStudents(parsedStudents);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error("학급 데이터 로드 실패:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchDepts(); },                  [fetchDepts]);
  useEffect(() => { fetchAdvisors(filters.deptId); }, [filters.deptId, fetchAdvisors]);
  useEffect(() => { fetchClassData(); },              [fetchClassData]);
  useEffect(() => { setShowCourse(false); },          [filters]);

  const displayed = quickFilter ? students.filter(s => s.totalAbsent >= 3) : students;

  const stats = {
    total:   students.length,
    danger:  students.filter(s => s.totalAbsent >= 6).length,
    warning: students.filter(s => s.totalAbsent >= 3 && s.totalAbsent < 6).length,
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

  const uniqueCourses = Array.from(
    displayed.reduce((acc, s) => {
      (s.courses || []).forEach(c => {
        if (!acc.has(c.courseId)) acc.set(c.courseId, c.courseName);
      });
      return acc;
    }, new Map())
  ).map(([id, name]) => ({ id, name }));

  return (
    <div style={{ fontFamily: "'DM Sans','Noto Sans KR',sans-serif", fontSize: '14px', color: '#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .sc-topbar { background:#fff; padding:0 24px; height:54px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #E5E7EB; margin-bottom:20px; border-radius:12px 12px 0 0; }
        .sc-topbar-left  { display:flex; align-items:center; gap:10px; }
        .sc-topbar-right { display:flex; align-items:center; gap:8px; }
        .sc-back-btn { width:30px; height:30px; border-radius:7px; background:#F3F4F6; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#374151; transition:background 0.15s; }
        .sc-back-btn:hover { background:#E5E7EB; }
        .sc-breadcrumb { font-size:13px; color:#9CA3AF; }
        .sc-breadcrumb span { color:#111827; font-weight:600; }
        .sc-btn { padding:7px 14px; border-radius:8px; font-size:12.5px; font-weight:500; cursor:pointer; font-family:inherit; display:flex; align-items:center; gap:5px; transition:all 0.15s; border:none; white-space:nowrap; }
        .sc-btn-secondary { background:#F9FAFB; border:1px solid #E5E7EB; color:#374151; }
        .sc-btn-secondary:hover { background:#F3F4F6; }
        .sc-btn-danger { background:#FEF2F2; border:1px solid #FECACA; color:#DC2626; }
        .sc-btn-danger:hover { background:#FEE2E2; }
        .sc-drilldown-btn { display:flex; align-items:center; gap:7px; padding:8px 16px; border-radius:9px; background:linear-gradient(135deg,#1A3A5C,#2563EB); border:none; color:#fff; font-size:12.5px; font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.2s; box-shadow:0 2px 8px rgba(37,99,235,0.25); white-space:nowrap; }
        .sc-drilldown-btn:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(37,99,235,0.35); }
        .sc-chip { font-size:11px; font-weight:600; padding:3px 9px; border-radius:20px; }
        .sc-chip-blue   { background:#EFF6FF; color:#1D4ED8; }
        .sc-chip-amber  { background:#FFFBEB; color:#D97706; }
        .sc-chip-red    { background:#FEF2F2; color:#DC2626; }
        .sc-chip-gray   { background:#F3F4F6; color:#6B7280; }

        .sc-card { background:#fff; border-radius:12px; border:1px solid #F3F4F6; padding:18px 20px; }
        .sc-card-title { font-size:13px; font-weight:700; color:#111827; margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid #F3F4F6; display:flex; align-items:center; gap:8px; }
        .sc-card-title::before { content:''; display:inline-block; width:3px; height:14px; background:#3B82F6; border-radius:2px; flex-shrink:0; }

        .sc-stat-row { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:16px; }
        .sc-stat-card { background:#fff; border-radius:12px; border:1px solid #F3F4F6; padding:14px 16px; }
        .sc-stat-label { font-size:11px; color:#9CA3AF; margin-bottom:5px; }
        .sc-stat-val { font-size:22px; font-weight:700; letter-spacing:-0.5px; }

        .sc-filter-card { background:#fff; border-radius:12px; border:1px solid #F3F4F6; padding:14px 20px; margin-bottom:16px; display:flex; align-items:flex-end; gap:16px; flex-wrap:wrap; }
        .sc-filter-group { display:flex; flex-direction:column; gap:4px; }
        .sc-filter-label { font-size:11px; font-weight:600; color:#9CA3AF; }
        .sc-select { padding:7px 10px; border-radius:8px; border:1px solid #E5E7EB; font-size:12.5px; font-family:inherit; color:#374151; background:#fff; cursor:pointer; outline:none; min-width:160px; }
        .sc-select:focus { border-color:#3B82F6; }
        .sc-class-tabs { display:flex; gap:6px; }
        .sc-class-tab { padding:7px 16px; border-radius:8px; border:1px solid #E5E7EB; background:#fff; font-size:13px; font-weight:500; color:#6B7280; cursor:pointer; transition:all 0.15s; font-family:inherit; }
        .sc-class-tab:hover { background:#F3F4F6; }
        .sc-class-tab.active { background:#1A3A5C; border-color:#1A3A5C; color:#fff; font-weight:600; }

        .sc-main-layout { display:flex; flex-direction:column; gap:20px; }
        .sc-grid-wrap { overflow-x:auto; border:1px solid #E5E7EB; border-radius:8px; }
        .sc-grid { width:100%; border-collapse:collapse; min-width:600px; }

        .sc-pivot-grid th, .sc-pivot-grid td { border-bottom:1px solid #E5E7EB; border-right:1px solid #E5E7EB; }
        .sc-pivot-grid th:last-child, .sc-pivot-grid td:last-child { border-right:none; }
        .sc-pivot-grid th { background:#F8FAFC; padding:10px 8px; font-size:12px; font-weight:600; color:#4B5563; text-align:center; vertical-align:middle; white-space:nowrap; }
        .sc-pivot-grid td { padding:10px 6px; font-size:12.5px; text-align:center; vertical-align:middle; background:#fff; }
        .sc-pivot-grid tr:hover td { background:#F8FAFC !important; }
        .sc-pivot-grid .left { text-align:left; padding-left:14px; }

        /* 숫자 배지: 글자에 딱 붙는 작은 배경, width/height 고정 없이 padding으로만 */
        .sc-absent-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px 7px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 12px;
        }

        .sc-side { display:flex; flex-direction:column; gap:14px; }
        .sc-prof-list { display:flex; flex-direction:column; gap:8px; }
        .sc-prof-row { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; background:#F8FAFC; border:1px solid #F3F4F6; }
        .sc-prof-avatar { width:34px; height:34px; border-radius:9px; background:linear-gradient(135deg,#3B82F6,#1A3A5C); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#fff; flex-shrink:0; }
        .sc-prof-name { font-size:13px; font-weight:600; color:#111827; }
        .sc-prof-sub  { font-size:11px; color:#9CA3AF; margin-top:1px; }
        .sc-focus-list { display:flex; flex-direction:column; gap:7px; }
        .sc-focus-row { display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:#FFF5F5; border-radius:8px; }
        .sc-empty-side { color:#9CA3AF; font-size:12px; text-align:center; padding:12px 0; }
        .sc-empty { padding:40px; text-align:center; color:#9CA3AF; font-size:13px; background:#fff; border-radius:12px; border:1px solid #F3F4F6; }
      `}</style>

      {/* ── 탑바 ── */}
      <div className="sc-topbar">
        <div className="sc-topbar-left">
          <button className="sc-back-btn" onClick={onBack ?? (() => navigate(-1))}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="sc-breadcrumb">학사 › <span>학과-반별 검색</span></div>
        </div>
        <div className="sc-topbar-right">
          <button className="sc-drilldown-btn" onClick={() => setShowCourse(true)}>
            상세 과목별 출결 보기
          </button>
          <button
            className={`sc-btn ${quickFilter ? 'sc-btn-danger' : 'sc-btn-secondary'}`}
            onClick={() => setQuickFilter(v => !v)}
          >
            {quickFilter ? '▲ 필터 해제' : '결석 3회+ 필터'}
          </button>
        </div>
      </div>

      {/* ── 통계 배너 ── */}
      <div className="sc-stat-row">
        <div className="sc-stat-card">
          <div className="sc-stat-label">반 전체 학생</div>
          <div className="sc-stat-val" style={{ color: '#3B82F6' }}>{stats.total} 명</div>
        </div>
        <div className="sc-stat-card">
          <div className="sc-stat-label">결석 위험 (6회+)</div>
          <div className="sc-stat-val" style={{ color: '#EF4444' }}>{stats.danger} 명</div>
        </div>
        <div className="sc-stat-card">
          <div className="sc-stat-label">결석 주의 (3~5회)</div>
          <div className="sc-stat-val" style={{ color: '#D97706' }}>{stats.warning} 명</div>
        </div>
      </div>

      {/* ── 필터 ── */}
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

      {/* ── 본문 ── */}
      {isLoading ? (
        <div className="sc-empty">데이터를 불러오는 중입니다...</div>
      ) : students.length === 0 ? (
        <div className="sc-empty">조회된 학생 데이터가 없습니다.</div>
      ) : (
        <div className="sc-main-layout">

          <div className="sc-card" style={{ padding: '18px 0' }}>
            <div className="sc-card-title" style={{ padding: '0 20px 10px 20px' }}>
              학생별 과목 결석 현황
              {quickFilter && <span className="sc-chip sc-chip-red" style={{ marginLeft: 4 }}>필터 적용 중</span>}
            </div>

            <div className="sc-grid-wrap" style={{ margin: '0 20px' }}>
              <table className="sc-grid sc-pivot-grid">
                <thead>
                  <tr>
                    <th colSpan="2" className="left" style={{ minWidth: '180px' }}>학생 정보</th>
                    {uniqueCourses.length > 0 && (
                      <th colSpan={uniqueCourses.length} style={{ background: '#EEF2FF', color: '#4F46E5', letterSpacing: '-0.5px' }}>
                        과목별 출석 현황
                      </th>
                    )}
                    <th rowSpan="2" style={{ width: '80px', borderLeft: '1px solid #E5E7EB' }}>총 결석</th>
                  </tr>
                  <tr>
                    <th className="left" style={{ width: '100px' }}>학번</th>
                    <th className="left" style={{ width: '150px' }}>영문 / 한글 이름</th>
                    {uniqueCourses.map(c => (
                      <th key={c.id} style={{
                        minWidth: '55px',
                        maxWidth: '80px',
                        whiteSpace: 'normal',
                        wordBreak: 'keep-all',
                        fontSize: '11px',
                        lineHeight: '1.3',
                      }}>
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(s => {
                    const isDanger  = s.totalAbsent >= 6;
                    const isWarning = s.totalAbsent >= 3 && s.totalAbsent < 6;

                    return (
                      <tr key={s.studentId}>
                        {/* 학번 */}
                        <td className="left" style={{ fontWeight: 600, color: '#6B7280', fontSize: '13px' }}>
                          {s.studentId}
                        </td>
                        {/* 이름 */}
                        <td className="left">
                          <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#111827' }}>{s.engName}</div>
                          {s.korName && <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{s.korName}</div>}
                        </td>

                        {/* 과목별 결석 횟수 — 숫자 뒤에만 작은 배경 */}
                        {uniqueCourses.map(uc => {
                          const courseData  = (s.courses || []).find(c => c.courseId === uc.id);
                          const absentCount = courseData?.totalAbsent ?? 0;

                          // 4회+ 빨강, 2~3회 주황, 1회 검정, 0회 연회색
                          const textColor = absentCount >= 4 ? '#DC2626'
                            : absentCount >= 2 ? '#D97706'
                            : absentCount === 1 ? '#111827'
                            : '#D1D5DB';

                          // 글자색에 맞는 연한 배경 (이미지 참고 — 숫자 뒤에만 붙는 작은 배지)
                          const bgColor = absentCount >= 4 ? '#FEE2E2'
                            : absentCount >= 2 ? '#FEF3C7'
                            : absentCount === 1 ? '#F3F4F6'
                            : 'transparent';

                          return (
                            <td key={uc.id}>
                              {courseData ? (
                                <span className="sc-absent-num" style={{ background: bgColor, color: textColor }}>
                                  {absentCount}
                                </span>
                              ) : (
                                <span style={{ color: '#E5E7EB' }}>-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* 총 결석 */}
                        <td style={{ borderLeft: '1px solid #E5E7EB' }}>
                          <span className={`sc-chip ${isDanger ? 'sc-chip-red' : isWarning ? 'sc-chip-amber' : 'sc-chip-gray'}`} style={{ fontSize: '12px', padding: '4px 10px' }}>
                            {s.totalAbsent}회
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 사이드 패널 */}
          <div className="sc-side">
            <div className="sc-card">
              <div className="sc-card-title">학과 교수진</div>
              {advisors.length === 0 ? (
                <p className="sc-empty-side">교수 정보가 없습니다.</p>
              ) : (
                <div className="sc-prof-list">
                  {advisors.map(p => (
                    <div key={p.professorId} className="sc-prof-row">
                      <div className="sc-prof-avatar">{p.name?.[0] ?? '?'}</div>
                      <div>
                        <div className="sc-prof-name">{p.name} 교수</div>
                        <div className="sc-prof-sub">{p.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sc-card">
              <div className="sc-card-title">집중 관리 대상</div>
              {students.filter(s => s.totalAbsent >= 3).length === 0 ? (
                <p className="sc-empty-side">해당 학생이 없습니다.</p>
              ) : (
                <div className="sc-focus-list">
                  {students
                    .filter(s => s.totalAbsent >= 3)
                    .sort((a, b) => b.totalAbsent - a.totalAbsent)
                    .slice(0, 6)
                    .map(s => (
                      <div key={s.studentId} className="sc-focus-row">
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                            {s.korName ? `${s.korName} (${s.engName})` : s.engName}
                          </span>
                        </div>
                        <span className="sc-chip sc-chip-red" style={{ flexShrink: 0 }}>누적 {s.totalAbsent}회</span>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}