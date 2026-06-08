/**
 * MyEnroll.jsx
 * 학기별 수강 과목 + 취득 성적(GPA) 조회
 */
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
  // 백엔드 응답 구조 보정 (data.data 또는 data)
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
  .en-wrap { padding: 4px 4px 24px; }
  .stat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:1rem; margin-bottom:1.25rem; }
  .stat-card { padding:1.25rem; background:#fff; border-radius:12px; border:1px solid #E2E8F0; }
  .stat-lbl  { font-size:.8125rem; color:#64748B; font-weight:600; margin-bottom:.5rem; }
  .stat-val  { font-size:1.75rem; font-weight:700; color:#1E293B; display:flex; align-items:baseline; gap:2px; }
  .stat-val .unit { font-size:.875rem; font-weight:500; color:#94A3B8; margin-left:2px; }
  .stat-sub  { font-size:.6875rem; color:#94A3B8; margin-top:4px; font-weight:500; }

  .data-card  { background:#fff; border-radius:14px; border:1px solid #E2E8F0; overflow:hidden; margin-top:1.25rem; }
  .card-hd    { display:flex; align-items:center; justify-content:space-between; padding:1.25rem; border-bottom:1px solid #F1F5F9; flex-wrap:wrap; gap:.75rem; }
  .card-hd-title { font-size:1rem; font-weight:700; color:#1E293B; }
  .form-select { padding:6px 32px 6px 12px; font-size:.875rem; border:1px solid #E2E8F0; border-radius:6px; color:#334155; background:#fff; font-weight:600; cursor:pointer; }
  .form-select:focus { border-color:#3B82F6; outline:none; }

  .tbl-wrap { overflow-x:auto; width:100%; }
  .base-tbl { width:100%; border-collapse:collapse; text-align:left; font-size:.875rem; }
  .base-tbl th { padding:.875rem 1.25rem; background:#F8FAFC; color:#64748B; font-weight:600; border-bottom:1px solid #E2E8F0; font-size:.8125rem; }
  .base-tbl td { padding:1rem 1.25rem; border-bottom:1px solid #F1F5F9; color:#334155; vertical-align:middle; }
  .base-tbl tbody tr:last-child td { border-bottom:none; }
  .base-tbl tbody tr:hover { background:#FAFBFC; }

  .pill { display:inline-flex; align-items:center; padding:4px 10px; font-size:.75rem; font-weight:600; border-radius:6px; line-height:1; }
  .pill-green  { background:#ECFDF5; color:#059669; }
  .pill-blue   { background:#EFF6FF; color:#1D4ED8; }
  .pill-violet { background:#F5F3FF; color:#7C3AED; }
  .pill-amber  { background:#FFFBEB; color:#D97706; }
  .pill-red    { background:#FEF2F2; color:#DC2626; }
  .pill-gray   { background:#F1F5F9; color:#475569; }

  .prog-track { flex:1; height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden; min-width:60px; }
  .prog-fill  { height:100%; border-radius:3px; transition:width .4s cubic-bezier(.4,0,.2,1); }

  .err-banner { padding:1rem; background:#FEF2F2; border:1px solid #FECACA; border-radius:12px; color:#DC2626; display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; font-size:.875rem; }
`;

// ── 하위 컴포넌트 ──────────────────────────────────────────
function Skeleton({ h = '1rem', w = '100%' }) {
  return <div style={{ height:h, width:w, background:'#E2E8F0', borderRadius:'6px', animation:'pulse 1.5s infinite', marginTop:'4px' }} />;
}

function ErrBanner({ msg, onRetry }) {
  return (
    <div className="err-banner">
      <span>⚠️ {msg}</span>
      {onRetry && <button onClick={onRetry} style={{ background:'none', border:'none', color:'#DC2626', fontWeight:700, cursor:'pointer', textDecoration:'underline' }}>다시 시도</button>}
    </div>
  );
}

// ── 유틸 ──────────────────────────────────────────────────
const GPA_MAP   = { 'A+':4.5,'A':4.0,'B+':3.5,'B':3.0,'C+':2.5,'C':2.0,'D+':1.5,'D':1.0,'F':0 };
const GRADE_PILL = { 'A+':'pill-green','A':'pill-green','B+':'pill-blue','B':'pill-blue','C+':'pill-gray','C':'pill-gray','D+':'pill-amber','D':'pill-amber','F':'pill-red' };
const TYPE_LABEL = { ONLINE:'온라인', OFFLINE:'오프라인', BLENDED:'혼합' };
const TYPE_PILL  = { ONLINE:'pill-violet', OFFLINE:'pill-green', BLENDED:'pill-blue' };

function gpaToNum(grade) { return GPA_MAP[grade] ?? null; }

function GpaBar({ gpa, max = 4.5 }) {
  const pct   = Math.min(100, (gpa / max) * 100);
  const color = gpa >= 3.5 ? '#22C55E' : gpa >= 2.5 ? '#3B82F6' : gpa >= 1.5 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'.75rem', justifyContent:'flex-end' }}>
      <div className="prog-track">
        <div className="prog-fill" style={{ width:`${pct}%`, background:color }} />
      </div>
      <span style={{ fontWeight:700, fontSize:'.875rem', color, minWidth:'2.25rem', textAlign:'right' }}>
        {gpa.toFixed(2)}
      </span>
    </div>
  );
}

// ── 메인 컴포넌트 ───────────────────────────────────────────
export default function MyEnroll() {
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [studentId,   setStudentId]   = useState(null);
  const [semesters,   setSemesters]   = useState([]);
  const [selSem,      setSelSem]      = useState('');
  const [enrollments, setEnrollments] = useState([]);

  // 초기: 내 ID + 학기 목록
  async function init() {
    setLoading(true);
    setError(null);
    try {
      const me = await apiFetch('/auth/me');
      
      // ★ 대시보드/프로필과 동일한 견고한 식별자(학번) 추출 로직
      const sid = me?.userId ?? me?.studentId ?? (typeof me === 'string' || typeof me === 'number' ? String(me) : null);
      
      if (!sid) {
        throw new Error('사용자 식별 번호(학번)를 찾을 수 없습니다.');
      }
      setStudentId(sid);

      // 학생 role은 /semesters, /semesters/current 403 에러가 뜰 수 있으므로
      // Promise.allSettled를 통해 에러 발생 시 빈 배열로 조용히 넘어가도록 방어
      const [semRes, curRes] = await Promise.allSettled([
        apiFetch('/semesters'),
        apiFetch('/semesters/current'),
      ]);

      const semList = semRes.status === 'fulfilled' ? toArray(semRes.value) : [];
      const sorted  = [...semList].sort((a, b) => b.semesterId - a.semesterId);
      setSemesters(sorted);

      let defaultId = sorted[0]?.semesterId ?? '';
      if (curRes.status === 'fulfilled' && curRes.value?.semesterId) {
        defaultId = curRes.value.semesterId;
      }
      setSelSem(String(defaultId));
    } catch (err) {
      console.error(err);
      setError(err.message || '데이터를 불러오지 못했습니다.');
      setLoading(false);
    }
  }

  useEffect(() => { init(); }, []);

  // 학기 변경 시 혹은 studentId가 확보되었을 때 수강 목록 갱신
  useEffect(() => {
    if (!studentId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // selSem(선택 학기)가 없으면 전체 수강 내역을 가져오거나 현재 기준으로 백엔드가 처리하도록 구성
        const query = selSem ? `?semesterId=${selSem}` : '';
        const data  = await apiFetch(`/students/${studentId}/enrollments${query}`);
        setEnrollments(toArray(data));
      } catch (err) {
        console.error("Enrollments fetch error:", err);
        setError('수강 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId, selSem]);

  // 파생 통계 연산
  const gradedList    = enrollments.filter(e => e.grade);
  const totalCredits  = enrollments.reduce((s, e) => s + (e.credits ?? 0), 0);
  const onlineCredits = enrollments.filter(e => e.onlineType === 'ONLINE').reduce((s, e) => s + (e.credits ?? 0), 0);
  const semGpa = gradedList.length > 0
    ? gradedList.reduce((sum, e) => {
        const n = gpaToNum(e.grade);
        return n !== null ? sum + n * (e.credits ?? 1) : sum;
      }, 0) / gradedList.reduce((s, e) => s + (e.credits ?? 1), 0)
    : null;

  return (
    <>
      <style>{CSS}</style>
      <TopBar title="수강 내역" />
      <div className="en-wrap">
        {error && <ErrBanner msg={error} onRetry={init} />}

        {/* 요약 카드 */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-lbl">수강 과목</div>
            <div className="stat-val">{loading ? <Skeleton h="2rem" w="50px"/> : enrollments.length}<span className="unit">개</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-lbl">총 학점</div>
            <div className="stat-val">{loading ? <Skeleton h="2rem" w="50px"/> : totalCredits}<span className="unit">학점</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-lbl">학기 GPA</div>
            {loading
              ? <Skeleton h="2rem" w="80px"/>
              : semGpa !== null
                ? <div className="stat-val">{semGpa.toFixed(2)}<span className="unit">/ 4.5</span></div>
                : <div style={{ fontSize:'.875rem', color:'#94A3B8', marginTop:'.5rem', fontWeight:600 }}>성적 미입력</div>
            }
          </div>
          <div className="stat-card">
            <div className="stat-lbl">온라인 학점</div>
            <div className="stat-val">{loading ? <Skeleton h="2rem" w="50px"/> : onlineCredits}<span className="unit">학점</span></div>
            {!loading && totalCredits > 0 && (
              <div className="stat-sub">전체의 {Math.round((onlineCredits / totalCredits) * 100)}%</div>
            )}
          </div>
        </div>

        {/* 수강 목록 테이블 */}
        <div className="data-card">
          <div className="card-hd">
            <div className="card-hd-title">수강 목록</div>
            {semesters.length > 0 ? (
              <select className="form-select" value={selSem} onChange={e => setSelSem(e.target.value)}>
                {semesters.map(s => (
                  <option key={s.semesterId} value={s.semesterId}>
                    {s.semesterName ?? `${s.year}년 ${s.term}`}
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ fontSize:'.875rem', color:'#64748B', fontWeight:600 }}>현재 학기</span>
            )}
          </div>

          {loading ? (
            <div style={{ padding:'1rem 1.5rem', display:'flex', flexDirection:'column', gap:'.75rem' }}>
              {[...Array(4)].map((_, i) => <Skeleton key={i} h="2.75rem" />)}
            </div>
          ) : enrollments.length === 0 ? (
            <div style={{ padding:'3rem 1.5rem', textAlign:'center', color:'#94A3B8', fontSize:'.875rem' }}>
              <div style={{ fontSize:'1.75rem', marginBottom:'.5rem' }}>📂</div>
              해당 학기 수강 정보가 없습니다.
            </div>
          ) : (
            <div className="tbl-wrap">
              <table className="base-tbl">
                <thead>
                  <tr>
                    <th>과목명</th>
                    <th>과목 코드</th>
                    <th style={{ textAlign:'center' }}>학점</th>
                    <th style={{ textAlign:'center' }}>수업 유형</th>
                    <th style={{ textAlign:'center' }}>성적</th>
                    <th style={{ textAlign:'right', paddingRight:'2.5rem' }}>GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e, i) => {
                    const gpaNum = e.grade ? gpaToNum(e.grade) : null;
                    return (
                      <tr key={e.enrollId ?? i}>
                        <td style={{ fontWeight:700, color:'#1E293B' }}>{e.courseName}</td>
                        <td style={{ color:'#94A3B8', fontFamily:'monospace', letterSpacing:'-.02em' }}>{e.courseCode ?? '—'}</td>
                        <td style={{ textAlign:'center', fontWeight:600 }}>{e.credits ?? '—'}</td>
                        <td style={{ textAlign:'center' }}>
                          <span className={`pill ${TYPE_PILL[e.onlineType] ?? 'pill-gray'}`}>
                            {TYPE_LABEL[e.onlineType] ?? e.onlineType ?? '—'}
                          </span>
                        </td>
                        <td style={{ textAlign:'center' }}>
                          {e.grade
                            ? <span className={`pill ${GRADE_PILL[e.grade] ?? 'pill-gray'}`} style={{ minWidth:'24px', justifyContent:'center' }}>{e.grade}</span>
                            : <span style={{ color:'#CBD5E1', fontSize:'.75rem', fontWeight:500 }}>미입력</span>
                          }
                        </td>
                        <td style={{ textAlign:'right', paddingRight:'1rem', minWidth:'8rem' }}>
                          {gpaNum !== null ? <GpaBar gpa={gpaNum} /> : <span style={{ color:'#CBD5E1', fontSize:'.75rem' }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && semGpa !== null && (
            <div style={{ padding:'1rem 1.5rem', background:'#F8FAFC', borderTop:'1px solid #E2E8F0', display:'flex', justifyContent:'flex-end', alignItems:'center', gap:'1rem' }}>
              <span style={{ fontSize:'.8125rem', color:'#64748B', fontWeight:700 }}>학기 평균 GPA</span>
              <div style={{ width:'150px' }}>
                <GpaBar gpa={semGpa} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}