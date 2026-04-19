// src/pages/admin/OnlineViolation.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../../../api/axios';

/* ────────────────────────────────────────────────
   상수 / 유틸
──────────────────────────────────────────────── */
const getRiskLevel = (ratio) => {
  const pct = ratio * 100;
  if (pct < 20) return { level: 'safe',      label: 'Safe',      color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', barColor: '#22C55E' };
  if (pct < 30) return { level: 'warning',   label: 'Warning',   color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', barColor: '#F59E0B' };
  return         { level: 'violation', label: 'Violation', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', barColor: '#EF4444' };
};

const fmtPct = (ratio) => (ratio * 100).toFixed(1) + '%';

/* 확인서 프린트 */
const printCert = (student, enrollments, semester) => {
  const onlineCourses = (enrollments || []).filter(e => e.isOnline);
  const totalCredits  = (enrollments || []).reduce((s, e) => s + (e.credits || 0), 0);
  const onlineCredits = onlineCourses.reduce((s, e) => s + (e.credits || 0), 0);
  const ratio         = totalCredits > 0 ? onlineCredits / totalCredits : 0;
  const html = `
    <html><head><meta charset="utf-8"/>
    <style>
      body{font-family:'Malgun Gothic',sans-serif;padding:60px;color:#111;font-size:14px;}
      h1{font-size:22px;text-align:center;margin-bottom:4px;letter-spacing:1px;}
      .sub{text-align:center;color:#555;font-size:13px;margin-bottom:40px;}
      table{width:100%;border-collapse:collapse;margin-bottom:24px;}
      th,td{padding:10px 14px;border:1px solid #ddd;font-size:13px;}
      th{background:#f5f5f5;font-weight:700;}
      .ratio{font-size:18px;font-weight:700;color:${ratio>0.3?'#DC2626':ratio>0.2?'#D97706':'#16A34A'};}
      .footer{margin-top:60px;text-align:right;color:#555;font-size:13px;}
      .seal{display:inline-block;border:2px solid #1A3A5C;padding:6px 20px;border-radius:4px;color:#1A3A5C;font-weight:700;margin-top:8px;}
    </style></head><body>
    <h1>온라인 수업 수강 확인서</h1>
    <div class="sub">경민대학교 국제교육원 · Certificate of Online Course Enrollment</div>
    <table>
      <tr><th>학번</th><td>${student.studentId}</td><th>성명</th><td>${student.korName || ''} (${student.engName || ''})</td></tr>
      <tr><th>학과</th><td>${student.deptName || ''}</td><th>학기</th><td>${semester || ''}</td></tr>
      <tr><th>전체 수강 학점</th><td>${totalCredits}학점</td><th>온라인 수강 학점</th><td>${onlineCredits}학점</td></tr>
      <tr><th colspan="2">온라인 수업 비율</th><td colspan="2" class="ratio">${fmtPct(ratio)} ${ratio > 0.3 ? '⚠ 30% 초과' : '(기준 충족)'}</td></tr>
    </table>
    <table>
      <tr><th>#</th><th>과목코드</th><th>과목명</th><th>학점</th><th>구분</th></tr>
      ${(enrollments||[]).map((e,i)=>`<tr><td>${i+1}</td><td>${e.courseId||''}</td><td>${e.courseName||''}</td><td>${e.credits||0}</td><td>${e.isOnline?'<b>온라인</b>':'오프라인'}</td></tr>`).join('')}
    </table>
    <div class="footer">
      발급일: ${new Date().toLocaleDateString('ko-KR')}<br/>
      <span class="seal">경민대학교 국제교육원장 (인)</span>
    </div>
    </body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
};

/* ────────────────────────────────────────────────
   컴포넌트
──────────────────────────────────────────────── */
export default function OnlineViolation() {
  const [loading, setLoading]         = useState(true);
  const [depts, setDepts]             = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [semester, setSemester]       = useState(null);
  const [students, setStudents]       = useState([]);   // 전체 위반/경고 학생
  const [filterLevel, setFilterLevel] = useState('all'); // all | violation | warning | safe
  const [sortBy, setSortBy]           = useState('ratio_desc');
  const [searchQ, setSearchQ]         = useState('');
  const [detail, setDetail]           = useState(null);  // {student, enrollments}
  const [detailLoading, setDL]        = useState(false);
  const detailRef = useRef(null);

  /* 학기 + 학과 목록 */
  useEffect(() => {
    Promise.all([
      api.get('/api/v1/semesters/current'),
      api.get('/api/v1/depts'),
    ]).then(([semRes, deptRes]) => {
      if (semRes.data.success)  setSemester(semRes.data.data);
      if (deptRes.data.success) setDepts(deptRes.data.data);
    }).catch(console.error);
  }, []);

  /* 위반 목록 로드 */
  const loadList = async (deptId = '') => {
    setLoading(true);
    try {
      const params = deptId ? { deptId } : {};
      const [violRes, allRes] = await Promise.all([
        api.get('/api/v1/academic/online-violations', { params }),
        api.get('/api/v1/search/online-violations',   { params }),
      ]);
      // 둘 중 성공한 응답 사용 (명세 두 곳에 존재)
      const raw = violRes.data.success ? violRes.data.data
                : allRes.data.success  ? allRes.data.data : [];
      setStudents(raw);
    } catch (e) {
      console.error(e);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadList(selectedDept); }, [selectedDept]);

  /* 학생 상세 (수강 내역) */
  const openDetail = async (student) => {
    setDetail({ student, enrollments: null });
    setDL(true);
    try {
      const r = await api.get(`/api/v1/students/${student.studentId}/enrollments`, {
        params: { semesterId: semester?.semesterId },
      });
      if (r.data.success) {
        setDetail({ student, enrollments: r.data.data });
      }
    } catch (e) { console.error(e); }
    finally { setDL(false); setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }
  };

  /* 필터 + 정렬 */
  const displayed = students
    .filter(s => {
      if (filterLevel !== 'all' && getRiskLevel(s.onlineRatio).level !== filterLevel) return false;
      if (searchQ) {
        const q = searchQ.toLowerCase();
        return (s.korName||'').includes(q) || (s.engName||'').toLowerCase().includes(q) || (s.studentId||'').includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'ratio_desc') return b.onlineRatio - a.onlineRatio;
      if (sortBy === 'ratio_asc')  return a.onlineRatio - b.onlineRatio;
      if (sortBy === 'name')       return (a.korName||'').localeCompare(b.korName||'');
      return 0;
    });

  const counts = {
    violation: students.filter(s => getRiskLevel(s.onlineRatio).level === 'violation').length,
    warning:   students.filter(s => getRiskLevel(s.onlineRatio).level === 'warning').length,
    safe:      students.filter(s => getRiskLevel(s.onlineRatio).level === 'safe').length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        .ov-wrap { padding: 20px 24px; background: #F0F2F7; min-height: calc(100vh - 56px); font-family: 'DM Sans','Noto Sans KR',sans-serif; font-size: 14px; color: #111827; box-sizing: border-box; }

        /* ── 상단 알림 배너 ── */
        .ov-banner { background: linear-gradient(135deg, #7F1D1D, #DC2626); border-radius: 14px; padding: 18px 24px; color: #fff; display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
        .ov-banner-icon { width: 40px; height: 40px; background: rgba(255,255,255,0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ov-banner-title { font-size: 15px; font-weight: 700; margin-bottom: 3px; }
        .ov-banner-sub { font-size: 12px; color: rgba(255,255,255,0.7); }
        .ov-banner-right { margin-left: auto; text-align: right; }
        .ov-banner-sem { font-size: 13px; font-weight: 600; background: rgba(255,255,255,0.15); padding: 6px 14px; border-radius: 20px; }

        /* ── 요약 카드 4개 ── */
        .ov-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
        .ov-sum-card { background: #fff; border-radius: 12px; border: 1px solid #F3F4F6; padding: 18px 20px; cursor: pointer; transition: all 0.15s; }
        .ov-sum-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.06); }
        .ov-sum-card.active { border-color: currentColor; box-shadow: 0 0 0 2px currentColor; }
        .ov-sum-label { font-size: 12px; color: #6B7280; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
        .ov-sum-dot { width: 8px; height: 8px; border-radius: 50%; }
        .ov-sum-val { font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 1; margin-bottom: 4px; }
        .ov-sum-sub { font-size: 11px; color: #9CA3AF; }

        /* ── 툴바 ── */
        .ov-toolbar { background: #fff; border-radius: 12px; border: 1px solid #F3F4F6; padding: 12px 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .ov-search-wrap { display: flex; align-items: center; gap: 8px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 7px 12px; flex: 1; min-width: 180px; }
        .ov-search-input { border: none; outline: none; background: transparent; font-size: 13px; font-family: inherit; color: #111827; width: 100%; }
        .ov-search-input::placeholder { color: #D1D5DB; }
        .ov-select { font-size: 12.5px; padding: 7px 10px; border-radius: 8px; border: 1px solid #E5E7EB; background: #fff; color: #374151; font-family: inherit; cursor: pointer; outline: none; }
        .ov-sort-label { font-size: 12px; color: #9CA3AF; white-space: nowrap; }
        .ov-refresh-btn { display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; padding: 7px 14px; border-radius: 8px; border: 1.5px solid #E5E7EB; background: #fff; color: #6B7280; cursor: pointer; font-family: inherit; transition: all 0.15s; margin-left: auto; }
        .ov-refresh-btn:hover { border-color: #3B82F6; color: #1D4ED8; }

        /* ── 메인 리스트 ── */
        .ov-card { background: #fff; border-radius: 14px; border: 1px solid #F3F4F6; overflow: hidden; margin-bottom: 16px; }
        .ov-card-header { padding: 14px 18px; border-bottom: 1px solid #F3F4F6; display: flex; align-items: center; justify-content: space-between; }
        .ov-card-title { font-size: 13.5px; font-weight: 700; }
        .ov-count-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; background: #F3F4F6; color: #6B7280; }

        /* 학생 행 */
        .ov-row { padding: 16px 18px; border-bottom: 1px solid #F9FAFB; display: flex; align-items: center; gap: 16px; cursor: pointer; transition: background 0.1s; }
        .ov-row:last-child { border-bottom: none; }
        .ov-row:hover { background: #FAFAFA; }
        .ov-row.selected { background: #EFF6FF; }
        .ov-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
        .ov-info { min-width: 0; width: 160px; flex-shrink: 0; }
        .ov-name { font-size: 13px; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ov-meta { font-size: 11px; color: #9CA3AF; margin-top: 2px; }

        /* 진행률 바 영역 */
        .ov-bar-area { flex: 1; min-width: 0; }
        .ov-bar-labels { display: flex; justify-content: space-between; font-size: 11px; color: #9CA3AF; margin-bottom: 5px; }
        .ov-bar-pct { font-weight: 700; font-size: 13px; }
        .ov-bar-bg { position: relative; height: 14px; background: #F3F4F6; border-radius: 7px; overflow: visible; }
        .ov-bar-fill { height: 100%; border-radius: 7px; transition: width 0.5s cubic-bezier(.4,0,.2,1); position: relative; z-index: 1; }
        /* 30% 데드라인 선 */
        .ov-deadline { position: absolute; top: -4px; bottom: -4px; left: 30%; width: 2px; background: #EF4444; z-index: 2; border-radius: 1px; }
        .ov-deadline::after { content: '30%'; position: absolute; top: -18px; left: 50%; transform: translateX(-50%); font-size: 9px; font-weight: 700; color: #EF4444; white-space: nowrap; font-family: 'DM Sans',sans-serif; }
        .ov-bar-bg-wrap { position: relative; padding: 4px 0; }

        .ov-credits { text-align: center; width: 80px; flex-shrink: 0; }
        .ov-credit-main { font-size: 14px; font-weight: 700; }
        .ov-credit-sub { font-size: 11px; color: #9CA3AF; margin-top: 2px; }
        .ov-risk-badge { width: 72px; text-align: center; flex-shrink: 0; }
        .ov-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px; }

        .ov-actions { display: flex; gap: 6px; flex-shrink: 0; }
        .ov-action-btn { font-size: 11.5px; font-weight: 600; padding: 6px 12px; border-radius: 8px; border: 1.5px solid; cursor: pointer; font-family: inherit; transition: all 0.15s; background: #fff; white-space: nowrap; }
        .ov-action-btn:hover { opacity: 0.8; }

        /* 로딩 */
        .ov-loading { text-align: center; padding: 60px; color: #9CA3AF; font-size: 13px; }
        .ov-empty { text-align: center; padding: 60px; color: #D1D5DB; font-size: 13px; }

        /* ── 상세 패널 ── */
        .ov-detail { background: #fff; border-radius: 14px; border: 1px solid #F3F4F6; overflow: hidden; margin-bottom: 16px; }
        .ov-detail-header { padding: 16px 20px; border-bottom: 1px solid #F3F4F6; display: flex; align-items: center; justify-content: space-between; background: #FAFAFA; }
        .ov-detail-title { font-size: 14px; font-weight: 700; }
        .ov-detail-close { width: 28px; height: 28px; border-radius: 8px; border: 1px solid #E5E7EB; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #6B7280; }

        /* 수강 테이블 */
        .ov-enroll-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .ov-enroll-table th { padding: 10px 16px; background: #F9FAFB; font-size: 11px; font-weight: 600; color: #9CA3AF; text-align: left; border-bottom: 1px solid #F3F4F6; }
        .ov-enroll-table td { padding: 12px 16px; border-bottom: 1px solid #F9FAFB; }
        .ov-enroll-table tr:last-child td { border-bottom: none; }
        .ov-online-tag { font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: #FEF2F2; color: #DC2626; }
        .ov-offline-tag { font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: #F0FDF4; color: #16A34A; }

        /* 상세 요약 바 */
        .ov-detail-summary { padding: 16px 20px; border-bottom: 1px solid #F3F4F6; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .ov-detail-stat { text-align: center; }
        .ov-detail-stat-val { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .ov-detail-stat-lbl { font-size: 11px; color: #9CA3AF; margin-top: 2px; }
        .ov-detail-bar-area { flex: 1; min-width: 200px; }
        .ov-detail-bar-lbl { display: flex; justify-content: space-between; font-size: 12px; color: #6B7280; margin-bottom: 6px; font-weight: 600; }
        .ov-detail-bar-bg { position: relative; height: 20px; background: #F3F4F6; border-radius: 10px; overflow: visible; }
        .ov-detail-bar-fill { height: 100%; border-radius: 10px; transition: width 0.5s; position: relative; z-index: 1; }
        .ov-detail-deadline { position: absolute; top: -6px; bottom: -6px; left: 30%; width: 2.5px; background: #EF4444; z-index: 2; border-radius: 2px; }
        .ov-detail-deadline::after { content: '30% 한도'; position: absolute; top: -22px; left: 50%; transform: translateX(-50%); font-size: 10px; font-weight: 700; color: #EF4444; white-space: nowrap; font-family: 'DM Sans',sans-serif; }
        .ov-detail-bar-wrap { position: relative; padding: 6px 0; }
        .ov-print-btn { display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; padding: 8px 16px; border-radius: 10px; border: 1.5px solid #1D4ED8; color: #1D4ED8; background: #EFF6FF; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .ov-print-btn:hover { background: #DBEAFE; }
      `}</style>

      <div className="ov-wrap">

        {/* ── 알림 배너 ── */}
        <div className="ov-banner">
          <div className="ov-banner-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="#fff">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
          </div>
          <div>
            <div className="ov-banner-title">법무부 외국인 유학생 온라인 수업 비율 관리</div>
            <div className="ov-banner-sub">순수 온라인 강의 30% 초과 시 비자 연장 거부 사유 발생 · 즉시 수강 변경 지도 필요</div>
          </div>
          <div className="ov-banner-right">
            <div className="ov-banner-sem">
              {semester ? `${semester.year}학년도 ${semester.term}학기` : '학기 로드 중...'}
            </div>
          </div>
        </div>

        {/* ── 요약 카드 ── */}
        <div className="ov-summary">
          {[
            { key: 'all',       label: '전체 모니터링', val: students.length,    dot: '#3B82F6', valColor: '#111827' },
            { key: 'violation', label: 'Violation (30%+)', val: counts.violation, dot: '#EF4444', valColor: '#DC2626' },
            { key: 'warning',   label: 'Warning (20~30%)', val: counts.warning,  dot: '#F59E0B', valColor: '#D97706' },
            { key: 'safe',      label: 'Safe (20% 미만)',   val: counts.safe,    dot: '#22C55E', valColor: '#16A34A' },
          ].map(item => (
            <div
              key={item.key}
              className={`ov-sum-card ${filterLevel === item.key ? 'active' : ''}`}
              style={{ color: item.valColor }}
              onClick={() => setFilterLevel(item.key)}
            >
              <div className="ov-sum-label">
                <div className="ov-sum-dot" style={{ background: item.dot }}/>
                {item.label}
              </div>
              <div className="ov-sum-val" style={{ color: item.valColor }}>{item.val}</div>
              <div className="ov-sum-sub">명</div>
            </div>
          ))}
        </div>

        {/* ── 툴바 ── */}
        <div className="ov-toolbar">
          <div className="ov-search-wrap">
            <svg width="13" height="13" viewBox="0 0 20 20" fill="#9CA3AF">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input className="ov-search-input" placeholder="학번, 이름 검색" value={searchQ} onChange={e => setSearchQ(e.target.value)}/>
          </div>

          <select className="ov-select" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
            <option value="">전체 학과</option>
            {depts.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
          </select>

          <span className="ov-sort-label">정렬</span>
          <select className="ov-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="ratio_desc">비율 높은 순</option>
            <option value="ratio_asc">비율 낮은 순</option>
            <option value="name">이름순</option>
          </select>

          <button className="ov-refresh-btn" onClick={() => loadList(selectedDept)}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
            </svg>
            새로고침
          </button>
        </div>

        {/* ── 학생 목록 ── */}
        <div className="ov-card">
          <div className="ov-card-header">
            <div className="ov-card-title">온라인 수업 비율 현황</div>
            <div className="ov-count-badge">{displayed.length}명</div>
          </div>

          {loading && <div className="ov-loading">데이터 불러오는 중...</div>}

          {!loading && displayed.length === 0 && (
            <div className="ov-empty">해당 조건의 학생이 없습니다.</div>
          )}

          {!loading && displayed.map(s => {
            const risk    = getRiskLevel(s.onlineRatio);
            const pct     = s.onlineRatio * 100;
            const isSelected = detail?.student?.studentId === s.studentId;

            return (
              <div
                key={s.studentId}
                className={`ov-row ${isSelected ? 'selected' : ''}`}
                onClick={() => openDetail(s)}
              >
                {/* 아바타 */}
                <div className="ov-avatar" style={{ background: risk.bg, color: risk.color }}>
                  {(s.korName || s.engName || '?')[0]}
                </div>

                {/* 이름 + 학번 */}
                <div className="ov-info">
                  <div className="ov-name">{s.korName || s.engName}</div>
                  <div className="ov-meta">{s.studentId} · {s.deptName || ''}</div>
                </div>

                {/* 진행률 바 */}
                <div className="ov-bar-area">
                  <div className="ov-bar-labels">
                    <span>온라인 비율</span>
                    <span className="ov-bar-pct" style={{ color: risk.color }}>{fmtPct(s.onlineRatio)}</span>
                  </div>
                  <div className="ov-bar-bg-wrap">
                    <div className="ov-bar-bg">
                      {/* 30% 데드라인 선 */}
                      <div className="ov-deadline"/>
                      <div
                        className="ov-bar-fill"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: risk.barColor,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 학점 */}
                <div className="ov-credits">
                  <div className="ov-credit-main" style={{ color: risk.color }}>
                    {s.onlineCredits ?? Math.round(s.onlineRatio * (s.totalCredits || 18))}
                    <span style={{ fontSize: 11, fontWeight: 400, color: '#9CA3AF' }}>학점</span>
                  </div>
                  <div className="ov-credit-sub">/ {s.totalCredits || '-'}학점</div>
                </div>

                {/* 위험도 뱃지 */}
                <div className="ov-risk-badge">
                  <span className="ov-badge" style={{ background: risk.bg, color: risk.color, border: `1px solid ${risk.border}` }}>
                    {risk.label}
                  </span>
                </div>

                {/* 액션 버튼 */}
                <div className="ov-actions" onClick={e => e.stopPropagation()}>
                  <button
                    className="ov-action-btn"
                    style={{ borderColor: '#3B82F6', color: '#1D4ED8' }}
                    onClick={() => openDetail(s)}
                  >상세</button>
                  {risk.level === 'violation' && (
                    <button
                      className="ov-action-btn"
                      style={{ borderColor: '#EF4444', color: '#DC2626' }}
                      onClick={() => openDetail(s)}
                    >확인서</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 상세 패널 ── */}
        {detail && (
          <div className="ov-detail" ref={detailRef}>
            <div className="ov-detail-header">
              <div className="ov-detail-title">
                {detail.student.korName || detail.student.engName} · 수강 내역 상세
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {!detailLoading && detail.enrollments && (
                  <button
                    className="ov-print-btn"
                    onClick={() => printCert(detail.student, detail.enrollments, semester ? `${semester.year}학년도 ${semester.term}학기` : '')}
                  >
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9v-1h8v1H6zm8-4a1 1 0 110 2 1 1 0 010-2z" clipRule="evenodd"/>
                    </svg>
                    온라인 수업 수강 확인서 출력
                  </button>
                )}
                <button className="ov-detail-close" onClick={() => setDetail(null)}>✕</button>
              </div>
            </div>

            {detailLoading && <div className="ov-loading">수강 내역 불러오는 중...</div>}

            {!detailLoading && detail.enrollments && (() => {
              const enrollments   = detail.enrollments;
              const totalCredits  = enrollments.reduce((s, e) => s + (e.credits || 0), 0);
              const onlineCredits = enrollments.filter(e => e.isOnline).reduce((s, e) => s + (e.credits || 0), 0);
              const ratio         = totalCredits > 0 ? onlineCredits / totalCredits : 0;
              const risk          = getRiskLevel(ratio);

              return (
                <>
                  {/* 요약 바 */}
                  <div className="ov-detail-summary">
                    <div className="ov-detail-stat">
                      <div className="ov-detail-stat-val">{totalCredits}</div>
                      <div className="ov-detail-stat-lbl">전체 수강 학점</div>
                    </div>
                    <div className="ov-detail-stat">
                      <div className="ov-detail-stat-val" style={{ color: risk.color }}>{onlineCredits}</div>
                      <div className="ov-detail-stat-lbl">온라인 학점</div>
                    </div>
                    <div className="ov-detail-stat">
                      <div className="ov-detail-stat-val" style={{ color: risk.color }}>{fmtPct(ratio)}</div>
                      <div className="ov-detail-stat-lbl">온라인 비율</div>
                    </div>
                    <div className="ov-detail-bar-area">
                      <div className="ov-detail-bar-lbl">
                        <span>온라인 비율</span>
                        <span style={{ color: risk.color }}>{fmtPct(ratio)}</span>
                      </div>
                      <div className="ov-detail-bar-wrap">
                        <div className="ov-detail-bar-bg">
                          <div className="ov-detail-deadline"/>
                          <div className="ov-detail-bar-fill" style={{ width: `${Math.min(ratio * 100, 100)}%`, background: risk.barColor }}/>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="ov-badge" style={{ background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`, fontSize: 13, padding: '6px 14px' }}>
                        {risk.label}
                      </span>
                    </div>
                  </div>

                  {/* 수강 테이블 */}
                  <table className="ov-enroll-table">
                    <thead>
                      <tr>
                        <th>과목코드</th>
                        <th>과목명</th>
                        <th>학점</th>
                        <th>구분</th>
                        <th>성적</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map(e => (
                        <tr key={e.enrollId} style={{ background: e.isOnline ? '#FFFBEB' : 'transparent' }}>
                          <td style={{ fontSize: 12, color: '#9CA3AF' }}>{e.courseId}</td>
                          <td style={{ fontWeight: e.isOnline ? 600 : 400 }}>{e.courseName}</td>
                          <td style={{ textAlign: 'center' }}>{e.credits}학점</td>
                          <td>
                            {e.isOnline
                              ? <span className="ov-online-tag">🌐 온라인</span>
                              : <span className="ov-offline-tag">오프라인</span>
                            }
                          </td>
                          <td style={{ textAlign: 'center', color: '#6B7280', fontSize: 12 }}>
                            {e.grade || '-'}
                          </td>
                        </tr>
                      ))}
                      {/* 합계 행 */}
                      <tr style={{ background: '#F9FAFB' }}>
                        <td colSpan={2} style={{ fontWeight: 700, fontSize: 13 }}>합계</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{totalCredits}학점</td>
                        <td style={{ fontWeight: 700, color: risk.color }}>
                          온라인 {onlineCredits}학점 ({fmtPct(ratio)})
                        </td>
                        <td/>
                      </tr>
                    </tbody>
                  </table>
                </>
              );
            })()}
          </div>
        )}

      </div>
    </>
  );
}
