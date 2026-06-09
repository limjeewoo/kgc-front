import React, { useState } from 'react';
import StaffBasicTab   from './StaffBasicTab.jsx';
import StaffVisaTab    from './StaffVisaTab.jsx';
import StaffTopikTab   from './StaffTopikTab.jsx';
import StaffConsultTab from './StaffConsultTab.jsx';

export default function StaffStudentDetail({ studentId, studentName, onBack, permissions, activeTab, onTabChange }) {
  const [internalTab, setInternalTab] = useState('basic');
  const currentTab = activeTab   ?? internalTab;
  const handleTab  = onTabChange ?? setInternalTab;

  const can = (key) => permissions?.find(p => p.permissionKey === key)?.isEnabled === true;

  const TABS = [
    { key: 'basic',   label: '기본 정보', show: can('STUDENT_VIEW') },
    { key: 'visa',    label: '비자',      show: can('VISA_VIEW') },
    { key: 'topik',   label: 'TOPIK',     show: can('TOPIK_VIEW') },
    { key: 'consult', label: '상담',      show: can('CONSULT_VIEW') },
  ].filter(t => t.show);

  return (
    <div style={{ fontFamily: "'DM Sans','Noto Sans KR',sans-serif", backgroundColor: '#F0F2F7', minHeight: '100vh' }}>
      <style>{`
        .ssd-tab-bar { display:flex; align-items:center; gap:4px; background:#fff; padding:0 1.75rem; border-bottom:1px solid #E5E7EB; }
        .ssd-tab { padding:1rem 1.25rem; font-size:0.875rem; font-weight:500; color:#6B7280; border:none; background:transparent; cursor:pointer; border-bottom:2px solid transparent; transition:all 0.15s; font-family:inherit; white-space:nowrap; }
        .ssd-tab:hover { color:#111827; }
        .ssd-tab.active { color:#1A3A5C; font-weight:700; border-bottom-color:#1A3A5C; }
      `}</style>

      <div className="ssd-tab-bar">
        {TABS.map(t => (
          <button key={t.key} className={`ssd-tab ${currentTab === t.key ? 'active' : ''}`} onClick={() => handleTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {currentTab === 'basic'   && can('STUDENT_VIEW') && <StaffBasicTab   studentId={studentId} onBack={onBack} permissions={permissions} />}
      {currentTab === 'visa'    && can('VISA_VIEW')    && <StaffVisaTab    studentId={studentId} permissions={permissions} />}
      {currentTab === 'topik'   && can('TOPIK_VIEW')   && <StaffTopikTab   studentId={studentId} permissions={permissions} />}
      {currentTab === 'consult' && can('CONSULT_VIEW') && <StaffConsultTab studentId={studentId} studentName={studentName} permissions={permissions} />}
    </div>
  );
}
