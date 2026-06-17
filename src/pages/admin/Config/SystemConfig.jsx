import React, { useState, useEffect } from 'react';
import api from "../../../api/axios";

const getCategory = (description) => {
  if (!description) return '📁 기타 권한';
  const desc = description.toLowerCase();
  if (desc.includes('학생') || desc.includes('학적') || desc.includes('출결') || desc.includes('출석') || desc.includes('수강') || desc.includes('성적') || desc.includes('비자') || desc.includes('토픽') || desc.includes('topik') || desc.includes('온라인')) return '🎓 학사 및 학생 관리';
  if (desc.includes('마일리지') || desc.includes('포인트') || desc.includes('상담') || desc.includes('장학') || desc.includes('행사')) return '🏆 학생 지원 및 활동 관리';
  if (desc.includes('수정') || desc.includes('변경') || desc.includes('삭제') || desc.includes('조회') || desc.includes('목록') || desc.includes('설정')) return '⚙️ 시스템 및 데이터 제어';
  return '📁 기타 권한';
};

function RolePermissionManagement() {
  const [activeTab, setActiveTab] = useState('STAFF');
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [schedulerTime, setSchedulerTime] = useState("");

  const fetchPermissions = async (role) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/admin/role-permissions/${role}`);
      setPermissions(response.data?.success ? (response.data.data || []) : []);
    } catch (error) {
      alert(error.response?.data?.message || '권한 목록을 불러오는 중 오류가 발생했습니다.');
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedulerTime = async () => {
    try {
      const res = await api.get('/api/v1/admin/scheduler');
      const timeConfig = res.data.data.find(item => item.configKey === 'DAILY_SEND_TIME');
      if (timeConfig) setSchedulerTime(timeConfig.value);
    } catch (err) { console.error("시간 조회 실패", err); }
  };

  const handleSaveTime = async () => {
    try {
      await api.patch('/api/v1/admin/scheduler/DAILY_SCHEDULER', { value: schedulerTime });
      alert(`알림 발송 시간이 ${schedulerTime}으로 변경되었습니다.`);
    } catch (err) { alert("시간 변경에 실패했습니다."); }
  };

  useEffect(() => {
    if (activeTab === 'SETTING') {
      fetchSchedulerTime();
    } else {
      fetchPermissions(activeTab);
    }
  }, [activeTab]);

  const handleTogglePermission = async (id, currentStatus) => {
    if (updatingId) return;
    const nextStatus = !currentStatus;
    try {
      setUpdatingId(id);
      const response = await api.patch(`/api/v1/admin/role-permissions/${id}`, { isEnabled: nextStatus });
      if (response.data?.success) {
        setPermissions(prev => prev.map(item => (item.id === id ? { ...item, isEnabled: nextStatus } : item)));
      }
    } catch (error) { alert('네트워크 오류가 발생했습니다.'); } finally { setUpdatingId(null); }
  };

  const groupedPermissions = permissions.reduce((groups, item) => {
    const category = getCategory(item.description);
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
    return groups;
  }, {});

  const sortedCategories = Object.keys(groupedPermissions).sort((a, b) => {
    if (a.includes('기타')) return 1;
    if (b.includes('기타')) return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="permission-container">
      <style>{`
        .permission-container { animation: fadeIn 0.25s ease; padding: 1.5rem; background: #FFF; border-radius: 1rem; border: 1px solid #F1F5F9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .page-hd { margin-bottom: 1.5rem; border-bottom: 1px solid #E2E8F0; padding-bottom: 1rem; }
        .page-title { font-size: 1.125rem; font-weight: 700; color: #0F172A; }
        .tab-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; background: #F8FAFC; padding: 0.375rem; border-radius: 0.5rem; width: fit-content; border: 1px solid #E2E8F0; }
        .tab-btn { border: none; background: none; padding: 0.5rem 1.25rem; font-weight: 600; color: #64748B; cursor: pointer; border-radius: 0.375rem; transition: 0.15s; }
        .tab-btn.active { background: #FFF; color: #10B981; box-shadow: 0 1px 3px rgba(15,23,42,0.08); border: 1px solid #E2E8F0; }
        .perm-table-wrapper { width: 100%; border-radius: 0.5rem; border: 1px solid #E2E8F0; overflow: hidden; }
        .perm-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .perm-table th { background: #F8FAFC; padding: 0.875rem 1.25rem; text-align: left; border-bottom: 1px solid #E2E8F0; }
        .category-row td { background: #F8FAFC; font-weight: 700; padding: 0.75rem 1.25rem; border-bottom: 1px solid #E2E8F0; }
        .switch { position: relative; display: inline-block; width: 40px; height: 22px; cursor: pointer; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: #CBD5E1; border-radius: 34px; transition: .2s; }
        .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; border-radius: 50%; transition: .2s; }
        input:checked + .slider { background-color: #10B981; }
        input:checked + .slider:before { transform: translateX(18px); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <div className="page-hd">
        <div className="page-title">🛡️ 시스템 권한 및 정책 관리</div>
      </div>

      <div className="tab-bar">
        {['STAFF', 'PROFESSOR', 'SETTING'].map(tab => (
          <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'STAFF' ? '조교' : tab === 'PROFESSOR' ? '교수' : '알림 설정'}
          </button>
        ))}
      </div>

      {activeTab === 'SETTING' ? (
        <div style={{ padding: '2rem', border: '1px solid #E2E8F0', borderRadius: '0.5rem', background: '#F9FAFB' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>🕒 일일 알림 발송 시간 설정</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input type="time" value={schedulerTime} onChange={(e) => setSchedulerTime(e.target.value)} style={{ border: '1px solid #CBD5E1', padding: '0.5rem', borderRadius: '0.375rem' }} />
            <button onClick={handleSaveTime} style={{ background: '#10B981', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}>시간 적용</button>
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748B' }}>* 설정하신 시간에 모든 사용자에게 알림이 발송됩니다.</p>
        </div>
      ) : (
        <div className="perm-table-wrapper">
          <table className="perm-table">
            <thead>
              <tr><th>권한 설명</th><th style={{ textAlign: 'center' }}>상태 활성화</th></tr>
            </thead>
            <tbody>
              {sortedCategories.map(category => (
                <React.Fragment key={category}>
                  <tr className="category-row"><td colSpan="2">{category}</td></tr>
                  {groupedPermissions[category].map(item => (
                    <tr key={item.id}>
                      <td style={{ padding: '1rem 1.25rem', paddingLeft: '2.5rem' }}>{item.description}</td>
                      <td style={{ textAlign: 'center' }}>
                        <label className="switch">
                          <input type="checkbox" checked={item.isEnabled} onChange={() => handleTogglePermission(item.id, item.isEnabled)} />
                          <span className="slider"></span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RolePermissionManagement;