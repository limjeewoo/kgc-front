import React, { useState, useEffect } from 'react';
import api from "../../../../api/axios";

// ─── 상수 ───────────────────────────────────────────────
const DEFAULT_MAX_HOURS = 20; // 기본 주 최대 근로시간 (TOPIK 미취득 시)

const STATUS_META = {
  PENDING:  { label: '승인 대기', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  APPROVED: { label: '승인 완료', color: '#059669', bg: '#ECFDF5', border: '#6EE7B7' },
  REJECTED: { label: '반려',     color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit' }) : '–';

// 두 날짜 사이 주당 근무시간 계산 (총 시간 / 주 수)
const calcWeeklyHours = (startDate, endDate, dailyHours, daysPerWeek) => {
  if (!startDate || !dailyHours || !daysPerWeek) return null;
  return dailyHours * daysPerWeek;
};

// ─── 진행 바 컴포넌트 ─────────────────────────────────
function HoursBar({ weekly, max }) {
  const pct   = Math.min((weekly / max) * 100, 100);
  const over  = weekly > max;
  const warn  = weekly >= max * 0.8 && !over;
  const color = over ? '#EF4444' : warn ? '#F59E0B' : '#3B82F6';

  return (
    <div style={{ minWidth: 140 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, alignItems:'center' }}>
        <span style={{ fontSize:11, fontWeight:700, color }}>
          주 {weekly}시간
          {over && <span style={{ marginLeft:5, fontSize:10, background:'#EF4444', color:'#fff', padding:'1px 6px', borderRadius:4 }}>초과</span>}
          {warn && <span style={{ marginLeft:5, fontSize:10, background:'#F59E0B', color:'#fff', padding:'1px 6px', borderRadius:4 }}>주의</span>}
        </span>
        <span style={{ fontSize:10, color:'#94A3B8' }}>/ {max}h</span>
      </div>
      <div style={{ height:6, background:'#F1F5F9', borderRadius:4, overflow:'hidden' }}>
        <div style={{
          height:'100%', width:`${pct}%`, borderRadius:4,
          background: over
            ? 'linear-gradient(90deg,#FCA5A5,#EF4444)'
            : warn
            ? 'linear-gradient(90deg,#FCD34D,#F59E0B)'
            : 'linear-gradient(90deg,#93C5FD,#3B82F6)',
          transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
        }} />
      </div>
      <div style={{ fontSize:10, color:'#CBD5E1', marginTop:2 }}>{pct.toFixed(0)}% 사용</div>
    </div>
  );
}

// ─── 반려 사유 모달 ───────────────────────────────────
function RejectModal({ onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.4)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000
    }}>
      <div style={{ background:'#fff', borderRadius:14, padding:'28px 28px 24px', width:400, boxShadow:'0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ fontWeight:700, fontSize:16, marginBottom:6, color:'#0F172A' }}>반려 사유 입력</div>
        <div style={{ fontSize:13, color:'#94A3B8', marginBottom:16 }}>반려 사유를 학생에게 전달할 내용으로 작성해주세요.</div>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="예: 근로계약서 서명 누락, 허가 시간 초과 등"
          style={{
            width:'100%', minHeight:90, border:'1.5px solid #E5E7EB', borderRadius:8,
            padding:'10px 12px', fontSize:13, resize:'vertical', fontFamily:'inherit',
            outline:'none', color:'#374151', boxSizing:'border-box',
          }}
        />
        <div style={{ display:'flex', gap:8, marginTop:16, justifyContent:'flex-end' }}>
          <button onClick={onCancel} style={{ padding:'8px 18px', border:'1px solid #E5E7EB', borderRadius:8, background:'#fff', color:'#6B7280', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit' }}>취소</button>
          <button
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim()}
            style={{ padding:'8px 18px', border:'none', borderRadius:8, background: reason.trim() ? '#DC2626' : '#F1F5F9', color: reason.trim() ? '#fff' : '#CBD5E1', cursor: reason.trim() ? 'pointer' : 'default', fontSize:13, fontWeight:700, fontFamily:'inherit', transition:'all 0.15s' }}
          >
            반려 처리
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────
export default function JobTab({ studentId, studentName }) {
  const [jobs, setJobs]         = useState([]);
  const [maxHours, setMaxHours] = useState(DEFAULT_MAX_HOURS);
  const [loading, setLoading]   = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // jobId
  const [rejectTarget, setRejectTarget]   = useState(null); // jobId
  const [toast, setToast]       = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── 데이터 로드 ──────────────────────────────────────
  const fetchData = async () => {
    // 변경 포인트 1: studentId가 없으면 로딩을 즉시 끄고 함수를 종료합니다.
    if (!studentId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const [jobsRes, hoursRes] = await Promise.allSettled([
        api.get(`/api/v1/students/${studentId}/jobs`),
        api.get(`/api/v1/topik/work-hours/${studentId}`),
      ]);

      if (jobsRes.status === 'fulfilled' && jobsRes.value.data.success)
        setJobs(jobsRes.value.data.data || []);

      if (hoursRes.status === 'fulfilled' && hoursRes.value.data.success)
        setMaxHours(hoursRes.value.data.data?.maxWeeklyHours || DEFAULT_MAX_HOURS);
    } catch (e) {
      console.error('JobTab 데이터 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [studentId]);

  // ── 승인 ─────────────────────────────────────────────
  const handleApprove = async (jobId) => {
    setActionLoading(jobId);
    try {
      const res = await api.patch(`/api/v1/jobs/${jobId}/approval`, { approved: true });
      if (res.data.success) {
        setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, status: 'APPROVED' } : j));
        showToast('승인 처리되었습니다.');
      }
    } catch (e) {
      showToast(e.response?.data?.message || '승인 처리 실패', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ── 반려 ─────────────────────────────────────────────
  const handleReject = async (reason) => {
    const jobId = rejectTarget;
    setRejectTarget(null);
    setActionLoading(jobId);
    try {
      const res = await api.patch(`/api/v1/jobs/${jobId}/approval`, { approved: false, reason });
      if (res.data.success) {
        setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, status: 'REJECTED', rejectReason: reason } : j));
        showToast('반려 처리되었습니다.');
      }
    } catch (e) {
      showToast(e.response?.data?.message || '반려 처리 실패', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ── 계약서 업로드 ─────────────────────────────────────
  const handleContractUpload = async (jobId, file) => {
    if (!file) return;
    setActionLoading(jobId);
    const form = new FormData();
    form.append('contract', file);
    try {
      const res = await api.patch(`/api/v1/jobs/${jobId}/contract`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, contractUrl: res.data.data?.contractUrl || 'uploaded' } : j));
        showToast('계약서가 업로드되었습니다.');
      }
    } catch (e) {
      showToast(e.response?.data?.message || '업로드 실패', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ── 필터 ─────────────────────────────────────────────
  const filtered = filterStatus === 'ALL' ? jobs : jobs.filter(j => j.status === filterStatus);

  // ── 통계 ─────────────────────────────────────────────
  const approved  = jobs.filter(j => j.status === 'APPROVED');
  const pending   = jobs.filter(j => j.status === 'PENDING');
  const totalWeekly = approved.reduce((sum, j) => sum + (calcWeeklyHours(j.startDate, j.endDate, j.dailyHours, j.daysPerWeek) || 0), 0);
  const isOverall   = totalWeekly > maxHours;

  return (
    <div style={{ fontFamily:"'DM Sans','Noto Sans KR',sans-serif", color:'#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }

        .jt-wrap { animation: fadeUp 0.28s ease; }
        .jt-summary { display:flex; gap:10px; margin-bottom:1.25rem; }
        .jt-sum-card { background:#fff; border:1px solid #F1F5F9; border-radius:10px; padding:14px 18px; flex:1; display:flex; align-items:center; gap:10px; }
        .jt-sum-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .jt-sum-lbl { font-size:12px; color:#64748B; font-weight:500; }
        .jt-sum-val { font-size:18px; font-weight:700; color:#0F172A; margin-left:auto; }
        .jt-sum-unit { font-size:12px; color:#94A3B8; font-weight:400; }

        .jt-banner { border-radius:10px; padding:12px 16px; margin-bottom:1.25rem; display:flex; align-items:center; gap:10px; font-size:13px; font-weight:600; }
        .jt-banner.over { background:#FEF2F2; border:1.5px solid #FECACA; color:#DC2626; }
        .jt-banner.warn { background:#FFFBEB; border:1.5px solid #FDE68A; color:#D97706; }
        .jt-banner.ok   { background:#ECFDF5; border:1.5px solid #6EE7B7; color:#059669; }

        .jt-filters { display:flex; gap:6px; margin-bottom:1rem; }
        .jt-filter-btn { padding:7px 16px; border-radius:8px; border:1.5px solid #E5E7EB; background:#fff; color:#6B7280; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.15s; font-family:inherit; }
        .jt-filter-btn:hover { border-color:#93C5FD; color:#1D4ED8; background:#EFF6FF; }
        .jt-filter-btn.active { background:#1A3A5C; color:#fff; border-color:#1A3A5C; }

        .jt-list { display:flex; flex-direction:column; gap:10px; }
        .jt-card { background:#fff; border:1px solid #F1F5F9; border-radius:12px; padding:18px 20px; transition:all 0.15s; }
        .jt-card:hover { border-color:#E2E8F0; box-shadow:0 4px 16px rgba(0,0,0,0.06); }
        .jt-card.pending { border-left:3px solid #F59E0B; }
        .jt-card.approved { border-left:3px solid #10B981; }
        .jt-card.rejected { border-left:3px solid #EF4444; }

        .jt-card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:14px; }
        .jt-company { font-size:15px; font-weight:700; color:#0F172A; }
        .jt-period { font-size:12px; color:#94A3B8; margin-top:3px; }

        .jt-meta-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:14px; }
        .jt-meta-item { background:#F8FAFC; border-radius:8px; padding:10px 12px; }
        .jt-meta-label { font-size:10px; color:#94A3B8; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px; }
        .jt-meta-val { font-size:13px; font-weight:600; color:#374151; }

        .jt-card-bottom { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }

        .jt-btn { display:inline-flex; align-items:center; gap:5px; border:none; border-radius:7px; font-size:12px; font-weight:700; cursor:pointer; padding:7px 14px; transition:all 0.15s; font-family:inherit; white-space:nowrap; }
        .jt-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .jt-btn-approve { background:#ECFDF5; color:#059669; border:1.5px solid #6EE7B7; }
        .jt-btn-approve:hover:not(:disabled) { background:#D1FAE5; }
        .jt-btn-reject  { background:#FEF2F2; color:#DC2626; border:1.5px solid #FECACA; }
        .jt-btn-reject:hover:not(:disabled)  { background:#FEE2E2; }
        .jt-btn-upload  { background:#EFF6FF; color:#2563EB; border:1.5px solid #BFDBFE; }
        .jt-btn-upload:hover:not(:disabled)  { background:#DBEAFE; }
        .jt-btn-view    { background:#F8FAFC; color:#475569; border:1.5px solid #E2E8F0; }
        .jt-btn-view:hover:not(:disabled)    { background:#F1F5F9; }

        .jt-reject-reason { margin-top:10px; background:#FEF2F2; border:1px solid #FECACA; border-radius:8px; padding:10px 12px; font-size:12px; color:#DC2626; }
        .jt-empty { padding:4rem; text-align:center; background:#fff; border-radius:12px; border:1px solid #F1F5F9; color:#CBD5E1; }
        .jt-empty-icon { font-size:2.5rem; margin-bottom:10px; }
        .jt-empty-txt { font-size:13px; }

        .jt-toast { position:fixed; bottom:24px; right:24px; padding:12px 20px; border-radius:10px; font-size:13px; font-weight:600; animation:toastIn 0.25s ease; z-index:9999; box-shadow:0 8px 24px rgba(0,0,0,0.12); display:flex; align-items:center; gap:8px; }
        .jt-toast.success { background:#0F172A; color:#fff; }
        .jt-toast.error   { background:#DC2626; color:#fff; }

        @keyframes spin { to{transform:rotate(360deg)} }
        .spin { animation:spin 0.7s linear infinite; display:inline-block; }
      `}</style>

      <div className="jt-wrap">
        {/* ── 요약 통계 ── */}
        <div className="jt-summary">
          <div className="jt-sum-card">
            <div className="jt-sum-dot" style={{ background:'#3B82F6' }} />
            <div className="jt-sum-lbl">전체 이력</div>
            <div className="jt-sum-val">{jobs.length}<span className="jt-sum-unit"> 건</span></div>
          </div>
          <div className="jt-sum-card">
            <div className="jt-sum-dot" style={{ background:'#F59E0B' }} />
            <div className="jt-sum-lbl">승인 대기</div>
            <div className="jt-sum-val" style={{ color: pending.length > 0 ? '#D97706' : '#0F172A' }}>
              {pending.length}<span className="jt-sum-unit"> 건</span>
            </div>
          </div>
          <div className="jt-sum-card">
            <div className="jt-sum-dot" style={{ background:'#10B981' }} />
            <div className="jt-sum-lbl">현재 주 총 근무시간</div>
            <div className="jt-sum-val" style={{ color: isOverall ? '#EF4444' : '#0F172A' }}>
              {totalWeekly}<span className="jt-sum-unit"> / {maxHours}h</span>
            </div>
          </div>
          <div className="jt-sum-card">
            <div className="jt-sum-dot" style={{ background:'#8B5CF6' }} />
            <div className="jt-sum-lbl">허가 최대시간 기준</div>
            <div className="jt-sum-val">주 {maxHours}<span className="jt-sum-unit"> 시간</span></div>
          </div>
        </div>

        {/* ── 전체 시간 배너 ── */}
        {approved.length > 0 && (
          <div className={`jt-banner ${isOverall ? 'over' : totalWeekly >= maxHours * 0.8 ? 'warn' : 'ok'}`}>
            <span style={{ fontSize:16 }}>{isOverall ? '⚠️' : totalWeekly >= maxHours * 0.8 ? '🔔' : '✅'}</span>
            {isOverall
              ? `주 ${totalWeekly}시간 — 허가 시간(${maxHours}h)을 ${totalWeekly - maxHours}시간 초과하고 있습니다.`
              : totalWeekly >= maxHours * 0.8
              ? `주 ${totalWeekly}시간 — 허가 시간(${maxHours}h)의 80% 이상 사용 중입니다.`
              : `주 ${totalWeekly}시간 — 허가 시간(${maxHours}h) 이내로 정상 운영 중입니다.`
            }
          </div>
        )}

        {/* ── 필터 ── */}
        <div className="jt-filters">
          {[
            { key:'ALL',      label:`전체 (${jobs.length})` },
            { key:'PENDING',  label:`대기 (${jobs.filter(j=>j.status==='PENDING').length})` },
            { key:'APPROVED', label:`승인 (${jobs.filter(j=>j.status==='APPROVED').length})` },
            { key:'REJECTED', label:`반려 (${jobs.filter(j=>j.status==='REJECTED').length})` },
          ].map(f => (
            <button
              key={f.key}
              className={`jt-filter-btn ${filterStatus === f.key ? 'active' : ''}`}
              onClick={() => setFilterStatus(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── 카드 목록 ── */}
        {loading ? (
          <div style={{ padding:'4rem', textAlign:'center', color:'#94A3B8', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
            <span className="spin" style={{ display:'inline-block', width:20, height:20, border:'2px solid #E5E7EB', borderTopColor:'#1A3A5C', borderRadius:'50%' }} />
            데이터를 불러오는 중...
          </div>
        ) : !studentId ? (
          // 변경 포인트 3: 상위 컴포넌트에서 아직 학생 ID를 주지 않았을 때 안내 메시지 출력
          <div className="jt-empty">
            <div className="jt-empty-icon">👤</div>
            <div className="jt-empty-txt">조회할 학생을 먼저 선택해 주세요.</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="jt-empty">
            <div className="jt-empty-icon">💼</div>
            <div className="jt-empty-txt">
              {filterStatus === 'ALL' ? '등록된 시간제 취업 이력이 없습니다.' : `${STATUS_META[filterStatus]?.label} 이력이 없습니다.`}
            </div>
          </div>
        ) : (
          <div className="jt-list">
            {filtered.map(job => {
              const meta   = STATUS_META[job.status] || STATUS_META.PENDING;
              const weekly = calcWeeklyHours(job.startDate, job.endDate, job.dailyHours, job.daysPerWeek);
              const isAct  = actionLoading === job.jobId;
              const statusKey = (job.status || 'PENDING').toLowerCase();

              return (
                <div key={job.jobId} className={`jt-card ${statusKey}`}>
                  {/* 카드 상단 */}
                  <div className="jt-card-top">
                    <div>
                      <div className="jt-company">{job.companyName || '업체명 미입력'}</div>
                      <div className="jt-period">
                        {fmt(job.startDate)} ~ {job.endDate ? fmt(job.endDate) : '진행중'}
                      </div>
                    </div>
                    <span style={{
                      fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:6,
                      background:meta.bg, color:meta.color, border:`1px solid ${meta.border}`,
                      whiteSpace:'nowrap', flexShrink:0,
                    }}>
                      {meta.label}
                    </span>
                  </div>

                  {/* 메타 정보 */}
                  <div className="jt-meta-grid">
                    <div className="jt-meta-item">
                      <div className="jt-meta-label">직종</div>
                      <div className="jt-meta-val">{job.jobType || '–'}</div>
                    </div>
                    <div className="jt-meta-item">
                      <div className="jt-meta-label">일 근무시간</div>
                      <div className="jt-meta-val">{job.dailyHours != null ? `${job.dailyHours}시간` : '–'}</div>
                    </div>
                    <div className="jt-meta-item">
                      <div className="jt-meta-label">주 근무일수</div>
                      <div className="jt-meta-val">{job.daysPerWeek != null ? `${job.daysPerWeek}일` : '–'}</div>
                    </div>
                    <div className="jt-meta-item">
                      <div className="jt-meta-label">시급</div>
                      <div className="jt-meta-val">{job.hourlyWage ? `${job.hourlyWage.toLocaleString()}원` : '–'}</div>
                    </div>
                  </div>

                  {/* 하단: 시간 바 + 액션 */}
                  <div className="jt-card-bottom">
                    {weekly != null
                      ? <HoursBar weekly={weekly} max={maxHours} />
                      : <div style={{ fontSize:12, color:'#CBD5E1' }}>근무시간 정보 없음</div>
                    }

                    <div style={{ display:'flex', gap:7, flexWrap:'wrap', justifyContent:'flex-end' }}>
                      {/* 계약서 버튼 */}
                      {job.contractUrl ? (
                        <a href={job.contractUrl} target="_blank" rel="noreferrer">
                          <button className="jt-btn jt-btn-view">📄 계약서 보기</button>
                        </a>
                      ) : (
                        <>
                          <input
                            id={`contract-${job.jobId}`}
                            type="file" accept="application/pdf"
                            style={{ display:'none' }}
                            onChange={e => handleContractUpload(job.jobId, e.target.files[0])}
                          />
                          {/* 변경 포인트 2: 복잡한 label 태그를 제거하고 원클릭 버튼 구조로 변경 */}
                          <button
                            className="jt-btn jt-btn-upload"
                            disabled={isAct}
                            onClick={() => document.getElementById(`contract-${job.jobId}`).click()}
                          >
                            {isAct ? <span className="spin">⏳</span> : '📎'} 계약서 업로드
                          </button>
                        </>
                      )}

                      {/* 승인/반려 버튼 (PENDING 상태일 때만) */}
                      {job.status === 'PENDING' && (
                        <>
                          <button
                            className="jt-btn jt-btn-approve"
                            disabled={isAct}
                            onClick={() => handleApprove(job.jobId)}
                          >
                            {isAct ? <span className="spin">⏳</span> : '✓'} 승인
                          </button>
                          <button
                            className="jt-btn jt-btn-reject"
                            disabled={isAct}
                            onClick={() => setRejectTarget(job.jobId)}
                          >
                            ✕ 반려
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 반려 사유 표시 */}
                  {job.status === 'REJECTED' && job.rejectReason && (
                    <div className="jt-reject-reason">
                      💬 반려 사유: {job.rejectReason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 반려 모달 ── */}
      {rejectTarget && (
        <RejectModal
          onConfirm={handleReject}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {/* ── 토스트 ── */}
      {toast && (
        <div className={`jt-toast ${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </div>
  );
}