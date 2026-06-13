import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';

export default function DeptManagement() {
  const [depts, setDepts]         = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal]         = useState(null); // null | { mode: 'add' | 'edit', dept?: {} }
  const [deleteTarget, setDeleteTarget] = useState(null); // dept 객체

  // ── 전체 목록 조회 ──────────────────────────────────────────
  const fetchDepts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/v1/depts');
      if (res.data.success) setDepts(res.data.data);
    } catch (e) {
      console.error('학과 목록 조회 실패:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchDepts(); }, [fetchDepts]);

  // ── 등록 / 수정 저장 ────────────────────────────────────────
  const handleSave = async (formData) => {
    try {
      if (modal.mode === 'add') {
        await api.post('/api/v1/depts', formData);
      } else {
        await api.put(`/api/v1/depts/${modal.dept.deptId}`, formData);
      }
      setModal(null);
      fetchDepts();
    } catch (e) {
      alert(e.response?.data?.message || '저장 중 오류가 발생했습니다.');
    }
  };

  // ── 삭제 ────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await api.delete(`/api/v1/depts/${deleteTarget.deptId}`);
      setDeleteTarget(null);
      fetchDepts();
    } catch (e) {
      alert(e.response?.data?.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={{ fontFamily:"'DM Sans','Noto Sans KR',sans-serif", fontSize:'14px', color:'#111827', padding:'1.5rem', background:'#F8FAFC', minHeight:'100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap');

        .dm-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; }
        .dm-title { font-size:1.125rem; font-weight:700; color:#0F172A; display:flex; align-items:center; gap:10px; }
        .dm-title::before { content:''; display:inline-block; width:4px; height:1.2rem; background:#3B82F6; border-radius:2px; }
        .dm-count { font-size:12px; font-weight:600; background:#EFF6FF; color:#2563EB; padding:3px 10px; border-radius:20px; }

        .dm-add-btn { display:flex; align-items:center; gap:6px; padding:9px 18px; background:#1A3A5C; color:#fff; border:none; border-radius:9px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:background .15s; }
        .dm-add-btn:hover { background:#15304e; }

        /* 테이블 카드 */
        .dm-card { background:#fff; border-radius:14px; border:1px solid #F1F5F9; overflow:hidden; }
        .dm-table { width:100%; border-collapse:collapse; }
        .dm-table th { padding:11px 16px; background:#F8FAFC; font-size:12px; font-weight:600; color:#9CA3AF; text-align:left; border-bottom:1px solid #F1F5F9; white-space:nowrap; }
        .dm-table th.center { text-align:center; }
        .dm-table td { padding:13px 16px; font-size:13px; border-bottom:1px solid #F9FAFB; vertical-align:middle; color:#374151; }
        .dm-table td.center { text-align:center; }
        .dm-table tr:last-child td { border-bottom:none; }
        .dm-table tr:hover td { background:#F8FAFC; }

        .dm-dept-id { font-size:11px; font-weight:700; background:#F3F4F6; color:#6B7280; padding:2px 8px; border-radius:5px; font-family:'DM Sans',monospace; }
        .dm-college-badge { font-size:11px; font-weight:600; padding:3px 9px; border-radius:20px; background:#EFF6FF; color:#2563EB; }

        .dm-action-btn { padding:5px 12px; border-radius:7px; font-size:12px; font-weight:600; cursor:pointer; border:none; font-family:inherit; transition:all .15s; }
        .dm-edit-btn  { background:#EFF6FF; color:#2563EB; margin-right:6px; }
        .dm-edit-btn:hover  { background:#DBEAFE; }
        .dm-del-btn   { background:#FEF2F2; color:#DC2626; }
        .dm-del-btn:hover   { background:#FEE2E2; }

        .dm-empty { padding:4rem; text-align:center; color:#9CA3AF; font-size:13px; }

        /* 모달 오버레이 */
        .dm-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; z-index:1000; padding:1rem; }
        .dm-modal { background:#fff; border-radius:16px; width:100%; max-width:480px; box-shadow:0 20px 60px rgba(0,0,0,0.15); overflow:hidden; }
        .dm-modal-header { padding:1.25rem 1.5rem; border-bottom:1px solid #F3F4F6; display:flex; align-items:center; justify-content:space-between; }
        .dm-modal-title { font-size:15px; font-weight:700; color:#0F172A; display:flex; align-items:center; gap:8px; }
        .dm-modal-title::before { content:''; display:inline-block; width:3px; height:1rem; background:#3B82F6; border-radius:2px; }
        .dm-modal-close { width:28px; height:28px; border-radius:6px; background:#F3F4F6; border:none; cursor:pointer; font-size:16px; color:#6B7280; display:flex; align-items:center; justify-content:center; }
        .dm-modal-close:hover { background:#E5E7EB; }
        .dm-modal-body { padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
        .dm-modal-footer { padding:1rem 1.5rem; border-top:1px solid #F3F4F6; display:flex; justify-content:flex-end; gap:8px; }

        .dm-field { display:flex; flex-direction:column; gap:5px; }
        .dm-label { font-size:12px; font-weight:600; color:#6B7280; }
        .dm-label span { color:#EF4444; margin-left:2px; }
        .dm-input { padding:9px 12px; border:1.5px solid #E5E7EB; border-radius:8px; font-size:13px; font-family:inherit; outline:none; transition:border-color .15s; color:#111827; }
        .dm-input:focus { border-color:#3B82F6; }
        .dm-input:disabled { background:#F9FAFB; color:#9CA3AF; cursor:not-allowed; }
        .dm-hint { font-size:11px; color:#9CA3AF; }

        .dm-btn-cancel { padding:9px 20px; background:#F3F4F6; color:#374151; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }
        .dm-btn-cancel:hover { background:#E5E7EB; }
        .dm-btn-save { padding:9px 20px; background:#1A3A5C; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:background .15s; }
        .dm-btn-save:hover { background:#15304e; }
        .dm-btn-save:disabled { background:#94A3B8; cursor:not-allowed; }

        /* 삭제 확인 모달 */
        .dm-del-modal { background:#fff; border-radius:16px; width:100%; max-width:380px; box-shadow:0 20px 60px rgba(0,0,0,0.15); padding:1.75rem; text-align:center; }
        .dm-del-icon { font-size:2.5rem; margin-bottom:0.75rem; }
        .dm-del-title { font-size:15px; font-weight:700; color:#0F172A; margin-bottom:0.5rem; }
        .dm-del-desc { font-size:13px; color:#6B7280; margin-bottom:1.5rem; line-height:1.6; }
        .dm-del-name { font-weight:700; color:#DC2626; }
        .dm-del-actions { display:flex; gap:8px; justify-content:center; }
        .dm-btn-del-confirm { padding:9px 24px; background:#DC2626; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }
        .dm-btn-del-confirm:hover { background:#B91C1C; }
      `}</style>

      {/* ── 헤더 ── */}
      <div className="dm-header">
        <div className="dm-title">
          학과 관리
          <span className="dm-count">{depts.length}개 학과</span>
        </div>
        <button className="dm-add-btn" onClick={() => setModal({ mode: 'add' })}>
          + 학과 등록
        </button>
      </div>

      {/* ── 테이블 ── */}
      <div className="dm-card">
        {isLoading ? (
          <div className="dm-empty">데이터를 불러오는 중입니다...</div>
        ) : depts.length === 0 ? (
          <div className="dm-empty">등록된 학과가 없습니다.</div>
        ) : (
          <table className="dm-table">
            <thead>
              <tr>
                <th>학과 ID</th>
                <th>학과명</th>
                <th>계열</th>
                <th className="center">수업연한</th>
                <th className="center">졸업학점</th>
                <th className="center">관리</th>
              </tr>
            </thead>
            <tbody>
              {depts.map(d => (
                <tr key={d.deptId}>
                  <td><span className="dm-dept-id">{d.deptId}</span></td>
                  <td style={{ fontWeight:600, color:'#111827' }}>{d.deptName}</td>
                  <td><span className="dm-college-badge">{d.college || '-'}</span></td>
                  <td className="center">{d.years ? `${d.years}년제` : '-'}</td>
                  <td className="center">{d.graduationCredits ? `${d.graduationCredits}학점` : '-'}</td>
                  <td className="center">
                    <button className="dm-action-btn dm-edit-btn" onClick={() => setModal({ mode: 'edit', dept: d })}>
                      수정
                    </button>
                    <button className="dm-action-btn dm-del-btn" onClick={() => setDeleteTarget(d)}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── 등록 / 수정 모달 ── */}
      {modal && (
        <DeptFormModal
          mode={modal.mode}
          dept={modal.dept}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── 삭제 확인 모달 ── */}
      {deleteTarget && (
        <div className="dm-overlay">
          <div className="dm-del-modal">
            <div className="dm-del-icon">🗑️</div>
            <div className="dm-del-title">학과를 삭제하시겠습니까?</div>
            <div className="dm-del-desc">
              <span className="dm-del-name">{deleteTarget.deptName}</span> 학과를 삭제하면<br />
              연관된 학생 및 과목 데이터에 영향을 줄 수 있습니다.
            </div>
            <div className="dm-del-actions">
              <button className="dm-btn-cancel" onClick={() => setDeleteTarget(null)}>취소</button>
              <button className="dm-btn-del-confirm" onClick={handleDelete}>삭제 확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 등록 / 수정 폼 모달 ─────────────────────────────────────────────
function DeptFormModal({ mode, dept, onSave, onClose }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState({
    deptId:            isEdit ? dept.deptId            : '',
    deptName:          isEdit ? dept.deptName          : '',
    college:           isEdit ? dept.college           : '',
    years:             isEdit ? String(dept.years)     : '',
    graduationCredits: isEdit ? String(dept.graduationCredits) : '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.deptId || !form.deptName) {
      alert('학과 ID와 학과명은 필수 입력 항목입니다.');
      return;
    }
    setIsSaving(true);
    await onSave({
      deptId:            form.deptId,
      deptName:          form.deptName,
      college:           form.college || null,
      years:             form.years ? parseInt(form.years) : 0,
      graduationCredits: form.graduationCredits ? parseInt(form.graduationCredits) : 0,
    });
    setIsSaving(false);
  };

  return (
    <div className="dm-overlay">
      <div className="dm-modal">
        <div className="dm-modal-header">
          <div className="dm-modal-title">
            {isEdit ? '학과 정보 수정' : '학과 등록'}
          </div>
          <button className="dm-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="dm-modal-body">
          <div className="dm-field">
            <label className="dm-label">학과 ID <span>*</span></label>
            <input
              className="dm-input"
              placeholder="예: CS01"
              value={form.deptId}
              onChange={set('deptId')}
              disabled={isEdit} // 수정 시 ID 변경 불가
            />
            {isEdit && <span className="dm-hint">학과 ID는 수정할 수 없습니다.</span>}
          </div>

          <div className="dm-field">
            <label className="dm-label">학과명 <span>*</span></label>
            <input
              className="dm-input"
              placeholder="예: 컴퓨터소프트웨어(3년제)과"
              value={form.deptName}
              onChange={set('deptName')}
            />
          </div>

          <div className="dm-field">
            <label className="dm-label">계열</label>
            <input
              className="dm-input"
              placeholder="예: 공학계열"
              value={form.college}
              onChange={set('college')}
            />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="dm-field">
              <label className="dm-label">수업연한 (년)</label>
              <input
                className="dm-input"
                type="number"
                min="1"
                max="6"
                placeholder="예: 3"
                value={form.years}
                onChange={set('years')}
              />
            </div>
            <div className="dm-field">
              <label className="dm-label">졸업학점</label>
              <input
                className="dm-input"
                type="number"
                min="0"
                placeholder="예: 110"
                value={form.graduationCredits}
                onChange={set('graduationCredits')}
              />
            </div>
          </div>
        </div>

        <div className="dm-modal-footer">
          <button className="dm-btn-cancel" onClick={onClose}>취소</button>
          <button className="dm-btn-save" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? '저장 중...' : isEdit ? '변경사항 저장' : '학과 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}