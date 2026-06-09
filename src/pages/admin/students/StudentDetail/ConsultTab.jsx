import React, { useState, useEffect } from 'react';
import api from '../../../../api/axios'; // 프로젝트 구조에 맞게 상대경로를 조정하세요.

function ProfessorConsultHistory() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  // 모달 및 양식 제어 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedConsultId, setSelectedConsultId] = useState(null);
  
  // 폼 입력값 상태 (학생 정보 추가)
  const [targetStudentName, setTargetStudentName] = useState('');
  const [targetStudentId, setTargetStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. 상담 이력 조회 (GET) - 어드민/교수용 전체 조회 API
  const fetchConsultations = async () => {
    try {
      setLoading(true);
      // 백엔드 명세에 맞게 전체 상담 내역을 가져오는 API 엔드포인트로 수정하세요.
      // 예: const response = await api.get('/api/v1/consultations');
      const response = await api.get(`/api/v1/consultations`);
      
      if (response.data?.success) {
        const dataList = Array.isArray(response.data.data) ? response.data.data : [];
        const sortedData = dataList.sort((a, b) => b.consultId - a.consultId);
        setConsultations(sortedData);
      } else {
        setConsultations([]);
      }
    } catch (error) {
      console.error('상담 이력 조회 에러:', error);
      // API가 없을 경우를 대비한 에러 메시지 처리
      alert(error.response?.data?.message || '상담 이력을 불러오는 중 오류가 발생했습니다.');
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  // 모달 열기 (등록 모드)
  const openCreateModal = () => {
    setIsEditMode(false);
    setSelectedConsultId(null);
    setTargetStudentName('');
    setTargetStudentId('');
    setTitle('');
    setContent('');
    setIsModalOpen(true);
  };

  // 모달 열기 (수정 모드)
  const openEditModal = (item) => {
    setIsEditMode(true);
    setSelectedConsultId(item.consultId);
    setTargetStudentName(item.studentName || '');
    setTargetStudentId(item.studentNum || ''); // 백엔드 데이터 구조에 맞춰 학번 매핑
    setTitle(item.title || '');
    setContent(item.content || '');
    setIsModalOpen(true);
  };

  // 2. 상담 등록(POST) 및 수정(PATCH) 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetStudentId.trim() || !title.trim() || !content.trim()) {
      alert('학번, 제목, 내용을 모두 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditMode) {
        // 상담 수정 (PATCH)
        const response = await api.patch(`/api/v1/consultations/${selectedConsultId}`, {
          title: title.trim(),
          content: content.trim()
        });
        
        if (response.data?.success) {
          alert('상담 일지가 성공적으로 수정되었습니다.');
          setIsModalOpen(false);
          fetchConsultations();
        } else {
          alert(response.data?.message || '수정에 실패했습니다.');
        }
      } else {
        // 상담 등록 (POST) - 입력받은 학번(targetStudentId)을 URL에 사용
        const response = await api.post(`/api/v1/students/${targetStudentId.trim()}/consultations`, {
          title: title.trim(),
          content: content.trim()
        });
        
        if (response.data?.success) {
          alert('새로운 상담 일지가 등록되었습니다.');
          setIsModalOpen(false);
          fetchConsultations();
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

  // 3. 상담 삭제 (DELETE)
  const handleDelete = async (consultId) => {
    if (!window.confirm('정말로 이 상담 기록을 삭제하시겠습니까?\n삭제 후에는 복구가 불가능합니다.')) {
      return;
    }

    try {
      const response = await api.delete(`/api/v1/consultations/${consultId}`);
      if (response.data?.success) {
        alert('상담 기록이 삭제되었습니다.');
        fetchConsultations();
      } else {
        alert(response.data?.message || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('상담 삭제 실패:', error);
      alert(error.response?.data?.message || '삭제 처리 중 서버 에러가 발생했습니다.');
    }
  };

  if (loading) return (
    <div className="consult-loading">
      <div className="spinner" />
      <p>상담 기록을 로드하는 중입니다...</p>
    </div>
  );

  return (
    <div className="consult-tab-container">
      <style>{`
        .consult-tab-container { animation: fadeIn 0.25s ease; padding: 0.5rem 0; }
        .consult-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 30vh; color: #64748B; font-size: 0.8125rem; }
        .spinner { width: 32px; height: 32px; border: 3px solid #E2E8F0; border-top-color: #10B981; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 8px; }
        
        /* 헤더 섹션 */
        .tab-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .tab-title { font-size: 0.9375rem; font-weight: 700; color: #0F172A; }
        .tab-title span { font-size: 0.8125rem; color: #10B981; font-weight: 600; margin-left: 6px; }
        
        /* 버튼 테마 */
        .btn-add-consult { background: #10B981; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; transition: 0.15s; display: flex; align-items: center; gap: 4px; }
        .btn-add-consult:hover { background: #059669; box-shadow: 0 2px 6px rgba(16,185,129,0.2); }
        
        /* 상담 타임라인 리스트 */
        .consult-list { display: flex; flex-direction: column; gap: 1rem; }
        .consult-item { background: #FFF; border: 1px solid #F1F5F9; border-radius: 0.75rem; padding: 1.25rem; position: relative; transition: 0.15s; }
        .consult-item:hover { border-color: #E2E8F0; box-shadow: 0 4px 12px rgba(15,23,42,0.03); }
        
        .item-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.625rem; border-bottom: 1px dashed #F1F5F9; padding-bottom: 0.625rem; }
        .prof-info { font-size: 0.8125rem; font-weight: 600; color: #334155; display: flex; align-items: center; gap: 6px; }
        .prof-badge { background: #E0F2FE; color: #0369A1; font-size: 0.6875rem; font-weight: 700; padding: 0.125rem 0.375rem; border-radius: 0.25rem; }
        .consult-date { font-size: 0.75rem; color: #94A3B8; }
        
        .item-body .item-title { font-size: 0.875rem; font-weight: 700; color: #0F172A; margin-bottom: 0.5rem; }
        .item-body .item-text { font-size: 0.8125rem; color: #475569; line-height: 1.5; white-space: pre-wrap; }
        
        /* 우측 상단 액션 툴즈 */
        .item-actions { display: flex; gap: 0.5rem; }
        .btn-action-text { background: none; border: none; font-size: 0.75rem; font-weight: 500; color: #94A3B8; cursor: pointer; padding: 0; }
        .btn-action-text:hover { color: #475569; }
        .btn-action-text.del:hover { color: #EF4444; }

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
        .form-input:focus { border-color: #10B981; box-shadow: 0 0 0 3px rgba(16,185,129,0.08); }
        .form-input:disabled { background: #F1F5F9; cursor: not-allowed; color: #94A3B8; }
        .form-textarea { width: 100%; height: 10rem; padding: 0.625rem 0.75rem; border: 1px solid #E2E8F0; border-radius: 0.5rem; font-size: 0.8125rem; outline: none; box-sizing: border-box; resize: none; font-family: inherit; line-height: 1.5; }
        .form-textarea:focus { border-color: #10B981; box-shadow: 0 0 0 3px rgba(16,185,129,0.08); }

        .btn-cancel { background: #E2E8F0; color: #475569; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; }
        .btn-submit { background: #10B981; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; }
        .btn-submit:disabled { background: #94A3B8; cursor: not-allowed; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* 상단 탭 컨트롤 */}
      <div className="tab-hd">
        <div className="tab-title">
          상담 이력 리스트 <span>{consultations.length}건</span>
        </div>
        <button className="btn-add-consult" onClick={openCreateModal}>
          ✍️ 상담 등록
        </button>
      </div>

      {/* 상담 피드 카드 리스트 */}
      <div className="consult-list">
        {consultations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#F8FAFC', borderRadius: '0.75rem', color: '#94A3B8', fontSize: '0.8125rem' }}>
            등록된 상담 이력이 없습니다. 새로운 상담 일지를 기록해 주세요.
          </div>
        ) : (
          consultations.map((item) => (
            <div className="consult-item" key={item.consultId}>
              <div className="item-meta">
                <div className="prof-info">
                  {/* 교수 이름 대신 상담 대상인 학생 정보가 보이도록 수정 */}
                  {item.studentName || '학생 이름'} 
                  <span className="prof-badge">{item.studentNum || '학번 없음'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="consult-date">
                    {item.updatedAt ? item.updatedAt.substring(0, 10) : item.createdAt?.substring(0, 10) || '-'}
                  </span>
                  <div className="item-actions">
                    <button className="btn-action-text" onClick={() => openEditModal(item)}>수정</button>
                    <button className="btn-action-text del" onClick={() => handleDelete(item.consultId)}>삭제</button>
                  </div>
                </div>
              </div>
              <div className="item-body">
                <div className="item-title">{item.title}</div>
                <div className="item-text">{item.content}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 상담 작성/수정 모달 팝업 */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-hd">
              {isEditMode ? '📝 상담 일지 수정' : '✍️ 새로운 상담 일지 등록'}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-bd">
                
                {/* 🚀 추가된 학생 이름 & 학번 입력 폼 */}
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-lbl">학생 이름</label>
                    <input 
                      type="text" 
                      placeholder="예: 홍길동" 
                      className="form-input"
                      value={targetStudentName}
                      onChange={(e) => setTargetStudentName(e.target.value)}
                      disabled={isEditMode}
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
                      disabled={isEditMode}
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
  );
}

export default ProfessorConsultHistory;