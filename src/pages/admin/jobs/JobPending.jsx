import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ─── API 헬퍼 ─────────────────────────────────────────
const API_BASE = '/api/v1';
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
});

async function apiFetch(path) {
  const res = await axios.get(`${API_BASE}${path}`, { headers: authHeader() });
  return res.data.data ?? res.data; // 이중 data 래핑 유연 대응
}
async function apiPatch(path, body) {
  const res = await axios.patch(`${API_BASE}${path}`, body, { headers: authHeader() });
  return res.data;
}

// ─── 상수 ─────────────────────────────────────────────
const TAB_LIST = [
  { key: 'PENDING',  label: '대기', color: '#F59E0B', bg: '#FFFBEB' },
  { key: 'APPROVED', label: '승인', color: '#10B981', bg: '#ECFDF5' },
  { key: 'REJECTED', label: '반려', color: '#EF4444', bg: '#FEF2F2' },
  { key: 'ALL',      label: '전체', color: '#64748B', bg: '#F1F5F9' },
];

const PILL_MAP = {
  PENDING:  'pill-amber',
  APPROVED: 'pill-green',
  REJECTED: 'pill-red',
};
const LABEL_MAP = {
  PENDING: '검토 중',
  APPROVED: '승인',
  REJECTED: '반려',
};

