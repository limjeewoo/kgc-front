import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const STATUS_MAP = ['ok', 'abs', 'late', 'pub', 'none'];
const LABELS = { ok: '출', abs: '결', late: '지', pub: '공', none: '-' };

export default function AttendTab() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attendData, setAttendData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setAttendData({
        currentRate: 85,
        totalRequiredHours: 300,
        currentAttendedHours: 255,
        visaThreshold: 70,
        courses: [
          { id: 1, name: '한국어 문법 3', code: 'KOR301', attend: [0, 0, 1, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 4, 4] },
          { id: 2, name: '한국어 회화 3', code: 'KOR302', attend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4] },
          { id: 3, name: '한국어 듣기 3', code: 'KOR303', attend: [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 4, 4] },
          { id: 4, name: '한국 사회의 이해', code: 'CUL101', attend: [0, 0, 0, 2, 0, 0, 0, 0, 0, 3, 0, 0, 1, 4, 4] },
        ]
      });
      setIsLoading(false);
    }, 300);
  }, [id]);

  if (isLoading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#9CA3AF' }}>데이터 로딩 중...</div>;

  const countAbsences = (attendArray) => {
    return attendArray.filter(st => st === 1).length;
  };

  const renderAbsBadge = (count) => {
    if (count >= 4) return <><div className="abs-count" style={{color:'#DC2626'}}>{count}회</div><div className="abs-badge ab-danger">위험</div></>;
    if (count >= 3) return <><div className="abs-count" style={{color:'#D97706'}}>{count}회</div><div className="abs-badge ab-warn">주의</div></>;
    return <><div className="abs-count" style={{color:'#6B7280'}}>{count}회</div><div className="abs-badge ab-ok">정상</div></>;
  };

  const isVisaSafe = attendData.currentRate >= attendData.visaThreshold;

  return (
    <div style={{ fontFamily: "'DM Sans', 'Noto Sans KR', sans-serif", fontSize: '0.875rem', color: '#111827', padding: '1.25rem', backgroundColor: '#F0F2F7', minHeight: '100vh' }}>
      <style>{`
        /* 상단 네비게이션 */
        .at-topbar { background: #fff; padding: 0 1.75rem; height: 3.625rem; display: flex; align-items: center; border-radius: 0.875rem; margin-bottom: 1.25rem; border: 1px solid #E5E7EB; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .at-back-btn { width: 1.875rem; height: 1.875rem; border-radius: 0.4375rem; background: #F3F4F6; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; margin-right: 0.625rem; transition: 0.2s; }
        .at-back-btn:hover { background: #E5E7EB; }
        .at-breadcrumb { font-size: 0.8125rem; color: #9CA3AF; }
        .at-breadcrumb span { color: #111827; font-weight: 600; }

        /* 요약 카드 */
        .at-summary-container { display: flex; gap: 1rem; margin-bottom: 1.25rem; }
        .at-rate-card { flex: 1; background: #fff; border-radius: 0.875rem; border: 1px solid #E5E7EB; padding: 1.5rem; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .at-visa-banner { flex: 2; display: flex; align-items: center; gap: 1rem; padding: 1.5rem; border-radius: 0.875rem; background: ${isVisaSafe ? '#F0FDF4' : '#FEF2F2'}; border: 1px solid ${isVisaSafe ? '#DCFCE7' : '#FEE2E2'}; color: ${isVisaSafe ? '#16A34A' : '#DC2626'}; }

        /* 범례 바 */
        .legend-bar { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.875rem; flex-wrap: wrap; padding: 0 0.5rem; }
        .legend-item { display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; color: #6B7280; white-space: nowrap; } /* 줄바꿈 방지 */
        .legend-cell { width: 1.375rem; height: 1.375rem; border-radius: 0.3125rem; display: flex; align-items: center; justify-content: center; font-size: 0.625rem; font-weight: 700; }
        
        .lc-ok { background: #EFF6FF; color: #3B82F6; }
        .lc-abs { background: #FEF2F2; color: #DC2626; }
        .lc-late { background: #FFFBEB; color: #D97706; }
        .lc-pub { background: #F0FDF4; color: #16A34A; }
        .lc-none { background: #F3F4F6; color: #9CA3AF; }

        /* 테이블 래퍼 */
        .attend-table-wrap { background: #fff; border-radius: 0.875rem; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .attend-table-header { padding: 1rem 1.25rem; border-bottom: 1px solid #F3F4F6; display: flex; justify-content: space-between; align-items: center; }
        .att-title { font-size: 0.9375rem; font-weight: 700; color: #111827; }
        .att-sub { font-size: 0.75rem; color: #9CA3AF; margin-top: 0.125rem; }

        /* 🚀 테이블 텍스트 밀림(줄바꿈) 방지 핵심 로직 🚀 */
        .att-table { width: 100%; border-collapse: collapse; min-width: 56.25rem; }
        .att-table th { 
          background: #F9FAFB; padding: 0.625rem 0.5rem; font-size: 0.6875rem; font-weight: 600; color: #6B7280; text-align: center; border-bottom: 1px solid #F3F4F6; 
          white-space: nowrap; /* 텍스트 한 줄 강제 정렬 */
          word-break: keep-all; /* 단어 중간 끊어짐 방지 */
        }
        .att-table td { 
          padding: 0.625rem 0.5rem; border-bottom: 1px solid #F9FAFB; text-align: center; vertical-align: middle; 
          white-space: nowrap; /* 텍스트 한 줄 강제 정렬 */
          word-break: keep-all; /* 단어 중간 끊어짐 방지 */
        }
        .att-table th.th-left, .att-table td.td-left { text-align: left; padding-left: 1.25rem; min-width: 11rem; } /* 과목명 최소 너비 확보 */
        .att-table tr:last-child td { border-bottom: none; }
        .att-table tr:hover td { background: #FAFAFA; }

        /* 테이블 내 텍스트 */
        .course-name { font-size: 0.8125rem; font-weight: 600; color: #111827; margin-bottom: 0.25rem; }
        .course-code { font-size: 0.6875rem; color: #9CA3AF; }

        /* 주차별 출결 셀 */
        .week-cell { 
          width: 2rem; height: 1.75rem; border-radius: 0.375rem; 
          display: flex; align-items: center; justify-content: center; 
          font-size: 0.6875rem; font-weight: 700; margin: 0 auto; 
          border: 1px solid transparent; cursor: pointer; transition: 0.15s; 
        }
        .week-cell:hover { transform: scale(1.1); box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
        
        .wc-ok { background: #EFF6FF; color: #3B82F6; border-color: #BFDBFE; }
        .wc-abs { background: #FEF2F2; color: #DC2626; border-color: #FECACA; }
        .wc-late { background: #FFFBEB; color: #D97706; border-color: #FDE68A; }
        .wc-pub { background: #F0FDF4; color: #16A34A; border-color: #A7F3D0; }
        .wc-none { background: #F3F4F6; color: #D1D5DB; border-color: #E5E7EB; }

        /* 결석 요약 배지 */
        .summary-wrap { display: flex; flex-direction: column; gap: 0.1875rem; align-items: center; justify-content: center; }
        .abs-count { font-size: 0.75rem; font-weight: 700; line-height: 1; }
        .abs-badge { font-size: 0.625rem; padding: 0.1875rem 0.375rem; border-radius: 0.625rem; font-weight: 600; line-height: 1; }
        .ab-danger { background: #FEF2F2; color: #DC2626; }
        .ab-warn { background: #FFFBEB; color: #D97706; }
        .ab-ok { background: #F0FDF4; color: #16A34A; }
      `}</style>

      {/* 상단 네비게이션 */}
      <div className="at-topbar">
        <button className="at-back-btn" onClick={() => navigate('/admin/dashboard')} title="대시보드로 돌아가기">
          <svg width="1rem" height="1rem" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div className="at-breadcrumb">관리자 대시보드 › 학생 목록 › <span>학생 상세 출결 (15주차)</span></div>
      </div>

      {/* 요약 컨테이너 */}
      <div className="at-summary-container">
        <div className="at-rate-card">
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '0.5rem', fontWeight: 500 }}>현재 통합 출석률</div>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, color: isVisaSafe ? '#3B82F6' : '#DC2626', lineHeight: 1 }}>{attendData.currentRate}%</div>
        </div>
        
        <div className="at-visa-banner">
          <span style={{ fontSize: '2rem' }}>{isVisaSafe ? '✅' : '⚠️'}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>비자 유지 상태 판독</div>
            <div style={{ fontSize: '0.8125rem', opacity: 0.9 }}>
              {isVisaSafe ? "현재 출석률이 비자 연장 가능 기준(70%)을 충족하고 있습니다." : "현재 출석률이 70% 미만으로 강제 출국 및 비자 취소 대상에 해당될 수 있습니다."}
            </div>
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="legend-bar">
        <div className="legend-item"><div className="legend-cell lc-ok">출</div>출석</div>
        <div className="legend-item"><div className="legend-cell lc-abs">결</div>결석</div>
        <div className="legend-item"><div className="legend-cell lc-late">지</div>지각</div>
        <div className="legend-item"><div className="legend-cell lc-pub">공</div>공결</div>
        <div className="legend-item"><div className="legend-cell lc-none">-</div>미입력</div>
      </div>

      {/* 주차별 출결 테이블 */}
      <div className="attend-table-wrap">
        <div className="attend-table-header">
          <div>
            <div className="att-title">2025학년도 1학기 출결 매트릭스</div>
            <div className="att-sub">수강 중인 과목별 상세 출결 이력</div>
          </div>
        </div>

        {/* 🚀 테이블 가로 스크롤 래퍼 유지 */}
        <div style={{ overflowX: 'auto' }}>
          <table className="att-table">
            <thead>
              <tr>
                <th className="th-left">수강 과목</th>
                {[...Array(15)].map((_, i) => (
                  <th key={i} style={{ color: i >= 13 ? '#D1D5DB' : '#6B7280' }}>{i + 1}주</th>
                ))}
                <th>결석수</th>
              </tr>
            </thead>
            <tbody>
              {attendData.courses.map((course) => (
                <tr key={course.id}>
                  <td className="td-left">
                    <div className="course-name">{course.name}</div>
                    <div className="course-code">{course.code}</div>
                  </td>
                  {course.attend.map((statusIdx, weekIdx) => {
                    const status = STATUS_MAP[statusIdx];
                    const isLocked = weekIdx >= 13;
                    return (
                      <td key={weekIdx}>
                        <div 
                          className={`week-cell wc-${status}`} 
                          style={isLocked ? { opacity: 0.4, cursor: 'default' } : {}}
                          title={`${weekIdx + 1}주차 - ${LABELS[status]}`}
                        >
                          {LABELS[status]}
                        </div>
                      </td>
                    );
                  })}
                  <td>
                    <div className="summary-wrap">
                      {renderAbsBadge(countAbsences(course.attend))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}