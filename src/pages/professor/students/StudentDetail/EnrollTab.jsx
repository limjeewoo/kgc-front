import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

// ─── 환경 설정 ─────────────────────────────────────────
// const BASE_URL = 'https://api.kmgc.world'; // 배포용
const BASE_URL = 'http://localhost:8080'; // 개발용

export default function EnrollTab({ studentId: propsStudentId }) {
  const { id: urlStudentId } = useParams();
  const studentId = propsStudentId || urlStudentId;
  
  // 상태 관리
  const [enrollments, setEnrollments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const api = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
  });

  useEffect(() => {
    const fetchEnrollData = async () => {
      try {
        setIsLoading(true);

        // 명세서 11번(수강 목록)과 12번(학업 요약) 병렬 호출
        const [enrollRes, summaryRes] = await Promise.all([
          api.get(`/api/v1/students/${studentId}/enrollments`),
          api.get(`/api/v1/students/${studentId}/academic-summary`).catch(() => ({ data: { data: {} } }))
        ]);

        if (enrollRes.data.success) {
          setEnrollments(enrollRes.data.data || []);
        }
        
        if (summaryRes.data && summaryRes.data.success) {
          setSummary(summaryRes.data.data);
        }
        
      } catch (error) {
        console.error("수강 및 성적 데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (studentId) fetchEnrollData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: '#9CA3AF', fontSize: '0.875rem' }}>
        데이터 로딩 중...
      </div>
    );
  }

  // API 데이터 매핑 안전 처리
  const currentSemester = summary?.semesterId || '-';
  const totalGpa = summary?.totalGpa || 0;
  const earnedCredits = summary?.totalCredits || 0;
  const totalGraduationCredits = summary?.graduationCredits || 110;

  return (
    <div style={{ 
      fontFamily: "'DM Sans', 'Noto Sans KR', sans-serif", 
      fontSize: '0.875rem', 
      color: '#111827',
      animation: 'fadeUp 0.28s ease' // 자연스러운 전환 애니메이션
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        
        /* 요약 그리드 */
        .et-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .et-card { background: #fff; border-radius: 0.875rem; border: 0.0625rem solid #F3F4F6; padding: 1.25rem; }
        .et-card-label { font-size: 0.75rem; color: #9CA3AF; margin-bottom: 0.5rem; font-weight: 500; }
        .et-card-val { font-size: 1.5rem; font-weight: 700; color: #111827; }
        .et-card-val.blue { color: #3B82F6; }

        /* 테이블 */
        .et-table-container { background: #fff; border-radius: 0.875rem; border: 0.0625rem solid #F3F4F6; overflow: hidden; }
        .et-table-header { padding: 1.25rem 1.5rem; border-bottom: 0.0625rem solid #F3F4F6; display: flex; justify-content: space-between; align-items: center; }
        .et-table-title { font-size: 0.9375rem; font-weight: 700; color: #111827; }
        
        .et-table { width: 100%; border-collapse: collapse; }
        .et-table th { background: #F9FAFB; padding: 0.75rem 1.5rem; text-align: left; font-size: 0.75rem; color: #6B7280; font-weight: 600; }
        .et-table td { padding: 1rem 1.5rem; border-bottom: 0.0625rem solid #F9FAFB; font-size: 0.8125rem; vertical-align: middle; }
        
        /* 배지 및 상태값 */
        .grade-badge { padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-weight: 700; font-size: 0.75rem; background: #EFF6FF; color: #1D4ED8; display: inline-block; }
        .status-completed { color: #16A34A; font-weight: 600; }
        .status-progress { color: #D97706; font-weight: 500; }
        .status-fail { color: #DC2626; font-weight: 500; }
      `}</style>

      {/* ── 요약 통계 ── */}
      <div className="et-summary-grid">
        <div className="et-card">
          <div className="et-card-label">해당(최근) 학기</div>
          <div className="et-card-val">{currentSemester}</div>
        </div>
        <div className="et-card">
          <div className="et-card-label">전체 평균 평점</div>
          <div className="et-card-val blue">{totalGpa.toFixed(2)} / 4.5</div>
        </div>
        <div className="et-card">
          <div className="et-card-label">취득 학점</div>
          <div className="et-card-val">
            {earnedCredits} <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#9CA3AF' }}> / {totalGraduationCredits}</span>
          </div>
        </div>
      </div>

      {/* ── 상세 리스트 ── */}
      <div className="et-table-container">
        <div className="et-table-header">
          <div className="et-table-title">상세 수강 및 성적 내역</div>
        </div>
        <table className="et-table">
          <thead>
            <tr>
              <th>과목코드</th>
              <th>과목명</th>
              <th>학점</th>
              <th>수업 방식</th>
              <th>성적</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>수강 내역이 없습니다.</td>
              </tr>
            ) : (
              enrollments.map(course => (
                <tr key={course.enrollId}>
                  <td style={{ color: '#6B7280', fontSize: '0.75rem', fontFamily: 'monospace' }}>{course.courseId}</td>
                  <td style={{ fontWeight: 600, color: '#0F172A' }}>{course.courseName}</td>
                  <td>{course.credits}학점</td>
                  <td>
                    {course.isOnline ? (
                      <span style={{ color: '#DC2626', fontSize: '0.725rem', fontWeight: 'bold', padding: '2px 6px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px' }}>온라인</span>
                    ) : (
                      <span style={{ color: '#475569', fontSize: '0.725rem', fontWeight: 'medium', padding: '2px 6px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px' }}>오프라인</span>
                    )}
                  </td>
                  <td>
                    {course.grade ? (
                      <span className="grade-badge">{course.grade}</span>
                    ) : (
                      <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>미입력</span>
                    )}
                  </td>
                  <td>
                    {course.grade === 'F' ? (
                      <span className="status-fail">미이수(F)</span>
                    ) : course.isCompleted ? (
                      <span className="status-completed">이수 완료</span>
                    ) : (
                      <span className="status-progress">수강 중</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}