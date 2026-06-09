import React, { useState } from 'react';
import api from '../../../../api/axios';
import TopBar from '../../../../components/layout/TopBar.jsx';

function ConsultTab() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchStudentId, setSearchStudentId] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [consultDate, setConsultDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchConsultations = async (targetId) => {
    const activeId = (targetId !== undefined ? targetId : searchStudentId)?.trim();
    if (!activeId) {
      alert('조회할 학생의 학번을 입력해주세요.');
      return;
    }
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/students/${activeId}/consultations`);
      setHasSearched(true);
      const raw = response.data;
      const dataList = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.content)
        ? raw.content
        : [];
      setConsultations([...dataList].sort((a, b) => b.consultId - a.consultId));
    } catch (error) {
      console.error('상담 이력 조회 에러:', error);
      alert(error.response?.data?.message || '상담 이력을 불러오는 중 오류가 발생했습니다.');
      setConsultations([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setTargetStudentId(searchStudentId);
    setTitle('');
    setContent('');
    setConsultDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanTargetId = targetStudentId.trim();
    if (!cleanTargetId || !content.trim() || !consultDate) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }
    const requestBody = {
      consultDate,
      rawContent: title.trim() ? `[${title.trim()}]\n${content.trim()}` : content.trim(),
    };
    try {
      setIsSubmitting(true);
      const response = await api.post(`/api/v1/students/${cleanTargetId}/consultations`, requestBody);
      if (response.data?.success !== false) {
        alert('새로운 상담 일지가 등록되었습니다.');
        setIsModalOpen(false);
        setSearchStudentId(cleanTargetId);
        fetchConsultations(cleanTargetId);
      } else {
        alert(response.data?.message || '등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('상담 저장 실패:', error);
      alert(`저장 실패: ${error.response?.data?.message || '데이터 처리에 실패했습니다.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="consult-loading"><div className="spinner" /><p>로딩 중...</p></div>
  );

  return (
    <>
      <TopBar title="상담 이력 관리" />
      <div className="consult-tab-container">
        <style>{`
          .consult-tab-container { animation: fadeIn 0.25s ease; padding: 0.5rem 1.5rem 24px; }
          .consult-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 30vh; color: #64748B; font-size: 0.8125rem; }
          .spinner { width: 32px; height: 32px; border: 3px solid #E2E8F0; border-top-color: #10B981; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 8px; }
          .tab-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
          .tab-title { font-size: 0.9375rem; font-weight: 700; color: #0F172A; }
          .tab-title span { font-size: 0.8125rem; color: #10B981; font-weight: 600; margin-left: 6px; }
          .search-toolbar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; background: #F8FAFC; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #E2E8F0; }
          .search-input { flex: 1; max-width: 280px; padding: 0.5rem 0.75rem; border: 1px solid #CBD5E1; border-radius: 0.375rem; font-size: 0.8125rem; outline: none; }
          .search-input:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
          .btn-search { background: #3B82F6; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; }
          .btn-search:hover { background: #2563EB; }
          .btn-add-consult { background: #10B981; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; transition: 0.15s; display: flex; align-items: center; gap: 4px; }
          .btn-add-consult:hover { background: #059669; box-shadow: 0 2px 6px rgba(16,185,129,0.2); }
          .consult-list { display: flex; flex-direction: column; gap: 1rem; }
          .consult-item { background: #FFF; border: 1px solid #F1F5F9; border-radius: 0.75rem; padding: 1.25rem; transition: 0.15s; }
          .consult-item:hover { border-color: #E2E8F0; box-shadow: 0 4px 12px rgba(15,23,42,0.03); }
          .item-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.625rem; border-bottom: 1px dashed #F1F5F9; padding-bottom: 0.625rem; }
          .prof-info { font-size: 0.8125rem; font-weight: 600; color: #334155; display: flex; align-items: center; gap: 6px; }
          .prof-badge { background: #E0F2FE; color: #0369A1; font-size: 0.6875rem; font-weight: 700; padding: 0.125rem 0.375rem; border-radius: 0.25rem; }
          .consult-date { font-size: 0.75rem; color: #94A3B8; font-weight: 600; }
          .item-body .item-text { font-size: 0.8125rem; color: #475569; line-height: 1.6; white-space: pre-wrap; margin-top: 0.5rem; }
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
          .form-textarea { width: 100%; height: 10rem; padding: 0.625rem 0.75rem; border: 1px solid #E2E8F0; border-radius: 0.5rem; font-size: 0.8125rem; outline: none; box-sizing: border-box; resize: none; font-family: inherit; line-height: 1.5; }
          .form-textarea:focus { border-color: #10B981; box-shadow: 0 0 0 3px rgba(16,185,129,0.08); }
          .btn-cancel { background: #E2E8F0; color: #475569; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; }
          .btn-submit { background: #10B981; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; }
          .btn-submit:disabled { background: #94A3B8; cursor: not-allowed; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        <div className="tab-hd">
          <div className="tab-title">
            상담 이력 조회
            {hasSearched && <span>{consultations.length}건 조회됨</span>}
          </div>
          <button className="btn-add-consult" onClick={openCreateModal}>✍️ 상담 등록</button>
        </div>

        <div className="search-toolbar">
          <input
            type="text"
            placeholder="조회할 학생의 학번을 입력하세요"
            className="search-input"
            value={searchStudentId}
            onChange={(e) => setSearchStudentId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchConsultations()}
          />
          <button type="button" className="btn-search" onClick={() => fetchConsultations()}>
            🔍 이력 조회
          </button>
        </div>

        <div className="consult-list">
          {!hasSearched ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#F8FAFC', borderRadius: '0.75rem', color: '#64748B', fontSize: '0.8125rem', border: '1px dashed #CBD5E1' }}>
              💡 상담 내역 조회를 위해 학번 입력 후 [이력 조회]를 눌러주세요.
            </div>
          ) : consultations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#F8FAFC', borderRadius: '0.75rem', color: '#94A3B8', fontSize: '0.8125rem' }}>
              등록된 상담 이력이 없습니다.
            </div>
          ) : (
            consultations.map((item, index) => (
              <div className="consult-item" key={item.consultId || index}>
                <div className="item-meta">
                  <div className="prof-info">
                    학생 <span className="prof-badge">{searchStudentId}</span>
                  </div>
                  <span className="consult-date">{item.consultDate}</span>
                </div>
                <div className="item-body">
                  <div className="item-text">{item.rawContent || '상담 내용이 없습니다.'}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-hd">✍️ 새로운 상담 일지 등록</div>
              <form onSubmit={handleSubmit}>
                <div className="modal-bd">
                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-lbl">학번 (Student ID) *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="예: 20260001"
                        value={targetStudentId}
                        onChange={(e) => setTargetStudentId(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-lbl">상담일 *</label>
                      <input
                        type="date"
                        className="form-input"
                        value={consultDate}
                        onChange={(e) => setConsultDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-lbl">상담 제목 (선택)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="제목을 입력하면 내용 상단에 추가됩니다"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-lbl">상담 상세 내용 *</label>
                    <textarea
                      className="form-textarea"
                      placeholder="상담 내용을 입력하세요"
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
    </>
  );
}

export default ConsultTab;