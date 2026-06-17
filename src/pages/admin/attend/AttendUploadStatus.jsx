import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';

export default function AttendUploadStatus() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/v1/attend/upload-status');
        if (res?.data?.success) {
          setRows(res.data.data || []);
        }
      } catch (e) {
        console.error(e);
        setError('업로드 현황을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  // 집계
  const totalDepts = rows.length;
  const completeDepts = rows.filter(r => r.missingCount === 0).length;
  const incompleteDepts = totalDepts - completeDepts;

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'4rem' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:36, height:36, border:'3px solid #E5E7EB', borderTopColor:'#1A3A5C', borderRadius:'50%', animation:'aus-spin 0.8s linear infinite', margin:'0 auto 12px' }} />
        <div style={{ color:'#6B7280', fontSize:'0.875rem' }}>업로드 현황 불러오는 중...</div>
      </div>
      <style>{`@keyframes aus-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="aus-wrap">
      <style>{`
        .aus-wrap { animation: aus-fade 0.28s ease; }
        @keyframes aus-fade { from { opacity:0; transform:translateY(8px);} to {opacity:1; transform:translateY(0);} }
        .aus-header { margin-bottom: 1.5rem; }
        .aus-title { font-size: 1.375rem; font-weight: 700; color: #0F172A; }
        .aus-subtitle { font-size: 0.8125rem; color: #94A3B8; margin-top: 0.25rem; }
        .aus-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .aus-stat { background:#fff; border:1px solid #F1F5F9; border-radius: 0.875rem; padding: 1.125rem 1.25rem; }
        .aus-stat .lbl { font-size: 0.75rem; color:#64748B; margin-bottom: 0.4rem; font-weight:500; }
        .aus-stat .val { font-size: 1.625rem; font-weight: 700; color:#0F172A; line-height:1; }
        .aus-stat .val .unit { font-size:0.8125rem; font-weight:400; color:#94A3B8; margin-left:3px; }
        .aus-card { background:#fff; border:1px solid #F1F5F9; border-radius: 1rem; overflow:hidden; }
        .aus-tbl { width:100%; border-collapse: collapse; }
        .aus-tbl thead th { background:#F8FAFC; font-size:0.75rem; font-weight:700; color:#64748B; text-align:left; padding:0.875rem 1.25rem; border-bottom:1px solid #F1F5F9; }
        .aus-tbl tbody td { padding:0.9375rem 1.25rem; border-bottom:1px solid #F8FAFC; font-size:0.8125rem; color:#374151; }
        .aus-tbl tbody tr:last-child td { border-bottom:none; }
        .aus-tbl tbody tr:hover { background:#FAFBFD; }
        .aus-dept { font-weight:600; color:#111827; }
        .aus-staff { color:#6B7280; }
        .aus-num { font-weight:600; }
        .aus-bar-wrap { display:flex; align-items:center; gap:0.625rem; }
        .aus-bar { width:90px; height:6px; background:#F1F5F9; border-radius:3px; overflow:hidden; }
        .aus-bar-fill { height:100%; border-radius:3px; transition: width 0.3s; }
        .aus-pct { font-size:0.75rem; font-weight:700; width:40px; }
        .aus-badge { font-size:0.6875rem; font-weight:700; padding:3px 10px; border-radius:6px; white-space:nowrap; }
        .aus-badge.done { background:#ECFDF5; color:#059669; }
        .aus-badge.miss { background:#FEF2F2; color:#DC2626; }
        .aus-empty { padding:3rem; text-align:center; color:#CBD5E1; font-size:0.875rem; }
        .aus-err { padding:1rem 1.25rem; background:#FEF2F2; color:#DC2626; border-radius:0.5rem; font-size:0.8125rem; margin-bottom:1rem; }
      `}</style>

      <div className="aus-header">
        <div className="aus-title">출결 업로드 현황</div>
        <div className="aus-subtitle">학과별 출결 파일 업로드 진행 상황을 확인합니다.</div>
      </div>

      {error && <div className="aus-err">{error}</div>}

      <div className="aus-stats">
        <div className="aus-stat">
          <div className="lbl">전체 학과</div>
          <div className="val">{totalDepts}<span className="unit">개</span></div>
        </div>
        <div className="aus-stat">
          <div className="lbl">업로드 완료</div>
          <div className="val" style={{ color:'#059669' }}>{completeDepts}<span className="unit">개</span></div>
        </div>
        <div className="aus-stat">
          <div className="lbl">미완료 학과</div>
          <div className="val" style={{ color:'#DC2626' }}>{incompleteDepts}<span className="unit">개</span></div>
        </div>
      </div>

      <div className="aus-card">
        {rows.length === 0 ? (
          <div className="aus-empty">표시할 학과가 없습니다.</div>
        ) : (
          <table className="aus-tbl">
            <thead>
              <tr>
                <th>학과</th>
                <th>담당 조교</th>
                <th>필요</th>
                <th>업로드</th>
                <th>누락</th>
                <th>진행률</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const pct = r.totalCount > 0 ? Math.round((r.uploadedCount / r.totalCount) * 100) : 0;
                const done = r.missingCount === 0;
                return (
                  <tr key={r.deptId}>
                    <td className="aus-dept">{r.deptName}</td>
                    <td className="aus-staff">{r.staffName || '-'}</td>
                    <td className="aus-num">{r.totalCount}</td>
                    <td className="aus-num" style={{ color:'#059669' }}>{r.uploadedCount}</td>
                    <td className="aus-num" style={{ color: r.missingCount > 0 ? '#DC2626' : '#9CA3AF' }}>{r.missingCount}</td>
                    <td>
                      <div className="aus-bar-wrap">
                        <div className="aus-bar">
                          <div className="aus-bar-fill" style={{ width:`${pct}%`, background: done ? '#10B981' : '#F59E0B' }} />
                        </div>
                        <span className="aus-pct" style={{ color: done ? '#059669' : '#D97706' }}>{pct}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`aus-badge ${done ? 'done' : 'miss'}`}>
                        {done ? '완료' : `누락 ${r.missingCount}`}
                      </span>
                    </td>
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
