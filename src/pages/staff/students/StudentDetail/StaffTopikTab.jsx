import React, { useState, useEffect } from 'react';
import api from '../../../../api/axios';

export default function StaffTopikTab({ studentId, permissions }) {
  const [topikList, setTopikList]   = useState([]);
  const [workHours, setWorkHours]   = useState(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    topikLevel: '1',
    examDate: '',
    instituteName: '',
    instituteLevel: '',
    koreanStartDate: '',
    basicTestResult: '',
  });

  const can = (key) => permissions?.find(p => p.permissionKey === key)?.isEnabled === true;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [topikRes, workRes] = await Promise.allSettled([
        api.get(`/api/v1/students/${studentId}/topik`),
        api.get(`/api/v1/topik/work-hours/${studentId}`),
      ]);
      if (topikRes.status === 'fulfilled' && topikRes.value.data?.success)
        setTopikList((topikRes.value.data.data || []).sort((a, b) => new Date(b.examDate) - new Date(a.examDate)));
      if (workRes.status === 'fulfilled' && workRes.value.data?.success)
        setWorkHours(workRes.value.data.data);
    } catch (e) {
      console.error('TOPIK 데이터 로드 실패:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (studentId) fetchData(); }, [studentId]);

  const handleSubmit = async () => {
    if (!form.examDate) { alert('시험일을 입력해주세요.'); return; }
    setSubmitting(true);
    try {
      const payload = {
        topikLevel:      parseInt(form.topikLevel),
        examDate:        form.examDate,
        instituteName:   form.instituteName   || null,
        instituteLevel:  form.instituteLevel  ? parseInt(form.instituteLevel) : null,
        koreanStartDate: form.koreanStartDate || null,
        basicTestResult: form.basicTestResult || null,
      };
      const res = await api.post(`/api/v1/students/${studentId}/topik`, payload);
      if (res.data.success) {
        alert('TOPIK 정보가 등록되었습니다.');
        setShowForm(false);
        setForm({ topikLevel:'1', examDate:'', instituteName:'', instituteLevel:'', koreanStartDate:'', basicTestResult:'' });
        fetchData();
      }
    } catch (e) {
      alert(e.response?.data?.message || '등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const latestTopik = topikList[0];

  return (
    <div style={{ padding: '1.25rem', backgroundColor: '#F0F2F7', minHeight: '80vh' }}>
      <style>{`
        .st-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem; }
        .st-title  { font-size:0.9375rem; font-weight:700; color:#111827; }
        .st-btn-add { padding:7px 16px; border-radius:8px; border:none; background:#1A3A5C; color:#fff; font-size:0.8125rem; font-weight:600; cursor:pointer; font-family:inherit; transition:background 0.15s; }
        .st-btn-add:hover { background:#112740; }

        .st-summary-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:1.25rem; }
        .st-stat-card { background:#fff; border-radius:0.875rem; border:1px solid #F3F4F6; padding:1.25rem; }
        .st-stat-lbl { font-size:0.75rem; color:#9CA3AF; margin-bottom:6px; }
        .st-stat-val { font-size:1.5rem; font-weight:700; color:#111827; }

        .st-card { background:#fff; border-radius:0.875rem; border:1px solid #F3F4F6; overflow:hidden; }
        .st-card-hd { padding:1rem 1.25rem; border-bottom:1px solid #F3F4F6; font-size:0.875rem; font-weight:700; color:#111827; }
        .st-table { width:100%; border-collapse:collapse; }
        .st-table th { background:#F9FAFB; padding:0.75rem 1.25rem; font-size:0.75rem; color:#6B7280; font-weight:600; text-align:left; border-bottom:1px solid #F3F4F6; }
        .st-table td { padding:0.875rem 1.25rem; font-size:0.8125rem; border-bottom:1px solid #F9FAFB; }
        .st-table tr:last-child td { border-bottom:none; }

        .st-chip { display:inline-flex; padding:3px 10px; border-radius:20px; font-size:0.6875rem; font-weight:700; }
        .st-chip-blue  { background:#EFF6FF; color:#1D4ED8; }
        .st-chip-green { background:#F0FDF4; color:#16A34A; }
        .st-chip-red   { background:#FEF2F2; color:#DC2626; }
        .st-chip-gray  { background:#F3F4F6; color:#6B7280; }

        .st-form-card { background:#fff; border-radius:0.875rem; border:1px solid #BFDBFE; padding:1.5rem; margin-bottom:1.25rem; }
        .st-form-title { font-size:0.875rem; font-weight:700; color:#1A3A5C; margin-bottom:1.25rem; }
        .st-form-grid  { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:1rem; }
        .st-form-grid2 { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:1.25rem; }
        .st-form-group { display:flex; flex-direction:column; gap:5px; }
        .st-form-label { font-size:0.75rem; font-weight:600; color:#374151; }
        .st-form-label span { color:#9CA3AF; font-weight:400; }
        .st-form-input, .st-form-select { padding:8px 12px; border:1px solid #D1D5DB; border-radius:8px; font-size:0.8125rem; font-family:inherit; outline:none; }
        .st-form-input:focus, .st-form-select:focus { border-color:#3B82F6; }
        .st-form-footer { display:flex; gap:8px; justify-content:flex-end; }
        .st-form-cancel { padding:7px 16px; border-radius:8px; border:1px solid #E5E7EB; background:#fff; color:#374151; font-size:0.8125rem; font-weight:600; cursor:pointer; font-family:inherit; }
        .st-form-submit { padding:7px 16px; border-radius:8px; border:none; background:#10B981; color:#fff; font-size:0.8125rem; font-weight:600; cursor:pointer; font-family:inherit; }
        .st-form-submit:disabled { background:#9CA3AF; cursor:not-allowed; }

        .st-empty { padding:3rem; text-align:center; color:#9CA3AF; font-size:0.8125rem; }
      `}</style>

      {/* 헤더 */}
      <div className="st-header">
        <div className="st-title">한국어 능력 (TOPIK)</div>
        {can('TOPIK_EDIT') && (
          <button className="st-btn-add" onClick={() => setShowForm(v => !v)}>
            {showForm ? '취소' : '+ TOPIK 등록'}
          </button>
        )}
      </div>

      {/* 요약 카드 */}
      <div className="st-summary-grid">
        <div className="st-stat-card">
          <div className="st-stat-lbl">현재 TOPIK 급수</div>
          <div className="st-stat-val" style={{ color: '#3B82F6' }}>
            {latestTopik ? `${latestTopik.topikLevel}급` : '미취득'}
          </div>
        </div>
        <div className="st-stat-card">
          <div className="st-stat-lbl">최근 시험일</div>
          <div className="st-stat-val" style={{ fontSize: '1rem', marginTop: '4px' }}>
            {latestTopik?.examDate || '-'}
          </div>
        </div>
        <div className="st-stat-card">
          <div className="st-stat-lbl">주간 최대 근로시간</div>
          <div className="st-stat-val" style={{ color: '#10B981' }}>
            {workHours?.maxWeeklyHours != null ? `${workHours.maxWeeklyHours}시간` : '-'}
          </div>
        </div>
      </div>

      {/* 등록 폼 */}
      {showForm && can('TOPIK_EDIT') && (
        <div className="st-form-card">
          <div className="st-form-title">TOPIK 성적 등록</div>
          <div className="st-form-grid">
            <div className="st-form-group">
              <label className="st-form-label">급수 *</label>
              <select className="st-form-select" value={form.topikLevel} onChange={e => setForm(p => ({ ...p, topikLevel: e.target.value }))}>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}급</option>)}
              </select>
            </div>
            <div className="st-form-group">
              <label className="st-form-label">시험일 *</label>
              <input type="date" className="st-form-input" value={form.examDate} onChange={e => setForm(p => ({ ...p, examDate: e.target.value }))} />
            </div>
            <div className="st-form-group">
              <label className="st-form-label">출신 어학원 <span>(선택)</span></label>
              <input type="text" className="st-form-input" placeholder="어학원명" value={form.instituteName} onChange={e => setForm(p => ({ ...p, instituteName: e.target.value }))} />
            </div>
          </div>
          <div className="st-form-grid2">
            <div className="st-form-group">
              <label className="st-form-label">어학원 수강 급수 <span>(선택)</span></label>
              <input type="number" className="st-form-input" placeholder="예: 3" min="1" max="6" value={form.instituteLevel} onChange={e => setForm(p => ({ ...p, instituteLevel: e.target.value }))} />
            </div>
            <div className="st-form-group">
              <label className="st-form-label">한국어 학습 시작일 <span>(선택)</span></label>
              <input type="date" className="st-form-input" value={form.koreanStartDate} onChange={e => setForm(p => ({ ...p, koreanStartDate: e.target.value }))} />
            </div>
            <div className="st-form-group">
              <label className="st-form-label">기초한국어 평가 결과 <span>(선택)</span></label>
              <input type="text" className="st-form-input" placeholder="결과 입력" value={form.basicTestResult} onChange={e => setForm(p => ({ ...p, basicTestResult: e.target.value }))} />
            </div>
          </div>
          <div className="st-form-footer">
            <button className="st-form-cancel" onClick={() => setShowForm(false)}>취소</button>
            <button className="st-form-submit" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </div>
      )}

      {/* TOPIK 이력 테이블 */}
      <div className="st-card">
        <div className="st-card-hd">TOPIK 이력</div>
        {isLoading ? (
          <div className="st-empty">불러오는 중...</div>
        ) : topikList.length === 0 ? (
          <div className="st-empty">등록된 TOPIK 이력이 없습니다.</div>
        ) : (
          <table className="st-table">
            <thead>
              <tr>
                <th>급수</th>
                <th>시험일</th>
                <th>출신 어학원</th>
                <th>어학원 수강급수</th>
                <th>학습 시작일</th>
                <th>기초평가 결과</th>
              </tr>
            </thead>
            <tbody>
              {topikList.map((t, i) => (
                <tr key={t.langId || i}>
                  <td>
                    <span className="st-chip st-chip-blue">{t.topikLevel}급</span>
                    {i === 0 && <span className="st-chip st-chip-green" style={{ marginLeft: 6 }}>최신</span>}
                  </td>
                  <td style={{ color: '#6B7280' }}>{t.examDate || '-'}</td>
                  <td>{t.instituteName || '-'}</td>
                  <td>{t.instituteLevel ? `${t.instituteLevel}급` : '-'}</td>
                  <td style={{ color: '#6B7280' }}>{t.koreanStartDate || '-'}</td>
                  <td>{t.basicTestResult || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
