import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopBar from '../../../components/layout/TopBar.jsx';

// ── API 헬퍼 ──────────────────────────────────────────────
const API_BASE = '/api/v1';

async function apiFetch(path) {
  const token = localStorage.getItem('accessToken');
  const res = await axios.get(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data?.data ?? res.data;
}

function toArray(val) {
  if (Array.isArray(val)) return val;
  if (val?.content && Array.isArray(val.content)) return val.content;
  if (val?.list    && Array.isArray(val.list))    return val.list;
  return [];
}

// ── CSS ───────────────────────────────────────────────────
const CSS = `
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  .at-wrap { padding: 4px 22px 24px; } /* 👈 이 부분을 수정했습니다 */
  .stat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:1rem; margin-bottom:1.5rem; }
  .stat-card { padding:1.25rem; background:#fff; border-radius:12px; border:1px solid #E2E8F0; }
  .stat-lbl  { font-size:.8125rem; color:#64748B; font-weight:600; margin-bottom:.5rem; }
  .stat-val  { font-size:1.75rem; font-weight:700; color:#1E293B; display:flex; align-items:baseline; gap:2px; }
  .stat-val .unit { font-size:.875rem; font-weight:500; color:#94A3B8; margin-left:2px; }
  .stat-sub  { font-size:.6875rem; color:#94A3B8; margin-top:4px; font-weight:500; }

  .data-card  { background:#fff; border-radius:14px; border:1px solid #E2E8F0; overflow:hidden; }
  .card-hd    { display:flex; align-items:center; justify-content:space-between; padding:1.25rem; border-bottom:1px solid #F1F5F9; flex-wrap:wrap; gap:.75rem; }
  .form-select { padding:6px 32px 6px 12px; font-size:.875rem; border:1px solid #E2E8F0; border-radius:6px; color:#334155; background:#fff; font-weight:600; cursor:pointer; }
  .form-select:focus { border-color:#3B82F6; outline:none; }

  .cac { background:#fff; border-radius:1rem; border:1px solid #E2E8F0; margin-bottom:1rem; overflow:hidden; transition:box-shadow .2s; }
  .cac:hover { box-shadow:0 6px 20px -4px rgba(0,0,0,.04); }
  .cac.is-danger  { border-left:4px solid #EF4444; }
  .cac.is-warning { border-left:4px solid #F59E0B; }
  .cac-hd { padding:1.25rem; display:flex; justify-content:space-between; align-items:flex-start; gap:.5rem; border-bottom:1px solid #F8FAFC; }
  .cac-bd { padding:1.25rem; }

  .week-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(36px,1fr)); gap:6px; margin-bottom:1.25rem; }
  .wc { height:36px; border-radius:8px; display:inline-flex; align-items:center; justify-content:center; font-size:.8125rem; font-weight:700; user-select:none; }
  .wc-present  { background:#DCFCE7; color:#16A34A; }
  .wc-absent   { background:#FEE2E2; color:#DC2626; }
  .wc-late     { background:#FEF3C7; color:#D97706; }
  .wc-official { background:#E0F2FE; color:#0284C7; }
  .wc-future   { background:#F1F5F9; color:#94A3B8; border:1px dashed #CBD5E1; }

  .pill { display:inline-flex; align-items:center; padding:4px 10px; font-size:.75rem; font-weight:600; border-radius:6px; line-height:1; }
  .pill-green { background:#ECFDF5; color:#059669; }
  .pill-amber { background:#FFFBEB; color:#D97706; }
  .pill-red   { background:#FEF2F2; color:#DC2626; }
  .pill-gray  { background:#F1F5F9; color:#475569; }

  .err-banner { padding:1rem; background:#FEF2F2; border:1px solid #FECACA; border-radius:12px; color:#DC2626; display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; font-size:.875rem; }
`;

// ── 하위 컴포넌트 ──────────────────────────────────────────
function Skeleton({ h = '1rem', w = '100%' }) {
  return <div style={{ height:h, width:w, background:'#E2E8F0', borderRadius:'6px', animation:'pulse 1.5s infinite', marginTop:'2px' }} />;
}

function ErrBanner({ msg, onRetry }) {
  return (
    <div className="err-banner">
      <span>⚠️ {msg}</span>
      {onRetry && <button onClick={onRetry} style={{ background:'none', border:'none', color:'#DC2626', fontWeight:700, cursor:'pointer', textDecoration:'underline' }}>다시 시도</button>}
    </div>
  );
}

const STATUS_MAP = {
  1: { label:'출', cls:'wc-present',   full:'출석' },
  2: { label:'결', cls:'wc-absent',    full:'결석' },
  3: { label:'지', cls:'wc-late',      full:'지각' },
  4: { label:'공', cls:'wc-official', full:'공결' },
};

function WeekCell({ week, status, isFuture }) {
  if (isFuture) {
    return <div className="wc wc-future" title={`${week}주차 (미진행)`}><span style={{ fontSize:'.6875rem', color:'#94A3B8' }}>{week}</span></div>;
  }
  const s = STATUS_MAP[status] ?? STATUS_MAP[1];
  return <div className={`wc ${s.cls}`} title={`${week}주차 ${s.full}`}>{s.label}</div>;
}

function AttendProgress({ total, absent, late, dangerCount, warningCount }) {
  const present = total - absent - late;
  const pPct = total ? Math.round((present / total) * 100) : 0;
  const aPct = total ? Math.round((absent  / total) * 100) : 0;
  const lPct = total ? Math.round((late    / total) * 100) : 0;
  const isDanger  = absent >= dangerCount;
  const isWarning = !isDanger && absent >= warningCount;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'.5rem', marginTop:'.25rem' }}>
      <div style={{ display:'flex', height:'8px', borderRadius:'4px', overflow:'hidden', background:'#F1F5F9' }}>
        <div style={{ width:`${pPct}%`, background:'#22C55E', transition:'width .7s' }} />
        <div style={{ width:`${lPct}%`, background:'#F59E0B', transition:'width .7s' }} />
        <div style={{ width:`${aPct}%`, background:'#EF4444', transition:'width .7s' }} />
      </div>
      <div style={{ display:'flex', gap:'.75rem', fontSize:'.75rem', color:'#64748B', flexWrap:'wrap', alignItems:'center' }}>
        <span>✅ 출석 {present}회</span>
        <span>⚠️ 지각 {late}회</span>
        <span>❌ 결석 {absent}회</span>
        <span style={{ marginLeft:'auto' }}>
          {isDanger  ? <span className="pill pill-red">위험 — F학점 위기</span>
          : isWarning ? <span className="pill pill-amber">주의</span>
          : <span className="pill pill-green">정상</span>}
        </span>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ───────────────────────────────────────────
