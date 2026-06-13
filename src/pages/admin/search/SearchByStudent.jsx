import React, { useState } from 'react';
import axios from 'axios';

// ── API 설정 ──────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 명세서 기준: onlineType ONLINE/OFFLINE/BLENDED
const ONLINE_TYPE_LABEL = {
  ONLINE:   { label: '온라인',   bg: 'transparent', color: '#374151' },
  OFFLINE:  { label: '오프라인', bg: 'transparent', color: '#374151' },
  BLENDED:  { label: '온·오프라인 혼합', bg: 'transparent', color: '#374151' },
};

// 근로 승인상태
const APPROVAL_STATUS_LABEL = {
  PENDING:  { label: '대기중',  bg: '#FFFBEB', color: '#D97706' },
  APPROVED: { label: '승인',    bg: '#F0FDF4', color: '#16A34A' },
  REJECTED: { label: '반려',    bg: '#FEF2F2', color: '#DC2626' },
};

export default function SearchByStudent({ onBack }) {
  const [query, setQuery]     = useState('');
  const [result, setResult]   = useState(null); // { student, visas, topiks, jobs, consultations, enrollments, requiredCourses, requiredCourseCompleted, requiredCourseTotal }
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // profile | enroll | consult | job | topik | visa

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setSearched(true);
    setResult(null);
    setActiveTab('profile');
    try {
      // 명세서 18.1: GET /api/v1/search/student/{studentId}
      const res = await api.get(`/api/v1/search/student/${query.trim()}`);
      if (res.data.success) {
        setResult(res.data.data);
      } else {
        setResult(null);
      }
    } catch (err) {
      console.error('학생 조회 오류:', err);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  // 편의 파싱
  const s   = result?.student       || {};
  const visas        = result?.visas        || [];
  const topiks       = result?.topiks       || [];
  const jobs         = result?.jobs         || [];
  const consultations = result?.consultations || [];
  const enrollments  = result?.enrollments  || [];
  const requiredCourses = result?.requiredCourses || [];
  const reqCompleted = result?.requiredCourseCompleted ?? 0;
  const reqTotal     = result?.requiredCourseTotal     ?? 0;

  // 현재 비자
  const currentVisa = visas.find(v => v.isCurrent) || visas[0];
  // 최신 TOPIK
  const latestTopik = topiks[0];

  const TABS = [
    { key: 'profile', label: '기본정보' },
    { key: 'enroll',  label: `수강목록 (${enrollments.length})` },
    { key: 'consult', label: `상담이력 (${consultations.length})` },
    { key: 'job',     label: `근로현황 (${jobs.length})` },
    { key: 'topik',   label: 'TOPIK' },
    { key: 'visa',    label: '비자' },
  ];

  return (
    <>
      <style>{`
        .sbs-wrap { font-family: 'DM Sans', 'Noto Sans KR', sans-serif; font-size: 14px; color: #111827; }
        .sbs-search-row { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
        .sbs-input { flex: 1; max-width: 360px; padding: 0.65rem 1rem; border: 1.5px solid #E5E7EB; border-radius: 0.625rem; font-size: 0.875rem; outline: none; background: #fff; font-family: inherit; }
        .sbs-input:focus { border-color: #3B82F6; }
        .sbs-search-btn { padding: 0.65rem 1.4rem; background: #1A3A5C; color: #fff; border: none; border-radius: 0.625rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: inherit; }
        .sbs-search-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* 카드 */
        .sbs-card { background: #fff; border-radius: 0.875rem; border: 1px solid #F3F4F6; margin-bottom: 1rem; overflow: hidden; }
        .sbs-card-header { padding: 0.875rem 1.25rem; border-bottom: 1px solid #F3F4F6; font-weight: 700; font-size: 0.875rem; color: #1A3A5C; display: flex; align-items: center; gap: 0.5rem; }
        .sbs-card-header::before { content:''; display:inline-block; width:3px; height:1rem; background:#3B82F6; border-radius:2px; flex-shrink:0; }

        /* 프로필 상단 */
        .sbs-profile-top { display: flex; gap: 1.5rem; padding: 1.25rem; align-items: flex-start; }
        .sbs-photo { width: 88px; height: 110px; border-radius: 0.5rem; background: #EFF6FF; border: 2px solid #DBEAFE; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
        .sbs-photo img { width: 100%; height: 100%; object-fit: cover; }
        .sbs-info-main { flex: 1; }
        .sbs-name-row { display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 0.625rem; flex-wrap: wrap; }
        .sbs-eng-name { font-size: 1.25rem; font-weight: 700; color: #111827; }
        .sbs-kor-name { font-size: 0.9375rem; color: #6B7280; font-weight: 500; }
        .sbs-id-badge { font-size: 0.75rem; background: #EFF6FF; color: #2563EB; padding: 2px 10px; border-radius: 20px; font-weight: 700; }

        /* 태그 */
        .sbs-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .sbs-tag { font-size: 0.6875rem; padding: 3px 10px; border-radius: 20px; font-weight: 600; }
        .tag-blue   { background: #EFF6FF; color: #2563EB; }
        .tag-green  { background: #F0FDF4; color: #16A34A; }
        .tag-purple { background: #F5F3FF; color: #7C3AED; }
        .tag-red    { background: #FEF2F2; color: #EF4444; }
        .tag-gray   { background: #F3F4F6; color: #374151; }
        .tag-amber  { background: #FFFBEB; color: #D97706; }

        /* 정보 그리드 */
        .sbs-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem 1.5rem; }
        .sbs-info-label { font-size: 0.6875rem; color: #9CA3AF; font-weight: 500; margin-bottom: 2px; }
        .sbs-info-value { font-size: 0.8125rem; font-weight: 600; color: #111827; }

        /* 통계 */
        .sbs-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid #F3F4F6; }
        .sbs-stat-box { padding: 0.875rem 1.25rem; text-align: center; border-right: 1px solid #F3F4F6; }
        .sbs-stat-box:last-child { border-right: none; }
        .sbs-stat-val { font-size: 1.375rem; font-weight: 700; color: #111827; }
        .sbs-stat-lbl { font-size: 0.6875rem; color: #9CA3AF; margin-top: 2px; }

        /* 탭 */
        .sbs-tabs { display: flex; gap: 4px; padding: 0 1.25rem; border-bottom: 1px solid #F3F4F6; background: #FAFAFA; overflow-x: auto; }
        .sbs-tab { padding: 10px 16px; font-size: 0.8125rem; font-weight: 500; color: #6B7280; border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; white-space: nowrap; font-family: inherit; transition: all 0.15s; }
        .sbs-tab.active { color: #1A3A5C; font-weight: 700; border-bottom-color: #3B82F6; }
        .sbs-tab-body { padding: 1.25rem; }

        /* 테이블 */
        .sbs-table-wrap { overflow-x: auto; }
        .sbs-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; min-width: 600px; }
        .sbs-table th { padding: 0.6rem 0.75rem; background: #F9FAFB; color: #6B7280; font-weight: 600; text-align: left; border-bottom: 1px solid #F3F4F6; white-space: nowrap; }
        .sbs-table th.center { text-align: center; }
        .sbs-table td { padding: 0.6rem 0.75rem; border-bottom: 1px solid #F9FAFB; vertical-align: middle; }
        .sbs-table td.center { text-align: center; }
        .sbs-table tr:last-child td { border-bottom: none; }

        /* 배지 */
        .sbs-badge { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px; display: inline-block; }

        /* 상담 */
        .sbs-counsel-item { padding: 1rem 0; border-bottom: 1px solid #F9FAFB; }
        .sbs-counsel-item:last-child { border-bottom: none; }
        .sbs-counsel-meta { font-size: 0.75rem; font-weight: 700; color: #6B7280; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
        .sbs-counsel-text { font-size: 0.8125rem; color: #374151; line-height: 1.65; background: #F9FAFB; border-radius: 0.5rem; padding: 0.75rem 1rem; }

        /* 교양필수 진행률 */
        .sbs-progress-bar { height: 8px; background: #E5E7EB; border-radius: 4px; overflow: hidden; margin-top: 4px; }
        .sbs-progress-fill { height: 100%; background: #3B82F6; border-radius: 4px; transition: width 0.3s; }

        /* 비어있음 / 초기 */
        .sbs-empty { padding: 2rem; text-align: center; color: #9CA3AF; font-size: 0.8125rem; }
        .sbs-not-found { padding: 3rem; text-align: center; background: #fff; border-radius: 0.875rem; border: 1px solid #F3F4F6; }
      `}</style>

      <div className="sbs-wrap">
        {/* ── 검색바 ── */}
        <div className="sbs-search-row">
          <input
            className="sbs-input"
            placeholder="학번을 입력하세요 (예: 25071001)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="sbs-search-btn" onClick={handleSearch} disabled={isLoading}>
            {isLoading ? '조회 중...' : '검색'}
          </button>
        </div>

        {/* ── 초기 상태 ── */}
        {!searched && (
          <div className="sbs-not-found">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
            <p style={{ fontWeight: 600, color: '#374151' }}>학번으로 학생을 검색하세요</p>
          </div>
        )}

        {/* ── 결과 없음 ── */}
        {searched && !result && !isLoading && (
          <div className="sbs-not-found">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>😶</div>
            <p style={{ fontWeight: 600, color: '#374151' }}>학생 정보를 찾을 수 없습니다</p>
          </div>
        )}

        {/* ── 학생 정보 ── */}
        {result && (
          <>
            {/* 상단 프로필 카드 */}
            <div className="sbs-card">
              <div className="sbs-card-header">학생 기본 정보</div>
              <div className="sbs-profile-top">
                <div className="sbs-photo">
                  {s.photoUrl
                    ? <img src={s.photoUrl} alt="프로필" />
                    : <span style={{ fontSize: '2.5rem', color: '#BFDBFE' }}>👤</span>
                  }
                </div>
                <div className="sbs-info-main">
                  <div className="sbs-name-row">
                    <span className="sbs-eng-name">{s.engName}</span>
                    {s.korName && <span className="sbs-kor-name">{s.korName}</span>}
                    <span className="sbs-id-badge">{s.studentId}</span>
                  </div>
                  <div className="sbs-tags">
                    {s.gender     && <span className="sbs-tag tag-blue">{s.gender}</span>}
                    {s.nationality && <span className="sbs-tag tag-gray">🌏 {s.nationality}</span>}
                    {s.grade      && <span className="sbs-tag tag-purple">{s.grade}학년</span>}
                    {s.classSec   && <span className="sbs-tag tag-purple">{s.classSec}반</span>}
                    <span className="sbs-tag tag-purple">TOPIK {latestTopik?.topikLevel ?? '없음'}급</span>
                    <span className={`sbs-tag ${s.enrollStatus === '등록' ? 'tag-blue' : 'tag-red'}`}>
                      {s.enrollStatus}
                    </span>
                    {currentVisa && (
                      <span className="sbs-tag tag-green">{currentVisa.visaType}</span>
                    )}
                  </div>
                  <div className="sbs-info-grid">
                    <div>
                      <div className="sbs-info-label">소속 학과</div>
                      <div className="sbs-info-value">{s.deptName || '-'}</div>
                    </div>
                    <div>
                      <div className="sbs-info-label">연락처</div>
                      <div className="sbs-info-value">{s.phone || '-'}</div>
                    </div>
                    <div>
                      <div className="sbs-info-label">생년월일</div>
                      <div className="sbs-info-value">{s.birthDate || '-'}</div>
                    </div>
                    <div>
                      <div className="sbs-info-label">입학일</div>
                      <div className="sbs-info-value">{s.admissionDate || '-'}</div>
                    </div>
                    <div>
                      <div className="sbs-info-label">비자 만료일</div>
                      <div className="sbs-info-value">{currentVisa?.expireDate || '-'}</div>
                    </div>
                    <div>
                      <div className="sbs-info-label">교양필수 이수</div>
                      <div className="sbs-info-value">{reqCompleted} / {reqTotal} 과목</div>
                      {reqTotal > 0 && (
                        <div className="sbs-progress-bar">
                          <div className="sbs-progress-fill" style={{ width: `${Math.round(reqCompleted / reqTotal * 100)}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 통계 바 */}
              <div className="sbs-stats-row">
                <div className="sbs-stat-box">
                  <div className="sbs-stat-val">{s.totalCredits ?? 0}</div>
                  <div className="sbs-stat-lbl">총이수학점</div>
                </div>
                <div className="sbs-stat-box">
                  {/* 명세서: gpa (totalGpa 아님) */}
                  <div className="sbs-stat-val">{s.gpa?.toFixed(2) ?? '0.00'}</div>
                  <div className="sbs-stat-lbl">전체 평점</div>
                </div>
                <div className="sbs-stat-box">
                  <div className="sbs-stat-val">{enrollments.length}</div>
                  <div className="sbs-stat-lbl">수강 과목 수</div>
                </div>
                <div className="sbs-stat-box">
                  <div className="sbs-stat-val">{consultations.length}</div>
                  <div className="sbs-stat-lbl">상담 횟수</div>
                </div>
              </div>
            </div>

            {/* 탭 카드 */}
            <div className="sbs-card">
              <div className="sbs-tabs">
                {TABS.map(t => (
                  <button
                    key={t.key}
                    className={`sbs-tab ${activeTab === t.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── 기본정보 탭 ── */}
              {activeTab === 'profile' && (
                <div className="sbs-tab-body">
                  {/* 교양필수 이수 현황 */}
                  {requiredCourses.length > 0 && (
                    <>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#1A3A5C' }}>교양필수 이수 현황</div>
                      <div className="sbs-table-wrap" style={{ marginBottom: 20 }}>
                        <table className="sbs-table">
                          <thead>
                            <tr>
                              <th>과목명</th>
                              <th className="center">이수여부</th>
                            </tr>
                          </thead>
                          <tbody>
                            {requiredCourses.map((rc, i) => (
                              <tr key={i}>
                                <td>{rc.courseName}</td>
                                <td className="center">
                                  <span className={`sbs-badge ${rc.completed ? 'tag-green' : 'tag-gray'}`}>
                                    {rc.completed ? '이수' : '미이수'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                  {requiredCourses.length === 0 && (
                    <div className="sbs-empty">교양필수 이수 정보가 없습니다.</div>
                  )}
                </div>
              )}

              {/* ── 수강목록 탭 ── */}
              {activeTab === 'enroll' && (
                <div className="sbs-tab-body">
                  {enrollments.length === 0 ? (
                    <div className="sbs-empty">수강 내역이 없습니다.</div>
                  ) : (
                    <div className="sbs-table-wrap">
                      <table className="sbs-table">
                        <thead>
                          <tr>
                            <th>학기</th>
                            <th>과목명</th>
                            <th className="center">이수구분</th>
                            <th className="center">학점</th>
                            <th className="center">수업방식</th>
                            <th className="center">성적</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrollments.map((en, i) => {
                            const onlineStyle = ONLINE_TYPE_LABEL[en.onlineType] || ONLINE_TYPE_LABEL.OFFLINE;
                            return (
                              <tr key={en.enrollId ?? i}>
                                <td style={{ color: '#9CA3AF', fontSize: 12 }}>{en.semesterId}</td>
                                <td style={{ fontWeight: 600 }}>{en.courseName}</td>
                                <td className="center">
                                  <span className="sbs-badge tag-gray">{en.courseType || '-'}</span>
                                </td>
                                <td className="center">{en.credits}학점</td>
                                <td className="center">
                                  <span className="sbs-badge" style={{ background: onlineStyle.bg, color: onlineStyle.color }}>
                                    {onlineStyle.label}
                                  </span>
                                </td>
                                <td className="center">
                                  <span style={{ fontWeight: 700, color: en.grade ? '#111827' : '#D1D5DB' }}>
                                    {en.grade ?? '-'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── 상담이력 탭 ── */}
              {activeTab === 'consult' && (
                <div className="sbs-tab-body">
                  {consultations.length === 0 ? (
                    <div className="sbs-empty">기록된 상담 내역이 없습니다.</div>
                  ) : (
                    consultations.map((c, i) => (
                      <div className="sbs-counsel-item" key={c.consultId ?? i}>
                        <div className="sbs-counsel-meta">
                          <span>{c.consultDate}</span>
                          <span>|</span>
                          <span>{c.professorName} 교수</span>
                          {c.crisisFlag && (
                            <span className="sbs-badge tag-red" style={{ fontSize: 11 }}>⚠ 위기징후</span>
                          )}
                        </div>
                        <div className="sbs-counsel-text">{c.rawContent}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── 근로현황 탭 ── */}
              {activeTab === 'job' && (
                <div className="sbs-tab-body">
                  {jobs.length === 0 ? (
                    <div className="sbs-empty">근로 이력이 없습니다.</div>
                  ) : (
                    <div className="sbs-table-wrap">
                      <table className="sbs-table">
                        <thead>
                          <tr>
                            <th>사업체명</th>
                            <th>업종</th>
                            <th>근무지</th>
                            <th className="center">주간 근로시간</th>
                            <th className="center">시급</th>
                            <th>기간</th>
                            <th className="center">승인상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobs.map((j, i) => {
                            const apv = APPROVAL_STATUS_LABEL[j.approvalStatus] || { label: j.approvalStatus, bg: '#F3F4F6', color: '#374151' };
                            return (
                              <tr key={j.jobId ?? i}>
                                <td style={{ fontWeight: 600 }}>{j.companyName || '-'}</td>
                                <td>{j.industry || '-'}</td>
                                <td style={{ fontSize: 12, color: '#6B7280' }}>{j.workAddress || '-'}</td>
                                <td className="center">{j.workHoursPerWeek}시간</td>
                                <td className="center">{j.wage?.toLocaleString()}원</td>
                                <td style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>
                                  {j.startDate} ~ {j.endDate || ''}
                                </td>
                                <td className="center">
                                  <span className="sbs-badge" style={{ background: apv.bg, color: apv.color }}>
                                    {apv.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── TOPIK 탭 ── */}
              {activeTab === 'topik' && (
                <div className="sbs-tab-body">
                  {topiks.length === 0 ? (
                    <div className="sbs-empty">TOPIK 이력이 없습니다.</div>
                  ) : (
                    <div className="sbs-table-wrap">
                      <table className="sbs-table">
                        <thead>
                          <tr>
                            <th className="center">TOPIK 급수</th>
                            <th>시험일</th>
                            <th>어학원명</th>
                            <th className="center">어학원 수강급수</th>
                            <th>한국어학습 시작</th>
                            <th className="center">기초평가</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topiks.map((t, i) => (
                            <tr key={t.langId ?? i}>
                              <td className="center">
                                <span className="sbs-badge tag-purple">{t.topikLevel}급</span>
                              </td>
                              <td>{t.examDate || '-'}</td>
                              <td>{t.instituteName || '-'}</td>
                              <td className="center">{t.instituteLevel ?? '-'}급</td>
                              <td>{t.koreanStartDate || '-'}</td>
                              <td className="center">{t.basicTestResult ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── 비자 탭 ── */}
              {activeTab === 'visa' && (
                <div className="sbs-tab-body">
                  {visas.length === 0 ? (
                    <div className="sbs-empty">비자 이력이 없습니다.</div>
                  ) : (
                    <div className="sbs-table-wrap">
                      <table className="sbs-table">
                        <thead>
                          <tr>
                            <th>비자 종류</th>
                            <th>만료일</th>
                            <th className="center">현재 비자</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visas.map((v, i) => (
                            <tr key={v.visaId ?? i}>
                              <td style={{ fontWeight: 600 }}>{v.visaType}</td>
                              <td>{v.expireDate}</td>
                              <td className="center">
                                {v.isCurrent
                                  ? <span className="sbs-badge tag-green">현재</span>
                                  : <span className="sbs-badge tag-gray">이전</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}