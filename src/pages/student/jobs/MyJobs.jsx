import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios'; // 🚀 전역 공통 API 인스턴스 임포트
import TopBar from '../../../components/layout/TopBar.jsx';


// 2. 전역 CSS 스타일
const GLOBAL_STYLE_CSS = `
  /* 🛠️ 대시보드 시리즈와 레이아웃 통일: 좌우 패딩 22px 확장 및 박스 크기 산정 방식 교정 */
  .sw-content { box-sizing: border-box; width: 100%; padding: 4px 22px 24px; animation: jobsFadeUp 0.28s ease; }
  
  @keyframes jobsFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
  .stat-card { padding: 1.25rem; background: #fff; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .stat-lbl { font-size: .8125rem; color: #64748B; font-weight: 600; margin-bottom: .5rem; }
  .stat-val { font-size: 1.75rem; font-weight: 700; color: #1E293B; display: flex; align-items: baseline; gap: 2px; }
  .stat-val .unit { font-size: .875rem; font-weight: 500; color: #94A3B8; margin-left: 2px; }
  .data-card { background: #fff; border-radius: 14px; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); overflow: hidden; margin-top: 1.25rem; }
  .card-hd { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem; border-bottom: 1px solid #F1F5F9; flex-wrap: wrap; gap: .75rem; }
  .card-hd-title { font-size: 1rem; font-weight: 700; color: #1E293B; }
  .pill { display: inline-flex; align-items: center; padding: 4px 10px; font-size: .75rem; font-weight: 600; border-radius: 6px; line-height: 1; }
  .pill-amber { background: #FFFBEB; color: #D97706; }
  .pill-green { background: #ECFDF5; color: #059669; }
  .pill-red { background: #FEF2F2; color: #DC2626; }
  .btn-primary { background: #3B82F6; color: #fff; border: none; padding: .625rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background .15s ease; }
  .btn-primary:hover { background: #2563EB; }
  .info-grid { display: grid; }
  .info-item-lbl { font-size: .75rem; color: #94A3B8; font-weight: 500; margin-bottom: .25rem; }
  .info-item-val { font-size: .875rem; color: #334155; font-weight: 600; }
`;

const STATUS = {
  PENDING:  { label: '검토 중', pill: 'pill-amber', icon: '⏳' },
  APPROVED: { label: '승인 완료', pill: 'pill-green', icon: '✅' },
  REJECTED: { label: '반려됨', pill: 'pill-red', icon: '❌' },
};

