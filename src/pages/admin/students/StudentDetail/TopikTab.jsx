import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function TopikTab() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [topikHistory, setTopikHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // API 연결 전 테스트용 데이터 로드
    setTimeout(() => {
      setStudent({
        studentId: id,
        korName: "응우옌반안",
        engName: "NGUYEN VAN AN",
        deptName: "컴퓨터소프트웨어과",
      });
      
      setTopikHistory([
        { id: 1, date: '2024-02-15', level: '4급', score: '192점', status: '유효', expiry: '2026-02-14' },
        { id: 2, date: '2023-08-20', level: '3급', score: '145점', status: '만료', expiry: '2025-08-19' },
        { id: 3, date: '2022-11-10', level: '2급', score: '120점', status: '만료', expiry: '2024-11-09' },
      ]);
      
      setIsLoading(false);
    }, 300);
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: '#9CA3AF' }}>
        데이터 로딩 중...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', 'Noto Sans KR', sans-serif", fontSize: '14px', color: '#111827', padding: '20px' }}>
      <style>{`
        .tt-topbar { background: #fff; padding: 0 28px; height: 58px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E5E7EB; margin-bottom: 24px; }
        .tt-topbar-left { display: flex; align-items: center; gap: 10px; }
        
        /* 뒤로가기 버튼 스타일 */
        .tt-back-btn { 
          width: 32px; height: 32px; border-radius: 8px; background: #F3F4F6; border: none; 
          cursor: pointer; display: flex; align-items: center; justify-content: center; 
          transition: all 0.2s; color: #374151; 
        }
        .tt-back-btn:hover { background: #E5E7EB; transform: translateX(-2px); }
        
        .tt-breadcrumb { font-size: 13px; color: #9CA3AF; }
        .tt-breadcrumb span { color: #111827; font-weight: 600; }

        .tt-card { background: #fff; border-radius: 14px; border: 1px solid #F3F4F6; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .tt-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #F3F4F6; }
        .tt-title { font-size: 16px; font-weight: 700; color: #1A3A5C; }

        .tt-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .tt-table th { background: #F9FAFB; padding: 12px; font-size: 12px; color: #6B7280; font-weight: 600; text-align: left; border-bottom: 1px solid #F3F4F6; }
        .tt-table td { padding: 14px 12px; font-size: 13px; border-bottom: 1px solid #F9FAFB; }
        
        .status-badge { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
        .status-valid { background: #F0FDF4; color: #16A34A; }
        .status-expired { background: #FEF2F2; color: #EF4444; }

        .add-btn { background: #1A3A5C; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; }
      `}</style>

      {/* 상단 네비게이션 */}
      <div className="tt-topbar">
        <div className="tt-topbar-left">
          {/* 🚀 뒤로가기 버튼: 클릭 시 이전 페이지(BasicTab)로 이동 */}
          <button className="tt-back-btn" onClick={() => navigate(-1)} title="뒤로가기">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="tt-breadcrumb">학생 관리 › {student?.korName} › <span>TOPIK 이력 조회</span></div>
        </div>
      </div>

      {/* 이력 카드 영역 */}
      <div className="tt-card">
        <div className="tt-card-header">
          <div className="tt-title">한국어 능력 시험(TOPIK) 이력</div>
          <button className="add-btn">+ 새 성적 등록</button>
        </div>

        <table className="tt-table">
          <thead>
            <tr>
              <th>시험 일자</th>
              <th>급수</th>
              <th>취득 점수</th>
              <th>유효 기간</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {topikHistory.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 500 }}>{item.date}</td>
                <td><span style={{ color: '#3B82F6', fontWeight: 700 }}>{item.level}</span></td>
                <td>{item.score}</td>
                <td style={{ color: '#6B7280' }}>{item.expiry}</td>
                <td>
                  <span className={`status-badge ${item.status === '유효' ? 'status-valid' : 'status-expired'}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {topikHistory.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
            등록된 TOPIK 이력이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}