// ─── 컴포넌트 전용 스타일 ───────────
const STYLES = `
@keyframes fadeUp   { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
@keyframes shimmer  { from { background-position:200% 0; } to { background-position:-200% 0; } }
@keyframes slideIn  { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }
@keyframes overlayIn{ from { opacity:0; } to { opacity:1; } }
@keyframes spin     { to { transform:rotate(360deg); } }

/* layout */
.job-pending-content { padding: 1rem 0; animation: fadeUp .28s ease; font-family: 'DM Sans', 'Noto Sans KR', sans-serif; }

/* sec label */
.sec-label { font-size:.6875rem; font-weight:700; color:#94A3B8; text-transform:uppercase; letter-spacing:.07em; margin-bottom:.75rem; }

/* stat cards */
.stat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:1rem; margin-bottom:1.75rem; }
.stat-card { background:#fff; border-radius:1rem; padding:1.375rem 1.25rem 1.125rem; border:1px solid #F1F5F9; transition:all .2s; position:relative; overflow:hidden; cursor:pointer; }
.stat-card::after { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
.stat-card.c-blue::after   { background:#3B82F6; }
.stat-card.c-amber::after  { background:#F59E0B; }
.stat-card.c-green::after  { background:#10B981; }
.stat-card.c-red::after    { background:#EF4444; }
.stat-card.active-card     { box-shadow:0 0 0 2.5px #3B82F6; }
.stat-card:hover { transform:translateY(-2px); box-shadow:0 8px 22px -6px rgba(0,0,0,.1); }
.stat-lbl { font-size:.75rem; color:#64748B; margin-bottom:.4rem; font-weight:500; }
.stat-val { font-size:2rem; font-weight:700; color:#0F172A; line-height:1; }

/* data card */
.data-card { background:#fff; border-radius:1rem; border:1px solid #F1F5F9; overflow:hidden; margin-bottom:1.5rem; }
.card-hd   { padding:.9375rem 1.25rem; border-bottom:1px solid #F8FAFC; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:.75rem; }
.card-hd-title { font-size:.875rem; font-weight:700; color:#0F172A; }
.card-badge    { font-size:.6875rem; font-weight:600; color:#64748B; background:#F1F5F9; padding:2px 9px; border-radius:20px; }

/* pills */
.pill        { font-size:.6875rem; padding:3px 9px; border-radius:6px; font-weight:700; display:inline-block; white-space:nowrap; }
.pill-green  { background:#ECFDF5; color:#059669; }
.pill-amber  { background:#FFFBEB; color:#B45309; }
.pill-red    { background:#FEF2F2; color:#DC2626; }
.pill-gray   { background:#F1F5F9; color:#475569; }

/* skeleton */
.skel { background:linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px; }

/* error */
.err-banner { margin-bottom:1.5rem; background:#FEF2F2; border:1px solid #FECACA; border-radius:.75rem; padding:1rem 1.25rem; display:flex; align-items:center; gap:.75rem; color:#DC2626; font-size:.875rem; }

/* filter / search bar */
.filter-bar { display:flex; align-items:center; gap:.75rem; flex-wrap:wrap; }
.search-input { padding:.5625rem .875rem; border:1.5px solid #E2E8F0; border-radius:.625rem; font-size:.875rem; font-family:inherit; width:220px; transition:border .2s; outline:none; }
.search-input:focus { border-color:#3B82F6; box-shadow:0 0 0 3px rgba(59,130,246,.1); }

/* table */
.tbl-wrap { overflow-x:auto; }
table.base-tbl { width:100%; border-collapse:collapse; font-size:.8125rem; }
table.base-tbl thead tr { background:#FAFBFD; border-bottom:1px solid #F1F5F9; }
table.base-tbl th { padding:.875rem 1rem; text-align:left; font-size:.75rem; color:#64748B; font-weight:600; white-space:nowrap; }
table.base-tbl td { padding:.875rem 1rem; border-bottom:1px solid #F8FAFC; color:#374151; vertical-align:middle; cursor:default; }
table.base-tbl tbody tr:hover td { background:#F8FAFC; }

/* row action buttons */
.act-btn { display:inline-flex; align-items:center; gap:.375rem; padding:.4375rem .875rem; border-radius:.5rem; border:1.5px solid; font-size:.8125rem; font-weight:700; cursor:pointer; font-family:inherit; transition:all .18s; }
.act-approve { border-color:#6EE7B7; color:#059669; background:#F0FDF4; }
.act-approve:hover:not(:disabled) { background:#059669; color:#fff; border-color:#059669; }
.act-reject  { border-color:#FCA5A5; color:#DC2626; background:#FFF5F5; }
.act-reject:hover:not(:disabled)  { background:#DC2626; color:#fff; border-color:#DC2626; }
.act-btn:disabled { opacity:.45; cursor:not-allowed; }

/* list dedicated buttons */
.act-check { 
  border: 1.5px solid #3B82F6; 
  color: #3B82F6; 
  background: transparent; 
  padding: .3rem .6rem; 
  font-size: .75rem; 
  font-weight: 600; 
  border-radius: .375rem; 
  cursor: pointer; 
  transition: all .2s;
}
.act-check:hover { 
  background: #EFF6FF; 
}

.act-view { 
  border: 1.5px solid #E2E8F0; 
  color: #64748B; 
  background: transparent; 
  padding: .3rem .6rem; 
  font-size: .75rem; 
  font-weight: 500; 
  border-radius: .375rem; 
  cursor: pointer; 
  transition: all .2s;
}
.act-view:hover { 
  background: #F8FAFC; 
}

/* buttons */
.btn-primary { display:inline-flex; align-items:center; gap:.5rem; padding:.625rem 1.375rem; border:none; border-radius:.625rem; background:#3B82F6; color:#fff; font-size:.875rem; font-weight:700; cursor:pointer; }
.btn-outline { display:inline-flex; align-items:center; gap:.5rem; padding:.625rem 1.375rem; border:1.5px solid #E2E8F0; border-radius:.625rem; background:#fff; color:#374151; font-size:.875rem; font-weight:600; cursor:pointer; }

/* empty */
.empty-state { padding:3rem 1.5rem; text-align:center; color:#94A3B8; font-size:.875rem; }

/* ── 상세 패널 (오버레이 드로어) ── */
.overlay-bg { position:fixed; inset:0; background:rgba(15,23,42,.35); z-index:100; animation:overlayIn .2s ease; }
.detail-drawer { position:fixed; top:0; right:0; bottom:0; width:480px; max-width:95vw; background:#fff; z-index:101; display:flex; flex-direction:column; box-shadow:-8px 0 32px -4px rgba(0,0,0,.14); animation:slideIn .22s ease; }
.drawer-hd { padding:1.125rem 1.5rem; border-bottom:1px solid #F1F5F9; display:flex; justify-content:space-between; align-items:center; flex-shrink:0; }
.drawer-title { font-size:1rem; font-weight:700; color:#0F172A; }
.drawer-close { width:2rem; height:2rem; border-radius:50%; border:1px solid #E2E8F0; background:#F8FAFC; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#64748B; }
.drawer-body { flex:1; overflow-y:auto; padding:1.5rem; }
.drawer-ft   { padding:1rem 1.5rem; border-top:1px solid #F1F5F9; display:flex; gap:.75rem; justify-content:flex-end; flex-shrink:0; }

.info-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem 1.5rem; }
.info-lbl { font-size:.6875rem; font-weight:600; color:#94A3B8; margin-bottom:.25rem; }
.info-val { font-size:.9375rem; font-weight:600; color:#0F172A; }

/* reject modal */
.reject-modal-wrap { position:fixed; inset:0; z-index:200; display:flex; align-items:center; justify-content:center; padding:1rem; background:rgba(15,23,42,.4); animation:overlayIn .2s; }
.reject-modal { background:#fff; border-radius:1rem; width:100%; max-width:440px; overflow:hidden; box-shadow:0 20px 50px -8px rgba(0,0,0,.2); }
.rm-hd  { padding:1.25rem 1.5rem; border-bottom:1px solid #F1F5F9; }
.rm-title { font-size:1rem; font-weight:700; color:#0F172A; }
.rm-body { padding:1.25rem 1.5rem; }
.rm-ft   { padding:1rem 1.5rem; border-top:1px solid #F1F5F9; display:flex; gap:.625rem; justify-content:flex-end; }
.rm-textarea { width:100%; padding:.75rem; border:1.5px solid #E2E8F0; border-radius:.625rem; font-size:.875rem; resize:vertical; min-height:100px; outline:none; }
.rm-textarea:focus { border-color:#EF4444; }

/* success toast */
.toast { position:fixed; bottom:1.5rem; left:50%; transform:translateX(-50%); background:#0F172A; color:#fff; padding:.75rem 1.5rem; border-radius:.75rem; font-size:.875rem; font-weight:600; z-index:300; box-shadow:0 8px 24px -4px rgba(0,0,0,.25); animation:fadeUp .25s ease; display:flex; align-items:center; gap:.5rem; }

/* approval stepper */
.stepper { display:flex; align-items:center; margin-bottom:1.25rem; }
.step-circle { width:2rem; height:2rem; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.75rem; font-weight:700; border:2.5px solid; flex-shrink:0; transition:all .3s; }
.step-line { flex:1; height:2px; transition:background .3s; }
.step-lbl { font-size:.6875rem; text-align:center; margin-top:.375rem; font-weight:500; }
`;

