import React from 'react';
import MileageManage from '../../admin/jobs/MileageManage.jsx';

export default function StaffMileagePage({ permissions }) {
  // 마일리지 점수 조정은 ADMIN 전용이라 조교는 읽기만 가능
  const canAdjust = permissions?.find(p => p.permissionKey === 'MILEAGE_EDIT')?.isEnabled === true;

  return (
    <div style={{ padding: '1.25rem 1.75rem', backgroundColor: '#F0F2F7', minHeight: '100vh' }}>
      {!canAdjust && (
        <style>{`
          .action-btn { display: none !important; }
        `}</style>
      )}
      <MileageManage />
    </div>
  );
}
