import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopBar from '../../../components/layout/TopBar.jsx';

const API_BASE = '/api/v1';

async function apiFetch(path) {
  const token = localStorage.getItem('accessToken');
  const res = await axios.get(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; 
}

function toArray(val) {
  if (Array.isArray(val)) return val;
  if (val?.content && Array.isArray(val.content)) return val.content;
  if (val?.list    && Array.isArray(val.list))    return val.list;
  if (val?.history && Array.isArray(val.history)) return val.history;
  return [];
}

function Skeleton({ w = '100%', h = '1rem', radius = '6px' }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'linear-gradient(90deg,#E2E8F0 25%,#F1F5F9 50%,#E2E8F0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
    }} />
  );
}

function GaugeRing({ pct, size = 120, stroke = 14, color = '#3B82F6', trackColor = '#E2E8F0', label }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * Math.min(pct / 100, 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={pct > 100 ? '#EF4444' : color} strokeWidth={stroke}
          strokeDasharray={`${Math.min(filled, circ)} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .8s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div style={{ textAlign: 'center', marginTop: '-.25rem' }}>{label}</div>
    </div>
  );
}

function AttendBar({ total, absent, late }) {
  const present = total - absent - late;
  const pPct = total ? (present / total) * 100 : 0;
  const aPct = total ? (absent  / total) * 100 : 0;
  const lPct = total ? (late    / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', background: '#F1F5F9', width: '100%' }}>
      <div style={{ width: `${pPct}%`, background: '#22C55E', transition: 'width .7s' }} />
      <div style={{ width: `${lPct}%`, background: '#F59E0B', transition: 'width .7s' }} />
      <div style={{ width: `${aPct}%`, background: '#EF4444', transition: 'width .7s' }} />
    </div>
  );
}

function VisaCountdown({ dDay, expireDate, visaType }) {
  const pct   = Math.max(0, Math.min(100, (dDay / 365) * 100));
  const color = dDay <= 30 ? '#EF4444' : dDay <= 90 ? '#F59E0B' : '#3B82F6';
  const bg    = dDay <= 30 ? '#FEF2F2' : dDay <= 90 ? '#FFFBEB' : '#EFF6FF';
  const label = dDay <= 30 ? '⚠ 만료 임박' : dDay <= 90 ? '갱신 권고' : '정상';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
      <GaugeRing pct={pct} size={96} stroke={10} color={color} trackColor="#EFF6FF"
        label={
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>D-{dDay}</div>
            <div style={{ fontSize: '.625rem', color: '#94A3B8', marginTop: '2px' }}>{visaType}</div>
          </div>
        }
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '.75rem', color: '#64748B', marginBottom: '.375rem' }}>만료 예정일</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{expireDate}</div>
        <div style={{
          marginTop: '.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '3px 8px', borderRadius: '6px', background: bg, color,
          fontSize: '.6875rem', fontWeight: 700,
        }}>{label}</div>
      </div>
    </div>
  );
}

export default function MyDashboard() {
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [visas,       setVisas]       = useState([]);
  const [topiks,      setTopiks]      = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [mileage,     setMileage]     = useState(null);
  const [onlineLimit, setOnlineLimit] = useState(30);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const meRes = await apiFetch('/auth/me');
      
      if (!meRes || meRes.success === false) {
        throw new Error(meRes?.message || '인증 정보를 불러오지 못했습니다.');
      }

      const meData = meRes.data ?? meRes;
      const sid = meData?.userId ?? meData?.studentId ?? (typeof meData === 'string' || typeof meData === 'number' ? String(meData) : null);
      const userRole = meData?.role ?? meData?.authority; 

      if (!sid) {
        throw new Error('사용자 식별 번호(학번)를 찾을 수 없습니다.');
      }

      const [visaRes, topikRes, enrollRes, mileRes] = await Promise.allSettled([
        apiFetch(`/students/${sid}/visas`),
        apiFetch(`/students/${sid}/topik`),
        apiFetch(`/students/${sid}/enrollments`),
        apiFetch(`/students/${sid}/mileage`),
      ]);

      if (visaRes.status === 'fulfilled' && visaRes.value?.success) {
        setVisas(toArray(visaRes.value.data));
      }
      if (topikRes.status === 'fulfilled' && topikRes.value?.success) {
        setTopiks(toArray(topikRes.value.data));
      }
      if (enrollRes.status === 'fulfilled' && enrollRes.value?.success) {
        setEnrollments(toArray(enrollRes.value.data));
      }
      if (mileRes.status === 'fulfilled' && mileRes.value?.success) {
        setMileage(mileRes.value.data);
      }
      
      const isAdmin = userRole === 'ADMIN' || userRole === 'ROLE_ADMIN';
      
      if (isAdmin) {
        try {
          const schedRes = await apiFetch('/admin/scheduler');
          if (schedRes?.success) {
            const cfg = schedRes.data;
            const val = Array.isArray(cfg)
              ? cfg.find(c => c.configKey === 'ONLINE_LIMIT_RATIO')?.value
              : cfg?.ONLINE_LIMIT_RATIO;
            if (val) setOnlineLimit(Number(val));
          } else {
            setOnlineLimit(30);
          }
        } catch (err) {
          console.warn("스케줄러 데이터를 불러오지 못해 기본값(30%)으로 대체합니다.");
          setOnlineLimit(30);
        }
      } else {
        setOnlineLimit(30);
      }

    } catch (err) {
      console.error("Dashboard Load Error:", err);
      setError(err.message || '데이터를 불러오지 못했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  const currentVisa = visas.find(v => v.isCurrent) ?? visas[0] ?? null;
  const dDay = currentVisa?.expireDate
    ? Math.max(0, Math.ceil((new Date(currentVisa.expireDate) - Date.now()) / 86400000))
    : null;

  const latestTopik = topiks[0] ?? null;

  const totalCredits  = enrollments.reduce((s, e) => s + (e.credits ?? 0), 0);
  const onlineCredits = enrollments.filter(e => e.onlineType === 'ONLINE').reduce((s, e) => s + (e.credits ?? 0), 0);
  const onlinePct     = totalCredits > 0 ? Math.round((onlineCredits / totalCredits) * 100) : 0;
  const onlineColor   = onlinePct > onlineLimit ? '#EF4444' : onlinePct > onlineLimit * 0.8 ? '#F59E0B' : '#3B82F6';

  const totalMileage    = mileage?.totalScore ?? mileage?.totalMileage ?? mileage?.total ?? 0;
  const semesterMileage = mileage?.semesterScore ?? mileage?.semesterMileage ?? mileage?.semester ?? 0;
  const mileageHistory  = toArray(mileage);

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { from{background-position:200% 0} to{background-position:-200% 0} }

        .db-wrap{animation:fadeUp .28s ease;width:100%;box-sizing:border-box;font-family:'DM Sans','Noto Sans KR',sans-serif;color:#111827;padding:4px 22px 24px}
        .sec-lbl{font-size:.6875rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.07em;margin-bottom:.75rem}

        .stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;margin-bottom:1.75rem}
        .stat-card{background:#fff;border-radius:1rem;padding:1.375rem 1.25rem 1.125rem;border:1px solid #F1F5F9;transition:all .2s;position:relative;overflow:hidden}
        .stat-card::after{content:'';position:absolute;top:0;left:0;right:0;height:3px}
        .stat-card.c-blue::after{background:#3B82F6}
        .stat-card.c-violet::after{background:#8B5CF6}
        .stat-card.c-green::after{background:#10B981}
        .stat-card:hover{transform:translateY(-3px);box-shadow:0 10px 28px -6px rgba(0,0,0,.09)}
        .stat-lbl{font-size:.75rem;color:#64748B;margin-bottom:.6rem;font-weight:500}

        .data-card{background:#fff;border-radius:1rem;border:1px solid #F1F5F9;overflow:hidden;margin-bottom:1.5rem}
        .card-hd{padding:.9375rem 1.25rem;border-bottom:1px solid #F8FAFC;display:flex;justify-content:space-between;align-items:center}
        .card-hd-title{font-size:.875rem;font-weight:700;color:#0F172A}
        .card-badge{font-size:.6875rem;font-weight:600;color:#64748B;background:#F1F5F9;padding:2px 9px;border-radius:20px}

        .att-th{display:flex;padding:.625rem 1.25rem;background:#FAFBFD;border-bottom:1px solid #F1F5F9;font-size:.75rem;color:#64748B;font-weight:600}
        .att-row{display:flex;align-items:center;padding:.9375rem 1.25rem;border-bottom:1px solid #F8FAFC;gap:.75rem}
        .att-row:last-child{border-bottom:none}
        .att-row:hover{background:#FAFBFD}
        .att-col-name{flex:1;min-width:0}
        .att-col-bar{width:9rem}
        .att-col-nums{width:8rem;font-size:.8rem;color:#4B5563;text-align:center;font-variant-numeric:tabular-nums}
        .att-col-status{width:4.5rem;text-align:right}
        .course-name{font-size:.8125rem;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .course-code{font-size:.6875rem;color:#94A3B8;margin-top:1px}

        .gauge-section{padding:1.5rem;display:flex;align-items:flex-start;gap:2rem;flex-wrap:wrap}
        .gauge-detail{flex:1;min-width:200px}
        .gauge-row{display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem}
        .gauge-lbl{font-size:.8125rem;color:#374151;width:6rem;flex-shrink:0}
        .prog-track{flex:1;height:8px;background:#F1F5F9;border-radius:4px;overflow:hidden}
        .prog-fill{height:100%;border-radius:4px;transition:width .8s cubic-bezier(.4,0,.2,1)}
        .prog-val{font-size:.8125rem;font-weight:700;width:3rem;text-align:right;flex-shrink:0}

        .mile-history{display:flex;flex-direction:column;gap:.5rem}
        .mile-item{display:flex;align-items:center;justify-content:space-between;padding:.625rem .875rem;background:#FAFBFD;border-radius:.625rem;gap:1rem}
        .mile-item-name{font-size:.8125rem;color:#374151;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1}
        .mile-item-pts{font-size:.8125rem;font-weight:700;}
        .mile-item-date{font-size:.6875rem;color:#94A3B8}

        .pill{font-size:.6875rem;padding:3px 9px;border-radius:6px;font-weight:700;display:inline-block;white-space:nowrap}
        .pill-green{background:#ECFDF5;color:#059669}
        .pill-amber{background:#FFFBEB;color:#B45309}
        .pill-red{background:#FEF2F2;color:#DC2626}

        .err-banner{margin-bottom:1.5rem;background:#FEF2F2;border:1px solid #FECACA;border-radius:.75rem;padding:1rem 1.25rem;display:flex;align-items:center;gap:.75rem;color:#DC2626;font-size:.875rem}
      `}</style>

      <TopBar title="종합 대시보드" />

      <div className="db-wrap">
        {error && (
          <div className="err-banner">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01" strokeLinecap="round"/>
            </svg>
            {error}
            <button onClick={loadAll} style={{ marginLeft:'auto', padding:'4px 12px', borderRadius:'6px', border:'1px solid #FECACA', background:'#fff', color:'#DC2626', cursor:'pointer', fontSize:'.8125rem', fontWeight:600 }}>
              재시도
            </button>
          </div>
        )}

        <div className="sec-lbl">주요 현황</div>
        <div className="stat-grid">
          
          <div className="stat-card c-blue">
            <div className="stat-lbl">체류 비자 만료</div>
            {loading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
                <Skeleton h="1.5rem" w="60%"/><Skeleton h="1rem" w="80%"/>
              </div>
            ) : currentVisa ? (
              <VisaCountdown dDay={dDay} expireDate={currentVisa.expireDate} visaType={currentVisa.visaType ?? '일반유학(D-2)'} />
            ) : (
              <div style={{ fontSize:'.875rem', color:'#94A3B8' }}>비자 정보 없음</div>
            )}
          </div>

          <div className="stat-card c-green">
            <div className="stat-lbl">한국어 능력 (TOPIK)</div>
            {loading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
                <Skeleton h="2.5rem" w="50%"/><Skeleton h="1rem" w="70%"/>
              </div>
            ) : latestTopik ? (
              <>
                <div style={{ fontSize:'2.25rem', fontWeight:700, color:'#0F172A', lineHeight:1 }}>
                  {latestTopik.topikLevel}
                  <span style={{ fontSize:'.875rem', fontWeight:400, color:'#94A3B8', marginLeft:'3px' }}>급</span>
                </div>
                <div style={{ fontSize:'.6875rem', color:'#94A3B8', marginTop:'.5rem' }}>
                  시험일: <strong style={{ color:'#10B981' }}>{latestTopik.examDate ?? '정보 없음'}</strong>
                </div>
              </>
            ) : (
              <div style={{ fontSize:'.875rem', color:'#94A3B8' }}>어학 성적 없음</div>
            )}
          </div>

          <div className="stat-card c-violet">
            <div className="stat-lbl">보유 KM 마일리지</div>
            {loading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
                <Skeleton h="2.5rem" w="50%"/><Skeleton h="1rem" w="70%"/>
              </div>
            ) : (
              <>
                <div style={{ fontSize:'2.25rem', fontWeight:700, color:'#0F172A', lineHeight:1 }}>
                  {totalMileage.toLocaleString()}
                  <span style={{ fontSize:'.875rem', fontWeight:400, color:'#94A3B8', marginLeft:'3px' }}>점</span>
                </div>
                <div style={{ fontSize:'.6875rem', color:'#94A3B8', marginTop:'.5rem' }}>
                  이번 학기 취득: <strong style={{ color:'#8B5CF6' }}>+{semesterMileage}점</strong>
                </div>
                {mileageHistory.length > 0 && (
                  <div className="mile-history" style={{ marginTop:'.875rem' }}>
                    {mileageHistory.slice(0, 2).map((h, i) => {
                      const title = h.reason ?? h.activityName ?? h.title ?? '마일리지 변동';
                      const amount = h.changeAmount ?? h.points ?? h.point ?? 0;
                      const amountStr = amount > 0 ? `+${amount}` : amount;
                      const amountColor = amount > 0 ? '#3B82F6' : '#EF4444';
                      
                      const rawDate = h.createdAt ?? h.earnedDate ?? h.date;
                      const dateStr = rawDate && typeof rawDate === 'string' ? rawDate.split('T')[0] : rawDate;

                      return (
                        <div className="mile-item" key={i}>
                          <span className="mile-item-name" title={title}>{title}</span>
                          <div style={{ textAlign:'right', flexShrink:0 }}>
                            <div className="mile-item-pts" style={{ color: amountColor }}>{amountStr}점</div>
                            <div className="mile-item-date">{dateStr}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="sec-lbl">학사 정보 및 상태</div>

        <div className="data-card">
          <div className="card-hd">
            <div className="card-hd-title">이번 학기 출결 현황</div>
          </div>
          <div className="att-th">
            <span className="att-col-name">수강 과목</span>
            <span className="att-col-bar" style={{ textAlign:'center' }}>출결 분포</span>
            <span className="att-col-nums">출석 / 결석 / 지각</span>
            <span className="att-col-status">상태</span>
          </div>
          {loading ? (
            [1,2,3].map(i => (
              <div className="att-row" key={i}>
                <div className="att-col-name"><Skeleton h="1rem" w="70%"/></div>
                <div className="att-col-bar"><Skeleton h="6px"/></div>
                <div className="att-col-nums"><Skeleton h="1rem" w="80%"/></div>
                <div className="att-col-status"><Skeleton h="1.25rem" w="3rem"/></div>
              </div>
            ))
          ) : enrollments.length === 0 ? (
            <div style={{ padding:'1.5rem', textAlign:'center', color:'#94A3B8', fontSize:'.875rem' }}>수강 정보가 없습니다.</div>
          ) : (
            enrollments.map((e, i) => {
              const present   = (e.totalWeeks ?? 0) - (e.absentCount ?? 0) - (e.lateCount ?? 0);
              const isDanger  = e.warningLevel === '위험';
              const isWarning = e.warningLevel === '주의';
              return (
                <div className="att-row" key={i}>
                  <div className="att-col-name">
                    <div className="course-name">{e.courseName ?? e.courseId}</div>
                    {e.courseCode && <div className="course-code">{e.courseCode}</div>}
                  </div>
                  <div className="att-col-bar">
                    <AttendBar total={e.totalWeeks ?? 0} absent={e.absentCount ?? 0} late={e.lateCount ?? 0} />
                  </div>
                  <div className="att-col-nums">{present}회 / {e.absentCount ?? 0}회 / {e.lateCount ?? 0}회</div>
                  <div className="att-col-status">
                    <span className={`pill ${isDanger ? 'pill-red' : isWarning ? 'pill-amber' : 'pill-green'}`}>
                      {isDanger ? '위험' : isWarning ? '주의' : '정상'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="data-card">
          <div className="card-hd">
            <div className="card-hd-title">순수 온라인 강의 수강 한도</div>
            <div className="card-badge">기준 {onlineLimit}%</div>
          </div>
          <div className="gauge-section">
            {loading ? (
              <Skeleton w="130px" h="130px" radius="50%"/>
            ) : (
              <GaugeRing
                pct={(onlineCredits / Math.max(1, totalCredits * (onlineLimit / 100))) * 100}
                size={130} stroke={13} color={onlineColor}
                label={
                  <div>
                    <div style={{ fontSize:'1.25rem', fontWeight:700, color: onlinePct > onlineLimit ? '#DC2626' : '#0F172A', lineHeight:1 }}>
                      {onlinePct}%
                    </div>
                    <div style={{ fontSize:'.625rem', color:'#94A3B8', marginTop:'2px' }}>온라인 비율</div>
                  </div>
                }
              />
            )}
            <div className="gauge-detail">
              {[
                { label: '온라인 이수', val: `${onlineCredits}학점`, pct: Math.min(100, (onlineCredits / Math.max(1, totalCredits * (onlineLimit / 100))) * 100), color: onlineColor },
                { label: '허용 한도',   val: `${Math.floor(totalCredits * (onlineLimit / 100))}학점`, pct: 100, color: '#E2E8F0' },
                { label: '전체 수강',   val: `${totalCredits}학점`, pct: 100, color: '#CBD5E1' },
              ].map(({ label, val, pct, color }) => (
                <div className="gauge-row" key={label}>
                  <span className="gauge-lbl">{label}</span>
                  <div className="prog-track">
                    <div className="prog-fill" style={{ width: loading ? '0%' : `${pct}%`, background: color }} />
                  </div>
                  <span className="prog-val" style={{ color: label === '온라인 이수' ? onlineColor : '#64748B' }}>
                    {loading ? '-' : val}
                  </span>
                </div>
              ))}

              {!loading && onlinePct > onlineLimit && (
                <div style={{ marginTop:'.75rem', padding:'.625rem .875rem', background:'#FEF2F2', borderRadius:'.625rem', border:'1px solid #FECACA', display:'flex', alignItems:'center', gap:'.5rem' }}>
                  <svg width="16" height="16" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  </svg>
                  <span style={{ fontSize:'.75rem', color:'#DC2626', fontWeight:600 }}>
                    온라인 강의 한도({onlineLimit}%) 초과 — 담당자에게 문의하세요
                  </span>
                </div>
              )}
              {!loading && onlinePct > onlineLimit * 0.8 && onlinePct <= onlineLimit && (
                <div style={{ marginTop:'.75rem', padding:'.625rem .875rem', background:'#FFFBEB', borderRadius:'.625rem', border:'1px solid #FDE68A', fontSize:'.75rem', color:'#92400E', fontWeight:600 }}>
                  ⚠ 한도의 80% 이상 사용 중입니다
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}