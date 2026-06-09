import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import ProfessorRegister from './ProfessorRegister'; 

export default function ProfessorList() {
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    fetchProfessors();
  }, []);

  const fetchProfessors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/professors');
      if (response.data?.success) {
        setProfessors(response.data.data || []);
      }
    } catch (error) {
      console.error('교수 목록 로드 실패:', error);
      setProfessors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (professorId) => {
    alert(`사번 [ ${professorId} ] 교수 정보 수정 페이지 이동 또는 모달 오픈`);
  };

  const handleDelete = async (professorId) => {
    if (!window.confirm(`사번 ${professorId} 교수를 삭제하시겠습니까?\n배정된 지도교수 데이터가 함께 삭제됩니다.`)) return;
    
    try {
      const response = await api.delete(`/api/v1/professors/${professorId}`);
      if (response.data?.success) {
        alert("삭제 완료되었습니다.");
        fetchProfessors();
      } else {
        alert(response.data?.message || "삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error('교수 삭제 실패:', error);
      alert('삭제 요청 중 오류가 발생했습니다.');
    }
  };

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
        .data-table td { padding: 0.875rem 1.25rem; font-size: 0.875rem; color: #374151; border-bottom: 1px solid #F3F4F6; vertical-align: middle; }
        .status-badge { display: inline-block; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background: #DEF7EC; color: #03543F; }
        .empty-row { text-align: center; padding: 3rem !important; color: #9CA3AF; }

        .btn-group { display: flex; gap: 0.375rem; }
        .btn-action { padding: 0.375rem 0.625rem; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: 0.15s; }
        .btn-action--edit { background: #F1F5F9; color: #475569; border-color: #E2E8F0; }
        .btn-action--edit:hover { background: #E2E8F0; }
        .btn-action--delete { background: #FEE2E2; color: #991B1B; }
        .btn-action--delete:hover { background: #FCA5A5; }

        /* 세로 비율을 살린 모달 레이아웃 */
        .modal-overlay { 
          position: fixed; 
          top: 0; left: 0; right: 0; bottom: 0; 
          background: rgba(15, 23, 42, 0.4); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          z-index: 999; 
          backdrop-filter: blur(5px); 
        }
        .modal-box { 
          background: #fff; 
          border-radius: 1.25rem; 
          width: 460px; 
          max-width: 90vw; 
          max-height: 85vh; 
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25); 
          overflow-y: auto; 
          padding: 2.5rem 2rem; 
          box-sizing: border-box;
          animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        
        .modal-header-ghost {
          display: flex;
          justify-content: flex-end;
          margin-bottom: -1rem;
        }
        .modal-close-x {
          background: none;
          border: none;
          font-size: 1.75rem;
          cursor: pointer;
          color: #9CA3AF;
          line-height: 1;
          padding: 0;
        }
        .modal-close-x:hover { color: #111827; }

        @keyframes modalPop { 
          from { opacity: 0; transform: scale(0.96) translateY(15px); } 
          to { opacity: 1; transform: scale(1) translateY(0); } 
        }
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
          <button className="btn-primary" onClick={() => setIsRegisterModalOpen(true)}>
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
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="empty-row">데이터를 불러오는 중입니다...</td>
              </tr>
            ) : filteredProfessors.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-row">조회된 교수 목록이 없습니다.</td>
              </tr>
            ) : (
              filteredProfessors.map((prof) => (
                <tr key={prof.professorId}>
                  <td style={{ fontWeight: 700, color: '#111827' }}>{prof.professorId}</td>
                  <td style={{ fontWeight: 600 }}>{prof.name}</td>
                  <td>
                    {prof.deptName} 
                    <small style={{ color: '#9CA3AF', marginLeft: '5px' }}>({prof.deptId})</small>
                  </td>
                  <td>{prof.phone || '-'}</td>
                  <td>{prof.email || '-'}</td>
                  <td><span className="status-badge">재직</span></td>
                  <td>
                    <div className="btn-group">
                      <button className="btn-action btn-action--edit" onClick={() => handleEdit(prof.professorId)}>수정</button>
                      <button className="btn-action btn-action--delete" onClick={() => handleDelete(prof.professorId)}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isRegisterModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRegisterModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-ghost">
              <button className="modal-close-x" onClick={() => setIsRegisterModalOpen(false)}>&times;</button>
            </div>
            <ProfessorRegister 
              onCancel={() => setIsRegisterModalOpen(false)} 
              onComplete={() => {
                setIsRegisterModalOpen(false);
                fetchProfessors();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}