export default function MyAttendance() {
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [studentId,    setStudentId]    = useState(null);
  const [semesters,    setSemesters]    = useState([]);
  const [selSem,       setSelSem]       = useState('');
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [enrollments,  setEnrollments]  = useState([]);
  const [attendMap,    setAttendMap]    = useState({});
  
  const [dangerCount]  = useState(4);
  const [warningCount] = useState(2);
  const [totalWeeks,   setTotalWeeks]   = useState(15);

  async function init() {
    setLoading(true);
    setError(null);
    try {
      const me = await apiFetch('/auth/me');
      const sid = me?.userId ?? me?.studentId ?? (typeof me === 'string' || typeof me === 'number' ? String(me) : null);
      if (!sid) throw new Error('사용자 식별 번호(학번)를 찾을 수 없습니다.');
      setStudentId(sid);

      let fetchedSemesters = [];
      try {
        const semData = await apiFetch('/semesters');
        fetchedSemesters = toArray(semData).sort((a, b) => b.semesterId - a.semesterId);
        setSemesters(fetchedSemesters);
      } catch (e) {
        console.warn('학기 목록을 불러오지 못했습니다.', e);
      }

      const enrollData = await apiFetch(`/students/${sid}/enrollments`);
      const list = toArray(enrollData);
      setAllEnrollments(list);

      if (fetchedSemesters.length > 0) {
        setSelSem(String(fetchedSemesters[0].semesterId));
      } else if (list.length > 0) {
        const fallbackSemId = list[0].semesterId ?? list[0].semester?.semesterId;
        if (fallbackSemId) setSelSem(String(fallbackSemId));
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || '데이터를 불러오지 못했습니다.');
      setLoading(false);
    }
  }

  useEffect(() => { init(); }, []);

  useEffect(() => {
    if (!selSem && allEnrollments.length === 0) return;

    const curSemObj = semesters.find(s => String(s.semesterId) === selSem);
    setTotalWeeks(curSemObj?.totalWeeks ?? 15);

    const currentList = selSem 
      ? allEnrollments.filter(e => String(e.semesterId ?? e.semester?.semesterId) === selSem)
      : allEnrollments;
      
    setEnrollments(currentList);

    if (currentList.length === 0) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.allSettled(
          currentList.map(e => apiFetch(`/enrollments/${e.enrollId}/attendances`))
        );
        
        const map = {};
        currentList.forEach((e, i) => {
          map[e.enrollId] = results[i].status === 'fulfilled' ? toArray(results[i].value) : [];
        });
        setAttendMap(map);
      } catch {
        setError('출결 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, [selSem, allEnrollments, semesters]);

  const dangerCourses  = enrollments.filter(e => (attendMap[e.enrollId] ?? []).filter(a => a.status === 2).length >= dangerCount).length;
  const warningCourses = enrollments.filter(e => {
    const absent = (attendMap[e.enrollId] ?? []).filter(a => a.status === 2).length;
    return absent >= warningCount && absent < dangerCount;
  }).length;

  const LEGEND = [
    { cls:'wc-present',  label:'출석' },
    { cls:'wc-late',     label:'지각' },
    { cls:'wc-absent',   label:'결석' },
    { cls:'wc-official', label:'공결' },
    { cls:'wc-future',   label:'미진행' },
  ];

  return (
    <>
      <style>{CSS}</style>
      <TopBar title="출결 현황" />
      <div className="at-wrap">
        {error && <ErrBanner msg={error} onRetry={init} />}

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-lbl">수강 과목 수</div>
            <div className="stat-val">{loading ? <Skeleton h="2rem" w="40px"/> : enrollments.length}<span className="unit">개</span></div>
          </div>
          <div className="stat-card" style={{ borderLeft:'4px solid #EF4444' }}>
            <div className="stat-lbl" style={{ color:'#DC2626' }}>F학점 위기 과목</div>
            <div className="stat-val" style={{ color:'#B91C1C' }}>{loading ? <Skeleton h="2rem" w="40px"/> : dangerCourses}<span className="unit">개</span></div>
            <div className="stat-sub">결석 {dangerCount}회 이상</div>
          </div>
          <div className="stat-card" style={{ borderLeft:'4px solid #F59E0B' }}>
            <div className="stat-lbl" style={{ color:'#D97706' }}>주의 필요 과목</div>
            <div className="stat-val" style={{ color:'#B45309' }}>{loading ? <Skeleton h="2rem" w="40px"/> : warningCourses}<span className="unit">개</span></div>
            <div className="stat-sub">결석 {warningCount}회 이상</div>
          </div>
        </div>

        <div className="data-card" style={{ marginBottom:'1.25rem' }}>
          <div className="card-hd">
            <div>
              {semesters.length > 0 ? (
                <select className="form-select" value={selSem} onChange={e => setSelSem(e.target.value)}>
                  {semesters.map(s => (
                    <option key={s.semesterId} value={s.semesterId}>
                      {s.semesterName ?? `${s.year}-${s.term}`}
                    </option>
                  ))}
                </select>
              ) : (
                <span style={{ fontSize:'.875rem', color:'#64748B', fontWeight:600 }}>전체 학기</span>
              )}
            </div>
            <div style={{ display:'flex', gap:'.875rem', alignItems:'center', flexWrap:'wrap' }}>
              {LEGEND.map(({ cls, label }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'.75rem', color:'#64748B', fontWeight:600 }}>
                  <div className={`wc ${cls}`} style={{ width:'22px', height:'22px', fontSize:'.6875rem', borderRadius:'6px' }}>
                    {cls !== 'wc-future' ? label.charAt(0) : ''}
                  </div>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="cac">
              <div className="cac-hd"><Skeleton w="240px" h="1.5rem" /></div>
              <div className="cac-bd"><Skeleton h="4.5rem" /></div>
            </div>
          ))
        ) : enrollments.length === 0 ? (
          <div className="data-card">
            <div style={{ padding:'3rem 1.5rem', textAlign:'center', color:'#94A3B8', fontSize:'.875rem' }}>
              <div style={{ fontSize:'1.75rem', marginBottom:'.5rem' }}>📂</div>
              수강 및 출결 기록이 없습니다.
            </div>
          </div>
        ) : (
          enrollments.map(e => {
            const att     = attendMap[e.enrollId] ?? [];
            const absent  = att.filter(a => a.status === 2).length;
            const late    = att.filter(a => a.status === 3).length;
            const official= att.filter(a => a.status === 4).length;
            const present = att.filter(a => a.status === 1).length;
            const isDanger  = absent >= dangerCount;
            const isWarning = !isDanger && absent >= warningCount;

            const weekMap     = Object.fromEntries(att.map(a => [a.week, a.status]));
            const currentWeek = att.length > 0 ? Math.max(...att.map(a => a.week ?? 0)) : 0;

            return (
              <div key={e.enrollId} className={`cac${isDanger ? ' is-danger' : isWarning ? ' is-warning' : ''}`}>
                <div className="cac-hd">
                  <div>
                    <div style={{ fontWeight:700, color:'#1E293B', fontSize:'1rem' }}>{e.courseName}</div>
                    <div style={{ fontSize:'.75rem', color:'#94A3B8', marginTop:'4px', fontWeight:500 }}>
                      {e.courseCode ?? ''}{e.professorName ? ` · ${e.professorName}` : ''}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'.375rem' }}>
                    {isDanger  ? <span className="pill pill-red">⚠️ F학점 경고</span>
                    : isWarning ? <span className="pill pill-amber">주의 요망</span>
                    : <span className="pill pill-green">안전</span>}
                    <span style={{ fontSize:'.6875rem', color:'#94A3B8', fontWeight:600 }}>
                      출석 {present} · 지각 {late} · 결석 {absent} · 공결 {official}
                    </span>
                  </div>
                </div>

                <div className="cac-bd">
                  <div className="week-grid">
                    {[...Array(totalWeeks)].map((_, idx) => {
                      const week = idx + 1;
                      return <WeekCell key={week} week={week} status={weekMap[week]} isFuture={week > currentWeek} />;
                    })}
                  </div>
                  <AttendProgress
                    total={att.length} absent={absent} late={late}
                    dangerCount={dangerCount} warningCount={warningCount}
                  />
                  {isDanger && (
                    <div style={{ marginTop:'1rem', padding:'.875rem 1rem', background:'#FEF2F2', borderRadius:'.625rem', border:'1px solid #FECACA', fontSize:'.8125rem', color:'#DC2626', fontWeight:700, lineHeight:1.6, display:'flex', gap:'6px' }}>
                      <span>🚨</span>
                      <span>결석 횟수가 기준치({dangerCount}회)를 초과했습니다. 담당 교수님 또는 학사 행정실에 문의하세요.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}