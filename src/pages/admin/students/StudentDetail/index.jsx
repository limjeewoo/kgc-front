import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BasicTab from './BasicTab';
import VisaTab from './VisaTab';
// import AttendanceTab from './AttendanceTab'; // 다른 탭들

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'visa', 'attendance' 등

  // 신규 등록 모드일 때는 기본 정보 탭만 보이도록 처리
  const isNewMode = id === 'new';

  return (
    <div style={{ background: '#F3F4F6', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        
        {/* 탭 네비게이션 */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC' }}>
          <button 
            style={{ padding: '1rem 2rem', fontWeight: 600, borderBottom: activeTab === 'basic' ? '3px solid #3B82F6' : '3px solid transparent', color: activeTab === 'basic' ? '#1D4ED8' : '#64748B', cursor: 'pointer', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
            onClick={() => setActiveTab('basic')}
          >
            기본 정보
          </button>
          
          {!isNewMode && (
            <button 
              style={{ padding: '1rem 2rem', fontWeight: 600, borderBottom: activeTab === 'visa' ? '3px solid #3B82F6' : '3px solid transparent', color: activeTab === 'visa' ? '#1D4ED8' : '#64748B', cursor: 'pointer', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
              onClick={() => setActiveTab('visa')}
            >
              비자 및 국적
            </button>
          )}
        </div>

        {/* 탭 내용 */}
        <div style={{ padding: '0' }}>
          {activeTab === 'basic' && <BasicTab studentId={id} />}
          {activeTab === 'visa' && <VisaTab studentId={id} isAdmin={true} />} {/* 관리자 여부를 props로 전달 */}
        </div>
      </div>
    </div>
  );
}