import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../api/axios';
import BasicTab   from './BasicTab.jsx';
import VisaTab    from './VisaTab.jsx';
import TopikTab   from './TopikTab.jsx';
import EnrollTab  from './EnrollTab.jsx';
import AttendTab  from './AttendTab.jsx';
import JobTab     from './JobTab.jsx';

const TABS = [
  { key: 'basic',  label: '기본 정보' },
  { key: 'visa',   label: '비자' },
  { key: 'topik',  label: 'TOPIK' },
  { key: 'enroll', label: '수강/성적' },
  { key: 'attend', label: '출결' },
  { key: 'job',    label: '시간제 근로' },
];

export default function ProfStudentDetail() {
  const { studentId } = useParams();
  const navigate      = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [student, setStudent]     = useState(null);
  const [loading, setLoading]     = useState(true);

  const currentUserRole = (() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const parsed = JSON.parse(userStr);
        return parsed.role || '';
      }
      return localStorage.getItem('role') || '';
    } catch (e) {
      return '';
    }
  })();

  const [hasEditPermission, setHasEditPermission] = useState(false);

  useEffect(() => {
    if (!studentId) return;

    const fetchPermissionsAndStudent = async () => {
      setLoading(true);

      if (currentUserRole) {
        try {
          const roleRes = await api.get(`/api/v1/admin/role-permissions/${currentUserRole}`);
          if (roleRes.data?.success && Array.isArray(roleRes.data.data)) {
            const canEdit = roleRes.data.data.some(
              p => p.permissionKey === 'STUDENT_EDIT' && p.isEnabled
            );
            setHasEditPermission(canEdit);
          }
        } catch (e) {
          console.warn('권한 확인 실패:', e);
          setHasEditPermission(false);
        }
      }

      try {
        const studentRes = await api.get(`/api/v1/students/${studentId}`);
        if (studentRes.data.success) {
          setStudent(studentRes.data.data);
        }
      } catch (e) {
        console.error('학생 조회 실패:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissionsAndStudent();
  }, [studentId, currentUserRole]);

  const readOnly = !hasEditPermission;

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContext:'center', height:'60vh', color:'#94A3B8', fontSize:13 }}>
      학생 정보를 불러오는 중...
    </div>
  );

  if (!student) return (
    <div style={{ padding:'3rem', textAlign:'center', color:'#EF4444', fontSize:13 }}>
      학생 정보를 찾을 수 없습니다.
    </div>
  );

  return (
    <div style={{ 
      fontFamily: "'DM Sans','Noto Sans KR',sans-serif", 
      color: '#111827',
      /* 💾 요구사항 반영: 메인 레이아웃의 좌우 패딩을 22px로 동일하게 설정했습니다. */
      padding: '0 22px' 
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

        .psd-header { display:flex; align-items:center; gap:12px; margin-bottom:1.25rem; }
        .psd-back { display:inline-flex; align-items:center; gap:6px; background:#fff; border:1px solid #E5E7EB; border-radius:8px; padding:7px 14px; font-size:13px; font-weight:600; color:#374151; cursor:pointer; font-family:inherit; transition:all .15s; }
        .psd-back:hover { background:#F9FAFB; }

        .psd-profile { background:#fff; border:1px solid #F1F5F9; border-radius:14px; padding:20px 24px; margin-bottom:1.25rem; display:flex; align-items:center; gap:16px; }
        .psd-avatar { width:52px; height:52px; border-radius:50%; background:#EFF6FF; color:#1D4ED8; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:800; flex-shrink:0; }
        .psd-name { font-size:17px; font-weight:700; color:#0F172A; }
        .psd-meta { font-size:12px; color:#94A3B8; margin-top:3px; }

        .psd-readonly-badge { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; background:#FFFBEB; border:1px solid #FDE68A; border-radius:20px; font-size:11px; font-weight:700; color:#D97706; margin-left:auto; }

        .psd-tabs { display:flex; gap:4px; margin-bottom:1rem; border-bottom:2px solid #F1F5F9; padding-bottom:0; }
        .psd-tab { padding:9px 18px; font-size:13px; font-weight:600; color:#94A3B8; cursor:pointer; border:none; background:none; font-family:inherit; border-bottom:2px solid transparent; margin-bottom:-2px; transition:all .15s; }
        .psd-tab:hover { color:#374151; }
        .psd-tab.active { color:#1A3A5C; border-bottom-color:#1A3A5C; }

        .psd-body { animation:fadeUp .25s ease; }
      `}</style>

      <div className="psd-header">
        <button className="psd-back" onClick={() => navigate(-1)}>← 목록으로</button>
      </div>

      <div className="psd-profile">
        <div className="psd-avatar">{(student.korName || student.engName || '?')[0]}</div>
        <div>
          <div className="psd-name">{student.korName || student.engName}</div>
          <div className="psd-meta">
            {student.studentId} · {student.deptName} · {student.grade}학년 {student.classSec}반 · {student.nationality}
          </div>
        </div>
        {!hasEditPermission && (
          <div className="psd-readonly-badge">
            🔒 읽기 전용 (교수 권한)
          </div>
        )}
      </div>

      <div className="psd-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`psd-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="psd-body">
        {activeTab === 'basic'  && <BasicTab  studentId={studentId} readOnly={readOnly} />}
        {activeTab === 'visa'   && <VisaTab   studentId={studentId} readOnly={readOnly} />}
        {activeTab === 'topik'  && <TopikTab  studentId={studentId} readOnly={readOnly} />}
        {activeTab === 'enroll' && <EnrollTab studentId={studentId} readOnly={readOnly} />}
        {activeTab === 'attend' && <AttendTab studentId={studentId} readOnly={readOnly} />}
        {activeTab === 'job'    && <JobTab    studentId={studentId} readOnly={readOnly} />}
      </div>
    </div>
  );
}