// 3. 하위 컴포넌트
function Skeleton({ h = '1rem', w = '100%' }) {
  return (
    <div style={{ height: h, width: w, backgroundColor: '#E2E8F0', borderRadius: '6px', animation: 'jobsPulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
      <style>{`@keyframes jobsPulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }`}</style>
    </div>
  );
}

function ErrBanner({ msg, onRetry }) {
  return (
    <div style={styles.errBanner}>
      <span>⚠️ {msg}</span>
      {onRetry && <button onClick={onRetry} style={styles.retryBtn}>다시 시도</button>}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={styles.emptyState}>
      <div style={{ fontSize: '1.75rem', marginBottom: '.5rem' }}>💼</div>
      {text}
    </div>
  );
}

function ApprovalStepper({ status, reason }) {
  const steps = ['서류 제출', '담당자 검토', '최종 처리'];
  const current = status === 'PENDING' ? 1 : ['APPROVED', 'REJECTED'].includes(status) ? 2 : 0;
  const isRejected = status === 'REJECTED';

  return (
    <div style={{ padding: '1rem 0 .5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const rejected = isRejected && active;
          const color = rejected ? '#EF4444' : done || active ? '#3B82F6' : '#E2E8F0';
          const textCol = rejected ? '#DC2626' : done || active ? '#1D4ED8' : '#94A3B8';
          
          return (
            <React.Fragment key={s}>
              <div style={styles.stepWrapper}>
                <div style={{
                  ...styles.stepCircle,
                  border: `2.5px solid ${color}`,
                  background: done ? '#3B82F6' : rejected ? '#FEF2F2' : active ? '#EFF6FF' : '#F8FAFC',
                  color: done ? '#fff' : textCol,
                }}>
                  {done ? '✓' : rejected ? '✕' : i + 1}
                </div>
                <div style={{ ...styles.stepLabel, color: textCol, fontWeight: active ? 700 : 400 }}>{s}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ ...styles.stepLine, background: done ? '#3B82F6' : '#E2E8F0' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {isRejected && reason && (
        <div style={styles.rejectionBox}>
          <strong>🔴 반려 사유 피드백:</strong> {reason}
        </div>
      )}
    </div>
  );
}

function JobDetail({ job, onClose }) {
  const details = [
    { l: '사업체명', v: job.companyName },
    { l: '등록 업종', v: job.jobType ?? '—' },
    { l: '근무지 소재지', v: job.workplaceAddr ?? '—' },
    { l: '주당 소정근무', v: job.weeklyHours ? `${job.weeklyHours}시간` : '—' },
    { l: '근로 계약 시작일', v: job.startDate },
    { l: '근로 계약 만료일', v: job.endDate ?? '해당 없음 (반복)' },
  ];

  return (
    <div style={styles.detailContainer}>
      <button onClick={onClose} style={styles.closeBtn}>×</button>
      <div style={{ marginBottom: '.875rem' }}>
        <span style={styles.detailHeader}>출입국 허가 및 내부 승인 절차 상태</span>
      </div>
      
      <ApprovalStepper status={job.approvalStatus} reason={job.rejectionReason} />

      <div style={{ borderTop: '1px solid #E2E8F0', marginTop: '1rem', paddingTop: '1rem' }}>
        <div className="info-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem' }}>
          {details.map(({ l, v }) => (
            <div key={l}>
              <div className="info-item-lbl">{l}</div>
              <div className="info-item-val">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {job.contractUrl && (
        <div style={{ marginTop: '1rem' }}>
          <a href={job.contractUrl} target="_blank" rel="noopener noreferrer" style={styles.contractLink}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            표준 근로계약서 사본 확인하기
          </a>
        </div>
      )}
    </div>
  );
}

// 4. 메인 컴포넌트
export default function MyJobs() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true); 
    setError(null);
    try {
      const meRes = await api.get('/auth/me');
      const meData = meRes.data?.data ?? meRes.data;
      
      const sid = meData?.userId ?? meData?.studentId ?? (typeof meData === 'string' || typeof meData === 'number' ? String(meData) : null);
      
      if (!sid) {
        throw new Error('사용자 식별 번호(학번)를 식별할 수 없습니다.');
      }

      const jobsRes = await api.get(`/students/${sid}/jobs`);
      const jobsData = jobsRes.data?.data ?? jobsRes.data;
      
      let jobsList = [];
      if (Array.isArray(jobsData)) {
        jobsList = jobsData;
      } else if (jobsData && Array.isArray(jobsData.jobs)) {
        jobsList = jobsData.jobs;
      }
      
      setJobs(jobsList);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || '근로 신청 이력 정보를 수신해오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'ALL' ? jobs : jobs.filter(j => j.approvalStatus === filter);

  const counts = {
    ALL: jobs.length,
    PENDING: jobs.filter(j => j.approvalStatus === 'PENDING').length,
    APPROVED: jobs.filter(j => j.approvalStatus === 'APPROVED').length,
    REJECTED: jobs.filter(j => j.approvalStatus === 'REJECTED').length,
  };

  const [expandedId, setExpandedId] = useState(null);

  return (
    <>
      <style>{GLOBAL_STYLE_CSS}</style>
      <div className="sw-main">
        <TopBar title="근로 이력 내역 관리" />
        <div className="sw-content">
          {error && <ErrBanner msg={error} onRetry={load} />}

          {/* 대시보드 스탯 카드 섹션 */}
          <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-lbl">전체 신고 신청 건</div>
              <div className="stat-val">{loading ? <Skeleton h="2rem" w="40px"/> : counts.ALL}<span className="unit">건</span></div>
            </div>
            {[
              { type: 'PENDING', label: '관할 부서 심사중', color: '#F59E0B', textCol: '#B45309' },
              { type: 'APPROVED', label: '근로 승인 허가', color: '#10B981', textCol: '#047857' },
              { type: 'REJECTED', label: '서류 반려/보완', color: '#EF4444', textCol: '#B91C1C' }
            ].map(c => (
              <div key={c.type} className="stat-card" style={{ borderLeft: `4px solid ${c.color}` }}>
                <div className="stat-lbl" style={{ color: c.textCol }}>{c.label}</div>
                <div className="stat-val sunset-val">{loading ? <Skeleton h="2rem" w="40px"/> : counts[c.type]}<span className="unit">건</span></div>
              </div>
            ))}
          </div>

          {/* 메인 데이터 카드 목록 */}
          <div className="data-card">
            <div className="card-hd">
              <div className="card-hd-title">근로 허가 신청 목록</div>
              <div style={{ display: 'flex', gap: '.375rem' }}>
                {[
                  { key: 'ALL', label: '전체' },
                  { key: 'PENDING', label: '검토 중' },
                  { key: 'APPROVED', label: '승인' },
                  { key: 'REJECTED', label: '반려' },
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => setFilter(key)} style={{
                    ...styles.filterBtn,
                    borderColor: filter === key ? '#3B82F6' : '#E2E8F0',
                    background: filter === key ? '#EFF6FF' : '#fff',
                    color: filter === key ? '#1D4ED8' : '#64748B',
                  }}>
                    {label} {counts[key] > 0 && <span style={{ opacity: .7 }}>({counts[key]})</span>}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '.625rem 1.25rem', borderBottom: '1px solid #F8FAFC' }}>
              <button className="btn-primary" style={{ fontSize: '.8125rem', padding: '.5rem 1.125rem' }} onClick={() => navigate('/student/jobs/upload')}>
                + 근로 허가 신청하기
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {[...Array(3)].map((_, i) => <Skeleton key={i} h="3.5rem" />)}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState text="작성 및 제출된 근로 계약서가 존재하지 않습니다." />
            ) : (
              <div style={{ padding: '0 1.25rem 1rem' }}>
                {filtered.map(job => {
                  const st = STATUS[job.approvalStatus] ?? STATUS.PENDING;
                  const isExpanded = expandedId === job.jobId;
                  return (
                    <div key={job.jobId} style={{ marginTop: '.75rem' }}>
                      <div onClick={() => setExpandedId(isExpanded ? null : job.jobId)} style={{
                        ...styles.jobRow,
                        border: `1.5px solid ${isExpanded ? '#BFDBFE' : '#F1F5F9'}`,
                        background: isExpanded ? '#F0F7FF' : '#FAFBFD',
                      }}>
                        <div style={{
                          ...styles.jobIconWrapper,
                          background: job.approvalStatus === 'APPROVED' ? '#ECFDF5' : job.approvalStatus === 'REJECTED' ? '#FEF2F2' : '#FFFBEB',
                        }}>{st.icon}</div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={styles.companyNameText}>{job.companyName}</div>
                          <div style={styles.jobPeriodText}>
                            {job.startDate} {job.endDate ? `~ ${job.endDate}` : '~ 계약 종료일까지'} &nbsp;·&nbsp; 주 소정 {job.weeklyHours}시간
                          </div>
                        </div>

                        <div style={styles.statusBadgeWrapper}>
                          <span className={`pill ${st.pill}`}>{st.label}</span>
                          <svg width="16" height="16" fill="none" stroke="#94A3B8" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}>
                            <path strokeLinecap="round" d="M19 9l-7 7-7-7"/>
                          </svg>
                        </div>
                      </div>
                      {isExpanded && <JobDetail job={job} onClose={() => setExpandedId(null)} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  errBanner: { padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '.875rem' },
  retryBtn: { background: 'none', border: 'none', color: '#DC2626', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' },
  emptyState: { padding: '3rem 1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '.875rem' },
  stepWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '5rem' },
  stepCircle: { width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, transition: 'all .3s ease' },
  stepLabel: { fontSize: '.6875rem', marginTop: '.375rem', textAlign: 'center' },
  stepLine: { flex: 1, height: '2px', marginBottom: '1.25rem', transition: 'background .3s ease' },
  rejectionBox: { marginTop: '.75rem', padding: '.75rem 1rem', background: '#FEF2F2', borderRadius: '.625rem', border: '1px solid #FECACA', fontSize: '.8125rem', color: '#DC2626' },
  detailContainer: { background: '#F8FAFC', borderRadius: '.875rem', border: '1px solid #E2E8F0', padding: '1.25rem 1.5rem', margin: '.5rem 0', position: 'relative' },
  closeBtn: { position: 'absolute', top: '.75rem', right: '.75rem', width: '1.75rem', height: '1.75rem', borderRadius: '50%', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#94A3B8' },
  detailHeader: { fontSize: '.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em' },
  contractLink: { display: 'inline-flex', alignItems: 'center', gap: '.375rem', fontSize: '.8125rem', color: '#3B82F6', fontWeight: 600, textDecoration: 'none' },
  filterBtn: { padding: '4px 12px', borderRadius: '20px', border: '1.5px solid', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer' },
  jobRow: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '.875rem 1rem', borderRadius: '.75rem', cursor: 'pointer', transition: 'all .2s ease' },
  jobIconWrapper: { width: '2.5rem', height: '2.5rem', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem' },
  companyNameText: { fontWeight: 700, color: '#0F172A', fontSize: '.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  jobPeriodText: { fontSize: '.75rem', color: '#94A3B8', marginTop: '2px' },
  statusBadgeWrapper: { display: 'flex', alignItems: 'center', gap: '.75rem', flexShrink: 0 }
};