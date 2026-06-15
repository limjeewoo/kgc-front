import React, { useState, useEffect } from 'react';
import api from '../../../../api/axios.js';

// 🎯 주소창(useParams) 대신 대시보드에서 내려주는 props(studentId)를 직접 받습니다.
export default function VisaTab({ studentId }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [visaInfo, setVisaInfo] = useState({
    visaType: 'D-2',
    issueDate: '',
    expireDate: ''
  });

  // 🎯 화면 이동을 위한 커스텀 이벤트 함수 (navigate 대체)
  const switchMenu = (menuName) => {
    window.dispatchEvent(
      new CustomEvent('switch-admin-menu', {
        detail: { menu: menuName }
      })
    );
  };

  useEffect(() => {
    // 혹시라도 비정상적인 접근으로 studentId가 없을 경우, 주소를 바꾸지 않고 대시보드 메뉴만 목록으로 돌립니다.
    if (!studentId) {
      alert('비자를 등록할 학생이 선택되지 않았습니다. 학생 목록에서 대상을 선택해 주세요.');
      switchMenu('학생 목록');
      return;
    }

    const fetchStudentAndVisaDetails = async () => {
      setIsLoading(true);
      try {
        const studentRes = await api.get(`/api/v1/students/${studentId}`);
        if (studentRes.data?.success) {
          setSelectedStudent(studentRes.data.data);
        } else {
          setSelectedStudent(studentRes.data);
        }

        try {
          const visaRes = await api.get(`/api/v1/students/${studentId}/visas`);
          let visaDataList = visaRes.data?.success ? visaRes.data.data : visaRes.data;
          
          if (Array.isArray(visaDataList) && visaDataList.length > 0) {
            const currentVisa = visaDataList.find(v => v.isCurrent) || visaDataList[0];
            
            setVisaInfo({
              visaType: currentVisa.visaType || 'D-2',
              issueDate: currentVisa.issueDate || '',
              expireDate: currentVisa.expireDate || ''
            });
          }
        } catch (visaErr) {
          console.log("ℹ️ 신규 등록 학생입니다.");
        }

      } catch (err) {
        console.error("학생 정보 로드 실패:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentAndVisaDetails();
  }, [studentId]); // 의존성 배열에서 navigate 제거

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setVisaInfo(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'issueDate' && updated.expireDate && updated.expireDate < value) {
        updated.expireDate = '';
      }
      return updated;
    });
  };

  const handleBackToStudentList = () => {
    // 🎯 취소 버튼 클릭 시 학생 목록 탭으로 부드럽게 전환
    switchMenu('학생 목록');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...visaInfo,
        isCurrent: true 
      };

      await api.post(`/api/v1/students/${studentId}/visas`, payload);
      
      alert(`${selectedStudent?.korName || '해당'} 학생의 비자 정보 등록이 완료되었습니다.`);
      handleBackToStudentList(); // 🎯 저장 완료 후에도 학생 목록 탭으로 전환
      
    } catch (err) {
      alert('저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="main-content">
      <style>{`
        /* 대시보드 기본 본문 규격 유지 */
        .main-content { padding: 1.5rem 1.75rem; background: #F0F2F7; min-height: 100vh; font-family: 'DM Sans', 'Noto Sans KR', sans-serif; }
        
        /* StudentList 스타일과 통일한 헤더 */
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .page-title { font-size: 1.375rem; font-weight: 700; color: #111827; margin: 0; }
        .tab-desc { font-size: 0.8125rem; color: #6B7280; margin: 0.25rem 0 0 0; }

        /* 비자 폼을 담은 흰색 카드 */
        .visa-tab-wrapper { background: #fff; border-radius: 0.875rem; padding: 1.5rem; border: 1px solid #E5E7EB; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }

        .selected-student-panel { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 0.5rem; padding: 1.25rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #1A3A5C; }
        .student-info-meta h4 { margin: 0 0 0.375rem 0; font-size: 1.0625rem; color: #0F172A; font-weight: 700; }
        .student-info-meta p { margin: 0; font-size: 0.875rem; color: #475569; }
        .student-info-meta span { font-weight: 600; color: #1A3A5C; }
        .badge-target { background: #E2E8F0; color: #475569; font-size: 0.75rem; padding: 0.375rem 0.75rem; border-radius: 1rem; font-weight: 600; }

        .visa-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
        .form-group.full { grid-column: span 2; }
        .form-group label { font-size: 0.8125rem; font-weight: 600; color: #374151; }
        .form-group input, .form-group select { padding: 0.625rem 0.875rem; border: 1px solid #E5E7EB; border-radius: 0.5rem; font-size: 0.875rem; background: #fff; transition: border-color 0.2s; }
        .form-group input:focus, .form-group select:focus { border-color: #1A3A5C; outline: none; box-shadow: 0 0 0 1px #1A3A5C; }
        
        .action-row { grid-column: span 2; margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 0.5rem; border-top: 1px solid #F3F4F6; padding-top: 1.25rem; }
        .btn-cancel { background: #fff; border: 1px solid #D1D5DB; color: #374151; padding: 0.625rem 1.25rem; border-radius: 0.5rem; font-size: 0.8125rem; cursor: pointer; font-weight: 600; transition: all 0.2s; }
        .btn-cancel:hover { background: #F9FAFB; border-color: #9CA3AF; color: #1F2937; }
        .btn-submit { background: #1A3A5C; color: #fff; border: none; padding: 0.625rem 1.5rem; border-radius: 0.5rem; font-size: 0.8125rem; cursor: pointer; font-weight: 600; transition: background-color 0.2s; }
        .btn-submit:hover { background: #112740; }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">체류 자격(비자) 정보 등록</h1>
          <p className="tab-desc">외국인 유학생의 비자 코드 정보 및 기한 만료일을 조회하고 갱신 처리합니다.</p>
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', color: '#1A3A5C', fontSize: '0.875rem', marginBottom: '1.5rem', fontWeight: 600 }}>
          🔄 학생 프로필 동기화 중...
        </div>
      )}

      <div className="table-card visa-tab-wrapper">
        {selectedStudent && (
          <div className="selected-student-panel">
            <div className="student-info-meta">
              <h4>{selectedStudent.korName || '이름 없음'} {selectedStudent.engName ? `(${selectedStudent.engName})` : ''}</h4>
              <p>
                학번: <span>{selectedStudent.studentId}</span> &nbsp;|&nbsp; 
                국적: <span>{selectedStudent.nationality || '-'}</span> &nbsp;|&nbsp; 
                소속: <span>{selectedStudent.department || selectedStudent.deptName || '-'}</span>
              </p>
            </div>
            <span className="badge-target">대상 학생 지정됨</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="visa-form-grid">
          <div className="form-group">
            <label>비자 발급일 (Issue Date)</label>
            <input type="date" name="issueDate" value={visaInfo.issueDate} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label>체류 만료일 (Expire Date)</label>
            <input type="date" name="expireDate" value={visaInfo.expireDate} min={visaInfo.issueDate} onChange={handleInputChange} required />
          </div>

          <div className="form-group full">
            <label>비자 자격 코드 (Visa Type)</label>
            <select name="visaType" value={visaInfo.visaType} onChange={handleInputChange}>
              <option value="D-2">D-2 (유학)</option>
              <option value="D-4">D-4 (일반연수)</option>
              <option value="F-2">F-2 (거주)</option>
              <option value="E-7">E-7 (특정활동)</option>
            </select>
          </div>

          <div className="action-row">
            <button type="button" className="btn-cancel" onClick={handleBackToStudentList}>취소</button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '비자 정보 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}