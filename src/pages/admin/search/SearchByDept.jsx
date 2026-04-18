import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── 더미 데이터 ───────────────────────────────────────────────
const DUMMY_DEPTS = [
  { deptId: 'CS01', deptName: '컴퓨터소프트웨어과' },
  { deptId: 'DS01', deptName: '데이터사이언스과' },
  { deptId: 'ME01', deptName: '기계공학과' },
  { deptId: 'BI01', deptName: '뷰티디자인과' },
];

const DUMMY_STUDENTS = [
  { studentId: '25071001', korName: '응우옌반안',  engName: 'NGUYEN VAN AN',  nationality: '베트남',     gender: '남', grade: 2, classSec: 'A', deptId: 'CS01', enrollStatus: '재학', visaType: 'D-2', visaExpire: '2025-06-15', attendance: 62, mileage: 320,  academicWarning: 1, gpa: 2.8 },
  { studentId: '25071002', korName: '천샤오민',    engName: 'CHEN XIAOMIN',    nationality: '중국',       gender: '여', grade: 1, classSec: 'A', deptId: 'CS01', enrollStatus: '재학', visaType: 'D-2', visaExpire: '2026-02-28', attendance: 91, mileage: 580,  academicWarning: 0, gpa: 3.9 },
  { studentId: '25071003', korName: '이반페트로프', engName: 'IVAN PETROV',     nationality: '러시아',     gender: '남', grade: 3, classSec: 'B', deptId: 'CS01', enrollStatus: '재학', visaType: 'D-4', visaExpire: '2025-08-31', attendance: 78, mileage: 410,  academicWarning: 0, gpa: 3.3 },
  { studentId: '25071004', korName: '파티마알리',  engName: 'FATIMA ALI',      nationality: '우즈베키스탄', gender: '여', grade: 2, classSec: 'B', deptId: 'CS01', enrollStatus: '휴학', visaType: 'D-2', visaExpire: '2025-12-01', attendance: 55, mileage: 120,  academicWarning: 2, gpa: 2.1 },
  { studentId: '25071005', korName: '아마라쿠마르', engName: 'AMARA KUMAR',     nationality: '인도',       gender: '남', grade: 1, classSec: 'A', deptId: 'CS01', enrollStatus: '재학', visaType: 'D-2', visaExpire: '2026-09-10', attendance: 84, mileage: 200,  academicWarning: 0, gpa: 3.5 },
  { studentId: '25071006', korName: '호앙민',      engName: 'HOANG MINH',      nationality: '베트남',     gender: '남', grade: 3, classSec: 'A', deptId: 'CS01', enrollStatus: '재학', visaType: 'D-2', visaExpire: '2025-05-20', attendance: 69, mileage: 290,  academicWarning: 1, gpa: 2.6 },
  { studentId: '25071007', korName: '나탈리아소콜', engName: 'NATALIA SOKOL',   nationality: '러시아',     gender: '여', grade: 2, classSec: 'C', deptId: 'CS01', enrollStatus: '제적', visaType: 'D-4', visaExpire: '2024-12-31', attendance: 40, mileage: 0,    academicWarning: 3, gpa: 1.5 },
  { studentId: '25071008', korName: '왕레이',      engName: 'WANG LEI',        nationality: '중국',       gender: '남', grade: 1, classSec: 'B', deptId: 'CS01', enrollStatus: '재학', visaType: 'D-2', visaExpire: '2026-03-01', attendance: 95, mileage: 720,  academicWarning: 0, gpa: 4.2 },
  { studentId: '25071009', korName: '린다오',      engName: 'LIN DAO',         nationality: '중국',       gender: '여', grade: 4, classSec: 'C', deptId: 'CS01', enrollStatus: '재학', visaType: 'D-2', visaExpire: '2025-09-30', attendance: 73, mileage: 440,  academicWarning: 0, gpa: 3.1 },
  { studentId: '25071010', korName: '카마로프',    engName: 'KAMALOV JASUR',   nationality: '우즈베키스탄', gender: '남', grade: 2, classSec: 'C', deptId: 'CS01', enrollStatus: '재학', visaType: 'D-4', visaExpire: '2025-07-15', attendance: 88, mileage: 510,  academicWarning: 0, gpa: 3.7 },
];

