import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../../api/axios';

const LABELS = { ok: '출', abs: '결', late: '지', pub: '공', none: '-' };

const getStatusKey = (code) => {
  if (code === 1) return 'ok';
  if (code === 2) return 'abs';
  if (code === 3) return 'late';
  if (code === 4) return 'pub';
  return 'none';
};

export default function AttendTab({ studentId: propsStudentId }) {
  const { id: urlStudentId } = useParams();
  const studentId = propsStudentId || urlStudentId;

  const [attendData, setAttendData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttendanceData = useCallback(async () => {
    if (!studentId) return;
    try {
      setIsLoading(true);

      const enrollRes = await api.get(`/api/v1/students/${studentId}/enrollments`);
      const enrollments = enrollRes.data?.success ? enrollRes.data.data : [];

      const courseAttendances = await Promise.all(
        enrollments.map(async (enroll) => {
          let attendArray = Array(15).fill(0);
          let totalAttend = 0, totalAbsent = 0, totalLate = 0;

          try {
            const attRes = await api.get(`/api/v1/enrollments/${enroll.enrollId}/attendances`);
            
            if (attRes.data?.success) {
              const attList = Array.isArray(attRes.data.data) 
                ? attRes.data.data 
                : (attRes.data.data?.attendances || []);
                
              attList.forEach(att => {
                const weekIdx = (att.weekNo || 1) - 1;
                const status = att.status || 0;
                
                if (weekIdx >= 0 && weekIdx < 15) {
                  attendArray[weekIdx] = status;
                }

                if (status === 1 || status === 4) totalAttend++;
                else if (status === 2) totalAbsent++;
                else if (status === 3) totalLate++;
              });
            }
          } catch (err) {
            console.warn(`[${enroll.courseId}] 출결 로드 실패`, err);
          }
          
          return {
            id: enroll.enrollId,
            name: enroll.courseName,
            code: enroll.courseId,
            attend: attendArray,
            totalAbsent,
            totalAttend,
            totalLate
          };
        })
      );

      let sumAttend = 0, sumAbsent = 0, sumLate = 0;
      courseAttendances.forEach(c => {
        sumAttend += c.totalAttend;
        sumAbsent += c.totalAbsent;
        sumLate += c.totalLate;
      });

      const totalHours = sumAttend + sumAbsent + sumLate;
      const currentRate = totalHours > 0 ? Math.round((sumAttend / totalHours) * 100) : 0;

      setAttendData({
        currentRate,
        totalRequiredHours: totalHours,
        currentAttendedHours: sumAttend,
        visaThreshold: 70,
        courses: courseAttendances
      });

    } catch (error) {
      console.error("출결 데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  if (isLoading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>출결 데이터를 불러오는 중입니다...</div>;
  if (!attendData) return <div style={{ padding: '4rem', textAlign: 'center', color: '#EF4444', fontSize: '0.875rem' }}>데이터를 불러올 수 없습니다.</div>;

  const renderAbsBadge = (count) => {
    if (count >= 4) return <><div className="abs-count" style={{color:'#DC2626'}}>{count}회</div><div className="abs-badge ab-danger">위험</div></>;
    if (count >= 3) return <><div className="abs-count" style={{color:'#D97706'}}>{count}회</div><div className="abs-badge ab-warn">주의</div></>;
    return <><div className="abs-count" style={{color:'#6B7280'}}>{count}회</div><div className="abs-badge ab-ok">정상</div></>;
  };

  const isVisaSafe = attendData.currentRate >= attendData.visaThreshold;

  return (
    <div style={{ 
      fontFamily: "'DM Sans', 'Noto Sans KR', sans-serif", 
      fontSize: '0.875rem', 
      color: '#111827',
      animation: 'fadeUp 0.28s ease',
      padding: '0 22px'
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        .at-summary-container { display: flex; gap: 1rem; margin-bottom: 1.25rem; }
        .at-rate-card { flex: 1; background: #fff; border-radius: 0.875rem; border: 1px solid #E5E7EB; padding: 1.5rem; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.01); }
        .at-visa-banner { flex: 2; display: flex; align-items: center; gap: 1rem; padding: 1.5rem; border-radius: 0.875rem; background: ${isVisaSafe ? '#F0FDF4' : '#FEF2F2'}; border: 1px solid ${isVisaSafe ? '#DCFCE7' : '#FEE2E2'}; color: ${isVisaSafe ? '#16A34A' : '#DC2626'}; }

        .legend-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; padding: 0 0.25rem; }
        .legend-items { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; color: #6B7280; white-space: nowrap; }
        .legend-cell { width: 1.375rem; height: 1.375rem; border-radius: 0.3125rem; display: flex; align-items: center; justify-content: center; font-size: 0.625rem; font-weight: 700; }
        
        .lc-ok { background: #EFF6FF; color: #3B82F6; }
        .lc-abs { background: #FEF2F2; color: #DC2626; }
        .lc-late { background: #FFFBEB; color: #D97706; }
        .lc-pub { background: #F0FDF4; color: #16A34A; }
        .lc-none { background: #F3F4F6; color: #9CA3AF; }

        .attend-table-wrap { background: #fff; border-radius: 0.875rem; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.01); }
        .attend-table-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #F3F4F6; display: flex; justify-content: space-between; align-items: center; }
        .att-title { font-size: 0.9375rem; font-weight: 700; color: #111827; }
        .att-sub { font-size: 0.75rem; color: #9CA3AF; margin-top: 0.125rem; }

        .att-table { width: 100%; border-collapse: collapse; min-width: 56.25rem; }
        .att-table th { background: #F9FAFB; padding: 0.75rem 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-align: center; border-bottom: 1px solid #F3F4F6; white-space: nowrap; }
        .att-table td { padding: 0.75rem 0.5rem; border-bottom: 1px solid #F9FAFB; text-align: center; vertical-align: middle; white-space: nowrap; }
        .att-table th.th-left, .att-table td.td-left { text-align: left; padding-left: 1.5rem; min-width: 12rem; }
        .att-table tr:last-child td { border-bottom: none; }
        .att-table tr:hover td { background: #FAFAFA; }

        .course-name { font-size: 0.8125rem; font-weight: 600; color: #0F172A; margin-bottom: 0.25rem; }
        .course-code { font-size: 0.6875rem; color: #9CA3AF; fontFamily: 'monospace'; }

        .week-cell { width: 2rem; height: 1.75rem; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; font-size: 0.6875rem; font-weight: 700; margin: 0 auto; border: 1px solid transparent; transition: 0.15s; }
        .week-cell:hover { transform: scale(1.08); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        
        .wc-ok { background: #EFF6FF; color: #3B82F6; border-color: #BFDBFE; }
        .wc-abs { background: #FEF2F2; color: #DC2626; border-color: #FECACA; }
        .wc-late { background: #FFFBEB; color: #D97706; border-color: #FDE68A; }
        .wc-pub { background: #F0FDF4; color: #16A34A; border-color: #A7F3D0; }
        .wc-none { background: #F3F4F6; color: #D1D5DB; border-color: #E5E7EB; }

        .summary-wrap { display: flex; flex-direction: column; gap: 0.25rem; align-items: center; justify-content: center; }
        .abs-count { font-size: 0.75rem; font-weight: 700; line-height: 1; }
        .abs-badge { font-size: 0.625rem; padding: 0.1875rem 0.5rem; border-radius: 0.625rem; font-weight: 600; line-height: 1; }
        .ab-danger { background: #FEF2F2; color: #DC2626; }
        .ab-warn { background: #FFFBEB; color: #D97706; }
        .ab-ok { background: #F0FDF4; color: #16A34A; }
        
        .refresh-btn { background: #fff; border: 1px solid #E5E7EB; color: #374151; font-size: 0.75rem; font-weight: 600; padding: 0.375rem 0.75rem; border-radius: 0.5rem; cursor: pointer; display: flex; align-items: center; gap: 0.375rem; transition: background 0.2s; }
        .refresh-btn:hover { background: #F9FAFB; }
      `}</style>

      <div className="at-summary-container">
        <div className="at-rate-card">
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '0.5rem', fontWeight: 500 }}>현재 통합 출석률</div>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, color: isVisaSafe ? '#3B82F6' : '#DC2626', lineHeight: 1 }}>{attendData.currentRate}%</div>
        </div>
        
        <div className="at-visa-banner">
          <span style={{ fontSize: '1.75rem' }}>{isVisaSafe ? '✅' : '⚠️'}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>비자 유지 상태 판독</div>
            <div style={{ fontSize: '0.8125rem', opacity: 0.9, lineHeight: 1.4 }}>
              {isVisaSafe ? "현재 출석률이 비자 연장 가능 기준(70%)을 충족하고 있습니다." : "현재 출석률이 70% 미만으로 강제 출국 및 비자 취소 대상에 해당될 수 있습니다."}
            </div>
          </div>
        </div>
      </div>

      <div className="legend-bar">
        <div className="legend-items">
          <div className="legend-item"><div className="legend-cell lc-ok">출</div>출석(1)</div>
          <div className="legend-item"><div className="legend-cell lc-abs">결</div>결석(2)</div>
          <div className="legend-item"><div className="legend-cell lc-late">지</div>지각(3)</div>
          <div className="legend-item"><div className="legend-cell lc-pub">공</div>공결(4)</div>
          <div className="legend-item"><div className="legend-cell lc-none">-</div>미입력(0)</div>
        </div>
        
        <button onClick={fetchAttendanceData} className="refresh-btn">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          최신 데이터 갱신
        </button>
      </div>

      <div className="attend-table-wrap">
        <div className="attend-table-header">
          <div>
            <div className="att-title">출결 매트릭스 (1~15주차)</div>
            <div className="att-sub">수강 중인 과목별 상세 주차 출결 현황</div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="att-table">
            <thead>
              <tr>
                <th className="th-left">수강 과목</th>
                {[...Array(15)].map((_, i) => (
                  <th key={i} style={{ color: i >= 13 ? '#9CA3AF' : '#6B7280' }}>{i + 1}주</th>
                ))}
                <th>결석 관리</th>
              </tr>
            </thead>
            <tbody>
              {attendData.courses.length === 0 ? (
                 <tr>
                   <td colSpan="17" style={{ padding: '4rem', color: '#9CA3AF', textAlign: 'center' }}>수강 및 출결 기록이 존재하지 않습니다.</td>
                 </tr>
              ) : (
                attendData.courses.map((course) => (
                  <tr key={course.id}>
                    <td className="td-left">
                      <div className="course-name">{course.name}</div>
                      <div className="course-code">{course.code}</div>
                    </td>
                    {course.attend.map((statusCode, weekIdx) => {
                      const statusKey = getStatusKey(statusCode);
                      const isFutureWeek = weekIdx >= 13;
                      return (
                        <td key={weekIdx}>
                          <div 
                            className={`week-cell wc-${statusKey}`} 
                            style={isFutureWeek ? { opacity: 0.4 } : {}}
                            title={`${weekIdx + 1}주차 - ${LABELS[statusKey]}`}
                          >
                            {LABELS[statusKey]}
                          </div>
                        </td>
                      );
                    })}
                    <td>
                      <div className="summary-wrap">
                        {renderAbsBadge(course.totalAbsent)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}