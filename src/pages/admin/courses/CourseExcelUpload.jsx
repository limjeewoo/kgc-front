import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';

export default function CourseExcelUpload({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSemesters();
    }
  }, [isOpen]);

  const fetchSemesters = async () => {
    setLoadingSemesters(true);
    try {
      // API 명세서: 전체 학기 목록 조회
      const res = await api.get('/api/v1/semesters');
      
      if (res.data?.success && Array.isArray(res.data.data)) {
        // 백엔드 DB에 학기 데이터가 아예 없을 때를 위한 방어 로직 (테스트용)
        if (res.data.data.length === 0) {
          setSemesters([
            { id: "2026-1", name: "2026학년도 1학기 (임시)" },
            { id: "2026-2", name: "2026학년도 2학기 (임시)" }
          ]);
        } else {
          setSemesters(res.data.data);
        }
      } else {
        console.error("학기 목록 로드 실패:", res.data?.message);
      }
    } catch (error) {
      console.error("학기 API 요청 중 오류 발생:", error);
      // 서버 연결 실패 시 프론트 UI 확인을 위한 대체 더미 데이터 투입
      setSemesters([
        { id: "2026-1", name: "2026학년도 1학기 (서버연결실패 대용)" },
        { id: "2025-2", name: "2025학년도 2학기 (서버연결실패 대용)" }
      ]);
    } finally {
      setLoadingSemesters(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedSemester) {
      alert("업로드할 학기를 선택해주세요.");
      return;
    }

    if (!file) {
      alert("파일을 선택해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      // API 명세서: 과목 엑셀 일괄 등록 쿼리 스트링(?semesterId=) 매핑
      const res = await api.post(`/api/v1/courses/bulk-upload?semesterId=${encodeURIComponent(selectedSemester)}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        alert("과목 엑셀 일괄 등록이 완료되었습니다.");
        onSuccess();
        onClose();
        setSelectedSemester('');
      } else {
        alert(res.data?.message || "서버 응답 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("엑셀 업로드 실패:", error);
      alert(error.response?.data?.message || "업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="excel-modal">
      <style>{`
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

        .excel-modal__content {
          background: #ffffff;
          padding: 2rem;
          border-radius: 1rem;
          width: 26rem;
          box-shadow: 0 1.25rem 1.5rem -0.25rem rgba(0, 0, 0, 0.1);
        }

        .excel-modal__header {
          margin-bottom: 1.25rem;
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

        .excel-modal__form-group {
          margin-bottom: 1.25rem;
        }

        .excel-modal__label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .excel-modal__select {
          width: 100%;
          padding: 0.625rem 0.75rem;
          border: 1px solid #D1D5DB;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #1F2937;
          background-color: #fff;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }

        .excel-modal__select:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .excel-modal__select:disabled {
          background-color: #F3F4F6;
          color: #9CA3AF;
          cursor: not-allowed;
        }

        .excel-modal__dropzone {
          border: 2px dashed #E5E7EB;
          border-radius: 0.75rem;
          padding: 2rem 1.5rem;
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

        .excel-modal__icon {
          margin-bottom: 0.5rem;
          color: #9CA3AF;
        }

        .excel-modal__dropzone:hover .excel-modal__icon {
          color: #3B82F6;
        }

        .excel-modal__file-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #2563EB;
          margin-top: 0.5rem;
        }

        .excel-modal__footer {
          display: flex;
          gap: 0.625rem;
          justify-content: flex-end;
        }

        .excel-modal__btn {
          padding: 0.625rem 1.25rem;
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: 0.15s;
          border: none;
        }

        .excel-modal__btn--cancel {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          color: #374151;
        }

        .excel-modal__btn--cancel:hover {
          background: #F9FAFB;
        }

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
          <p className="excel-modal__subtitle">대상 학기와 Excel 파일을 선택하여 과목을 등록합니다.</p>
        </header>

        <div className="excel-modal__form-group">
          <label className="excel-modal__label">📌 대상 학기 선택</label>
          <select 
            className="excel-modal__select"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            disabled={loadingSemesters || uploading}
          >
            {loadingSemesters ? (
              <option>학기 리스트 불러오는 중...</option>
            ) : (
              <>
                <option value="">-- 등록할 학기를 고르세요 --</option>
                {semesters.map((sem) => {
                  // 백엔드 엔티티의 다양한 key 명칭을 자동 수용하는 폴백 처리
                  const semesterValue = sem.id || sem.semesterId || sem.code;
                  const semesterLabel = sem.name || sem.semesterName || sem.title || semesterValue;
                  
                  return (
                    <option key={semesterValue} value={semesterValue}>
                      {semesterLabel}
                    </option>
                  );
                })}
              </>
            )}
          </select>
        </div>
        
        <div className="excel-modal__dropzone" onClick={() => document.getElementById('excelFile').click()}>
          <div className="excel-modal__icon">
            <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
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
          <button 
            className="excel-modal__btn excel-modal__btn--confirm" 
            onClick={handleUpload} 
            disabled={uploading || !file || !selectedSemester}
          >
            {uploading ? "업로드 중..." : "업로드 시작"}
          </button>
        </footer>
      </div>
    </div>
  );
}