// ─── 승인 단계 스텝퍼 ──────────────────────────────────
function ApprovalStepper({ status }) {
  const steps = ['서류 접수', '담당자 검토', '최종 처리'];
  const stepIdx = { PENDING: 1, APPROVED: 2, REJECTED: 2 };
  const current = stepIdx[status] ?? 1;
  const isRejected = status === 'REJECTED';

  return (
    <div>
      <div className="stepper">
        {steps.map((s, i) => {
          const done    = i < current;
          const active  = i === current;
          const reject  = isRejected && i === current;
          const lineColor = done ? '#3B82F6' : '#E2E8F0';
          const circBorder = reject ? '#EF4444' : done ? '#3B82F6' : active ? '#3B82F6' : '#E2E8F0';
          const circBg     = reject ? '#FEF2F2' : done ? '#3B82F6' : active ? '#EFF6FF' : '#F8FAFC';
          const circColor  = reject ? '#DC2626' : done ? '#fff' : active ? '#1D4ED8' : '#CBD5E1';
          return (
            <React.Fragment key={s}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:'5rem' }}>
                <div className="step-circle"
                  style={{ borderColor: circBorder, background: circBg, color: circColor }}>
                  {done ? '✓' : reject ? '✕' : i + 1}
                </div>
                <div className="step-lbl" style={{ color: reject ? '#DC2626' : done || active ? '#1D4ED8' : '#94A3B8' }}>
                  {s}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="step-line" style={{ background: lineColor, marginBottom:'1.25rem' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── 반려 사유 모달 ────────────────────────────────────
function RejectModal({ job, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  return (
    <div className="reject-modal-wrap" onClick={onCancel}>
      <div className="reject-modal" onClick={e => e.stopPropagation()}>
        <div className="rm-hd">
          <div className="rm-title">반려 사유 입력</div>
          <div style={{ fontSize:'.8125rem', color:'#64748B', marginTop:'.25rem' }}>
            {job.studentName} — {job.companyName}
          </div>
        </div>
        <div className="rm-body">
          <label style={{ fontSize:'.8125rem', fontWeight:600, color:'#374151', display:'block', marginBottom:'.5rem' }}>
            반려 사유 <span style={{ color:'#EF4444' }}>*</span>
          </label>
          <textarea
            className="rm-textarea"
            placeholder="반려 사유를 입력하세요. 학생에게 표시됩니다."
            value={reason}
            onChange={e => setReason(e.target.value)}
            autoFocus
          />
        </div>
        <div className="rm-ft">
          <button className="btn-outline" onClick={onCancel}>취소</button>
          <button
            className="btn-primary"
            style={{ background:'#EF4444' }}
            disabled={!reason.trim() || loading}
            onClick={() => onConfirm(reason.trim())}
          >
            {loading ? '처리중...' : '반려 처리'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 상세 드로어 ───────────────────────────────────────
function DetailDrawer({ job, onClose, onApprove, onReject, actioning }) {
  const [studentInfo, setStudentInfo] = useState(null);
  const [isLoadingStudent, setIsLoadingStudent] = useState(false);

  useEffect(() => {
    if (!job?.studentId) return;
    
    const fetchStudentDetail = async () => {
      setIsLoadingStudent(true);
      try {
        const data = await apiFetch(`/search/student/${job.studentId}`);
        setStudentInfo(data.student);
      } catch (err) {
        console.error('학생 상세 정보를 불러오지 못했습니다.', err);
      } finally {
        setIsLoadingStudent(false);
      }
    };

    fetchStudentDetail();
  }, [job?.studentId]);

  if (!job) return null;
  const isPending = job.approvalStatus === 'PENDING';

  const InfoRow = ({ label, value, children }) => (
    <div>
      <div className="info-lbl">{label}</div>
      <div className="info-val">{children ?? value ?? '—'}</div>
    </div>
  );

  return (
    <>
      <div className="overlay-bg" onClick={onClose} />
      <div className="detail-drawer">
        <div className="drawer-hd">
          <div>
            <div className="drawer-title">신청 상세 — {job.companyName}</div>
            <div style={{ fontSize:'.75rem', color:'#94A3B8', marginTop:'2px' }}>
              {job.studentName} ({job.studentId})
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}>×</button>
        </div>

        <div className="drawer-body">
          <div style={{ marginBottom:'1.25rem' }}>
            <div style={{ fontSize:'.6875rem', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'.875rem' }}>
              처리 단계
            </div>
            <ApprovalStepper status={job.approvalStatus} />
            {/* 📝 수정: 백엔드 필드명에 맞게 job.rejectionReason -> job.rejectReason 으로 수정 */}
            {job.approvalStatus === 'REJECTED' && job.rejectReason && (
              <div style={{ padding:'.75rem 1rem', background:'#FEF2F2', borderRadius:'.625rem', border:'1px solid #FECACA', fontSize:'.8125rem', color:'#DC2626', marginTop:'.5rem' }}>
                <strong>반려 사유:</strong> {job.rejectReason}
              </div>
            )}
          </div>

          <div style={{ height:'1px', background:'#F1F5F9', margin:'1.25rem 0' }} />

          <div style={{ fontSize:'.6875rem', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'.875rem' }}>
            신청자 정보
          </div>
          <div className="info-grid" style={{ marginBottom:'1.25rem' }}>
            <InfoRow label="학생명"  value={job.studentName} />
            <InfoRow label="학번"    value={job.studentId} />
            <InfoRow label="학과"    value={isLoadingStudent ? '불러오는 중...' : (studentInfo?.deptName ?? '—')} />
            <InfoRow label="국적"    value={isLoadingStudent ? '불러오는 중...' : (studentInfo?.nationality ?? '—')} />
          </div>

          <div style={{ height:'1px', background:'#F1F5F9', margin:'1.25rem 0' }} />

          <div style={{ fontSize:'.6875rem', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'.875rem' }}>
            근로 계약 정보
          </div>
          <div className="info-grid" style={{ marginBottom:'1.25rem' }}>
            {/* 📝 수정: 상세 보기 패널에도 '신청일(createdAt)' 필드 추가 매핑 */}
            <InfoRow label="신청일"        value={job.createdAt ? job.createdAt.slice(0, 10) : '—'} />
            <InfoRow label="사업체명"      value={job.companyName} />
            <InfoRow label="업종 / 직종"   value={job.industry ?? '—'} />
            <InfoRow label="근무지 주소"   value={job.workAddress ?? '—'} />
            <InfoRow label="시급"          value={job.wage != null ? `${job.wage.toLocaleString()}원` : '—'} />
            <InfoRow label="주당 근무시간" value={job.workHoursPerWeek != null ? `${job.workHoursPerWeek}시간` : '—'} />
            <InfoRow label="계약 시작일"   value={job.startDate} />
            <InfoRow label="계약 종료일"   value={job.endDate ?? '미정'} />
            <InfoRow label="상태">
              <span className={`pill ${PILL_MAP[job.approvalStatus] ?? 'pill-gray'}`}>
                {LABEL_MAP[job.approvalStatus] ?? job.approvalStatus}
              </span>
            </InfoRow>
          </div>
        </div>

        {isPending && (
          <div className="drawer-ft">
            <button className="act-btn act-reject" disabled={actioning === job.jobId} onClick={() => onReject(job)}>
              반려
            </button>
            <button className="act-btn act-approve" disabled={actioning === job.jobId} onClick={() => onApprove(job.jobId)}>
              {actioning === job.jobId ? '처리중...' : '승인'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── 토스트 & Skeleton ───────────────────────────────────
function Toast({ msg, type = 'success' }) {
  return <div className="toast">{type === 'success' ? '✅' : '❌'} {msg}</div>;
}
function Sk({ w = '100%', h = '1rem' }) {
  return <div className="skel" style={{ width: w, height: h }} />;
}

// ════════════════════════════════════════════════════════
//  메인 컴포넌트
// ════════════════════════════════════════════════════════
export default function JobPending() {
  const [tab, setTab]               = useState('PENDING');
  const [allJobs, setAllJobs]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actioning, setActioning]   = useState(null);
  const [toast, setToast]           = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch('/jobs/pending');
      setAllJobs(Array.isArray(data) ? data : []);
    } catch {
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleApprove = async (jobId) => {
    setActioning(jobId);
    try {
      await apiPatch(`/jobs/${jobId}/approval`, { approved: true });
      setAllJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, approvalStatus: 'APPROVED' } : j));
      if (selected?.jobId === jobId) {
        setSelected(prev => ({ ...prev, approvalStatus: 'APPROVED' }));
      }
      showToast('승인 처리되었습니다.');
      
      // 🚀 사이드바 알림 개수 갱신 이벤트 발생
      window.dispatchEvent(new Event('refresh-sidebar-badge'));
      
    } catch {
      showToast('승인 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setActioning(null);
    }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    const jobId = rejectTarget.jobId;
    setActioning(jobId);
    try {
      await apiPatch(`/jobs/${jobId}/approval`, { approved: false, reason });
      // 📝 수정: 반려 사유 상태 업데이트 시에도 백엔드 필드명(rejectReason)으로 통일
      setAllJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, approvalStatus: 'REJECTED', rejectReason: reason } : j));
      if (selected?.jobId === jobId) {
        setSelected(prev => ({ ...prev, approvalStatus: 'REJECTED', rejectReason: reason }));
      }
      setRejectTarget(null);
      showToast('반려 처리되었습니다.');
      
      // 🚀 사이드바 알림 개수 갱신 이벤트 발생
      window.dispatchEvent(new Event('refresh-sidebar-badge'));
      
    } catch {
      showToast('반려 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setActioning(null);
    }
  };

  const tabFiltered = tab === 'ALL' ? allJobs : allJobs.filter(j => j.approvalStatus === tab);
  const displayed = tabFiltered.filter(j => {
    const q = search.toLowerCase();
    return !q || j.studentName?.toLowerCase().includes(q) || j.companyName?.toLowerCase().includes(q) || String(j.studentId).includes(q);
  });

  const counts = {
    PENDING:  allJobs.filter(j => j.approvalStatus === 'PENDING').length,
    APPROVED: allJobs.filter(j => j.approvalStatus === 'APPROVED').length,
    REJECTED: allJobs.filter(j => j.approvalStatus === 'REJECTED').length,
    ALL:      allJobs.length,
  };
  const statColors = { PENDING:'c-amber', APPROVED:'c-green', REJECTED:'c-red', ALL:'c-blue' };

  return (
    <>
      <style>{STYLES}</style>

      {rejectTarget && (
        <RejectModal job={rejectTarget} onConfirm={handleRejectConfirm} onCancel={() => setRejectTarget(null)} loading={actioning === rejectTarget.jobId} />
      )}

      {selected && (
        <DetailDrawer job={selected} onClose={() => setSelected(null)} onApprove={handleApprove} onReject={setRejectTarget} actioning={actioning} />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="job-pending-content">
        {error && (
          <div className="err-banner">
            ⚠️ {error}
            <button onClick={load} style={{ marginLeft:'auto', padding:'4px 12px', borderRadius:'6px', border:'1px solid #FECACA', background:'#fff', color:'#DC2626', cursor:'pointer' }}>
              재시도
            </button>
          </div>
        )}

        <div className="sec-label">처리 현황</div>
        <div className="stat-grid">
          {TAB_LIST.map(({ key, label }) => (
            <div
              key={key}
              className={`stat-card ${statColors[key]} ${tab === key ? 'active-card' : ''}`}
              onClick={() => setTab(key)}
            >
              <div className="stat-lbl">{label}</div>
              <div className="stat-val">
                {loading ? <Sk w="40px" h="2rem" /> : counts[key]}
              </div>
            </div>
          ))}
        </div>

        <div className="data-card">
          <div className="card-hd">
            <div className="card-hd-title">신청 내역</div>
            <div className="filter-bar">
              <input
                type="text"
                className="search-input"
                placeholder="학생명, 학번, 기업명 검색"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="tbl-wrap">
            <table className="base-tbl">
              <thead>
                <tr>
                  <th>상태</th>
                  <th>신청일</th>
                  <th>학생명</th>
                  <th>학번</th>
                  <th>사업체명</th>
                  <th>근무지 주소</th>
                  <th>계약기간</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{ textAlign:'center', padding:'2rem' }}>데이터를 불러오는 중입니다...</td></tr>
                ) : displayed.length === 0 ? (
                  <tr><td colSpan="8" className="empty-state">조건에 맞는 내역이 없습니다.</td></tr>
                ) : (
                  displayed.map(job => (
                    <tr key={job.jobId}>
                      <td>
                        <span className={`pill ${PILL_MAP[job.approvalStatus] ?? 'pill-gray'}`}>
                          {LABEL_MAP[job.approvalStatus] ?? job.approvalStatus}
                        </span>
                      </td>
                      {/* 📝 수정: 신청일에 백엔드 데이터(createdAt)를 T 기준으로 자르거나 앞 10자리(YYYY-MM-DD)만 표시 */}
                      <td>{job.createdAt ? job.createdAt.slice(0, 10) : '—'}</td>
                      <td style={{ fontWeight: 600 }}>{job.studentName ?? '—'}</td>
                      <td>{job.studentId ?? '—'}</td>
                      <td>{job.companyName ?? '—'}</td>
                      <td>{job.workAddress ?? '—'}</td>
                      <td>{job.startDate} ~ {job.endDate ?? '미정'}</td>
                      <td style={{ textAlign: 'center' }}>
                        {job.approvalStatus === 'PENDING' ? (
                          <button 
                            className="act-check" 
                            onClick={() => setSelected(job)}
                          >
                            근로 확인
                          </button>
                        ) : (
                          <button 
                            className="act-view" 
                            onClick={() => setSelected(job)}
                          >
                            상세 보기
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}