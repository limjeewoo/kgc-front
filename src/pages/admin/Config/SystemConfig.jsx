import React, { useState, useEffect } from 'react';
import api from "../../../api/axios";

function RolePermissionManagement() {
  const [activeTab, setActiveTab] = useState('STAFF');
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchPermissions = async (role) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/admin/role-permissions/${role}`);
      
      if (response.data?.success) {
        setPermissions(response.data.data || []);
      } else {
        setPermissions([]);
      }
    } catch (error) {
      console.error(`${role} 권한 조회 에러:`, error);
      alert(error.response?.data?.message || '권한 목록을 불러오는 중 오류가 발생했습니다.');
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions(activeTab);
  }, [activeTab]);

  const handleTogglePermission = async (id, currentStatus) => {
    if (updatingId) return;

    const nextStatus = !currentStatus;

    try {
      setUpdatingId(id);
      
      const response = await api.patch(`/api/v1/admin/role-permissions/${id}`, {
        isEnabled: nextStatus
      });

      if (response.data?.success) {
        setPermissions(prev =>
          prev.map(item => (item.id === id ? { ...item, isEnabled: nextStatus } : item))
        );
      } else {
        alert(response.data?.message || '권한 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('권한 토글 에러:', error);
      alert(error.response?.data?.message || '네트워크 오류가 발생했습니다.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="permission-container">
      <style>{`
        .permission-container { animation: fadeIn 0.25s ease; padding: 1.5rem; background: #FFF; border-radius: 1rem; border: 1px solid #F1F5F9; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .page-hd { margin-bottom: 1.5rem; border-bottom: 1px solid #E2E8F0; padding-bottom: 1rem; }
        .page-title { font-size: 1.125rem; font-weight: 700; color: #0F172A; }
        .page-desc { font-size: 0.8125rem; color: #64748B; margin-top: 0.25rem; }
        
        .tab-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; background: #F8FAFC; padding: 0.375rem; border-radius: 0.5rem; border: 1px solid #E2E8F0; width: fit-content; }
        .tab-btn { border: none; background: none; padding: 0.5rem 1.25rem; font-size: 0.8125rem; font-weight: 600; color: #64748B; cursor: pointer; border-radius: 0.375rem; transition: 0.15s; }
        .tab-btn:hover { color: #334155; }
        .tab-btn.active { background: #FFF; color: #10B981; box-shadow: 0 1px 3px rgba(15,23,42,0.08); border: 1px solid #E2E8F0; }

        .perm-table-wrapper { width: 100%; overflow-x: auto; border-radius: 0.5rem; border: 1px solid #E2E8F0; }
        .perm-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.8125rem; }
        .perm-table th { background: #F8FAFC; color: #475569; font-weight: 600; padding: 0.75rem 1rem; border-bottom: 1px solid #E2E8F0; }
        .perm-table td { padding: 1rem; border-bottom: 1px solid #F1F5F9; color: #334155; vertical-align: middle; }
        .perm-table tr:last-child td { border-bottom: none; }
        .key-badge { background: #F1F5F9; color: #475569; font-family: monospace; font-size: 0.75rem; padding: 0.125rem 0.375rem; border-radius: 0.25rem; border: 1px solid #E2E8F0; }
        
        .switch { position: relative; display: inline-block; width: 40px; height: 22px; cursor: pointer; }
        .switch input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; z-index: 2; cursor: pointer; margin: 0; }
        .slider { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: #CBD5E1; transition: .2s; border-radius: 34px; z-index: 1; pointer-events: none; }
        .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: .2s; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
        
        input:checked + .slider { background-color: #10B981; }
        input:checked + .slider:before { transform: translateX(18px); }
        
        .switch.disabled { opacity: 0.5; cursor: not-allowed; }
        .switch.disabled input { cursor: not-allowed; }

        .loading-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 0; color: #64748B; font-size: 0.8125rem; }
        .spinner { width: 28px; height: 28px; border: 3px solid #E2E8F0; border-top-color: #10B981; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 8px; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="page-hd">
        <div className="page-title">🛡️ 시스템 권한 관리</div>
        <div className="page-desc">교수진 및 조교 계정의 기본 메뉴 접근 및 기능 제어 권한을 설정합니다. (ADMIN 권한은 상시 활성화)</div>
      </div>

      <div className="tab-bar">
        <button 
          className={`tab-btn ${activeTab === 'STAFF' ? 'active' : ''}`} 
          onClick={() => setActiveTab('STAFF')}
        >
          STAFF (조교)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'PROFESSOR' ? 'active' : ''}`} 
          onClick={() => setActiveTab('PROFESSOR')}
        >
          PROFESSOR (교수)
        </button>
      </div>

      {loading ? (
        <div className="loading-box">
          <div className="spinner" />
          <p>권한 데이터를 불러오는 중...</p>
        </div>
      ) : (
        <div className="perm-table-wrapper">
          <table className="perm-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>권한 키 (Permission Key)</th>
                <th style={{ width: '45%' }}>설명</th>
                <th style={{ width: '20%', textAlign: 'center' }}>상태 활성화</th>
              </tr>
            </thead>
            <tbody>
              {permissions.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '3rem 0', color: '#94A3B8' }}>
                    조회된 권한 정보가 없습니다.
                  </td>
                </tr>
              ) : (
                permissions.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="key-badge">{item.permissionKey}</span>
                    </td>
                    <td style={{ fontWeight: '500', color: '#1E293B' }}>
                      {item.description}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <label className={`switch ${updatingId === item.id ? 'disabled' : ''}`}>
                        <input 
                          type="checkbox" 
                          checked={item.isEnabled} 
                          disabled={updatingId === item.id}
                          onChange={() => handleTogglePermission(item.id, item.isEnabled)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RolePermissionManagement;