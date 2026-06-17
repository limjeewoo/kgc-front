import React, { useState, useEffect } from 'react';
import api from '../../../../api/axios'; // 🚀 공통 API 인스턴스 사용

const fmt = (d) => d ? d.replace(/-/g, '. ') : '–';

export default function TopikTab({ studentId }) {
  const [student, setStudent] = useState(null);
  const [topikHistory, setTopikHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);

  const [hasEditPermission, setHasEditPermission] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const switchMenu = (menuName) => {
    window.dispatchEvent(
      new CustomEvent('switch-admin-menu', {
        detail: { menu: menuName }
      })
    );
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        const roles = payload.roles || payload.authorities || [];
        
        setHasEditPermission(roles.includes('TOPIK_EDIT') || roles.includes('ADMIN') || roles.includes('STAFF'));
        setIsAdmin(roles.includes('ADMIN'));
      } catch (e) {
        console.error("토큰 파싱 실패:", e);
      }
    }
  }, []);

  const fetchTopikData = async () => {
    if (!studentId) return;

    try {
      setIsLoading(true);

      const [studentRes, topikRes] = await Promise.all([
        api.get(`/api/v1/students/${studentId}`).catch(() => ({ data: { data: {} } })),
        api.get(`/api/v1/students/${studentId}/topik`).catch(() => ({ data: { data: [] } }))
      ]);

      if (studentRes.data?.success) {
        setStudent(studentRes.data.data);
      } else if (studentRes.data) {
        setStudent(studentRes.data);
      }

      let rawList = [];
      if (topikRes.data?.success) {
        rawList = topikRes.data.data?.topiks || topikRes.data.data || [];
      } else if (Array.isArray(topikRes.data)) {
        rawList = topikRes.data;
      }

      const sortedHistory = [...rawList].sort(
        (a, b) => new Date(b.examDate || '') - new Date(a.examDate || '')
      );
      setTopikHistory(sortedHistory);

    } catch (error) {
      console.error("TOPIK 데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!studentId) {
      alert('TOPIK 이력을 조회할 학생이 선택되지 않았습니다.');
      switchMenu('학생 목록');
      return;
    }
    fetchTopikData();
  }, [studentId]);

  const handleDelete = async (langId) => {
    if (!window.confirm("해당 TOPIK 이력을 정말 삭제하시겠습니까?")) return;
    
    try {
      setIsDeleting(langId);
      const res = await api.delete(`/api/v1/topik/${langId}`);
      if (res.data?.success || res.status === 200 || res.status === 204) {
        alert("성공적으로 삭제되었습니다.");
        fetchTopikData();
      }
    } catch (error) {
      console.error("TOPIK 삭제 실패:", error);
      alert(error.response?.data?.message || "삭제 실패했습니다.");
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: '#9CA3AF' }}>
        <div className="tt-spin" style={{ marginRight: 8 }} /> 데이터 로딩 중...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', 'Noto Sans KR', sans-serif", fontSize: '14px', color: '#111827', padding: '0 22px' }}>
      <style>{`
        .tt-topbar { background: #fff; padding: 0 28px; height: 58px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E5E7EB; margin-bottom: 24px; }
        .tt-topbar-left { display: flex; align-items: center; gap: 10px; }
        
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
        .tt-table td { padding: 14px 12px; font-size: 13px; border-bottom: 1px solid #F9FAFB; color: #374151; }
        
        .add-btn { background: #1A3A5C; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
        .add-btn:hover { background: #112740; }

        .del-btn { background: none; border: 1px solid #FCA5A5; color: #EF4444; padding: 4px 8px; border-radius: 6px; font-size: 11px; cursor: pointer; transition: all 0.2s; font-weight: 500; }
        .del-btn:hover { background: #FEF2F2; border-color: #EF4444; }
        .del-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        @keyframes tt-spin { to { transform: rotate(360deg); } }
        .tt-spin { width: 16px; height: 16px; border: 2px solid #E5E7EB; border-top-color: #1A3A5C; border-radius: 50%; animation: tt-spin 0.6s linear infinite; display: inline-block; }
      `}</style>

      <div className="tt-topbar">
        <div className="tt-topbar-left">
          <button className="tt-back-btn" onClick={() => switchMenu('학생 목록')} title="뒤로가기">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="tt-breadcrumb">
            학생 관리 › {student?.korName || '불러오는 중...'} › <span>TOPIK 이력 조회</span>
          </div>
        </div>
      </div>

      <div className="tt-card">
        <div className="tt-card-header">
          <div className="tt-title">한국어 능력 시험(TOPIK) 및 어학 이력</div>
          {hasEditPermission && (
            <button className="add-btn" onClick={() => alert('새 성적 등록 모달 오픈 예정')}>
              + 새 성적 등록
            </button>
          )}
        </div>

        <table className="tt-table">
          <thead>
            <tr>
              <th>시험일</th>
              <th>TOPIK 급수</th>
              <th>어학원 정보</th>
              <th>한국어학습 시작년월</th>
              <th>기초한국어능력평가</th>
              {isAdmin && <th style={{ textAlign: 'center' }}>관리</th>}
            </tr>
          </thead>
          <tbody>
            {topikHistory.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? "6" : "5"} style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                  등록된 TOPIK 이력이 없습니다.
                </td>
              </tr>
            ) : (
              topikHistory.map((item) => {
                const targetId = item.langId || item.id || item.topikId;
                
                return (
                  <tr key={targetId}>
                    <td style={{ fontWeight: 500 }}>{fmt(item.examDate)}</td>
                    <td>
                      <span style={{ color: '#3B82F6', fontWeight: 700 }}>
                        {item.topikLevel ? `${item.topikLevel}급` : '–'}
                      </span>
                    </td>
                    <td>
                      {item.instituteName ? (
                        <div>
                          <span style={{ fontWeight: 500 }}>{item.instituteName}</span>
                          {item.instituteLevel && <span style={{ fontSize: '11px', color: '#6B7280', marginLeft: '6px' }}>({item.instituteLevel} 수강)</span>}
                        </div>
                      ) : '–'}
                    </td>
                    <td>
                      {item.koreanStartDate ? fmt(item.koreanStartDate) : '–'}
                    </td>
                    <td>
                      {item.basicTestResult || '–'}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="del-btn" 
                          onClick={() => handleDelete(targetId)}
                          disabled={isDeleting === targetId}
                        >
                          {isDeleting === targetId ? '삭제중..' : '삭제'}
                        </button>
                      </td>
                    )}
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