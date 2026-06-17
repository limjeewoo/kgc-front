import React, { useState } from 'react';
import api from '../../../api/axios';

const APPROVAL_STATUS_LABEL = {
  PENDING:  { label: '대기중',  bg: '#FFFBEB', color: '#D97706' },
  APPROVED: { label: '승인',    bg: '#F0FDF4', color: '#16A34A' },
  REJECTED: { label: '반려',    bg: '#FEF2F2', color: '#DC2626' },
};

const ATTENDANCE_CODE = {
  0: { label: '-', color: '#9CA3AF', title: '미입력' },
  1: { label: '○', color: '#3B82F6', title: '출석' },
  2: { label: '×', color: '#EF4444', title: '결석' },
  3: { label: '△', color: '#F59E0B', title: '지각' },
  4: { label: '◎', color: '#10B981', title: '공결' },
};

export default function SearchByStudent() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null); 
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setSearched(true);
    setResult(null);
    setActiveTab('profile');
    try {
      const res = await api.get(`/api/v1/search/student/${query.trim()}`);
      if (res.data.success) {
        setResult(res.data.data);
      } else {
        setResult(null);
      }
    } catch (err) {
      console.error("검색 중 에러 발생:", err);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  const s = result?.student || {};
  const visas = result?.visas || [];
  const topiks = result?.topiks || [];
  const jobs = result?.jobs || [];
  const consultations = result?.consultations || [];
  const attendances = result?.attendances || result?.attendanceList || result?.enrollments || [];

  const latestTopik = topiks[0];

  const TABS = [
    { key: 'profile', label: '기본정보' },
    { key: 'attend',  label: `수강/출석 (${attendances.length})` },
    { key: 'consult', label: `상담이력 (${consultations.length})` },
    { key: 'job',     label: `근로현황 (${jobs.length})` },
    { key: 'topik',   label: 'TOPIK / 어학원' },
    { key: 'visa',    label: '비자' },
  ];

  return (
    <>
      <style>{`
        .sbs-wrap { font-family: 'Noto Sans KR', sans-serif; font-size: 13px; color: #111827; }
        .sbs-search-row { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; }
        .sbs-input { flex: 1; max-width: 360px; padding: 0.55rem 0.85rem; border: 1.5px solid #E5E7EB; border-radius: 0.375rem; font-size: 0.85rem; outline: none; }
        .sbs-input:focus { border-color: #1A3A5C; }
        .sbs-search-btn { padding: 0.55rem 1.25rem; background: #1A3A5C; color: #fff; border: none; border-radius: 0.375rem; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
        .sbs-search-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .sbs-top-bar { display: flex; align-items: center; background: #F0F4F8; border: 1px solid #D2DCE6; padding: 0.5rem 1rem; border-radius: 4px; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
        .sbs-tb-label-black { background: #000; color: #fff; padding: 0.25rem 0.75rem; font-weight: 700; font-size: 13px; border-radius: 2px; }
        .sbs-tb-id { font-size: 16px; font-weight: 700; color: #1A3A5C; letter-spacing: 0.5px; }
        .sbs-tb-name-box { display: flex; gap: 0.5rem; align-items: center; font-weight: 700; font-size: 14px; color: #333; margin-right: auto; }
        .sbs-tb-meta { display: flex; align-items: center; gap: 1rem; font-size: 12px; color: #4B5563; }
        .sbs-tb-meta span em { font-style: normal; font-weight: 700; color: #111827; margin-left: 4px; }
        .sbs-tb-tag { background: #6B7280; color: #fff; padding: 1px 6px; font-size: 11px; font-weight: 600; border-radius: 2px; }

        .sbs-card { background: #fff; border-radius: 6px; border: 1px solid #E5E7EB; margin-bottom: 1rem; overflow: hidden; }
        .sbs-tabs { display: flex; gap: 2px; background: #F9FAFB; border-bottom: 1px solid #E5E7EB; }
        .sbs-tab { padding: 10px 16px; font-size: 13px; font-weight: 500; color: #4B5563; border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; }
        .sbs-tab.active { color: #1A3A5C; font-weight: 700; border-bottom-color: #1A3A5C; background: #fff; }
        .sbs-tab-body { padding: 1.25rem; }

        .sbs-table-wrap { overflow-x: auto; }
        
        .sbs-attend-table { width: 100%; border-collapse: collapse; font-size: 12px; min-width: 1000px; text-align: center; }
        .sbs-attend-table th { padding: 6px 4px; background: #F8FAFC; color: #334155; font-weight: 600; border: 1px solid #CBD5E1; font-size: 11px; }
        .sbs-attend-table td { padding: 6px 4px; border: 1px solid #E2E8F0; color: #334155; }
        .sbs-attend-table td.left { text-align: left; padding-left: 8px; }
        
        .sbs-warn-badge { font-weight: 700; padding: 2px 6px; border-radius: 3px; font-size: 11px; display: inline-block; }
        .sbs-warn-badge.주의 { background: #FEF3C7; color: #D97706; border: 1px solid #FCD34D; }
        .sbs-warn-badge.위험 { background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; }
        .sbs-warn-badge.정상 { background: #F0FDF4; color: #16A34A; }

        .sbs-grid-profile { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .sbs-pro-item { border-bottom: 1px solid #F3F4F6; padding-bottom: 0.5rem; }
        .sbs-pro-lbl { font-size: 11px; color: #9CA3AF; margin-bottom: 2px; }
        .sbs-pro-val { font-weight: 600; font-size: 13px; }
        .sbs-empty { padding: 2rem; text-align: center; color: #9CA3AF; }
        .sbs-not-found { padding: 3rem; text-align: center; background: #fff; border-radius: 6px; border: 1px solid #E5E7EB; }
        
        .sbs-badge { font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
        .tag-gray { background: #F3F4F6; color: #374151; }
        .tag-green { background: #E8F5E9; color: #2E7D32; }
        .tag-red { background: #FFEBEE; color: #C62828; }
      `}</style>

      <div className="sbs-wrap">
        <div className="sbs-search-row">
          <input
            className="sbs-input"
            placeholder="학번을 입력하세요"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="sbs-search-btn" onClick={handleSearch} disabled={isLoading}>
            {isLoading ? '조회 중...' : '검색'}
          </button>
        </div>

        {!searched && (
          <div className="sbs-not-found">
            <p style={{ color: '#6B7280' }}>학번을 입력하여 검색을 시작해 주세요.</p>
          </div>
        )}

        {searched && !result && !isLoading && (
          <div className="sbs-not-found">
            <p style={{ fontWeight: 600, color: '#EF4444' }}>학생 정보를 찾을 수 없습니다.</p>
          </div>
        )}

        {result && (
          <>
            <div className="sbs-top-bar">
              <div className="sbs-tb-label-black">학번</div>
              <div className="sbs-tb-id">{s.studentId || '-'}</div>
              
              <div className="sbs-tb-name-box">
                <span>{s.engName || '영문명 없음'}</span>
                {s.korName && <span style={{ color: '#6B7280', fontWeight: 'normal', fontSize: '13px' }}>{s.korName}</span>}
              </div>

              <div className="sbs-tb-meta">
                <span>성별:<em>{s.gender || '-'}</em></span>
                <span>총이수학점:<em>{s.totalCredits ?? 0}</em></span>
                <span>평점:<em>{s.gpa?.toFixed(2) ?? '-'}</em></span>
                <span className="sbs-tb-tag">TOPIK</span>
                <span style={{ marginLeft: '-8px', fontWeight: 600 }}>{latestTopik?.topikLevel ? `${latestTopik.topikLevel}급` : '-'}</span>
                <span>연락처:<em style={{ color: '#2563EB' }}>{s.phone || '-'}</em></span>
              </div>
            </div>

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

              {activeTab === 'profile' && (
                 <div className="sbs-tab-body">
                 <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                   <div style={{ width: '90px', height: '115px', background: '#F3F4F6', border: '1px solid #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                     {s.photoUrl ? <img src={s.photoUrl} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '11px', color: '#9CA3AF' }}>사진 없음</span>}
                   </div>
                   
                   <div style={{ flex: 1 }} className="sbs-grid-profile">
                     <div className="sbs-pro-item"><div className="sbs-pro-lbl">소속학과</div><div className="sbs-pro-val">{s.deptName || '-'}</div></div>
                     <div className="sbs-pro-item"><div className="sbs-pro-lbl">학년/분반</div><div className="sbs-pro-val">{s.grade ? `${s.grade}학년` : '-'} / {s.classSec ? `${s.classSec}분반` : '-'}</div></div>
                     <div className="sbs-pro-item"><div className="sbs-pro-lbl">등록상태</div><div className="sbs-pro-val">{s.enrollStatus || '-'}</div></div>
                     <div className="sbs-pro-item"><div className="sbs-pro-lbl">국적</div><div className="sbs-pro-val">{s.nationality || '-'}</div></div>
                     <div className="sbs-pro-item"><div className="sbs-pro-lbl">생년월일</div><div className="sbs-pro-val">{s.birthDate || '-'}</div></div>
                     <div className="sbs-pro-item"><div className="sbs-pro-lbl">입학일</div><div className="sbs-pro-val">{s.admissionDate || '-'}</div></div>
                   </div>
                 </div>
               </div>
              )}

              {activeTab === 'attend' && (
                <div className="sbs-tab-body" style={{ padding: '0.75rem' }}>
                  {attendances.length === 0 ? (
                    <div className="sbs-empty">
                      등록된 수강/출석 데이터가 없습니다.<br/>
                      <span style={{ fontSize: '11px', color: '#EF4444', marginTop: '4px', display: 'inline-block' }}>
                        (F12 콘솔창의 '백엔드 응답 데이터'에 attendances 배열이 비어있는지 확인해주세요.)
                      </span>
                    </div>
                  ) : (
                    <div className="sbs-table-wrap">
                      <table className="sbs-attend-table">
                        <thead>
                          <tr>
                            <th style={{ width: '65px' }}>출석평가</th>
                            <th>과목명</th>
                            <th style={{ width: '80px' }}>구분</th>
                            {Array.from({ length: 15 }, (_, i) => (
                              <th key={i} style={{ width: '40px', minWidth: '40px' }}>{i + 1}주</th>
                            ))}
                            <th style={{ width: '40px' }}>출석</th>
                            <th style={{ width: '40px' }}>지각</th>
                            <th style={{ width: '40px' }}>결석</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendances.map((att, idx) => (
                            <tr key={att.courseId || idx}>
                              <td>
                                {att.warningStatus && att.warningStatus !== '정상' ? (
                                  <span className={`sbs-warn-badge ${att.warningStatus}`}>{att.warningStatus}</span>
                                ) : (
                                  <span className="sbs-warn-badge 정상">정상</span>
                                )}
                              </td>
                              <td className="left" style={{ fontWeight: '600', color: '#1E293B' }}>{att.courseName || '-'}</td>
                              <td>{att.courseType || '-'}</td>
                              
                              {Array.from({ length: 15 }).map((_, wIdx) => {
                                const code = att.weeklyAttend?.[wIdx] ?? 0;
                                const match = ATTENDANCE_CODE[code] || ATTENDANCE_CODE[0];
                                return (
                                  <td key={wIdx} title={match.title} style={{ color: match.color, fontWeight: '700', fontSize: '13px' }}>
                                    {match.label}
                                  </td>
                                );
                              })}
                              
                              <td style={{ fontWeight: '600', background: '#F8FAFC', color: '#3B82F6' }}>{att.totalPresent ?? 0}</td>
                              <td style={{ fontWeight: '600', background: '#F8FAFC', color: '#F59E0B' }}>{att.totalLate ?? 0}</td>
                              <td style={{ fontWeight: '600', background: '#F8FAFC', color: (att.totalAbsent > 0) ? '#EF4444' : '#334155' }}>
                                {att.totalAbsent ?? 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'consult' && (
                <div className="sbs-tab-body">
                  {consultations.length === 0 ? (
                    <div className="sbs-empty">상담 내역이 없습니다.</div>
                  ) : (
                    consultations.map((c, i) => (
                      <div style={{ padding: '0.75rem 0', borderBottom: '1px solid #F3F4F6' }} key={c.consultId || i}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#4B5563', marginBottom: '4px' }}>
                          <span>{c.consultDate}</span> | <span>{c.professorName}</span>
                          {c.crisisFlag && <span className="sbs-badge tag-red" style={{ marginLeft: '6px' }}>위기징후</span>}
                        </div>
                        <div style={{ background: '#F9FAFB', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '12.5px' }}>{c.rawContent}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'job' && (
                <div className="sbs-tab-body">
                  {jobs.length === 0 ? (
                    <div className="sbs-empty">근로 이력이 없습니다.</div>
                  ) : (
                    <div className="sbs-table-wrap">
                      <table className="sbs-attend-table" style={{ textAlign: 'left' }}>
                        <thead>
                          <tr>
                            <th>사업체명</th>
                            <th>업종</th>
                            <th>근무지 주소</th>
                            <th>주간근로시간</th>
                            <th>시급</th>
                            <th>승인상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobs.map((j, i) => {
                            const apv = APPROVAL_STATUS_LABEL[j.approvalStatus] || { label: j.approvalStatus, bg: '#F3F4F6', color: '#374151' };
                            return (
                              <tr key={j.jobId || i}>
                                <td style={{ fontWeight: '600' }}>{j.companyName}</td>
                                <td>{j.industry}</td>
                                <td>{j.workAddress}</td>
                                <td>{j.workHoursPerWeek}</td>
                                <td>{j.wage?.toLocaleString()}</td>
                                <td>
                                  <span className="sbs-badge" style={{ background: apv.bg, color: apv.color }}>{apv.label}</span>
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

              {activeTab === 'topik' && (
                <div className="sbs-tab-body">
                  {topiks.length === 0 ? (
                    <div className="sbs-empty">TOPIK 정보가 없습니다.</div>
                  ) : (
                    <div className="sbs-table-wrap">
                      <table className="sbs-attend-table">
                        <thead>
                          <tr>
                            <th>급수</th>
                            <th>시험일자</th>
                            <th>어학원명</th>
                            <th>어학원 이수급수</th>
                            <th>한국어 학습 시작일</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topiks.map((t, i) => (
                            <tr key={t.langId || i}>
                              <td><span className="sbs-badge tag-gray">{t.topikLevel}급</span></td>
                              <td>{t.examDate || '-'}</td>
                              <td style={{ fontWeight: '600' }}>{t.instituteName || '-'}</td>
                              <td>{t.instituteLevel ? `${t.instituteLevel}급` : '-'}</td>
                              <td>{t.koreanStartDate || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'visa' && (
                <div className="sbs-tab-body">
                  {visas.length === 0 ? (
                    <div className="sbs-empty">비자 이력이 없습니다.</div>
                  ) : (
                    <div className="sbs-table-wrap">
                      <table className="sbs-attend-table">
                        <thead>
                          <tr>
                            <th>비자 종류</th>
                            <th>만료일</th>
                            <th>상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visas.map((v, i) => (
                            <tr key={v.visaId || i}>
                              <td style={{ fontWeight: '600' }}>{v.visaType}</td>
                              <td>{v.expireDate || '-'}</td>
                              <td>
                                {v.isCurrent ? (
                                  <span className="sbs-badge tag-green">현재</span>
                                ) : (
                                  <span className="sbs-badge tag-gray">이전</span>
                                )}
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