import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchByCourse from './SearchByCourse.jsx';

// API 설정
const BASE_URL = 'http://localhost:8080'; // 개발용 (필요시 배포용 변환)

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

  // 1. 학과 목록 조회
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

  // 2. 해당 학과의 교수(지도교수) 목록 조회
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

  // 3. [핵심] 반별 학생 수강과목 및 결석 데이터 파싱
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
        // 백엔드 구조에 맞춰 파싱: courses 배열 합산 처리
        const parsedStudents = json.data.map(student => {
          const courses = student.courses || [];
          // 과목별 결석/지각 합산 계산
          const totalAbsent = courses.reduce((sum, c) => sum + (c.totalAbsent || 0), 0);
          const totalLate = courses.reduce((sum, c) => sum + (c.totalLate || 0), 0);

          return {
            ...student,
            courses,
            totalAbsent,
            totalLate
          };
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

  // 라이프사이클 이펙트
  useEffect(() => { fetchDepts(); }, [fetchDepts]);
  useEffect(() => { fetchAdvisors(filters.deptId); }, [filters.deptId, fetchAdvisors]);
  useEffect(() => { fetchClassData(); }, [fetchClassData]);
  useEffect(() => { setShowCourse(false); }, [filters]);

  // 필터링 처리 (결석 3회 이상)
  const displayed = quickFilter ? students.filter(s => s.totalAbsent >= 3) : students;

  // 상단 통계 스냅샷 (출석률 제외하고 총 결석 기반 위험/주의 산정)
  const stats = {
    total: students.length,
    danger: students.filter(s => s.totalAbsent >= 6).length,
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
        .sc-chip-green { background:#F0FDF4; color:#16A34A; }
        .sc-chip-amber { background:#FFFBEB; color:#D97706; }
        .sc-chip-red   { background:#FEF2F2; color:#DC2626; }
        .sc-chip-gray  { background:#F3F4F6; color:#6B7280; }
        
        .sc-card { background:#fff; border-radius:12px; border:1px solid #F3F4F6; padding:18px 20px; }
        .sc-card-title { font-size:13px; font-weight:700; color:#111827; margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid #F3F4F6; display:flex; align-items:center; gap:8px; }
        .sc-card-title::before { content:''; display:inline-block; width:3px; height:14px; background:#3B82F6; border-radius:2px; flex-shrink:0; }
        
        /* Stats Banner 변경 (3칸으로 축소) */
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
        
        .sc-main-layout { display: flex; flex-direction: column; gap: 20px; align-items: stretch; }
        .sc-grid-wrap { overflow-x:auto; }
        .sc-grid { width:100%; border-collapse:collapse; min-width:600px; }
        .sc-grid th { padding:10px 8px; font-size:12px; font-weight:600; color:#9CA3AF; text-align:center; border-bottom:1px solid #F3F4F6; white-space:nowrap; background:#FAFAFA; }
        .sc-grid th.left { text-align:left; padding-left:12px; }
        .sc-grid td { padding:12px 6px; font-size:12.5px; text-align:center; border-bottom:1px solid #F9FAFB; vertical-align:middle; }
        .sc-grid td.left { text-align:left; padding-left:12px; }
        .sc-grid tr:last-child td { border-bottom:none; }
        .sc-grid tr.danger-row td  { background:#FFF5F5; }
        .sc-grid tr.warning-row td { background:#FFFBEB; }
        .sc-grid tr:hover td { background:#F8FAFC !important; }

        /* 과목별 뱃지 스타일 */
        .sc-course-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .sc-course-badge { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #E5E7EB; padding: 6px 10px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
        .sc-course-name { font-weight: 600; color: #374151; font-size: 11.5px; }
        .sc-course-stat { font-size: 11px; color: #6B7280; border-left: 1px solid #E5E7EB; padding-left: 6px; }

        .sc-side { display:flex; flex-direction:column; gap:14px; min-width:0; }
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

          {/* 좌: 수강과목 요약 테이블 */}
          <div className="sc-card">
            <div className="sc-card-title">
              학생별 과목 결석 현황
              {quickFilter && <span className="sc-chip sc-chip-red" style={{marginLeft:4}}>필터 적용 중</span>}
            </div>
            <div className="sc-grid-wrap">
              <table className="sc-grid">
                <thead>
                  <tr>
                    <th className="left" style={{ width: '180px' }}>학생 정보</th>
                    <th className="left">수강 과목별 결석 내역</th>
                    <th style={{ width: '100px' }}>총 결석</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(s => {
                    const isDanger  = s.totalAbsent >= 6;
                    const isWarning = s.totalAbsent >= 3 && s.totalAbsent < 6;
                    
                    return (
                      <tr key={s.studentId} className={isDanger ? 'danger-row' : isWarning ? 'warning-row' : ''}>
                        <td className="left">
                          <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{s.engName}</div>
                          <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: '2px' }}>{s.studentId}</div>
                        </td>
                        
                        <td className="left">
                          <div className="sc-course-list">
                            {s.courses.map(c => (
                              <div key={c.courseId} className="sc-course-badge">
                                <span className="sc-course-name">{c.courseName}</span>
                                <span className="sc-course-stat">결석 {c.totalAbsent}</span>
                                {c.warningStatus && (
                                  <span className={`sc-chip ${c.warningStatus === '위험' ? 'sc-chip-red' : 'sc-chip-amber'}`} style={{ padding: '2px 6px', fontSize: '10px' }}>
                                    {c.warningStatus}
                                  </span>
                                )}
                              </div>
                            ))}
                            {s.courses.length === 0 && <span style={{ color: '#9CA3AF', fontSize: '12px' }}>수강 과목 없음</span>}
                          </div>
                        </td>

                        <td>
                          <span className={`sc-chip ${isDanger ? 'sc-chip-red' : isWarning ? 'sc-chip-amber' : 'sc-chip-gray'}`} style={{ fontSize: '12px', padding: '5px 12px' }}>
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

          {/* 우: 사이드 패널 */}
          <div className="sc-side">
            {/* 학과 교수진 */}
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

            {/* 집중 관리 대상 */}
            <div className="sc-card">
              <div className="sc-card-title">집중 관리 대상</div>
              {students.filter(s => s.totalAbsent >= 3).length === 0 ? (
                <p className="sc-empty-side">해당 학생이 없습니다.</p>
              ) : (
                <div className="sc-focus-list">
                  {students
                    .filter(s => s.totalAbsent >= 3)
                    .sort((a, b) => b.totalAbsent - a.totalAbsent) // 결석 많은 순 정렬
                    .slice(0, 6)
                    .map(s => (
                      <div key={s.studentId} className="sc-focus-row">
                        <span style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                          {s.engName}
                        </span>
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