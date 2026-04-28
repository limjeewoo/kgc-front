import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';

export default function ProfessorList({ onRegisterClick }) {
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. 백엔드에서 교수 목록 불러오기 (명세서 5번 항목)
  useEffect(() => {
    const fetchProfessors = async () => {
      try {
        setLoading(true);
        // GET /api/v1/professors 호출
        const response = await api.get('/api/v1/professors');
        
        // 명세서 응답 구조: { success: true, data: [ { professorId, deptId, deptName, name, ... }, ... ] }
        if (response.data?.success) {
          setProfessors(response.data.data || []);
        }
      } catch (error) {
        console.error('교수 목록을 불러오는데 실패했습니다.', error);
        // 에러 발생 시 사용자 피드백을 위해 빈 배열 설정
        setProfessors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessors();
  }, []);

  // 2. 검색 필터링 로직 (명세서 필드명: name, deptName 기준)
  const filteredProfessors = professors.filter(prof => 
    prof.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    prof.deptName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.professorId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="prof-list-container">
      <style>{`
        .prof-list-container { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .page-title { font-size: 1.25rem; font-weight: 700; color: #111827; }
        .header-actions { display: flex; gap: 0.75rem; }
        .search-input { padding: 0.625rem 1rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 0.875rem; width: 250px; outline: none; transition: border-color 0.2s; }
        .search-input:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        .btn-primary { background: #3B82F6; color: #fff; border: none; padding: 0.625rem 1.25rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; }
        .btn-primary:hover { background: #2563EB; }
        .table-card { background: #fff; border-radius: 0.875rem; border: 1px solid #F3F4F6; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .data-table { width: 100%; border-collapse: collapse; text-align: left; }
        .data-table th { background: #F9FAFB; padding: 1rem 1.25rem; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-transform: uppercase; border-bottom: 1px solid #E5E7EB; }
        .data-table td { padding: 0.5rem 0.5rem; font-size: 0.875rem; color: #374151; border-bottom: 1px solid #F3F4F6; }
        .status-badge { display: inline-block; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background: #DEF7EC; color: #03543F; }
        .empty-row { text-align: center; padding: 3rem !important; color: #9CA3AF; }
      `}</style>

      <div className="page-header">
        <h2 className="page-title">👨‍🏫 전체 교수 목록</h2>
        <div className="header-actions">
          <input 
            type="text" 
            className="search-input" 
            placeholder="이름, 학과 또는 사번 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn-primary" onClick={onRegisterClick}>
            <span>+</span> 교수 등록
          </button>
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>사번</th>
              <th>이름</th>
              <th>소속 학과</th>
              <th>연락처</th>
              <th>이메일</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="empty-row">데이터를 불러오는 중입니다...</td>
              </tr>
            ) : filteredProfessors.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-row">조회된 교수 목록이 없습니다.</td>
              </tr>
            ) : (
              filteredProfessors.map((prof) => (
                /* ✅ 명세서의 professorId를 key로 사용 */
                <tr key={prof.professorId}>
                  <td style={{ fontWeight: 700, color: '#111827' }}>{prof.professorId}</td>
                  <td style={{ fontWeight: 600 }}>{prof.name}</td>
                  <td>
                    {prof.deptName} 
                    <small style={{ color: '#9CA3AF', marginLeft: '5px' }}>({prof.deptId})</small>
                  </td>
                  <td>{prof.phone || '-'}</td>
                  <td>{prof.email || '-'}</td>
                  <td>
                    <span className="status-badge">재직</span>
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