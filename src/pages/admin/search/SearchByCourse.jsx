import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const WEEK_LABELS = Array.from({ length: 15 }, (_, i) => `${i + 1}`);

const getStatusDisplay = (code) => {
  switch (code) {
    case 1: return { label: '출', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' };
    case 2: return { label: '결', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' };
    case 3: return { label: '지', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' };
    case 4: return { label: '공', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' };
    default: return { label: '–', color: '#D1D5DB', bg: 'transparent', border: 'transparent' };
  }
};

export default function SearchByCourse({ deptId, classSec, onBack }) {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseData, setCourseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [policy, setPolicy] = useState({ warningThreshold: 3, dangerThreshold: 6 });

  useEffect(() => {
    const initData = async () => {
      if (!deptId || !classSec) return;
      try {
        const courseRes = await api.get('/api/v1/search/class', {
          params: { deptId, classSec }
        });
        if (courseRes.data.success) {
          const courses = courseRes.data.data || [];
          setAvailableCourses(courses);
          if (courses.length > 0) setSelectedCourseId(courses[0].courseId);
        }
        const policyRes = await api.get('/api/v1/policies/attend');
        if (policyRes.data.success) setPolicy(policyRes.data.data);
      } catch (error) {
        console.error('초기 데이터 로드 실패:', error);
      }
    };
    initData();
  }, [deptId, classSec]);

  const fetchCourseDetail = useCallback(async () => {
    if (!selectedCourseId) return;
    setIsLoading(true);
    try {
      const res = await api.get('/api/v1/search/course', {
        params: { courseId: selectedCourseId }
      });
      if (res.data.success) setCourseData(res.data.data);
    } catch (error) {
      console.error('과목 상세 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => { fetchCourseDetail(); }, [fetchCourseDetail]);

  const students = courseData?.students || [];

  // 통계 계산
  const dangerCount  = students.filter(s => (s.totalAbsent || 0) >= policy.dangerThreshold).length;
  const warningCount = students.filter(s => (s.totalAbsent || 0) >= policy.warningThreshold && (s.totalAbsent || 0) < policy.dangerThreshold).length;
  const safeCount    = students.length - dangerCount - warningCount;

  const selectedCourse = availableCourses.find(c => c.courseId === selectedCourseId);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Noto Sans KR', sans-serif", color: '#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

        .sbc-wrap { animation: fadeUp 0.28s ease; }

        /* 헤더 */
        .sbc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
        .sbc-back { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #E5E7EB; border-radius: 8px; padding: 7px 14px; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .sbc-back:hover { background: #F9FAFB; border-color: #D1D5DB; }
        .sbc-title { font-size: 1.25rem; font-weight: 700; color: #0F172A; }
        .sbc-subtitle { font-size: 0.8rem; color: #94A3B8; margin-top: 3px; }

        /* 요약 통계 */
        .sbc-stats { display: flex; gap: 10px; margin-bottom: 1.25rem; }
        .sbc-stat { background: #fff; border: 1px solid #F1F5F9; border-radius: 10px; padding: 12px 18px; display: flex; align-items: center; gap: 10px; flex: 1; }
        .sbc-stat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .sbc-stat-label { font-size: 12px; color: #64748B; font-weight: 500; }
        .sbc-stat-val { font-size: 18px; font-weight: 700; color: #0F172A; margin-left: auto; }
        .sbc-stat-unit { font-size: 12px; color: #94A3B8; font-weight: 400; }

        /* 탭 */
        .sbc-tabs { display: flex; gap: 6px; margin-bottom: 1rem; flex-wrap: wrap; }
        .sbc-tab { padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid #E5E7EB; background: #fff; color: #6B7280; transition: all 0.15s; font-family: inherit; white-space: nowrap; }
        .sbc-tab:hover { border-color: #93C5FD; color: #1D4ED8; background: #EFF6FF; }
        .sbc-tab.active { background: #1A3A5C; color: #fff; border-color: #1A3A5C; }

        /* 테이블 카드 */
        .sbc-card { background: #fff; border-radius: 12px; border: 1px solid #F1F5F9; overflow: hidden; }
        .sbc-table-wrap { overflow-x: auto; }
        .sbc-table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }

        /* 헤더 행 */
        .sbc-table thead tr { background: #F8FAFC; }
        .sbc-table th {
          padding: 10px 6px; font-size: 11px; font-weight: 700; color: #64748B;
          border-bottom: 1.5px solid #E2E8F0; text-align: center;
          position: sticky; top: 0; z-index: 10; background: #F8FAFC;
          white-space: nowrap; letter-spacing: 0.02em;
        }
        .sbc-table th.th-name { text-align: left; padding-left: 14px; }

        /* 바디 행 */
        .sbc-table tbody tr { transition: background 0.12s; }
        .sbc-table tbody tr:hover { background: #F8FBFF; }
        .sbc-table tbody tr:last-child td { border-bottom: none; }
        .sbc-table td {
          padding: 9px 6px; border-bottom: 1px solid #F1F5F9;
          text-align: center; color: #374151; vertical-align: middle;
        }
        .sbc-table td.td-no { color: #CBD5E1; font-size: 11px; }
        .sbc-table td.td-name { text-align: left; padding-left: 14px; font-weight: 600; color: #0F172A; position: sticky; left: 0; background: #fff; border-right: 1px solid #F1F5F9; z-index: 5; }
        .sbc-table tbody tr:hover td.td-name { background: #F8FBFF; }
        .sbc-table td.td-dept { color: #6B7280; font-size: 11px; }
        .sbc-table td.td-id { color: #94A3B8; font-size: 11px; font-family: monospace; }
        .sbc-table td.td-nat { color: #374151; }

        /* 주차 셀 */
        .week-cell { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 5px; font-size: 10px; font-weight: 700; border: 1px solid transparent; }

        /* 결석 수 */
        .absent-val { font-weight: 700; }

        /* 평가 배지 */
        .eval-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; }
        .eval-danger  { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
        .eval-warning { background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A; }
        .eval-caution { background: #FFF7ED; color: #EA580C; border: 1px solid #FDBA74; }

        /* 빈 상태 */
        .sbc-empty { padding: 3.5rem; text-align: center; color: #CBD5E1; }
        .sbc-empty-icon { font-size: 2rem; margin-bottom: 10px; }
        .sbc-empty-txt { font-size: 13px; }

        /* 로딩 */
        .sbc-loading { display: flex; align-items: center; justify-content: center; padding: 4rem; gap: 10px; color: #94A3B8; font-size: 13px; }
        .sbc-spinner { width: 20px; height: 20px; border: 2px solid #E5E7EB; border-top-color: #1A3A5C; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* 범례 */
        .sbc-legend { display: flex; gap: 14px; align-items: center; padding: 10px 16px; border-top: 1px solid #F1F5F9; background: #FAFBFC; }
        .legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #64748B; }
        .legend-dot { width: 20px; height: 20px; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
      `}</style>

      <div className="sbc-wrap">

        {/* 헤더 */}
        <div className="sbc-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="sbc-back" onClick={onBack}>← 뒤로</button>
            <div>
              <div className="sbc-title">과목별 출결 현황</div>
              <div className="sbc-subtitle">
                {selectedCourse ? `${selectedCourse.courseName} · ` : ''}수강생 주차별 출결 상세
              </div>
            </div>
          </div>
        </div>

        {/* 요약 통계 */}
        <div className="sbc-stats">
          <div className="sbc-stat">
            <div className="sbc-stat-dot" style={{ background: '#3B82F6' }} />
            <div className="sbc-stat-label">전체 수강생</div>
            <div className="sbc-stat-val">{students.length}<span className="sbc-stat-unit"> 명</span></div>
          </div>
          <div className="sbc-stat">
            <div className="sbc-stat-dot" style={{ background: '#10B981' }} />
            <div className="sbc-stat-label">정상</div>
            <div className="sbc-stat-val" style={{ color: '#059669' }}>{safeCount}<span className="sbc-stat-unit"> 명</span></div>
          </div>
          <div className="sbc-stat">
            <div className="sbc-stat-dot" style={{ background: '#F59E0B' }} />
            <div className="sbc-stat-label">경고 ({policy.warningThreshold}회↑)</div>
            <div className="sbc-stat-val" style={{ color: '#D97706' }}>{warningCount}<span className="sbc-stat-unit"> 명</span></div>
          </div>
          <div className="sbc-stat">
            <div className="sbc-stat-dot" style={{ background: '#EF4444' }} />
            <div className="sbc-stat-label">위험 ({policy.dangerThreshold}회↑)</div>
            <div className="sbc-stat-val" style={{ color: '#EF4444' }}>{dangerCount}<span className="sbc-stat-unit"> 명</span></div>
          </div>
        </div>

        {/* 탭 */}
        <div className="sbc-tabs">
          {availableCourses.map(course => (
            <button
              key={course.courseId}
              className={`sbc-tab ${selectedCourseId === course.courseId ? 'active' : ''}`}
              onClick={() => setSelectedCourseId(course.courseId)}
            >
              {course.courseName}
            </button>
          ))}
        </div>

        {/* 테이블 카드 */}
        <div className="sbc-card">
          {isLoading ? (
            <div className="sbc-loading">
              <div className="sbc-spinner" />
              데이터를 불러오는 중...
            </div>
          ) : (
            <>
              <div className="sbc-table-wrap">
                <table className="sbc-table">
                  <colgroup>
                    <col width="36px" />
                    <col width="100px" />
                    <col width="42px" />
                    <col width="88px" />
                    <col width="148px" />
                    <col width="54px" />
                    {WEEK_LABELS.map((_, i) => <col key={i} width="30px" />)}
                    <col width="44px" />
                    <col width="58px" />
                    <col width="52px" />
                    <col width="64px" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>학과</th>
                      <th>분반</th>
                      <th>학번</th>
                      <th className="th-name">성명</th>
                      <th>국적</th>
                      {WEEK_LABELS.map(w => <th key={w}>{w}주</th>)}
                      <th>결석</th>
                      <th>평가</th>
                      <th>평점</th>
                      <th>이수학점</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length > 0 ? students.map((student, idx) => {
                      const totalAbsent = student.totalAbsent || 0;
                      let evalLabel = '';
                      let evalClass = '';
                      if (totalAbsent >= policy.dangerThreshold) { evalLabel = '위험'; evalClass = 'eval-danger'; }
                      else if (totalAbsent >= policy.warningThreshold) { evalLabel = '경고'; evalClass = 'eval-warning'; }
                      else if (totalAbsent > 0) { evalLabel = '주의'; evalClass = 'eval-caution'; }

                      return (
                        <tr key={student.studentId}>
                          <td className="td-no">{idx + 1}</td>
                          <td className="td-dept">{student.deptName || '–'}</td>
                          <td style={{ color: '#6B7280', fontSize: 11 }}>{student.classSec || classSec}</td>
                          <td className="td-id">{student.studentId}</td>
                          <td className="td-name">{student.engName || student.korName}</td>
                          <td className="td-nat">{student.nationality || '–'}</td>

                          {Array.from({ length: 15 }).map((_, i) => {
                            const weekNo = i + 1;
                            const attendance = student.attendances?.find(a => a.weekNo === weekNo);
                            const d = getStatusDisplay(attendance?.status);
                            return (
                              <td key={weekNo} style={{ padding: '5px 3px' }}>
                                {attendance ? (
                                  <span className="week-cell" style={{ background: d.bg, color: d.color, borderColor: d.border }}>
                                    {d.label}
                                  </span>
                                ) : (
                                  <span style={{ color: '#E5E7EB', fontSize: 10 }}>–</span>
                                )}
                              </td>
                            );
                          })}

                          <td>
                            <span className="absent-val" style={{ color: totalAbsent === 0 ? '#94A3B8' : totalAbsent >= policy.dangerThreshold ? '#EF4444' : '#D97706' }}>
                              {totalAbsent}
                            </span>
                          </td>
                          <td>
                            {evalLabel
                              ? <span className={`eval-badge ${evalClass}`}>{evalLabel}</span>
                              : <span style={{ color: '#D1D5DB', fontSize: 11 }}>–</span>
                            }
                          </td>
                          <td style={{ color: '#374151', fontWeight: 600 }}>{student.gpa || '–'}</td>
                          <td style={{ color: '#374151' }}>{student.totalCredits || '–'}</td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={WEEK_LABELS.length + 10}>
                          <div className="sbc-empty">
                            <div className="sbc-empty-icon"></div>
                            <div className="sbc-empty-txt">수강생 데이터가 없습니다.</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 범례 */}
              <div className="sbc-legend">
                <span style={{ fontSize: 11, color: '#94A3B8', marginRight: 4, fontWeight: 600 }}>범례</span>
                {[
                  { label: '출', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', text: '출석' },
                  { label: '결', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', text: '결석' },
                  { label: '지', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', text: '지각' },
                  { label: '공', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', text: '공결' },
                ].map(item => (
                  <div key={item.text} className="legend-item">
                    <span className="legend-dot" style={{ background: item.bg, color: item.color, border: `1px solid ${item.border}` }}>{item.label}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}