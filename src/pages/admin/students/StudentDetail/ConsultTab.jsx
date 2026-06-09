import React, { useState } from 'react';
import api from '../../../../api/axios';

function ProfessorConsultHistory() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchStudentId, setSearchStudentId] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const fetchConsultations = async () => {
    const activeId = searchStudentId?.trim();
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

  if (loading) return (
    <div className="consult-loading"><div className="spinner" /><p>로딩 중...</p></div>
  );

  return (
    <div className="consult-tab-container">
      <style>{`
        .consult-tab-container { animation: fadeIn 0.25s ease; padding: 0.5rem 0; }
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
        .consult-list { display: flex; flex-direction: column; gap: 1rem; }
        .consult-item { background: #FFF; border: 1px solid #F1F5F9; border-radius: 0.75rem; padding: 1.25rem; transition: 0.15s; }
        .consult-item:hover { border-color: #E2E8F0; box-shadow: 0 4px 12px rgba(15,23,42,0.03); }
        .item-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.625rem; border-bottom: 1px dashed #F1F5F9; padding-bottom: 0.625rem; }
        .prof-info { font-size: 0.8125rem; font-weight: 600; color: #334155; display: flex; align-items: center; gap: 6px; }
        .prof-badge { background: #E0F2FE; color: #0369A1; font-size: 0.6875rem; font-weight: 700; padding: 0.125rem 0.375rem; border-radius: 0.25rem; }
        .consult-date { font-size: 0.75rem; color: #94A3B8; font-weight: 600; }
        .item-body .item-text { font-size: 0.8125rem; color: #475569; line-height: 1.6; white-space: pre-wrap; margin-top: 0.5rem; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="tab-hd">
        <div className="tab-title">
          상담 이력 조회
          {hasSearched && <span>{consultations.length}건 조회됨</span>}
        </div>
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
        <button type="button" className="btn-search" onClick={fetchConsultations}>
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
    </div>
  );
}

export default ProfessorConsultHistory;