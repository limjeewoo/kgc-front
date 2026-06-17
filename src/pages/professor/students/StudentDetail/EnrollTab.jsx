import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../../api/axios';

export default function EnrollTab({ studentId: propsStudentId }) {
  const { id: urlStudentId } = useParams();
  const studentId = propsStudentId || urlStudentId;
  
  const [enrollments, setEnrollments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollData = async () => {
      try {
        setIsLoading(true);

        const [enrollRes, semesterRes] = await Promise.all([
          api.get(`/api/v1/students/${studentId}/enrollments`),
          api.get(`/api/v1/semesters/current`).catch(() => ({ data: { data: { name: '알 수 없음' } } }))
        ]);

        let fetchedEnrollments = [];
        if (enrollRes.data?.success) {
          fetchedEnrollments = enrollRes.data.data || [];
          setEnrollments(fetchedEnrollments);
        }
        
        let totalCredits = 0;
        let totalGradePoints = 0;
        let gradedCredits = 0;

        const gradeScale = {
          'A+': 4.5, 'A0': 4.0, 'B+': 3.5, 'B0': 3.0,
          'C+': 2.5, 'C0': 2.0, 'D+': 1.5, 'D0': 1.0, 'F': 0.0
        };

        fetchedEnrollments.forEach(course => {
          const credits = course.credits || 0;
          
          if (course.isCompleted || (course.grade && course.grade !== 'F')) {
            totalCredits += credits;
          }
          
          if (course.grade && gradeScale[course.grade] !== undefined) {
            gradedCredits += credits;
            totalGradePoints += (gradeScale[course.grade] * credits);
          }
        });

        const calculatedGpa = gradedCredits > 0 ? (totalGradePoints / gradedCredits) : 0;
        const currentSemesterStr = semesterRes.data?.data?.name || semesterRes.data?.data?.semesterId || '-';

        setSummary({
          semesterId: currentSemesterStr,
          totalGpa: calculatedGpa,
          totalCredits: totalCredits,
          graduationCredits: 110
        });
        
      } catch (error) {
        console.error("수강 및 성적 데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (studentId) fetchEnrollData();
  }, [studentId]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: '#9CA3AF', fontSize: '0.875rem' }}>
        데이터 로딩 중...
      </div>
    );
  }

  const currentSemester = summary?.semesterId || '-';
  const totalGpa = summary?.totalGpa || 0;
  const earnedCredits = summary?.totalCredits || 0;
  const totalGraduationCredits = summary?.graduationCredits || 110;
  return (
    <div style={{ 
      fontFamily: "'DM Sans', 'Noto Sans KR', sans-serif", 
      fontSize: '0.875rem', 
      color: '#111827',
      animation: 'fadeUp 0.28s ease',
      /* 💾 요구사항 반영: 최상위 레이아웃 양옆에 22px 패딩을 명시했습니다. */
      padding: '0 22px'
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