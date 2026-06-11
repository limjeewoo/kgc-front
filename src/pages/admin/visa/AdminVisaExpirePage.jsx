import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';

export default function AdminVisaExpirePage() {
  const [visaList, setVisaList]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [sortKey, setSortKey]     = useState('dDay');
  const [filterLevel, setFilter]  = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');

  useEffect(() => {
    api.get('/api/v1/visas/expiring', { params: { days: 60 } })
      .then(res => { if (res.data?.success) setVisaList(res.data.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getLevel = (dDay) => dDay <= 30 ? '위험' : '주의';
  const getLevelStyle = (level) => level === '위험'
    ? { bg:'#FEF2F2', color:'#DC2626', border:'#FECACA' }
    : { bg:'#FFFBEB', color:'#D97706', border:'#FDE68A' };

  const processed = visaList.map(v => ({ ...v, level: getLevel(v.dDay) }));

  // 학과 목록 추출
  const deptList = ['ALL', ...Array.from(new Set(processed.map(v => v.deptName || '미분류'))).sort()];

  const filtered = processed
    .filter(v => filterLevel === 'ALL' || v.level === filterLevel)
    .filter(v => selectedDept === 'ALL' || (v.deptName || '미분류') === selectedDept);

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === 'dDay') return a.dDay - b.dDay;
    if (sortKey === 'name') return (a.studentName || '').localeCompare(b.studentName || '');
    if (sortKey === 'dept') return (a.deptName || '').localeCompare(b.deptName || '');
    return 0;
  });

  const dangerCount  = processed.filter(v => v.level === '위험').length;
  const warningCount = processed.filter(v => v.level === '주의').length;

  return (
    <div style={{ padding:'1.5rem 1.75rem', backgroundColor:'#F0F2F7', minHeight:'100vh', fontFamily:"'DM Sans','Noto Sans KR',sans-serif" }}>
      <style>{`
        .vep-title  { font-size:1.375rem; font-weight:700; color:#111827; margin-bottom:1.5rem; }
        .vep-stat-row { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:1.5rem; }
        .vep-stat { background:#fff; border-radius:14px; border:1px solid #F3F4F6; padding:18px 20px; position:relative; overflow:hidden; }
        .vep-stat::after { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
        .vep-stat.all::after    { background:#3B82F6; }
        .vep-stat.danger::after { background:#EF4444; }
        .vep-stat.warn::after   { background:#F59E0B; }
        .vep-stat-lbl { font-size:0.75rem; color:#9CA3AF; margin-bottom:6px; font-weight:500; }
        .vep-stat-val { font-size:1.75rem; font-weight:700; color:#111827; }
        .vep-stat-val .unit { font-size:0.875rem; font-weight:400; color:#9CA3AF; margin-left:3px; }

        .vep-toolbar { background:#fff; border-radius:12px; border:1px solid #F3F4F6; padding:14px 18px; display:flex; align-items:center; gap:10px; margin-bottom:1rem; flex-wrap:wrap; }
        .vep-btn { padding:6px 14px; border-radius:8px; border:1.5px solid #E5E7EB; background:#fff; color:#6B7280; font-size:0.75rem; font-weight:600; cursor:pointer; font-family:inherit; transition:0.15s; }
        .vep-btn:hover { border-color:#93C5FD; color:#1D4ED8; background:#EFF6FF; }
        .vep-btn.active { background:#1A3A5C; color:#fff; border-color:#1A3A5C; }
        .vep-select { padding:6px 12px; border:1.5px solid #E5E7EB; border-radius:8px; font-size:0.75rem; font-weight:600; background:#fff; color:#374151; cursor:pointer; font-family:inherit; outline:none; }
        .vep-select:focus { border-color:#1A3A5C; }

        .vep-card { background:#fff; border-radius:14px; border:1px solid #F3F4F6; overflow:hidden; }
        .vep-table { width:100%; border-collapse:collapse; font-size:0.8125rem; }
        .vep-table thead tr { background:#F8FAFC; }
        .vep-table th { padding:11px 16px; font-size:0.75rem; font-weight:600; color:#64748B; border-bottom:1.5px solid #E2E8F0; text-align:left; white-space:nowrap; }
        .vep-table td { padding:12px 16px; border-bottom:1px solid #F1F5F9; color:#374151; vertical-align:middle; }
        .vep-table tr:last-child td { border-bottom:none; }
        .vep-table tbody tr:hover td { background:#F8FBFF; }
        .vep-level-badge { display:inline-flex; align-items:center; padding:3px 10px; border-radius:20px; font-size:0.6875rem; font-weight:700; border:1px solid; }
        .vep-dday { font-size:0.875rem; font-weight:800; }
        .vep-empty { padding:4rem; text-align:center; color:#9CA3AF; font-size:0.8125rem; }
      `}</style>

      <div className="vep-title">비자 만료 임박 현황</div>

      <div className="vep-stat-row">
        <div className="vep-stat all">
          <div className="vep-stat-lbl">전체 대상</div>
          <div className="vep-stat-val">{processed.length}<span className="unit">명</span></div>
        </div>
        <div className="vep-stat danger">
          <div className="vep-stat-lbl">위험 (D-30 이내)</div>
          <div className="vep-stat-val" style={{ color:'#EF4444' }}>{dangerCount}<span className="unit">명</span></div>
        </div>
        <div className="vep-stat warn">
          <div className="vep-stat-lbl">주의 (D-31~60)</div>
          <div className="vep-stat-val" style={{ color:'#D97706' }}>{warningCount}<span className="unit">명</span></div>
        </div>
      </div>

      <div className="vep-toolbar">
        {/* 위험 단계 필터 */}
        {['ALL', '위험', '주의'].map(f => (
          <button key={f} className={`vep-btn ${filterLevel === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'ALL' ? `전체 (${processed.length})` : f === '위험' ? `위험 (${dangerCount})` : `주의 (${warningCount})`}
          </button>
        ))}

        <div style={{ width:'1px', height:20, background:'#E5E7EB', margin:'0 2px' }} />

        {/* 학과 필터 드롭다운 */}
        <select className="vep-select" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
          {deptList.map(d => (
            <option key={d} value={d}>
              {d === 'ALL' ? '전체 학과' : d}
            </option>
          ))}
        </select>

        {/* 정렬 */}
        <select className="vep-select" value={sortKey} onChange={e => setSortKey(e.target.value)} style={{ marginLeft:'auto' }}>
          <option value="dDay">만료일 임박순</option>
          <option value="name">이름순</option>
          <option value="dept">학과순</option>
        </select>
      </div>

      <div className="vep-card">
        {loading ? (
          <div className="vep-empty">불러오는 중...</div>
        ) : sorted.length === 0 ? (
          <div className="vep-empty">해당하는 학생이 없습니다. </div>
        ) : (
          <table className="vep-table">
            <thead>
              <tr>
                <th>위험단계</th><th>학생명</th><th>학번</th><th>학과</th>
                <th>학년/반</th><th>비자 종류</th><th>만료일</th><th>남은 기간</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(v => {
                const ls = getLevelStyle(v.level);
                return (
                  <tr key={v.studentId}>
                    <td><span className="vep-level-badge" style={{ background:ls.bg, color:ls.color, borderColor:ls.border }}>{v.level}</span></td>
                    <td style={{ fontWeight:600, color:'#111827' }}>{v.studentName}</td>
                    <td style={{ color:'#6B7280' }}>{v.studentId}</td>
                    <td>{v.deptName ?? '-'}</td>
                    <td>{v.grade ? `${v.grade}학년` : '-'} {v.classSec ? `${v.classSec}반` : ''}</td>
                    <td><span style={{ background:'#EFF6FF', color:'#1D4ED8', padding:'2px 8px', borderRadius:6, fontSize:'0.6875rem', fontWeight:700 }}>{v.visaType ?? '-'}</span></td>
                    <td>{v.expiryDate ?? '-'}</td>
                    <td><span className="vep-dday" style={{ color: v.level === '위험' ? '#EF4444' : '#D97706' }}>D-{v.dDay}</span></td>
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
