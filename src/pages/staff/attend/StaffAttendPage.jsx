import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import SearchByClass from '../../admin/search/SearchByClass.jsx';

export default function StaffAttendPage({ permissions }) {
  const [showUpload, setShowUpload]             = useState(false);
  const [uploadFile, setUploadFile]             = useState(null);
  const [uploading, setUploading]               = useState(false);
  const [currentSemesterId, setCurrentSemesterId] = useState('');

  const can = (key) => permissions?.find(p => p.permissionKey === key)?.isEnabled === true;

  useEffect(() => {
    api.get('/api/v1/semesters/current')
      .then(res => { if (res.data?.success) setCurrentSemesterId(res.data.data.semesterId); })
      .catch(() => {});
  }, []);

  const handleUpload = async () => {
    if (!uploadFile) { alert('파일을 선택해주세요.'); return; }
    if (!currentSemesterId) { alert('현재 학기 정보를 불러올 수 없습니다.'); return; }
    const formData = new FormData();
    formData.append('file', uploadFile);
    setUploading(true);
    try {
      const res = await api.post(
        `/api/v1/attend/upload?semesterId=${currentSemesterId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (res.data.success) {
        alert('출결 업로드가 완료되었습니다.');
        setShowUpload(false);
        setUploadFile(null);
      }
    } catch (e) {
      alert(e.response?.data?.message || '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans','Noto Sans KR',sans-serif", position: 'relative' }}>
      <style>{`
        /* SearchByClass 원본 탑바 숨김 */
        .sc-topbar { display: none !important; }

        .sap-topbar {
          background: #fff; padding: 0 1.75rem; height: 3.625rem;
          display: flex; align-items: center; justify-content: space-between;
          border-radius: 0.875rem; margin: 1.25rem 0 0;
          border: 1px solid #E5E7EB;
        }
        .sap-breadcrumb { font-size: 0.8125rem; color: #9CA3AF; }
        .sap-breadcrumb span { color: #111827; font-weight: 600; }
        .sap-topbar-right { display: flex; align-items: center; gap: 8px; }
        .sap-upload-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px; border: none;
          background: #1A3A5C; color: #fff; font-size: 0.8125rem; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: background 0.15s;
        }
        .sap-upload-btn:hover { background: #112740; }

        .sap-modal-bg {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .sap-modal {
          background: #fff; border-radius: 1rem; width: 28rem; padding: 2rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .sap-modal-title { font-size: 1.125rem; font-weight: 700; color: #111827; margin-bottom: 0.25rem; }
        .sap-modal-sub   { font-size: 0.8125rem; color: #6B7280; margin-bottom: 0.5rem; }
        .sap-notice {
          background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 0.5rem;
          padding: 0.75rem 1rem; font-size: 0.75rem; color: #1D4ED8;
          margin-bottom: 1.25rem; line-height: 1.6;
        }
        .sap-dropzone {
          border: 2px dashed #E5E7EB; border-radius: 0.75rem; padding: 2.5rem 1.5rem;
          text-align: center; cursor: pointer; background: #F9FAFB;
          margin-bottom: 1.5rem; transition: 0.2s;
        }
        .sap-dropzone:hover { border-color: #3B82F6; background: #F0F7FF; }
        .sap-file-name { font-size: 0.875rem; font-weight: 600; color: #2563EB; margin-top: 0.5rem; }
        .sap-modal-footer { display: flex; gap: 0.625rem; justify-content: flex-end; }
        .sap-btn-cancel  { padding: 0.625rem 1.25rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; background: #fff; border: 1px solid #E5E7EB; color: #374151; font-family: inherit; }
        .sap-btn-confirm { padding: 0.625rem 1.25rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; background: #10B981; color: #fff; border: none; font-family: inherit; }
        .sap-btn-confirm:disabled { background: #9CA3AF; cursor: not-allowed; }
      `}</style>

      {/* 조교용 탑바 */}
      <div className="sap-topbar">
        <div className="sap-breadcrumb">
          조교 대시보드 › <span>출결 관리</span>
        </div>
        <div className="sap-topbar-right">
          {can('ATTEND_UPLOAD') && (
            <button className="sap-upload-btn" onClick={() => setShowUpload(true)}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 4v12m0 0l-3-3m3 3l3-3M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              출결 파일 업로드
            </button>
          )}
        </div>
      </div>

      {/* SearchByClass 재사용 (탑바만 CSS로 숨김) */}
      <SearchByClass onBack={null} />

      {/* 업로드 모달 */}
      {showUpload && (
        <div className="sap-modal-bg" onClick={() => { setShowUpload(false); setUploadFile(null); }}>
          <div className="sap-modal" onClick={e => e.stopPropagation()}>
            <div className="sap-modal-title">출결 엑셀 업로드</div>
            <div className="sap-modal-sub">현재 학기: {currentSemesterId || '불러오는 중...'}</div>
            <div className="sap-notice">
              📌 파일명이 자동으로 파싱됩니다.<br/>
              형식: <strong>과목명_(학과명-학년-반)_attendance.xlsx</strong><br/>
              예시: Java기초_(컴퓨터소프트웨어(3년제)과-2-D)_attendance.xlsx
            </div>
            <div className="sap-dropzone" onClick={() => document.getElementById('staffAttendFile').click()}>
              <svg width="40" height="40" fill="none" stroke="#9CA3AF" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M12 4v12m0 0l-3-3m3 3l3-3M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div style={{ fontSize: '0.8125rem', color: '#6B7280', marginTop: '0.5rem' }}>
                {uploadFile ? '파일을 변경하려면 클릭하세요' : '클릭하여 엑셀 파일을 선택하세요 (.xlsx)'}
              </div>
              <input id="staffAttendFile" type="file" hidden accept=".xlsx,.xls"
                onChange={e => setUploadFile(e.target.files[0])} />
              {uploadFile && <div className="sap-file-name">📄 {uploadFile.name}</div>}
            </div>
            <div className="sap-modal-footer">
              <button className="sap-btn-cancel" onClick={() => { setShowUpload(false); setUploadFile(null); }} disabled={uploading}>취소</button>
              <button className="sap-btn-confirm" onClick={handleUpload} disabled={uploading || !uploadFile}>
                {uploading ? '업로드 중...' : '업로드 시작'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
