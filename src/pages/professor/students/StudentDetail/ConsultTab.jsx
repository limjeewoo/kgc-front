import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopBar from '../../../../components/layout/TopBar.jsx'; // 🚀 요청하신 경로로 TopBar 임포트

function ProfessorConsultHistory() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);

  // 모달 및 양식 제어 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedConsultId, setSelectedConsultId] = useState(null);
  
  // 폼 입력값 상태
  const [targetStudentName, setTargetStudentName] = useState('');
  const [targetStudentId, setTargetStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 페이지 접속 시 억지로 리스트를 부르지 않도록 빈 배열 유지
    setConsultations([]);
  }, []);

  const openCreateModal = () => {
    setIsEditMode(false);
    setSelectedConsultId(null);
    setTargetStudentName('');
    setTargetStudentId('');
    setTitle('');
    setContent('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setIsEditMode(true);
    setSelectedConsultId(item.consultId);
    setTargetStudentName(item.studentName || '');
    setTargetStudentId(item.studentNum || ''); 
    setTitle(item.title || '');
    setContent(item.content || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetStudentId.trim() || !title.trim() || !content.trim()) {
      alert('학번, 제목, 내용을 모두 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditMode) {
        const response = await axios.patch(`/api/v1/consultations/${selectedConsultId}`, {
          title: title.trim(),
          content: content.trim()
        });
        
        if (response.data?.success) {
          alert('상담 일지가 성공적으로 수정되었습니다.');
          setIsModalOpen(false);
        } else {
          alert(response.data?.message || '수정에 실패했습니다.');
        }
      } else {
        const response = await axios.post(`/api/v1/students/${targetStudentId.trim()}/consultations`, {
          title: title.trim(),
          content: content.trim()
        });
        
        if (response.data?.success) {
          alert('새로운 상담 일지가 성공적으로 등록되었습니다.');
          setIsModalOpen(false);
        } else {
          alert(response.data?.message || '등록에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('상담 저장 실패:', error);
      alert(error.response?.data?.message || '상담 데이터를 저장하는 중 에러가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (consultId) => {
    if (!window.confirm('정말로 이 상담 기록을 삭제하시겠습니까?\n삭제 후에는 복구가 불가능합니다.')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/v1/consultations/${consultId}`);
      if (response.data?.success) {
        alert('상담 기록이 삭제되었습니다.');
      } else {
        alert(response.data?.message || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('상담 삭제 실패:', error);
      alert(error.response?.data?.message || '삭제 처리 중 서버 에러가 발생했습니다.');
    }
  };

  if (loading) return null;

  return (
    <div className="page-wrapper">
      <style>{`
        /* 전체 래퍼 스타일 */
        .page-wrapper { background: #F8FAFC; min-height: 100vh; display: flex; flex-direction: column; }
        
        /* 기존 컨텐츠 영역 */
        .consult-tab-container { padding: 1.5rem; max-width: 1200px; margin: 0 auto; width: 100%; box-sizing: border-box; animation: fadeIn 0.25s ease; }
        
        /* 헤더 섹션 */
        .tab-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .tab-title { font-size: 0.9375rem; font-weight: 700; color: #334155; }
        
        /* 버튼 테마 */
        .btn-add-consult { background: #10B981; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; transition: 0.15s; display: flex; align-items: center; gap: 4px; }
        .btn-add-consult:hover { background: #059669; box-shadow: 0 2px 6px rgba(16,185,129,0.2); }
        
        /* 상담 타임라인 리스트 */
        .consult-list { display: flex; flex-direction: column; gap: 1rem; }
        .consult-item { background: #FFF; border: 1px solid #F1F5F9; border-radius: 0.75rem; padding: 1.25rem; position: relative; transition: 0.15s; }
        
        /* 모달 스타일 */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.3); display: flex; align-items: center; justify-content: center; z-index: 999; backdrop-filter: blur(2px); }
        .modal-box { background: #fff; border-radius: 1rem; width: 32rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; animation: fadeUp 0.2s ease; }
        .modal-hd { padding: 1.25rem; border-bottom: 1px solid #F1F5F9; font-weight: 700; font-size: 0.9375rem; color: #0F172A; }
        .modal-bd { padding: 1.25rem; }
        .modal-ft { padding: 1rem 1.25rem; background: #F8FAFC; border-top: 1px solid #F1F5F9; display: flex; justify-content: flex-end; gap: 0.5rem; }
        
        .form-row { display: flex; gap: 1rem; margin-bottom: 1.25rem; }
        .form-group { margin-bottom: 1.25rem; flex: 1; }
        .form-lbl { display: block; font-size: 0.75rem; font-weight: 600; color: #64748B; margin-bottom: 0.375rem; }
        .form-input { width: 100%; padding: 0.625rem 0.75rem; border: 1px solid #E2E8F0; border-radius: 0.5rem; font-size: 0.8125rem; outline: none; box-sizing: border-box; }
        .form-input:focus { border-color: #10B981; }
        .form-textarea { width: 100%; height: 10rem; padding: 0.625rem 0.75rem; border: 1px solid #E2E8F0; border-radius: 0.5rem; font-size: 0.8125rem; outline: none; box-sizing: border-box; resize: none; font-family: inherit; line-height: 1.5; }
        .form-textarea:focus { border-color: #10B981; }

        .btn-cancel { background: #E2E8F0; color: #475569; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; }
        .btn-submit { background: #10B981; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; }
        .btn-submit:disabled { background: #94A3B8; cursor: not-allowed; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* 🚀 불러온 TopBar 컴포넌트 렌더링 */}
      <TopBar />

      {/* 메인 컨텐츠 영역 */}
      <div className="consult-tab-container">
        <div className="tab-hd">
          <div className="tab-title">
            개별 상담 기록
          </div>
          <button className="btn-add-consult" onClick={openCreateModal}>
            ✍️ 새로운 상담 등록하기
          </button>
        </div>

        <div className="consult-list">
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '0.75rem', color: '#94A3B8', fontSize: '0.8125rem' }}>
            상단 버튼을 눌러 담당 학생의 상담 일지를 기록해 주세요.
          </div>
        </div>

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-hd">
                ✍️ 새로운 상담 일지 등록
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-bd">
                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-lbl">학생 이름</label>
                      <input 
                        type="text" 
                        placeholder="예: 홍길동" 
                        className="form-input"
                        value={targetStudentName}
                        onChange={(e) => setTargetStudentName(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-lbl">학번 (Student ID)</label>
                      <input 
                        type="text" 
                        placeholder="예: 20260001 (필수)" 
                        className="form-input"
                        value={targetStudentId}
                        onChange={(e) => setTargetStudentId(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '1.25rem' }}>
                    <label className="form-lbl">상담 제목</label>
                    <input 
                      type="text" 
                      placeholder="예: 학업 성적 및 비자 갱신 관련 면담" 
                      className="form-input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-lbl">상담 상세 내용</label>
                    <textarea 
                      placeholder="학생과의 구체적인 상담 원인, 진행 내용, 지도 방향 등을 상세하게 기록하세요." 
                      className="form-textarea"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-ft">
                  <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>취소</button>
                  <button type="submit" className="btn-submit" disabled={isSubmitting}>
                    {isSubmitting ? '저장 중...' : '기록 저장'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfessorConsultHistory;