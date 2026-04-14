import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function EnrollTab({ onTabChange }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [enrollData, setEnrollData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setEnrollData({
        currentSemester: "2024년 2학기",
        totalGpa: 3.8,
        earnedCredits: 45,
        totalCredits: 80,
        courses: [
          { id: 1, name: "데이터베이스 실무", professor: "김철수", credit: 3, grade: "A0", status: "이수" },
          { id: 2, name: "리액트 프로그래밍", professor: "이영희", credit: 3, grade: "A+", status: "이수" },
          { id: 3, name: "운영체제론", professor: "박지성", credit: 3, grade: "B+", status: "이수" },
          { id: 4, name: "캡스톤디자인", professor: "최강산", credit: 2, grade: "P", status: "이수" },
        ]
      });
      setIsLoading(false);
    }, 300);
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: '#9CA3AF', fontSize: '0.875rem' }}>
        데이터 로딩 중...
      </div>
    );
  }

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
      `}</style>

      {/* 상단 네비게이션 */}
      <div className="et-topbar">
        <div className="et-topbar-left">
          {/* 🚀 뒤로가기 클릭 시 관리자 대시보드로 이동 */}
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
          <div className="et-card-label">현재 수강 학기</div>
          <div className="et-card-val">{enrollData.currentSemester}</div>
        </div>
        <div className="et-card">
          <div className="et-card-label">전체 평균 평점</div>
          <div className="et-card-val blue">{enrollData.totalGpa} / 4.5</div>
        </div>
        <div className="et-card">
          <div className="et-card-label">취득 학점</div>
          <div className="et-card-val">{enrollData.earnedCredits} <span style={{fontSize: '0.875rem', fontWeight: 400, color: '#9CA3AF'}}> / {enrollData.totalCredits}</span></div>
        </div>
      </div>

      <div className="et-table-container">
        <div className="et-table-header">
          <div className="et-table-title">상세 성적 내역</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>과목명</th>
              <th>담당교수</th>
              <th>학점</th>
              <th>성적</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {enrollData.courses.map(course => (
              <tr key={course.id}>
                <td style={{fontWeight: 500}}>{course.name}</td>
                <td style={{color: '#6B7280'}}>{course.professor}</td>
                <td>{course.credit}학점</td>
                <td><span className="grade-badge">{course.grade}</span></td>
                <td style={{color: '#16A34A', fontWeight: 500}}>{course.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}