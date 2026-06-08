import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import TopBar from '../../../components/layout/TopBar.jsx';

// 1. 공통 Axios 인스턴스 설정
const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  // 정확한 토큰 키 이름(accessToken)으로 변경 완료!
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 2. 전역 스타일시트 정의
const GLOBAL_PROFILE_CSS = `
  .sw-content { padding: 4px 4px 24px; }
  .sec-label { font-size: 1rem; font-weight: 700; color: #1E293B; margin: 1.5rem 0 .75rem; padding-left: 4px; }

  .data-card { background: #fff; border-radius: 14px; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01); overflow: hidden; margin-bottom: 1.25rem; }
  .card-hd { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid #F1F5F9; }
  .card-hd-title { font-size: .9375rem; font-weight: 700; color: #0F172A; }
  .card-badge { font-size: .75rem; font-weight: 600; background: #F1F5F9; color: #475569; padding: 4px 8px; border-radius: 6px; }
  .card-body { padding: 1.5rem; }

  .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; }
  .info-item-lbl { font-size: .75rem; font-weight: 600; color: #94A3B8; margin-bottom: .25rem; text-transform: uppercase; }
  .info-item-val { font-size: .9375rem; font-weight: 600; color: #334155; }

  .tbl-wrap { width: 100%; overflow-x: auto; background: #fff; }
  .base-tbl { width: 100%; border-collapse: collapse; text-align: left; font-size: .875rem; }
  .base-tbl th { background: #F8FAFC; color: #64748B; font-weight: 600; padding: .75rem 1.5rem; border-bottom: 1px solid #E2E8F0; font-size: .75rem; }
  .base-tbl td { padding: .875rem 1.5rem; border-bottom: 1px solid #F1F5F9; color: #334155; font-weight: 500; vertical-align: middle; }
  .base-tbl tbody tr:last-child td { border-bottom: none; }

  .pill { display: inline-flex; align-items: center; padding: 4px 10px; font-size: .75rem; font-weight: 600; border-radius: 6px; line-height: 1; }
  .pill-green { background: #ECFDF5; color: #059669; }
  .pill-amber { background: #FFFBEB; color: #D97706; }
  .pill-red { background: #FEF2F2; color: #DC2626; }
  .pill-blue { background: #EFF6FF; color: #2563EB; }
  .pill-violet { background: #F5F3FF; color: #7C3AED; }
  .pill-gray { background: #F1F5F9; color: #475569; }
`;

