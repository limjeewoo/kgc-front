import React from 'react';
import JobPending    from '../../admin/jobs/JobPending.jsx';
import MileageManage from '../../admin/jobs/MileageManage.jsx';

export default function StaffJobPendingPage({ permissions }) {
  const canApprove = permissions?.find(p => p.permissionKey === 'JOB_APPROVAL')?.isEnabled === true;

  return (
    <div style={{ padding: '1.25rem 1.75rem', backgroundColor: '#F0F2F7', minHeight: '100vh' }}>
      {!canApprove && (
        <style>{`
          .act-approve, .act-reject,
          .drawer-ft { display: none !important; }
        `}</style>
      )}
      <JobPending />
    </div>
  );
}
