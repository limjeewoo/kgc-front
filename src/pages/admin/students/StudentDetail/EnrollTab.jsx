import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// const BASE_URL = 'https://api.kmgc.world'; // 배포용
const BASE_URL = 'http://localhost:8080'; // 개발용

export default function EnrollTab({ onTabChange }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 상태 관리
  const [enrollments, setEnrollments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Axios 인스턴스 (인증 토큰 포함)
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
  });

  useEffect(() => {
    const fetchEnrollData = async () => {
      try {
        setIsLoading(true);

        // 명세서 11번(수강 목록)과 12번(학업 요약) 병렬 호출
        const [enrollRes, summaryRes] = await Promise.all([
          api.get(`/api/v1/students/${id}/enrollments`),
          api.get(`/api/v1/students/${id}/academic-summary`).catch(() => ({ data: { data: {} } }))
        ]);

        if (enrollRes.data.success) {
          setEnrollments(enrollRes.data.data);
        }
        
        // 학업 요약 데이터가 있을 경우 세팅
        if (summaryRes.data && summaryRes.data.success) {
          setSummary(summaryRes.data.data);
        }
        
      } catch (error) {
        console.error("수강 및 성적 데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchEnrollData();
  }, [id]);

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
      padding: '1.25rem', 
      backgroundColor: '#FDFDFD',
      minHeight: '100vh'
    }}>
      <style>{`
        .et-topbar { 
          background: #fff; padding: 0 1.75rem; height: 3.625rem; 
          display: flex; align-items: center; justify-content: space-between; 
          border-bottom: 0.0625rem solid #E5E7EB; margin-bottom: 1.5rem; 
        }
        .et-topbar-left { display: flex; align-items: center; gap: 0.625rem; }
        .et-back-btn { 
          width: 1.875rem; height: 1.875rem; border-radius: 0.4375rem; 
          background: #F3F4F6; border: none; cursor: pointer; 
          display: flex; align-items: center; justify-content: center; 
          transition: background 0.15s; color: #374151; 
        }
        .et-back-btn:hover { background: #E5E7EB; }
        .et-breadcrumb { font-size: 0.8125rem; color: #9CA3AF; }
        .et-breadcrumb span { color: #111827; font-weight: 600; }

        .et-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .et-card { background: #fff; border-radius: 0.875rem; border: 0.0625rem solid #F3F4F6; padding: 1.25rem; }
        .et-card-label { font-size: 0.75rem; color: #9CA3AF; margin-bottom: 0.5rem; }
        .et-card-val { font-size: 1.5rem; font-weight: 700; color: #111827; }
        .et-card-val.blue { color: #3B82F6; }

        .et-table-container { background: #fff; border-radius: 0.875rem; border: 0.0625rem solid #F3F4F6; overflow: hidden; }
        .et-table-header { padding: 1.25rem 1.5rem; border-bottom: 0.0625rem solid #F3F4F6; display: flex; justify-content: space-between; align-items: center; }
        .et-table-title { font-size: 0.9375rem; font-weight: 700; color: #111827; }
        
        table { width: 100%; border-collapse: collapse; }
        th { background: #F9FAFB; padding: 0.75rem 1.5rem; text-align: left; font-size: 0.75rem; color: #6B7280; font-weight: 500; }
        td { padding: 1rem 1.5rem; border-bottom: 0.0625rem solid #F9FAFB; font-size: 0.8125rem; }
        .grade-badge { padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-weight: 600; font-size: 0.75rem; background: #EFF6FF; color: #1D4ED8; }
        .status-completed { color: #16A34A; font-weight: 600; }
        .status-progress { color: #D97706; font-weight: 500; }
        .status-fail { color: #DC2626; font-weight: 500; }
      `}</style>

      {/* 상단 네비게이션 */}
      <div className="et-topbar">
        <div className="et-topbar-left">
          <button className="et-back-btn" onClick={() => navigate('/admin/dashboard')} title="대시보드로 돌아가기">
            <svg width="1rem" height="1rem" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="et-breadcrumb">관리자 대시보드 › 학생 관리 › <span>수강 및 성적 이력</span></div>
        </div>
      </div>

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
            {earnedCredits} <span style={{fontSize: '0.875rem', fontWeight: 400, color: '#9CA3AF'}}> / {totalGraduationCredits}</span>
          </div>
        </div>
      </div>

      <div className="et-table-container">
        <div className="et-table-header">
          <div className="et-table-title">상세 성적 내역</div>
        </div>
        <table>
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
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>수강 내역이 없습니다.</td>
              </tr>
            ) : (
              enrollments.map(course => (
                <tr key={course.enrollId}>
                  <td style={{ color: '#6B7280', fontSize: '0.75rem' }}>{course.courseId}</td>
                  <td style={{ fontWeight: 600 }}>{course.courseName}</td>
                  <td>{course.credits}학점</td>
                  <td>
                    {course.isOnline ? (
                       <span style={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 6px', background: '#FEF2F2', borderRadius: '4px'}}>온라인</span>
                    ) : "오프라인"}
                  </td>
                  <td>
                    {course.grade ? (
                      <span className="grade-badge">{course.grade}</span>
                    ) : (
                      <span style={{ color: '#9CA3AF' }}>미입력</span>
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