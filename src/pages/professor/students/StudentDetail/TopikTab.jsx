import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// const BASE_URL = 'https://api.kmgc.world'; // 배포용
const BASE_URL = 'http://localhost:8080'; // 개발용

export default function TopikTab() {
  const { studentId } = useParams();
  const id = studentId;
  const navigate = useNavigate();
  
  // 상태 관리
  const [student, setStudent] = useState(null);
  const [topikHistory, setTopikHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const api = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
  });

  useEffect(() => {
    const fetchTopikData = async () => {
      try {
        setIsLoading(true);

        // 1. 학생 기본 정보 (이름, 학과 등 상단 UI용)
        // 2. 해당 학생의 TOPIK 성적 이력 목록
        const [studentRes, topikRes] = await Promise.all([
          api.get(`/api/v1/students/${id}`).catch(() => ({ data: { data: {} } })),
          api.get(`/api/v1/students/${id}/topik`).catch(() => ({ data: { data: [] } }))
        ]);

        if (studentRes.data?.success) {
          setStudent(studentRes.data.data);
        }

        if (topikRes.data?.success) {
          const sortedHistory = (topikRes.data.data || []).sort(
            (a, b) => new Date(b.testDate || '') - new Date(a.testDate || '')
          );
          setTopikHistory(sortedHistory);
        }

      } catch (error) {
        console.error("TOPIK 이력 데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchTopikData();
  }, [id]);

  // 날짜 비교를 통한 유효/만료 상태 계산 함수
  const checkStatus = (expiryDate, apiStatus) => {
    if (apiStatus) return apiStatus; // API에서 '유효' 또는 '만료'를 직접 주면 그대로 사용
    if (!expiryDate) return '-';
    
    const today = new Date();
    const expDate = new Date(expiryDate);
    return expDate >= today ? '유효' : '만료';
  };

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

        .add-btn { background: #1A3A5C; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
        .add-btn:hover { background: #112740; }
      `}</style>

      {/* 상단 네비게이션 */}
      <div className="tt-topbar">
        <div className="tt-topbar-left">
          <button className="tt-back-btn" onClick={() => navigate(-1)} title="뒤로가기">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="tt-breadcrumb">
            학생 관리 › {student?.korName || '학생 이름'} › <span>TOPIK 이력 조회</span>
          </div>
        </div>
      </div>

      {/* 이력 카드 영역 */}
      <div className="tt-card">
        <div className="tt-card-header">
          <div className="tt-title">한국어 능력 시험(TOPIK) 이력</div>
          <button className="add-btn" onClick={() => alert('새 성적 등록 모달 오픈 예정')}>+ 새 성적 등록</button>
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
            {topikHistory.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                  등록된 TOPIK 이력이 없습니다.
                </td>
              </tr>
            ) : (
              topikHistory.map((item) => {
                const status = checkStatus(item.expiryDate, item.status);
                
                return (
                  <tr key={item.topikId || item.id}>
                    <td style={{ fontWeight: 500 }}>{item.testDate || '-'}</td>
                    <td><span style={{ color: '#3B82F6', fontWeight: 700 }}>{item.topikLevel || '-'}</span></td>
                    <td>{item.totalScore ? `${item.totalScore}점` : '-'}</td>
                    <td style={{ color: '#6B7280' }}>{item.expiryDate || '-'}</td>
                    <td>
                      <span className={`status-badge ${status === '유효' ? 'status-valid' : 'status-expired'}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}