import React from 'react';
import JobTab     from '../../../admin/students/StudentDetail/JobTab.jsx';
import MileageManage from '../../../admin/jobs/MileageManage.jsx';

export default function StaffJobPage({ studentId, permissions }) {
  const canApprove = permissions?.find(p => p.permissionKey === 'JOB_APPROVAL')?.isEnabled === true;

  return (
    <div style={{ padding: '1.25rem', backgroundColor: '#F0F2F7', minHeight: '80vh' }}>
      {/* JOB_APPROVAL 권한 없으면 승인/반려 버튼 CSS로 숨김 */}
      {!canApprove && (
        <style>{`
          .jt-btn-approve, .jt-btn-reject { display: none !important; }
        `}</style>
      )}
      <JobTab studentId={studentId} />

      <div style={{ marginTop: '2rem' }}>
        <MileageManage studentId={studentId} />
      </div>
    </div>
  );
}