// ─── 유틸 ───────────────────────────────────────────────────────
const getDaysUntil = (dateStr) => {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getVisaChip = (expire) => {
  const d = getDaysUntil(expire);
  if (d <= 30)  return { cls: 'sd-chip-red',   label: `D-${d}` };
  if (d <= 90)  return { cls: 'sd-chip-amber', label: `D-${d}` };
  return              { cls: 'sd-chip-green',  label: `D-${d}` };
};

const getAttendStyle = (rate) => {
  if (rate < 70) return { color: '#DC2626', bg: '#FEF2F2' };
  if (rate < 80) return { color: '#D97706', bg: '#FFFBEB' };
  return               { color: '#16A34A', bg: '#F0FDF4' };
};

const getEnrollChip = (status) => {
  if (status === '재학') return 'sd-chip-green';
  if (status === '휴학') return 'sd-chip-amber';
  return 'sd-chip-red';
};

// ─── 컴포넌트 ───────────────────────────────────────────────────
export default function SearchByDept() {
  const navigate = useNavigate();

  // 필터 상태
  const [filters, setFilters] = useState({
    deptId: 'CS01',
    nationality: '',
    gender: '',
    grade: '',
    classSec: '',
    visaType: '',
    enrollStatus: '',
  });

  // 선택된 학생 (체크박스)
  const [selected, setSelected] = useState(new Set());
  const [students, setStudents]  = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');

  // ── API: GET /api/v1/search/dept (시뮬레이션) ──
  const fetchStudents = useCallback(() => {
    setIsLoading(true);
    setSelected(new Set());
    setTimeout(() => {
      let result = DUMMY_STUDENTS.filter(s => s.deptId === filters.deptId);
      if (filters.nationality)   result = result.filter(s => s.nationality   === filters.nationality);
      if (filters.gender)        result = result.filter(s => s.gender         === filters.gender);
      if (filters.grade)         result = result.filter(s => s.grade          === Number(filters.grade));
      if (filters.classSec)      result = result.filter(s => s.classSec       === filters.classSec);
      if (filters.visaType)      result = result.filter(s => s.visaType       === filters.visaType);
      if (filters.enrollStatus)  result = result.filter(s => s.enrollStatus   === filters.enrollStatus);
      setStudents(result);
      setIsLoading(false);
    }, 350);
  }, [filters]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ── 통계 계산 ──
  const stats = {
    total:    students.length,
    enrolled: students.filter(s => s.enrollStatus === '재학').length,
    leave:    students.filter(s => s.enrollStatus === '휴학').length,
    expelled: students.filter(s => s.enrollStatus === '제적').length,
    danger:   students.filter(s => s.attendance < 70).length,
    visaAlert: students.filter(s => getDaysUntil(s.visaExpire) <= 30).length,
  };

  // ── 체크박스 ──
  const toggleAll = () => {
    if (selected.size === students.length) setSelected(new Set());
    else setSelected(new Set(students.map(s => s.studentId)));
  };
  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  // ── 엑셀 다운로드 (GET /api/v1/search/dept + export 시뮬레이션) ──
  const handleExcel = () => {
    const rows = students
      .filter(s => selected.size === 0 || selected.has(s.studentId))
      .map(s => `${s.studentId}\t${s.korName}\t${s.nationality}\t${s.gender}\t${s.grade}학년\t${s.classSec}반\t${s.visaType}\t${s.visaExpire}\t${s.attendance}%\t${s.mileage}\t${s.academicWarning}회\t${s.gpa}`);
    const header = '학번\t성명\t국적\t성별\t학년\t반\t비자\t비자만료일\t출석률\t마일리지\t학사경고\tGPA';
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `학과별현황_${filters.deptId}.xls`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── 알림 전송 (POST /api/v1/notifications 시뮬레이션) ──
  const handleNotify = () => {
    alert(`✅ ${selected.size > 0 ? selected.size : students.length}명에게 알림이 전송되었습니다.`);
    setShowNotifyModal(false);
    setNotifyMsg('');
  };

  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  const currentDept = DUMMY_DEPTS.find(d => d.deptId === filters.deptId);

  return (
    <div style={{ fontFamily: "'DM Sans','Noto Sans KR',sans-serif", fontSize: '14px', color: '#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        /* ── 공통 ── */
        .sd-topbar { background:#fff; padding:0 28px; height:58px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #E5E7EB; margin-bottom:24px; }
        .sd-topbar-left { display:flex; align-items:center; gap:10px; }
        .sd-topbar-right { display:flex; align-items:center; gap:8px; }
        .sd-breadcrumb { font-size:13px; color:#9CA3AF; }
        .sd-breadcrumb span { color:#111827; font-weight:600; }
        .sd-back-btn { width:30px; height:30px; border-radius:7px; background:#F3F4F6; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#374151; transition:background 0.15s; }
        .sd-back-btn:hover { background:#E5E7EB; }
        .sd-btn { padding:7px 14px; border-radius:8px; font-size:12.5px; font-weight:500; cursor:pointer; font-family:inherit; display:flex; align-items:center; gap:5px; transition:all 0.15s; }
        .sd-btn-secondary { background:#F9FAFB; border:1px solid #E5E7EB; color:#374151; }
        .sd-btn-secondary:hover { background:#F3F4F6; }
        .sd-btn-primary { background:#1A3A5C; border:1px solid #1A3A5C; color:#fff; }
        .sd-btn-primary:hover { background:#153150; }
        .sd-btn-danger { background:#FEF2F2; border:1px solid #FECACA; color:#DC2626; }
        .sd-btn-danger:hover { background:#FEE2E2; }
        .sd-btn-green { background:#F0FDF4; border:1px solid #BBF7D0; color:#16A34A; }
        .sd-btn-green:hover { background:#DCFCE7; }
        .sd-btn:disabled { opacity:0.45; cursor:not-allowed; }

        .sd-chip { font-size:11px; font-weight:600; padding:3px 9px; border-radius:20px; white-space:nowrap; }
        .sd-chip-blue  { background:#EFF6FF; color:#1D4ED8; }
        .sd-chip-green { background:#F0FDF4; color:#16A34A; }
        .sd-chip-amber { background:#FFFBEB; color:#D97706; }
        .sd-chip-red   { background:#FEF2F2; color:#DC2626; }
        .sd-chip-gray  { background:#F3F4F6; color:#6B7280; }

        /* ── 통계 배너 ── */
        .sd-stat-banner { display:grid; grid-template-columns:repeat(6,1fr); gap:12px; margin-bottom:18px; }
        .sd-stat-card { background:#fff; border-radius:12px; border:1px solid #F3F4F6; padding:16px 18px; }
        .sd-stat-label { font-size:11px; color:#9CA3AF; margin-bottom:6px; }
        .sd-stat-val { font-size:22px; font-weight:700; color:#111827; letter-spacing:-0.5px; }
        .sd-stat-val.blue  { color:#3B82F6; }
        .sd-stat-val.green { color:#16A34A; }
        .sd-stat-val.amber { color:#D97706; }
        .sd-stat-val.red   { color:#EF4444; }

        /* ── 필터 카드 ── */
        .sd-filter-card { background:#fff; border-radius:14px; border:1px solid #F3F4F6; padding:18px 22px; margin-bottom:18px; }
        .sd-filter-title { font-size:13px; font-weight:700; color:#111827; margin-bottom:14px; }
        .sd-filter-row { display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end; }
        .sd-filter-group { display:flex; flex-direction:column; gap:4px; min-width:120px; }
        .sd-filter-label { font-size:11px; font-weight:600; color:#9CA3AF; }
        .sd-select {
          padding:7px 10px; border-radius:8px; border:1px solid #E5E7EB;
          font-size:12.5px; font-family:inherit; color:#374151;
          background:#fff; cursor:pointer; outline:none; min-width:120px;
        }
        .sd-select:focus { border-color:#3B82F6; }

        /* ── 테이블 카드 ── */
        .sd-table-card { background:#fff; border-radius:14px; border:1px solid #F3F4F6; overflow:hidden; }
        .sd-table-header { padding:16px 22px; border-bottom:1px solid #F3F4F6; display:flex; align-items:center; justify-content:space-between; }
        .sd-table-title { font-size:13px; font-weight:700; color:#111827; display:flex; align-items:center; gap:8px; }
        .sd-table-actions { display:flex; gap:8px; }

        .sd-table { width:100%; border-collapse:collapse; }
        .sd-table th { padding:10px 14px; font-size:11.5px; font-weight:600; color:#9CA3AF; text-align:left; border-bottom:1px solid #F3F4F6; white-space:nowrap; background:#FAFAFA; }
        .sd-table td { padding:10px 14px; font-size:12.5px; color:#374151; border-bottom:1px solid #F9FAFB; vertical-align:middle; }
        .sd-table tr:last-child td { border-bottom:none; }
        .sd-table tr.danger-row td { background:#FFF5F5; }
        .sd-table tr:hover td { background:#F8FAFC; }
        .sd-table tr.danger-row:hover td { background:#FEE2E2; }

        .sd-student-name { font-weight:600; color:#111827; }
        .sd-student-id   { font-size:11px; color:#9CA3AF; margin-top:1px; }

        .sd-attend-bar { display:flex; align-items:center; gap:6px; }
        .sd-attend-track { width:56px; height:5px; background:#F3F4F6; border-radius:99px; overflow:hidden; }
        .sd-attend-fill  { height:100%; border-radius:99px; }

        .sd-checkbox { width:15px; height:15px; cursor:pointer; accent-color:#1A3A5C; }

        /* ── 모달 ── */
        .sd-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; z-index:999; }
        .sd-modal { background:#fff; border-radius:16px; padding:28px; width:440px; max-width:90vw; }
        .sd-modal-title { font-size:15px; font-weight:700; color:#111827; margin-bottom:16px; }
        .sd-textarea { width:100%; height:100px; border:1px solid #E5E7EB; border-radius:8px; padding:10px 12px; font-size:13px; font-family:inherit; resize:none; outline:none; box-sizing:border-box; }
        .sd-textarea:focus { border-color:#3B82F6; }
        .sd-modal-footer { display:flex; justify-content:flex-end; gap:8px; margin-top:16px; }

        /* ── 빈 상태 ── */
        .sd-empty { padding:48px; text-align:center; color:#9CA3AF; font-size:13px; }

        /* ── 로딩 ── */
        .sd-loading { padding:48px; text-align:center; color:#9CA3AF; font-size:13px; }

        @media (max-width:900px) {
          .sd-stat-banner { grid-template-columns:repeat(3,1fr); }
          .sd-filter-row { flex-direction:column; }
        }
      `}</style>

      {/* 탑바 */}
      <div className="sd-topbar">
        <div className="sd-topbar-left">
          <button className="sd-back-btn" onClick={() => navigate(-1)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="sd-breadcrumb">학생 관리 › <span>학과별 현황 검색</span></div>
        </div>
        <div className="sd-topbar-right">
          <button
            className="sd-btn sd-btn-secondary"
            disabled={students.length === 0}
            onClick={handleExcel}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            엑셀 다운로드
          </button>
          <button
            className="sd-btn sd-btn-primary"
            disabled={students.length === 0}
            onClick={() => setShowNotifyModal(true)}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            일괄 알림 전송 {selected.size > 0 && `(${selected.size}명)`}
          </button>
        </div>
      </div>

      {/* 통계 배너 — GET /api/v1/search/dept 결과 기반 */}
      <div className="sd-stat-banner">
        <div className="sd-stat-card">
          <div className="sd-stat-label">전체 학생</div>
          <div className="sd-stat-val blue">{stats.total}</div>
        </div>
        <div className="sd-stat-card">
          <div className="sd-stat-label">재학</div>
          <div className="sd-stat-val green">{stats.enrolled}</div>
        </div>
        <div className="sd-stat-card">
          <div className="sd-stat-label">휴학</div>
          <div className="sd-stat-val amber">{stats.leave}</div>
        </div>
        <div className="sd-stat-card">
          <div className="sd-stat-label">제적</div>
          <div className="sd-stat-val red">{stats.expelled}</div>
        </div>
        <div className="sd-stat-card">
          <div className="sd-stat-label">출석 위험 (70% 미만)</div>
          <div className="sd-stat-val red">{stats.danger}</div>
        </div>
        <div className="sd-stat-card">
          <div className="sd-stat-label">비자 만료 임박 (D-30)</div>
          <div className="sd-stat-val amber">{stats.visaAlert}</div>
        </div>
      </div>

      {/* 필터 카드 — GET /api/v1/search/dept 쿼리파람 */}
      <div className="sd-filter-card">
        <div className="sd-filter-title">
          <svg width="13" height="13" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24" style={{display:'inline',marginRight:6,verticalAlign:'middle'}}>
            <path d="M3 4h18M7 8h10M11 12h4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          다중 필터
        </div>
        <div className="sd-filter-row">
          {/* 학과 — GET /api/v1/depts */}
          <div className="sd-filter-group">
            <span className="sd-filter-label">학과 *</span>
            <select className="sd-select" value={filters.deptId} onChange={e => setFilter('deptId', e.target.value)}>
              {DUMMY_DEPTS.map(d => (
                <option key={d.deptId} value={d.deptId}>{d.deptName}</option>
              ))}
            </select>
          </div>
          {/* 국적 */}
          <div className="sd-filter-group">
            <span className="sd-filter-label">국적</span>
            <select className="sd-select" value={filters.nationality} onChange={e => setFilter('nationality', e.target.value)}>
              <option value="">전체</option>
              {[...new Set(DUMMY_STUDENTS.map(s => s.nationality))].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {/* 성별 */}
          <div className="sd-filter-group">
            <span className="sd-filter-label">성별</span>
            <select className="sd-select" value={filters.gender} onChange={e => setFilter('gender', e.target.value)}>
              <option value="">전체</option>
              <option value="남">남</option>
              <option value="여">여</option>
            </select>
          </div>
          {/* 학년 */}
          <div className="sd-filter-group">
            <span className="sd-filter-label">학년</span>
            <select className="sd-select" value={filters.grade} onChange={e => setFilter('grade', e.target.value)}>
              <option value="">전체</option>
              {[1,2,3,4].map(g => <option key={g} value={g}>{g}학년</option>)}
            </select>
          </div>
          {/* 반 */}
          <div className="sd-filter-group">
            <span className="sd-filter-label">반</span>
            <select className="sd-select" value={filters.classSec} onChange={e => setFilter('classSec', e.target.value)}>
              <option value="">전체</option>
              {['A','B','C','D'].map(c => <option key={c} value={c}>{c}반</option>)}
            </select>
          </div>
          {/* 비자 */}
          <div className="sd-filter-group">
            <span className="sd-filter-label">비자 종류</span>
            <select className="sd-select" value={filters.visaType} onChange={e => setFilter('visaType', e.target.value)}>
              <option value="">전체</option>
              <option value="D-2">D-2</option>
              <option value="D-4">D-4</option>
            </select>
          </div>
          {/* 재적 상태 */}
          <div className="sd-filter-group">
            <span className="sd-filter-label">재적 상태</span>
            <select className="sd-select" value={filters.enrollStatus} onChange={e => setFilter('enrollStatus', e.target.value)}>
              <option value="">전체</option>
              <option value="재학">재학</option>
              <option value="휴학">휴학</option>
              <option value="제적">제적</option>
            </select>
          </div>
          {/* 초기화 */}
          <div className="sd-filter-group" style={{justifyContent:'flex-end'}}>
            <button className="sd-btn sd-btn-secondary" onClick={() => setFilters({ deptId:'CS01', nationality:'', gender:'', grade:'', classSec:'', visaType:'', enrollStatus:'' })}>
              초기화
            </button>
          </div>
        </div>
      </div>

      {/* 테이블 카드 */}
      <div className="sd-table-card">
        <div className="sd-table-header">
          <div className="sd-table-title">
            {currentDept?.deptName} 학생 현황
            <span className="sd-chip sd-chip-blue">{students.length}명</span>
            {stats.danger > 0 && <span className="sd-chip sd-chip-red">⚠ 위험 {stats.danger}명</span>}
          </div>
          <div className="sd-table-actions">
            {selected.size > 0 && (
              <>
                <button className="sd-btn sd-btn-green" onClick={handleExcel}>
                  선택 엑셀 ({selected.size})
                </button>
                <button className="sd-btn sd-btn-danger" onClick={() => setShowNotifyModal(true)}>
                  선택 알림 ({selected.size})
                </button>
              </>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="sd-loading">데이터 로딩 중...</div>
        ) : students.length === 0 ? (
          <div className="sd-empty">조건에 맞는 학생이 없습니다.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="sd-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input type="checkbox" className="sd-checkbox"
                      checked={selected.size === students.length && students.length > 0}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>학생</th>
                  <th>국적 / 성별</th>
                  <th>학년 / 반</th>
                  <th>재적 상태</th>
                  <th>비자</th>
                  <th>비자 만료</th>
                  <th>출석률</th>
                  <th>마일리지</th>
                  <th>학사 경고</th>
                  <th>GPA</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const isDanger = s.attendance < 70;
                  const attendStyle = getAttendStyle(s.attendance);
                  const visaChip = getVisaChip(s.visaExpire);

                  return (
                    <tr key={s.studentId} className={isDanger ? 'danger-row' : ''}>
                      <td>
                        <input type="checkbox" className="sd-checkbox"
                          checked={selected.has(s.studentId)}
                          onChange={() => toggleOne(s.studentId)}
                        />
                      </td>
                      <td>
                        <div className="sd-student-name">{s.korName}</div>
                        <div className="sd-student-id">{s.studentId}</div>
                      </td>
                      <td>{s.nationality} / {s.gender}</td>
                      <td>{s.grade}학년 {s.classSec}반</td>
                      <td>
                        <span className={`sd-chip ${getEnrollChip(s.enrollStatus)}`}>{s.enrollStatus}</span>
                      </td>
                      <td>
                        <span className="sd-chip sd-chip-blue">{s.visaType}</span>
                      </td>
                      <td>
                        <span className={`sd-chip ${visaChip.cls}`}>{visaChip.label}</span>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: 2 }}>{s.visaExpire}</div>
                      </td>
                      <td>
                        <div className="sd-attend-bar">
                          <div className="sd-attend-track">
                            <div className="sd-attend-fill" style={{ width: `${s.attendance}%`, background: attendStyle.color }} />
                          </div>
                          <span style={{ fontSize: '12.5px', fontWeight: 600, color: attendStyle.color }}>
                            {s.attendance}%
                            {isDanger && ' ⚠'}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.mileage.toLocaleString()} P</td>
                      <td>
                        {s.academicWarning > 0
                          ? <span className={`sd-chip ${s.academicWarning >= 3 ? 'sd-chip-red' : 'sd-chip-amber'}`}>{s.academicWarning}회</span>
                          : <span className="sd-chip sd-chip-gray">없음</span>
                        }
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.gpa}</td>
                      <td>
                        <button
                          className="sd-btn sd-btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '11.5px' }}
                          onClick={() => navigate(`/students/${s.studentId}`)}
                        >
                          상세보기
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 알림 전송 모달 — POST /api/v1/notifications */}
      {showNotifyModal && (
        <div className="sd-modal-overlay" onClick={() => setShowNotifyModal(false)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <div className="sd-modal-title">
              📢 일괄 알림 전송
              <span className="sd-chip sd-chip-blue" style={{ marginLeft: 8 }}>
                {selected.size > 0 ? `${selected.size}명 선택` : `전체 ${students.length}명`}
              </span>
            </div>
            <div style={{ fontSize: '12.5px', color: '#6B7280', marginBottom: 12 }}>
              대상: {selected.size > 0
                ? [...selected].map(id => students.find(s => s.studentId === id)?.korName).join(', ')
                : `${currentDept?.deptName} 전체 학생`}
            </div>
            <textarea
              className="sd-textarea"
              placeholder="전송할 공지 내용을 입력하세요..."
              value={notifyMsg}
              onChange={e => setNotifyMsg(e.target.value)}
            />
            <div className="sd-modal-footer">
              <button className="sd-btn sd-btn-secondary" onClick={() => setShowNotifyModal(false)}>취소</button>
              <button className="sd-btn sd-btn-primary" disabled={!notifyMsg.trim()} onClick={handleNotify}>
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}