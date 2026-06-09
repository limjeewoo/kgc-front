import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';

export default function ProfessorList({ onRegisterClick }) {
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 권한 설정을 제어하기 위한 핵심 상탯값
  const [permissionId, setPermissionId] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const [updatingPermission, setUpdatingPermission] = useState(false);

  useEffect(() => {
    fetchProfessors();
    fetchProfessorPermission();
  }, []);

  const fetchProfessors = async () => {
    try {
      setLoading(true);
      // API 명세서: 전체 교수 목록 조회
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

  const fetchProfessorPermission = async () => {
    try {
      // API 명세서: 특정 Role 권한 조회 (PROFESSOR)
      const response = await api.get('/api/v1/admin/role-permissions/PROFESSOR');
      if (response.data?.success && Array.isArray(response.data.data)) {
        
        // 교수 데이터 제어와 연관된 특정 권한 코드(PROFESSOR_EDIT) 판별 및 매핑
        const editPermission = response.data.data.find(
          (p) => p.permissionCode === 'PROFESSOR_EDIT' || p.name === 'PROFESSOR_EDIT'
        ) || response.data.data[0];

        if (editPermission) {
          setPermissionId(editPermission.id);
          setIsEditable(editPermission.isEnabled);
        }
      }
    } catch (error) {
      console.error('권한 설정 로드 실패:', error);
    }
  };

  const handleTogglePermission = async () => {
    if (!permissionId) return;

    const nextState = !isEditable;
    setUpdatingPermission(true);

    try {
      // API 명세서: 권한 온오프 토글 변경
      const response = await api.patch(`/api/v1/admin/role-permissions/${permissionId}`, {
        isEnabled: nextState
      });

      if (response.data?.success) {
        setIsEditable(nextState);
        alert(`교수 수정/삭제 권한이 ${nextState ? '허가' : '차단'}되었습니다.`);
      } else {
        alert(response.data?.message || "권한 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error('권한 업데이트 실패:', error);
      alert('권한 처리 중 에러가 발생했습니다.');
    } finally {
      setUpdatingPermission(false);
    }
  };

  const handleEdit = (professorId) => {
    alert(`사번 [ ${professorId} ] 교수 정보 수정 페이지 이동 또는 모달 오픈`);
  };

  const handleDelete = async (professorId) => {
    if (!window.confirm(`사번 ${professorId} 교수를 삭제하시겠습니까?\n배정된 지도교수 데이터가 함께 삭제됩니다.`)) return;
    
    try {
      // API 명세서: 교수 삭제
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
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .page-title { font-size: 1.25rem; font-weight: 700; color: #111827; }
        
        .permission-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          padding: 0.75rem 1.25rem;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .permission-text { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #334155; font-weight: 500; }
        .switch { position: relative; display: inline-block; width: 2.75rem; height: 1.5rem; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; inset: 0; background-color: #CBD5E1; transition: .3s; border-radius: 9999px; }
        .slider:before { position: absolute; content: ""; height: 1.125rem; width: 1.125rem; left: 0.1875rem; bottom: 0.1875rem; background-color: white; transition: .3s; border-radius: 50%; }
        input:checked + .slider { background-color: #10B981; }
        input:checked + .slider:before { transform: translateX(1.25rem); }
        input:disabled + .slider { opacity: 0.6; cursor: not-allowed; }

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

      {/* 실시간 교수 권한 허가 토글 바 */}
      <div className="permission-bar">
        <div className="permission-text">
          <span>⚙️</span>
          <span>교수 계정의 <strong>데이터 수정 및 삭제 권한</strong> 허용</span>
          <span style={{ fontSize: '0.75rem', color: isEditable ? '#10B981' : '#64748B', marginLeft: '0.25rem' }}>
            ({isEditable ? '수정/삭제 가능' : '읽기 전용'})
          </span>
        </div>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={isEditable} 
            onChange={handleTogglePermission}
            disabled={!permissionId || updatingPermission}
          />
          <span className="slider"></span>
        </label>
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
              {isEditable && <th>관리</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isEditable ? "7" : "6"} className="empty-row">데이터를 불러오는 중입니다...</td>
              </tr>
            ) : filteredProfessors.length === 0 ? (
              <tr>
                <td colSpan={isEditable ? "7" : "6"} className="empty-row">조회된 교수 목록이 없습니다.</td>
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
                  <td>
                    <span className="status-badge">재직</span>
                  </td>
                  {isEditable && (
                    <td>
                      <div className="btn-group">
                        <button className="btn-action btn-action--edit" onClick={() => handleEdit(prof.professorId)}>수정</button>
                        <button className="btn-action btn-action--delete" onClick={() => handleDelete(prof.professorId)}>삭제</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}