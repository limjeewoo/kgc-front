import React, { useState, useEffect } from 'react';
import api from '../../../../api/axios';

export default function StaffVisaTab({ studentId, permissions }) {
  const [visas, setVisas]         = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm] = useState({ visaType: 'D-2', issueDate: '', expiryDate: '' });
  const [submitting, setSubmitting] = useState(false);

  const can = (key) => permissions?.find(p => p.permissionKey === key)?.isEnabled === true;

  const calcDday = (expiryDate) => {
    if (!expiryDate) return null;
    const diff = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatus = (dday) => {
    if (dday === null) return { label: '-', chipClass: 'sv-chip-gray' };
    if (dday < 0)   return { label: '만료', chipClass: 'sv-chip-red' };
    if (dday <= 30) return { label: `D-${dday}`, chipClass: 'sv-chip-red' };
    if (dday <= 90) return { label: `D-${dday}`, chipClass: 'sv-chip-amber' };
    return { label: `D-${dday}`, chipClass: 'sv-chip-green' };
  };

  const fetchVisas = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/v1/students/${studentId}/visas`);
      if (res.data?.success) setVisas(res.data.data || []);
    } catch (e) {
      console.error('비자 로드 실패:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (studentId) fetchVisas(); }, [studentId]);

  const handleSubmit = async () => {
    if (!form.expiryDate) { alert('만료일을 입력해주세요.'); return; }
    setSubmitting(true);
    try {
      const res = await api.post(`/api/v1/students/${studentId}/visas`, form);
      if (res.data.success) {
        alert('비자가 등록되었습니다.');
        setShowForm(false);
        setForm({ visaType: 'D-2', issueDate: '', expiryDate: '' });
        fetchVisas();
      }
    } catch (e) {
      alert(e.response?.data?.message || '등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetCurrent = async (visaId) => {
    try {
      const res = await api.patch(`/api/v1/visas/${visaId}/current`);
      if (res.data.success) fetchVisas();
    } catch (e) {
      alert(e.response?.data?.message || '설정 중 오류가 발생했습니다.');
    }
  };

  const currentVisa = visas.find(v => v.isCurrent) || visas[0];
  const dday = currentVisa ? calcDday(currentVisa.expiryDate || currentVisa.expireDate) : null;
  const status = getStatus(dday);

  return (
    <div style={{ padding: '1.25rem', backgroundColor: '#F0F2F7', minHeight: '80vh' }}>
      <style>{`
        .sv-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem; }
        .sv-title  { font-size:0.9375rem; font-weight:700; color:#111827; }
        .sv-btn-add { padding:7px 16px; border-radius:8px; border:none; background:#1A3A5C; color:#fff; font-size:0.8125rem; font-weight:600; cursor:pointer; font-family:inherit; transition:background 0.15s; }
        .sv-btn-add:hover { background:#112740; }

        .sv-dday-card { background:#fff; border-radius:0.875rem; border:1px solid #F3F4F6; padding:1.5rem 1.75rem; margin-bottom:1.25rem; display:flex; align-items:center; gap:2rem; flex-wrap:wrap; }
        .sv-dday-val  { font-size:2.5rem; font-weight:700; line-height:1; }
        .sv-dday-lbl  { font-size:0.75rem; color:#9CA3AF; margin-bottom:4px; }
        .sv-dday-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.5rem; flex:1; }
        .sv-dday-field-lbl { font-size:0.6875rem; color:#9CA3AF; margin-bottom:3px; }
        .sv-dday-field-val { font-size:0.875rem; font-weight:600; color:#111827; }

        .sv-card { background:#fff; border-radius:0.875rem; border:1px solid #F3F4F6; overflow:hidden; }
        .sv-card-hd { padding:1rem 1.25rem; border-bottom:1px solid #F3F4F6; font-size:0.875rem; font-weight:700; color:#111827; }
        .sv-table { width:100%; border-collapse:collapse; }
        .sv-table th { background:#F9FAFB; padding:0.75rem 1.25rem; font-size:0.75rem; color:#6B7280; font-weight:600; text-align:left; border-bottom:1px solid #F3F4F6; }
        .sv-table td { padding:0.875rem 1.25rem; font-size:0.8125rem; border-bottom:1px solid #F9FAFB; }
        .sv-table tr:last-child td { border-bottom:none; }

        .sv-chip { display:inline-flex; padding:3px 10px; border-radius:20px; font-size:0.6875rem; font-weight:700; }
        .sv-chip-green { background:#F0FDF4; color:#16A34A; }
        .sv-chip-amber { background:#FFFBEB; color:#D97706; }
        .sv-chip-red   { background:#FEF2F2; color:#DC2626; }
        .sv-chip-gray  { background:#F3F4F6; color:#6B7280; }
        .sv-chip-blue  { background:#EFF6FF; color:#1D4ED8; }

        .sv-set-btn { padding:4px 10px; border-radius:6px; border:1px solid #E5E7EB; background:#fff; color:#374151; font-size:0.75rem; font-weight:600; cursor:pointer; font-family:inherit; }
        .sv-set-btn:hover { background:#F3F4F6; }

        .sv-form-card { background:#fff; border-radius:0.875rem; border:1px solid #BFDBFE; padding:1.5rem; margin-bottom:1.25rem; }
        .sv-form-title { font-size:0.875rem; font-weight:700; color:#1A3A5C; margin-bottom:1.25rem; }
        .sv-form-grid  { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:1.25rem; }
        .sv-form-group { display:flex; flex-direction:column; gap:5px; }
        .sv-form-label { font-size:0.75rem; font-weight:600; color:#374151; }
        .sv-form-input, .sv-form-select { padding:8px 12px; border:1px solid #D1D5DB; border-radius:8px; font-size:0.8125rem; font-family:inherit; outline:none; }
        .sv-form-input:focus, .sv-form-select:focus { border-color:#3B82F6; }
        .sv-form-footer { display:flex; gap:8px; justify-content:flex-end; }
        .sv-form-cancel  { padding:7px 16px; border-radius:8px; border:1px solid #E5E7EB; background:#fff; color:#374151; font-size:0.8125rem; font-weight:600; cursor:pointer; font-family:inherit; }
        .sv-form-submit  { padding:7px 16px; border-radius:8px; border:none; background:#10B981; color:#fff; font-size:0.8125rem; font-weight:600; cursor:pointer; font-family:inherit; }
        .sv-form-submit:disabled { background:#9CA3AF; cursor:not-allowed; }

        .sv-empty { padding:3rem; text-align:center; color:#9CA3AF; font-size:0.8125rem; }
      `}</style>

      {/* 헤더 */}
      <div className="sv-header">
        <div className="sv-title">비자 및 체류 정보</div>
        {can('VISA_EDIT') && (
          <button className="sv-btn-add" onClick={() => setShowForm(v => !v)}>
            {showForm ? '취소' : '+ 비자 등록'}
          </button>
        )}
      </div>

      {/* 등록 폼 */}
      {showForm && can('VISA_EDIT') && (
        <div className="sv-form-card">
          <div className="sv-form-title">신규 비자 등록</div>
          <div className="sv-form-grid">
            <div className="sv-form-group">
              <label className="sv-form-label">비자 종류</label>
              <select className="sv-form-select" value={form.visaType} onChange={e => setForm(p => ({ ...p, visaType: e.target.value }))}>
                <option value="D-2">D-2 (유학)</option>
                <option value="D-4">D-4 (일반연수)</option>
                <option value="F-2">F-2 (거주)</option>
                <option value="F-4">F-4 (재외동포)</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div className="sv-form-group">
              <label className="sv-form-label">발급일</label>
              <input type="date" className="sv-form-input" value={form.issueDate} onChange={e => setForm(p => ({ ...p, issueDate: e.target.value }))} />
            </div>
            <div className="sv-form-group">
              <label className="sv-form-label">만료일 *</label>
              <input type="date" className="sv-form-input" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} />
            </div>
          </div>
          <div className="sv-form-footer">
            <button className="sv-form-cancel" onClick={() => setShowForm(false)}>취소</button>
            <button className="sv-form-submit" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </div>
      )}

      {/* D-Day 배너 */}
      {currentVisa && (
        <div className="sv-dday-card">
          <div style={{ textAlign: 'center', minWidth: '120px', paddingRight: '2rem', borderRight: '1px solid #F3F4F6' }}>
            <div className="sv-dday-lbl">체류 만료 D-Day</div>
            <div className="sv-dday-val" style={{ color: dday !== null && dday <= 30 ? '#EF4444' : dday !== null && dday <= 90 ? '#D97706' : '#111827' }}>
              {dday === null ? '-' : dday < 0 ? `D+${Math.abs(dday)}` : `D-${dday}`}
            </div>
            <span className={`sv-chip ${status.chipClass}`} style={{ marginTop: '8px' }}>{status.label}</span>
          </div>
          <div className="sv-dday-grid">
            <div>
              <div className="sv-dday-field-lbl">비자 종류</div>
              <div className="sv-dday-field-val" style={{ color: '#1D4ED8' }}>{currentVisa.visaType}</div>
            </div>
            <div>
              <div className="sv-dday-field-lbl">발급일</div>
              <div className="sv-dday-field-val">{currentVisa.issueDate || '-'}</div>
            </div>
            <div>
              <div className="sv-dday-field-lbl">만료일</div>
              <div className="sv-dday-field-val" style={{ color: dday !== null && dday <= 30 ? '#EF4444' : '#111827' }}>
                {currentVisa.expiryDate || currentVisa.expireDate || '-'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 비자 이력 테이블 */}
      <div className="sv-card">
        <div className="sv-card-hd">비자 이력</div>
        {isLoading ? (
          <div className="sv-empty">불러오는 중...</div>
        ) : visas.length === 0 ? (
          <div className="sv-empty">등록된 비자 정보가 없습니다.</div>
        ) : (
          <table className="sv-table">
            <thead>
              <tr>
                <th>비자 종류</th>
                <th>발급일</th>
                <th>만료일</th>
                <th>D-Day</th>
                <th>상태</th>
                {can('VISA_EDIT') && <th>관리</th>}
              </tr>
            </thead>
            <tbody>
              {visas.map(v => {
                const d = calcDday(v.expiryDate || v.expireDate);
                const s = getStatus(d);
                return (
                  <tr key={v.visaId}>
                    <td style={{ fontWeight: 600 }}>{v.visaType}</td>
                    <td style={{ color: '#6B7280' }}>{v.issueDate || '-'}</td>
                    <td style={{ color: '#6B7280' }}>{v.expiryDate || v.expireDate || '-'}</td>
                    <td><span className={`sv-chip ${s.chipClass}`}>{s.label}</span></td>
                    <td>
                      {v.isCurrent
                        ? <span className="sv-chip sv-chip-blue">현재</span>
                        : <span className="sv-chip sv-chip-gray">이전</span>}
                    </td>
                    {can('VISA_EDIT') && (
                      <td>
                        {!v.isCurrent && (
                          <button className="sv-set-btn" onClick={() => handleSetCurrent(v.visaId)}>
                            현재로 설정
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
