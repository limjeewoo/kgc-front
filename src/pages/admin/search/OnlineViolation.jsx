import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const getRiskLevel = (ratio) => {
  const pct = (ratio || 0) * 100;
  if (pct < 20) return { level: 'safe',      label: '정상',   color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' };
  if (pct < 30) return { level: 'warning',   label: '주의',   color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' };
  return         { level: 'violation', label: '초과',   color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' };
};

const fmtPct = (ratio) => ((ratio || 0) * 100).toFixed(1) + '%';

const printCert = (student, enrollments, semesterName) => {
  const onlineCredits = (enrollments || []).filter(e => e.onlineType === 'ONLINE').reduce((sum, e) => sum + (e.credits || 0), 0);
  const totalCredits  = (enrollments || []).reduce((s, e) => s + (e.credits || 0), 0);
  const ratio = totalCredits > 0 ? onlineCredits / totalCredits : 0;

  const html = `<html><head><meta charset="utf-8"/>
    <style>
      body{font-family:'Malgun Gothic',sans-serif;padding:60px;color:#111;font-size:14px;line-height:1.6;}
      h1{font-size:24px;text-align:center;margin-bottom:10px;letter-spacing:1px;}
      .sub{text-align:center;color:#666;font-size:14px;margin-bottom:50px;border-bottom:2px solid #1A3A5C;padding-bottom:10px;}
      table{width:100%;border-collapse:collapse;margin-bottom:30px;}
      th,td{padding:12px 15px;border:1px solid #aaa;font-size:13px;text-align:left;}
      th{background:#f8f9fa;font-weight:700;width:20%;}
      .ratio{font-size:18px;font-weight:700;color:${ratio >= 0.3 ? '#DC2626' : '#16A34A'};}
      .footer{margin-top:80px;text-align:center;}
      .date{text-align:right;margin-bottom:20px;color:#555;}
      .seal-text{font-size:20px;font-weight:800;color:#1A3A5C;letter-spacing:2px;}
      .notice{margin-top:40px;font-size:12px;color:#777;border:1px dashed #ccc;padding:10px;}
    </style></head><body>
    <h1>온라인 수업 수강 확인서</h1>
    <div class="sub">경민대학교 국제교육원 · Certificate of Online Course Enrollment</div>
    <h3>1. 학생 인적사항</h3>
    <table>
      <tr><th>학번</th><td>${student.studentId||''}</td><th>성명</th><td>${student.korName||''} (${student.engName||''})</td></tr>
      <tr><th>학과</th><td>${student.deptName||''}</td><th>해당학기</th><td>${semesterName}</td></tr>
    </table>
    <h3>2. 수강 및 온라인 비율 현황</h3>
    <table>
      <tr><th>총 수강학점</th><td>${totalCredits}학점</td><th>온라인 수강학점</th><td>${onlineCredits}학점</td></tr>
      <tr><th>온라인 비율</th><td colspan="3" class="ratio">${fmtPct(ratio)} ${ratio>=0.3?' (기준 30% 초과 - 관리대상)':' (정상)'}</td></tr>
    </table>
    <div class="notice">※ 본 확인서는 법무부 유학생 관리 지침(온라인 수업 30% 이내 제한)에 따른 수강 현황을 증명함.</div>
    <div class="footer">
      <div class="date">${new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'})}</div>
      <div class="seal-text">경민대학교 국제교육원장</div>
    </div></body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
};

export default function OnlineViolation() {
  const [loading, setLoading]           = useState(true);
  const [depts, setDepts]               = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [semester, setSemester]         = useState(null);
  const [students, setStudents]         = useState([]);
  const [filterLevel, setFilterLevel]   = useState('all');
  const [sortBy, setSortBy]             = useState('ratio_desc');
  const [searchQ, setSearchQ]           = useState('');
  const [detail, setDetail]             = useState(null);
  const [detailLoading, setDL]          = useState(false);
  const detailRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [semRes, deptRes] = await Promise.all([
          api.get('/api/v1/semesters/current'),
          api.get('/api/v1/depts'),
        ]);
        if (semRes.data.success) setSemester(semRes.data.data);
        if (deptRes.data.success) setDepts(deptRes.data.data || []);
      } catch (err) { console.error('초기 데이터 로드 실패', err); }
    };
    init();
  }, []);

  const loadList = async (deptId = '') => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/search/online-violations', {
        params: { deptId: deptId || undefined },
      });
      if (res.data.success) setStudents(Array.isArray(res.data.data) ? res.data.data : []);
      else setStudents([]);
    } catch (e) { console.error('목록 조회 실패', e); setStudents([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadList(selectedDept); }, [selectedDept]);

  const openDetail = async (student) => {
    if (detail?.student?.studentId === student.studentId) { setDetail(null); return; }
    setDetail({ student, enrollments: null });
    setDL(true);
    try {
      const r = await api.get(`/api/v1/students/${student.studentId}/enrollments`, {
        params: { semesterId: semester?.semesterId },
      });
      if (r.data.success) setDetail({ student, enrollments: r.data.data });
    } catch (e) { console.error('상세 내역 조회 실패', e); }
    finally {
      setDL(false);
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior:'smooth', block:'nearest' }), 100);
    }
  };

  const displayed = students
    .filter(s => {
      const level = getRiskLevel(s.onlineRatio).level;
      if (filterLevel !== 'all' && level !== filterLevel) return false;
      if (searchQ) {
        const q = searchQ.toLowerCase();
        return (s.korName||'').includes(q) || (s.engName||'').toLowerCase().includes(q) || (s.studentId||'').includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'ratio_desc') return (b.onlineRatio||0) - (a.onlineRatio||0);
      if (sortBy === 'ratio_asc')  return (a.onlineRatio||0) - (b.onlineRatio||0);
      if (sortBy === 'name')       return (a.korName||'').localeCompare(b.korName||'');
      return 0;
    });

  const counts = {
    violation: students.filter(s => (s.onlineRatio||0) >= 0.3).length,
    warning:   students.filter(s => (s.onlineRatio||0) >= 0.2 && (s.onlineRatio||0) < 0.3).length,
    safe:      students.filter(s => (s.onlineRatio||0) < 0.2).length,
  };

  return (
    <div style={{ fontFamily:"'DM Sans','Noto Sans KR',sans-serif", fontSize:'14px', color:'#111827' }}>
      <style>{`
        .ov-topbar { background:#fff; padding:0 24px; height:54px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #E5E7EB; margin-bottom:20px; border-radius:12px 12px 0 0; }
        .ov-topbar-left { display:flex; align-items:center; gap:10px; }
        .ov-topbar-right { display:flex; align-items:center; gap:8px; }
        .ov-breadcrumb { font-size:13px; color:#9CA3AF; }
        .ov-breadcrumb span { color:#111827; font-weight:600; }
        .ov-btn { padding:7px 14px; border-radius:8px; font-size:12.5px; font-weight:500; cursor:pointer; font-family:inherit; display:flex; align-items:center; gap:5px; transition:all 0.15s; border:none; }
        .ov-btn-secondary { background:#F9FAFB; border:1px solid #E5E7EB !important; color:#374151; }
        .ov-btn-secondary:hover { background:#F3F4F6; }
        .ov-btn-primary { background:#1A3A5C; color:#fff; }
        .ov-btn-primary:hover { background:#153150; }
        .ov-semester-badge { background:#EFF6FF; color:#1D4ED8; font-size:12px; font-weight:600; padding:5px 12px; border-radius:20px; white-space:nowrap; }

        /* 통계 배너 */
        .ov-stat-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:16px; }
        .ov-stat-card { background:#fff; border-radius:12px; border:1.5px solid #F3F4F6; padding:14px 18px; cursor:pointer; transition:all 0.15s; }
        .ov-stat-card:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,0.07); }
        .ov-stat-card.active { border-color:#3B82F6; box-shadow:0 0 0 3px rgba(59,130,246,0.12); }
        .ov-stat-label { font-size:11px; color:#9CA3AF; margin-bottom:5px; }
        .ov-stat-val { font-size:24px; font-weight:700; letter-spacing:-0.5px; margin-bottom:2px; }
        .ov-stat-sub { font-size:11px; color:#9CA3AF; }

        /* 필터 */
        .ov-filter-card { background:#fff; border-radius:12px; border:1px solid #F3F4F6; padding:14px 18px; margin-bottom:16px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .ov-search { flex:1; min-width:180px; padding:7px 12px; border:1px solid #E5E7EB; border-radius:8px; font-size:12.5px; outline:none; font-family:inherit; }
        .ov-search:focus { border-color:#3B82F6; }
        .ov-select { padding:7px 10px; border-radius:8px; border:1px solid #E5E7EB; font-size:12.5px; cursor:pointer; outline:none; font-family:inherit; }

        /* 테이블 카드 */
        .ov-table-card { background:#fff; border-radius:12px; border:1px solid #F3F4F6; overflow:hidden; margin-bottom:16px; }
        .ov-table-head { padding:14px 18px; border-bottom:1px solid #F3F4F6; display:flex; align-items:center; justify-content:space-between; }
        .ov-table-title { font-size:13px; font-weight:700; color:#111827; display:flex; align-items:center; gap:8px; }
        .ov-table-title::before { content:''; display:inline-block; width:3px; height:14px; background:#3B82F6; border-radius:2px; }

        /* 테이블 */
        .ov-table-wrap { overflow-x:auto; }
        .ov-table { width:100%; border-collapse:collapse; min-width:860px; }
        .ov-table th { padding:10px 14px; font-size:11.5px; font-weight:600; color:#9CA3AF; text-align:left; border-bottom:1px solid #F3F4F6; background:#FAFAFA; white-space:nowrap; }
        .ov-table th.center { text-align:center; }
        .ov-table td { padding:12px 14px; font-size:12.5px; border-bottom:1px solid #F9FAFB; vertical-align:middle; color:#374151; white-space:nowrap; }
        .ov-table td.center { text-align:center; }
        .ov-table tr:last-child td { border-bottom:none; }
        .ov-table tr:hover td { background:#F8FAFC; cursor:pointer; }
        .ov-table tr.selected td { background:#EFF6FF; }

        /* 셀 스타일 */
        .ov-student-id { font-size:11px; font-weight:700; background:#F3F4F6; color:#6B7280; padding:2px 7px; border-radius:5px; font-family:'DM Sans',monospace; }
        .ov-eng-name { font-weight:600; color:#111827; }
        .ov-chip { font-size:11px; font-weight:600; padding:3px 9px; border-radius:20px; display:inline-block; }
        .ov-chip-blue { background:#EFF6FF; color:#1D4ED8; }
        .ov-chip-red  { background:#FEF2F2; color:#DC2626; }

        /* 비율 바 (인라인 미니) */
        .ov-mini-bar-wrap { display:flex; align-items:center; gap:8px; }
        .ov-mini-bar-bg { width:80px; height:6px; background:#F3F4F6; border-radius:99px; position:relative; flex-shrink:0; }
        .ov-mini-bar-fill { height:100%; border-radius:99px; }
        .ov-mini-bar-limit { position:absolute; left:30%; top:0; bottom:0; width:1.5px; background:#EF4444; border-radius:1px; }
        .ov-pct-text { font-size:12px; font-weight:700; min-width:38px; }

        /* 충족 여부 */
        .ov-ok   { display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:600; color:#16A34A; background:#F0FDF4; padding:4px 10px; border-radius:20px; border:1px solid #BBF7D0; }
        .ov-fail { display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:600; color:#DC2626; background:#FEF2F2; padding:4px 10px; border-radius:20px; border:1px solid #FECACA; }

        /* 상세 패널 */
        .ov-detail-panel { background:#fff; border-radius:12px; border:1px solid #F3F4F6; overflow:hidden; margin-bottom:40px; animation:ov-slide 0.25s ease; }
        @keyframes ov-slide { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .ov-detail-head { padding:16px 20px; border-bottom:1px solid #F3F4F6; display:flex; align-items:center; justify-content:space-between; }
        .ov-detail-title { font-size:14px; font-weight:700; color:#111827; }
        .ov-detail-sub   { font-size:12px; color:#9CA3AF; margin-top:2px; }
        .ov-enroll-table { width:100%; border-collapse:collapse; }
        .ov-enroll-table th { padding:11px 16px; font-size:12px; font-weight:600; color:#6B7280; text-align:left; border-bottom:1px solid #E5E7EB; background:#F9FAFB; white-space:nowrap; }
        .ov-enroll-table td { padding:13px 16px; font-size:13px; color:#374151; border-bottom:1px solid #F3F4F6; vertical-align:middle; }
        .ov-enroll-table tr:last-child td { border-bottom:none; }
        .ov-enroll-table tr:hover td { background:#F8FAFC; }

        .ov-empty { padding:48px; text-align:center; color:#9CA3AF; font-size:13px; }
      `}</style>

      {/* ── 탑바 ── */}
      <div className="ov-topbar">
        <div className="ov-topbar-left">
          <div className="ov-breadcrumb">학사 › <span>온라인 30% 초과 확인</span></div>
        </div>
        <div className="ov-topbar-right">
          {semester && (
            <span className="ov-semester-badge">{semester.year}학년도 {semester.term}학기</span>
          )}
          <button className="ov-btn ov-btn-secondary" onClick={() => loadList(selectedDept)}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            새로고침
          </button>
        </div>
      </div>

      {/* ── 통계 배너 ── */}
      <div className="ov-stat-row">
        {[
          { key:'all',       label:'전체 학생',        count:students.length,  color:'#3B82F6', sub:'조회 대상' },
          { key:'violation', label:'기준 초과 (30%+)', count:counts.violation, color:'#EF4444', sub:'즉시 조치 필요' },
          { key:'warning',   label:'주의 (20~30%)',    count:counts.warning,   color:'#D97706', sub:'모니터링 필요' },
          { key:'safe',      label:'안전 (20% 미만)',  count:counts.safe,      color:'#16A34A', sub:'정상 범위' },
        ].map(c => (
          <div key={c.key} className={`ov-stat-card ${filterLevel===c.key?'active':''}`} onClick={() => setFilterLevel(c.key)}>
            <div className="ov-stat-label">{c.label}</div>
            <div className="ov-stat-val" style={{ color:c.color }}>{c.count}</div>
            <div className="ov-stat-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── 필터 ── */}
      <div className="ov-filter-card">
        <svg width="14" height="14" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24" style={{flexShrink:0}}>
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <input className="ov-search" placeholder="이름 또는 학번으로 검색..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        <select className="ov-select" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
          <option value="">전체 학과</option>
          {depts.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
        </select>
        <select className="ov-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="ratio_desc">비율 높은 순</option>
          <option value="ratio_asc">비율 낮은 순</option>
          <option value="name">이름 순</option>
        </select>
      </div>

      {/* ── 테이블 ── */}
      <div className="ov-table-card">
        <div className="ov-table-head">
          <div className="ov-table-title">
            온라인 수강 비율 현황
            <span className="ov-chip ov-chip-blue">{displayed.length}명</span>
            {counts.violation > 0 && (
              <span className="ov-chip ov-chip-red">⚠ 초과 {counts.violation}명</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="ov-empty">데이터를 불러오는 중입니다...</div>
        ) : displayed.length === 0 ? (
          <div className="ov-empty">조건에 맞는 학생이 없습니다.</div>
        ) : (
          <div className="ov-table-wrap">
            <table className="ov-table">
              <thead>
                <tr>
                  <th>학번</th>
                  <th>영문명</th>
                  <th>학과</th>
                  <th className="center">총이수학점</th>
                  <th className="center">현 신청학점</th>
                  <th className="center">온라인 학점</th>
                  <th className="center">온라인 비율</th>
                  <th className="center">30% 충족 여부</th>
                  <th className="center">상세</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(s => {
                  const risk      = getRiskLevel(s.onlineRatio);
                  const isOk      = (s.onlineRatio || 0) < 0.3;
                  const isSelected = detail?.student?.studentId === s.studentId;
                  return (
                    <tr key={s.studentId} className={isSelected ? 'selected' : ''} onClick={() => openDetail(s)}>
                      <td><span className="ov-student-id">{s.studentId}</span></td>
                      <td>
                        <div className="ov-eng-name">{s.engName || '-'}</div>
                        {s.korName && <div style={{ fontSize:11, color:'#9CA3AF', marginTop:1 }}>{s.korName}</div>}
                      </td>
                      <td style={{ color:'#374151' }}>{s.deptName || '-'}</td>
                      <td className="center">
                        <span style={{ fontWeight:600 }}>{s.totalCredits ?? '-'}</span>
                        {s.totalCredits != null && <span style={{ fontSize:11, color:'#9CA3AF' }}> 학점</span>}
                      </td>
                      <td className="center">
                        <span style={{ fontWeight:600 }}>{s.currentCredits ?? '-'}</span>
                        {s.currentCredits != null && <span style={{ fontSize:11, color:'#9CA3AF' }}> 학점</span>}
                      </td>
                      <td className="center">
                        <span style={{ fontWeight:700, color: s.onlineCredits > 0 ? '#2563EB' : '#9CA3AF' }}>
                          {s.onlineCredits ?? '-'}
                        </span>
                        {s.onlineCredits != null && <span style={{ fontSize:11, color:'#9CA3AF' }}> 학점</span>}
                      </td>
                      <td className="center">
                        <div className="ov-mini-bar-wrap" style={{ justifyContent:'center' }}>
                          <div className="ov-mini-bar-bg">
                            <div className="ov-mini-bar-limit" />
                            <div className="ov-mini-bar-fill" style={{ width:`${Math.min((s.onlineRatio||0)*100,100)}%`, background: risk.barColor || risk.color }} />
                          </div>
                          <span className="ov-pct-text" style={{ color: risk.color }}>{fmtPct(s.onlineRatio)}</span>
                        </div>
                      </td>
                      <td className="center">
                        {isOk
                          ? <span className="ov-ok">✓ 충족</span>
                          : <span className="ov-fail">✕ 초과</span>
                        }
                      </td>
                      <td className="center">
                        <button
                          style={{ padding:'5px 12px', borderRadius:7, background:'#EFF6FF', color:'#2563EB', border:'none', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
                          onClick={e => { e.stopPropagation(); openDetail(s); }}
                        >
                          {isSelected ? '닫기' : '상세'}
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

      {/* ── 상세 패널 ── */}
      {detail && (
        <div className="ov-detail-panel" ref={detailRef}>
          <div className="ov-detail-head">
            <div>
              <div className="ov-detail-title">{detail.student.korName} 학생 수강 상세 내역</div>
              <div className="ov-detail-sub">{semester?.year}년 {semester?.term}학기 기준</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {detail.enrollments && (
                <button className="ov-btn ov-btn-primary" onClick={() => printCert(detail.student, detail.enrollments, `${semester?.year}년 ${semester?.term}학기`)}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  확인서 출력
                </button>
              )}
              <button className="ov-btn ov-btn-secondary" onClick={() => setDetail(null)}>닫기</button>
            </div>
          </div>

          {detailLoading ? (
            <div className="ov-empty">수강 정보를 조회 중입니다...</div>
          ) : !detail.enrollments || detail.enrollments.length === 0 ? (
            <div className="ov-empty">해당 학기에 등록된 수강 내역이 없습니다.</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table className="ov-enroll-table">
                <thead>
                  <tr>
                    <th>과목명</th>
                    <th>학점</th>
                    <th>이수형태</th>
                    <th>성적</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.enrollments.map(e => (
                    <tr key={e.enrollId}>
                      <td style={{ fontWeight:600, color:'#111827' }}>{e.courseName}</td>
                      <td><span className="ov-chip ov-chip-blue">{e.credits}학점</span></td>
                      <td>
                        {e.onlineType === 'ONLINE'   ? <span style={{ fontWeight:600, color:'#2563EB' }}>온라인 수업</span>
                        : e.onlineType === 'BLENDED' ? <span style={{ color:'#7C3AED' }}>온·오프라인 혼합</span>
                        :                              <span style={{ color:'#6B7280' }}>대면 수업</span>}
                      </td>
                      <td style={{ fontWeight:600 }}>{e.grade || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}