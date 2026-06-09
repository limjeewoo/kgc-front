import React, { useState, useEffect } from 'react';
import api from '../../../../api/axios';

export default function StaffConsultTab({ studentId, studentName, permissions }) {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [isEditMode, setIsEditMode]       = useState(false);
  const [selectedConsultId, setSelectedConsultId] = useState(null);
  const [title, setTitle]       = useState('');
  const [content, setContent]   = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const can = (key) => permissions?.find(p => p.permissionKey === key)?.isEnabled === true;

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/students/${studentId}/consultations`);
      if (res.data?.success) {
        const sorted = (res.data.data || []).sort((a, b) => b.consultId - a.consultId);
        setConsultations(sorted);
      } else {
        setConsultations([]);
      }
    } catch (e) {
      console.error('상담 이력 조회 실패:', e);
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (studentId) fetchConsultations(); }, [studentId]);

  const openCreateModal = () => {
    setIsEditMode(false);
    setSelectedConsultId(null);
    setTitle('');
    setContent('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setIsEditMode(true);
    setSelectedConsultId(item.consultId);
    setTitle(item.title || '');
    setContent(item.content || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const res = await api.patch(`/api/v1/consultations/${selectedConsultId}`, {
          title: title.trim(), content: content.trim()
        });
        if (res.data?.success) {
          alert('상담 일지가 수정되었습니다.');
          setIsModalOpen(false);
          fetchConsultations();
        }
      } else {
        const res = await api.post(`/api/v1/students/${studentId}/consultations`, {
          title: title.trim(), content: content.trim()
        });
        if (res.data?.success) {
          alert('상담 일지가 등록되었습니다.');
          setIsModalOpen(false);
          fetchConsultations();
        }
      }
    } catch (e) {
      alert(e.response?.data?.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (consultId) => {
    if (!window.confirm('이 상담 기록을 삭제하시겠습니까?')) return;
    try {
      const res = await api.delete(`/api/v1/consultations/${consultId}`);
      if (res.data?.success) {
        alert('삭제되었습니다.');
        fetchConsultations();
      }
    } catch (e) {
      alert(e.response?.data?.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={{ padding: '1.25rem', backgroundColor: '#F0F2F7', minHeight: '80vh' }}>
      <style>{`
        .sct-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; }
        .sct-title  { font-size:0.9375rem; font-weight:700; color:#111827; }
        .sct-title span { font-size:0.8125rem; color:#10B981; font-weight:600; margin-left:6px; }
        .sct-btn-add { background:#10B981; color:#fff; border:none; padding:7px 16px; border-radius:8px; font-size:0.8125rem; font-weight:600; cursor:pointer; font-family:inherit; transition:background 0.15s; }
        .sct-btn-add:hover { background:#059669; }

        .sct-list { display:flex; flex-direction:column; gap:1rem; }
        .sct-item { background:#fff; border:1px solid #F1F5F9; border-radius:0.75rem; padding:1.25rem; transition:0.15s; }
        .sct-item:hover { border-color:#E2E8F0; box-shadow:0 4px 12px rgba(0,0,0,0.03); }

        .sct-item-meta { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.625rem; padding-bottom:0.625rem; border-bottom:1px dashed #F1F5F9; }
        .sct-prof { font-size:0.8125rem; font-weight:600; color:#334155; }
        .sct-badge { background:#E0F2FE; color:#0369A1; font-size:0.6875rem; font-weight:700; padding:2px 6px; border-radius:4px; margin-left:6px; }
        .sct-date  { font-size:0.75rem; color:#94A3B8; }

        .sct-item-actions { display:flex; gap:0.5rem; align-items:center; }
        .sct-btn-text { background:none; border:none; font-size:0.75rem; font-weight:500; color:#94A3B8; cursor:pointer; padding:0; font-family:inherit; }
        .sct-btn-text:hover { color:#475569; }
        .sct-btn-text.del:hover { color:#EF4444; }

        .sct-item-title { font-size:0.875rem; font-weight:700; color:#0F172A; margin-bottom:0.5rem; }
        .sct-item-text  { font-size:0.8125rem; color:#475569; line-height:1.6; white-space:pre-wrap; }

        .sct-empty { text-align:center; padding:3rem 1rem; background:#fff; border-radius:0.75rem; border:1px solid #F3F4F6; color:#9CA3AF; font-size:0.8125rem; }

        .sct-modal-bg { position:fixed; inset:0; background:rgba(15,23,42,0.3); display:flex; align-items:center; justify-content:center; z-index:999; backdrop-filter:blur(2px); }
        .sct-modal { background:#fff; border-radius:1rem; width:32rem; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); overflow:hidden; animation:sctFadeUp 0.2s ease; }
        @keyframes sctFadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

        .sct-modal-hd { padding:1.25rem; border-bottom:1px solid #F1F5F9; font-weight:700; font-size:0.9375rem; color:#0F172A; }
        .sct-modal-bd { padding:1.25rem; }
        .sct-modal-ft { padding:1rem 1.25rem; background:#F8FAFC; border-top:1px solid #F1F5F9; display:flex; justify-content:flex-end; gap:0.5rem; }

        .sct-student-info { background:#F0FDF4; border:1px solid #A7F3D0; border-radius:8px; padding:10px 14px; margin-bottom:1.25rem; font-size:0.8125rem; color:#065F46; font-weight:600; }

        .sct-form-group { margin-bottom:1.25rem; }
        .sct-form-lbl  { display:block; font-size:0.75rem; font-weight:600; color:#64748B; margin-bottom:0.375rem; }
        .sct-form-input { width:100%; padding:0.625rem 0.75rem; border:1px solid #E2E8F0; border-radius:0.5rem; font-size:0.8125rem; outline:none; box-sizing:border-box; font-family:inherit; }
        .sct-form-input:focus { border-color:#10B981; box-shadow:0 0 0 3px rgba(16,185,129,0.08); }
        .sct-form-textarea { width:100%; height:10rem; padding:0.625rem 0.75rem; border:1px solid #E2E8F0; border-radius:0.5rem; font-size:0.8125rem; outline:none; box-sizing:border-box; resize:none; font-family:inherit; line-height:1.5; }
        .sct-form-textarea:focus { border-color:#10B981; box-shadow:0 0 0 3px rgba(16,185,129,0.08); }

        .sct-btn-cancel { background:#E2E8F0; color:#475569; border:none; padding:0.5rem 1rem; border-radius:0.5rem; font-size:0.8125rem; font-weight:600; cursor:pointer; font-family:inherit; }
        .sct-btn-submit { background:#10B981; color:#fff; border:none; padding:0.5rem 1rem; border-radius:0.5rem; font-size:0.8125rem; font-weight:600; cursor:pointer; font-family:inherit; }
        .sct-btn-submit:disabled { background:#94A3B8; cursor:not-allowed; }
      `}</style>

      {/* 헤더 */}
      <div className="sct-header">
        <div className="sct-title">
          상담 이력<span>{consultations.length}건</span>
        </div>
        {can('CONSULT_WRITE') && (
          <button className="sct-btn-add" onClick={openCreateModal}>
            ✍️ 상담 등록
          </button>
        )}
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="sct-empty">불러오는 중...</div>
      ) : consultations.length === 0 ? (
        <div className="sct-empty">등록된 상담 이력이 없습니다.</div>
      ) : (
        <div className="sct-list">
          {consultations.map(item => (
            <div className="sct-item" key={item.consultId}>
              <div className="sct-item-meta">
                <div>
                  <span className="sct-prof">{item.professorName || '상담자'}</span>
                  <span className="sct-badge">{item.consultDate || item.createdAt?.substring(0,10) || '-'}</span>
                </div>
                <div className="sct-item-actions">
                  {can('CONSULT_WRITE') && (
                    <>
                      <button className="sct-btn-text" onClick={() => openEditModal(item)}>수정</button>
                      <button className="sct-btn-text del" onClick={() => handleDelete(item.consultId)}>삭제</button>
                    </>
                  )}
                </div>
              </div>
              <div className="sct-item-title">{item.title}</div>
              <div className="sct-item-text">{item.rawContent || item.content}</div>
            </div>
          ))}
        </div>
      )}

      {/* 등록/수정 모달 */}
      {isModalOpen && (
        <div className="sct-modal-bg" onClick={() => setIsModalOpen(false)}>
          <div className="sct-modal" onClick={e => e.stopPropagation()}>
            <div className="sct-modal-hd">
              {isEditMode ? '📝 상담 일지 수정' : '✍️ 새로운 상담 일지 등록'}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="sct-modal-bd">
                {/* 학생 정보 고정 표시 (학번 입력 불필요) */}
                <div className="sct-student-info">
                  상담 대상: {studentName || studentId}
                  <span style={{ color:'#6B7280', fontWeight:400, marginLeft:8 }}>({studentId})</span>
                </div>
                <div className="sct-form-group">
                  <label className="sct-form-lbl">상담 제목 *</label>
                  <input
                    type="text"
                    className="sct-form-input"
                    placeholder="예: 학업 성적 및 비자 갱신 관련 면담"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="sct-form-group" style={{ marginBottom:0 }}>
                  <label className="sct-form-lbl">상담 내용 *</label>
                  <textarea
                    className="sct-form-textarea"
                    placeholder="상담 원인, 진행 내용, 지도 방향, 아르바이트 현황 등을 기록하세요."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="sct-modal-ft">
                <button type="button" className="sct-btn-cancel" onClick={() => setIsModalOpen(false)}>취소</button>
                <button type="submit" className="sct-btn-submit" disabled={isSubmitting}>
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
