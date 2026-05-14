import React, { useState } from 'react';
import api from '../../../api/axios';

export default function CourseExcelUpload({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("파일을 선택해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await api.post('/api/v1/courses/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        alert("과목 엑셀 일괄 등록이 완료되었습니다.");
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("엑셀 업로드 실패:", error);
      alert(error.response?.data?.message || "업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <div className="excel-modal">
      <style>{`
        /* Block: excel-modal */
        .excel-modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          font-family: 'DM Sans', 'Noto Sans KR', sans-serif;
        }

        /* Element: excel-modal__content */
        .excel-modal__content {
          background: #ffffff;
          padding: 2rem;
          border-radius: 1rem;
          width: 26rem;
          box-shadow: 0 1.25rem 1.5rem -0.25rem rgba(0, 0, 0, 0.1);
        }

        /* Element: excel-modal__header */
        .excel-modal__header {
          margin-bottom: 1.5rem;
        }

        .excel-modal__title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .excel-modal__subtitle {
          font-size: 0.8125rem;
          color: #6B7280;
          margin-top: 0.25rem;
        }

        /* Element: excel-modal__dropzone */
        .excel-modal__dropzone {
          border: 2px dashed #E5E7EB;
          border-radius: 0.75rem;
          padding: 2.5rem 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #F9FAFB;
          margin-bottom: 1.5rem;
        }

        .excel-modal__dropzone:hover {
          border-color: #3B82F6;
          background: #F0F7FF;
        }

        /* Element: excel-modal__icon */
        .excel-modal__icon {
          margin-bottom: 0.75rem;
          color: #9CA3AF;
        }

        .excel-modal__dropzone:hover .excel-modal__icon {
          color: #3B82F6;
        }

        /* Element: excel-modal__file-info */
        .excel-modal__file-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #2563EB;
          margin-top: 0.5rem;
        }

        /* Element: excel-modal__footer */
        .excel-modal__footer {
          display: flex;
          gap: 0.625rem;
          justify-content: flex-end;
        }

        /* Element: excel-modal__btn (Base) */
        .excel-modal__btn {
          padding: 0.625rem 1.25rem;
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: 0.15s;
          border: none;
        }

        /* Modifier: --cancel */
        .excel-modal__btn--cancel {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          color: #374151;
        }

        .excel-modal__btn--cancel:hover {
          background: #F9FAFB;
        }

        /* Modifier: --confirm */
        .excel-modal__btn--confirm {
          background: #10B981;
          color: #ffffff;
        }

        .excel-modal__btn--confirm:hover {
          background: #059669;
        }

        .excel-modal__btn--confirm:disabled {
          background: #9CA3AF;
          cursor: not-allowed;
        }
      `}</style>
      
      <div className="excel-modal__content">
        <header className="excel-modal__header">
          <h3 className="excel-modal__title">과목 일괄 등록</h3>
          <p className="excel-modal__subtitle">Excel 파일을 업로드하여 과목을 한 번에 등록합니다.</p>
        </header>
        
        <div className="excel-modal__dropzone" onClick={() => document.getElementById('excelFile').click()}>
          <div className="excel-modal__icon">
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M12 4v12m0 0l-3-3m3 3l3-3M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={{fontSize: '0.8125rem', color: '#6B7280', margin: 0}}>
            {file ? "파일을 변경하려면 클릭하세요" : "클릭하여 엑셀 파일을 선택하세요"}
          </p>
          <input type="file" id="excelFile" hidden accept=".xlsx, .xls" onChange={handleFileChange} />
          {file && <div className="excel-modal__file-name">📄 {file.name}</div>}
        </div>

        <footer className="excel-modal__footer">
          <button className="excel-modal__btn excel-modal__btn--cancel" onClick={onClose} disabled={uploading}>
            취소
          </button>
          <button className="excel-modal__btn excel-modal__btn--confirm" onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? "업로드 중..." : "업로드 시작"}
          </button>
        </footer>
      </div>
    </div>
  );
}