function Skeleton({ h = '1rem', w = '100%' }) {
  return (
    <div style={{ 
      height: h, width: w, backgroundColor: '#E2E8F0', borderRadius: '6px',
      animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite', marginTop: '2px'
    }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }`}</style>
    </div>
  );
}

function ErrBanner({ msg, onRetry }) {
  return (
    <div style={styles.errBanner}>
      <span>{msg}</span>
      {onRetry && <button onClick={onRetry} style={styles.retryBtn}>다시 시도</button>}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={styles.emptyState}>{text}</div>
  );
}

export default function MyProfile() {
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [student, setStudent]   = useState(null);
  const [visas, setVisas]       = useState([]);
  const [topik, setTopik]       = useState([]);

  const load = useCallback(async () => {
    setLoading(true); 
    setError(null);
    try {
      // 1. 내 로그인 세션 정보 조회
      const meRes = await api.get('/auth/me');
      const body = meRes.data;
      const meData = body?.data ?? body;
      
      // 대시보드와 동일한 방식의 견고한 학번 추출
      const sid = meData?.userId ?? meData?.studentId ?? (typeof meData === 'string' || typeof meData === 'number' ? String(meData) : null);
      
      if (!sid) {
        throw new Error('사용자 식별 번호(학번)를 찾을 수 없습니다.');
      }
      
      // 2. 학적, 비자, TOPIK 이력 병렬 요청
      // Promise.allSettled를 사용하여 일부 API가 권한 문제(403) 등으로 실패해도 프로필 화면 전체가 터지지 않게 방어
      const [sRes, vRes, tRes] = await Promise.allSettled([
        api.get(`/students/${sid}`),
        api.get(`/students/${sid}/visas`),
        api.get(`/students/${sid}/topik`),
      ]);
      
      // 학적(기본 프로필) 데이터 매핑 (필수)
      if (sRes.status === 'fulfilled') {
        setStudent(sRes.value.data?.data ?? sRes.value.data);
      } else {
        throw new Error('기본 인적사항을 불러오지 못했습니다.');
      }

      // 비자 데이터 매핑 (선택적 표시)
      if (vRes.status === 'fulfilled') {
        const vData = vRes.value.data?.data ?? vRes.value.data;
        setVisas(Array.isArray(vData) ? vData : []);
      } else {
        console.warn('비자 정보 조회 실패 (권한 또는 404)');
        setVisas([]);
      }

      // TOPIK 데이터 매핑 (선택적 표시)
      if (tRes.status === 'fulfilled') {
        const tData = tRes.value.data?.data ?? tRes.value.data;
        setTopik(Array.isArray(tData) ? tData : []);
      } else {
        console.warn('TOPIK 정보 조회 실패 (권한 또는 404)');
        setTopik([]);
      }

    } catch (err) {
      console.error(err);
      setError(err.message || '프로필 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const currentVisa  = visas.find(v => v.isCurrent) ?? visas[0] ?? null;
  const latestTopik  = topik[0] ?? null;
  
  // 백엔드 포스트맨 명세인 '재학', '휴학' 등에 맞춰 매핑
  const statusColor  = {
    '재학': 'pill-green', '휴학': 'pill-amber', '졸업': 'pill-gray', '제적': 'pill-red',
  };

  const InfoItem = ({ label, value, children }) => (
    <div>
      <div className="info-item-lbl">{label}</div>
      <div className="info-item-val">{children ?? value ?? '—'}</div>
    </div>
  );

  return (
    <>
      <style>{GLOBAL_PROFILE_CSS}</style>
      <div className="sw-main">
        <TopBar title="프로필" />
        <div className="sw-content">
          {error && <ErrBanner msg={error} onRetry={load} />}

          {/* 상단 프로필 히어로 카드 */}
          <div className="data-card" style={styles.mb24}>
            <div className="card-body" style={styles.heroLayout}>
              <div style={styles.avatar}>
                {loading ? '?' : (student?.korName?.charAt(0).toUpperCase() ?? 'S')}
              </div>

              <div style={styles.flex1}>
                {loading ? (
                  <div style={styles.skeletonColumn}>
                    <Skeleton w="140px" h="1.5rem" />
                    <Skeleton w="200px" h="1rem" />
                  </div>
                ) : (
                  <>
                    <div style={styles.metaRow}>
                      <span style={styles.studentName}>{student?.korName}</span>
                      <span className={`pill ${statusColor[student?.enrollStatus] ?? 'pill-gray'}`}>
                        {student?.enrollStatus ?? '재학'}
                      </span>
                    </div>
                    <div style={styles.studentSubText}>
                      {student?.deptName} · {student?.grade}학년 {student?.classSec}반 &nbsp;|&nbsp; 학번: {student?.studentId}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 인적사항 격자 배치 */}
          <div className="sec-label">인적사항</div>
          <div className="data-card">
            <div className="card-hd">
              <div className="card-hd-title">기본 신원 정보</div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="info-grid">
                  {[...Array(8)].map((_, i) => (
                    <div key={i}>
                      <Skeleton h=".75rem" w="60px" />
                      <div style={styles.mt6}><Skeleton h="1.1rem" /></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="info-grid">
                  <InfoItem label="성명 (Name)"     value={student?.korName} />
                  <InfoItem label="영문 성명 (English Name)" value={student?.engName} />
                  <InfoItem label="성별 (Gender)"   value={student?.gender} />
                  <InfoItem label="생년월일 (Birth)" value={student?.birthDate} />
                  <InfoItem label="국적 (Nationality)" value={student?.nationality} />
                  <InfoItem label="소속 학과 (Dept)"  value={student?.deptName} />
                  <InfoItem label="학년 / 반"  value={`${student?.grade}학년 ${student?.classSec}반`} />
                  <InfoItem label="연락처 (Phone)"   value={student?.phone} />
                  <InfoItem label="입학 일자 (Admission)" value={student?.admissionDate} />
                  <InfoItem label="학적 상태 (Status)">
                    <span className={`pill ${statusColor[student?.enrollStatus] ?? 'pill-gray'}`}>{student?.enrollStatus ?? '재학'}</span>
                  </InfoItem>
                </div>
              )}
            </div>
          </div>

          {/* 비자 정보 */}
          <div className="sec-label">비자 정보 (Visa Status)</div>
          <div className="data-card">
            <div className="card-hd">
              <div className="card-hd-title">현재 유효 비자</div>
              {visas.length > 1 && <div className="card-badge">체류 이력 {visas.length}건</div>}
            </div>
            {loading ? (
              <div className="card-body"><Skeleton h="4rem" /></div>
            ) : !currentVisa ? (
              <EmptyState text="등록된 비자 인증 기록이 존재하지 않습니다." />
            ) : (
              <>
                <div className="card-body">
                  <div className="info-grid">
                    <InfoItem label="비자 종류 (Visa Type)"  value={currentVisa.visaType} />
                    <InfoItem label="발급일 (Issue Date)"   value={currentVisa.issueDate} />
                    <InfoItem label="만료일 (Expiry Date)"  value={currentVisa.expireDate} />
                    <InfoItem label="체류 잔여일 (D-Day)">
                      {(() => {
                        const dDay = Math.ceil((new Date(currentVisa.expireDate) - Date.now()) / 86400000);
                        const isExpired = dDay < 0;
                        return (
                          <span className={`pill ${isExpired || dDay <= 30 ? 'pill-red' : dDay <= 90 ? 'pill-amber' : 'pill-green'}`}>
                            {isExpired ? '만료됨' : `D-${Math.max(0, dDay)}`}
                          </span>
                        );
                      })()}
                    </InfoItem>
                  </div>
                </div>

                {visas.length > 1 && (
                  <>
                    <div style={styles.historySubLabel}>VISA HISTORY</div>
                    <div className="tbl-wrap" style={styles.borderTopF1}>
                      <table className="base-tbl">
                        <thead>
                          <tr>
                            <th>비자 종류</th>
                            <th>발급일</th>
                            <th>만료일</th>
                            <th>상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visas.map((v, i) => (
                            <tr key={v.visaId ?? i}>
                              <td style={styles.tblBoldText}>{v.visaType}</td>
                              <td>{v.issueDate}</td>
                              <td>{v.expireDate}</td>
                              <td>
                                {v.isCurrent ? <span className="pill pill-blue">현재 적용</span> : <span className="pill pill-gray">만료/이전</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* TOPIK 능력 수준 */}
          <div className="sec-label">한국어 능력 수준 (TOPIK)</div>
          <div className="data-card">
            <div className="card-hd">
              <div className="card-hd-title">공인 TOPIK 성적 취득 기록</div>
              {latestTopik && <div className="card-badge" style={styles.topikBadge}>최고 자격: TOPIK {latestTopik.topikLevel}급</div>}
            </div>
            {loading ? (
              <div className="card-body"><Skeleton h="3rem" /></div>
            ) : topik.length === 0 ? (
              <EmptyState text="등록된 공인 TOPIK 어학 성적이 없습니다." />
            ) : (
              <div className="tbl-wrap">
                <table className="base-tbl">
                  <thead>
                    <tr>
                      <th>인증 급수</th>
                      <th>성적 취득일</th>
                      <th>비고 사항</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topik.map((t, i) => (
                      <tr key={t.langId ?? i}>
                        <td>
                          <span className="pill pill-violet" style={styles.topikPill}>TOPIK {t.topikLevel}급</span>
                        </td>
                        <td style={styles.tblMediumText}>{t.acquiredDate}</td>
                        <td style={styles.tblNoteText}>{t.note ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

// 7. 인라인 스타일 자산 일괄 격리 관리
const styles = {
  errBanner: { padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '.875rem' },
  retryBtn: { background: 'none', border: 'none', color: '#DC2626', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' },
  emptyState: { padding: '3rem 1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '.875rem' },
  mb24: { marginBottom: '1.5rem' },
  heroLayout: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
  avatar: { width: '4.5rem', height: '4.5rem', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.625rem', fontWeight: 700, color: '#fff', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' },
  flex1: { flex: 1 },
  skeletonColumn: { display: 'flex', flexDirection: 'column', gap: '.5rem' },
  metaRow: { display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.375rem' },
  studentName: { fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' },
  studentSubText: { fontSize: '.875rem', color: '#64748B', fontWeight: 500 },
  mt6: { marginTop: '.4rem' },
  historySubLabel: { padding: '0 1.5rem .625rem', fontSize: '.75rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.5px' },
  borderTopF1: { borderTop: '1px solid #F1F5F9' },
  tblBoldText: { fontWeight: 600, color: '#1E293B' },
  tblMediumText: { fontWeight: 600, color: '#334155' },
  tblNoteText: { color: '#94A3B8', fontSize: '.8125rem' },
  topikBadge: { backgroundColor: '#F5F3FF', color: '#7C3AED' },
  topikPill: { padding: '5px 10px' }
};