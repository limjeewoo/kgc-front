import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';

export default function AdvisorAssign() {
  const [depts, setDepts] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(null); // 처리 중인 professorId

  // 학과 목록 + 전체 교수 목록 초기 로드
  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [deptRes, profRes] = await Promise.all([
          api.get('/api/v1/depts'),
          api.get('/api/v1/professors'),
        ]);
        if (deptRes.data.success) setDepts(deptRes.data.data || []);
        if (profRes.data.success) setProfessors(profRes.data.data || []);
      } catch (e) {
        console.error('초기 데이터 로드 실패', e);
      }
    };
    fetchInit();
  }, []);

  // 학과 필터링된 교수 목록
  const filtered = selectedDeptId
    ? professors.filter(p => String(p.deptId) === String(selectedDeptId) || String(p.departmentId) === String(selectedDeptId))
    : professors;

  // 전담교수 토글: PATCH /api/v1/professors/{professorId}/dedicated?isDedicated={true|false}
  const handleToggle = async (prof) => {
    const next = !prof.isDedicated;
    if (!window.confirm(`${prof.name} 교수를 ${next ? '전담교수로 지정' : '전담교수에서 해제'}하시겠습니까?`)) return;

    try {
      setToggling(prof.professorId);
      const res = await api.patch(`/api/v1/professors/${prof.professorId}/dedicated`, null, {
        params: { isDedicated: next },
      });
      if (res.data.success) {
        setProfessors(prev =>
          prev.map(p => p.professorId === prof.professorId ? { ...p, isDedicated: next } : p)
        );
      } else {
        alert(res.data.message || '처리 중 오류가 발생했습니다.');
      }
    } catch (e) {
      alert(e.response?.data?.message || '처리 중 오류가 발생했습니다.');
    } finally {
      setToggling(null);
    }
  };

  const dedicatedCount = filtered.filter(p => p.isDedicated).length;

  return (
    <div style={{ fontFamily: "'DM Sans','Noto Sans KR',sans-serif", color: '#111827', padding: '1.75rem 2rem' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .dp-wrap { animation: fadeUp 0.28s ease; }
        .dp-header { margin-bottom: 1.5rem; }
        .dp-title { font-size: 1.375rem; font-weight: 800; color: #0F172A; }
        .dp-subtitle { font-size: 0.8125rem; color: #94A3B8; margin-top: 4px; }

        .dp-filter-card { background: #fff; border-radius: 12px; border: 1px solid #F1F5F9; padding: 1rem 1.25rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .dp-filter-label { font-size: 0.75rem; font-weight: 600; color: #94A3B8; white-space: nowrap; }
        .dp-select { padding: 0.55rem 0.875rem; border: 1.5px solid #E5E7EB; border-radius: 8px; font-size: 0.875rem; font-family: inherit; color: #374151; background: #fff; cursor: pointer; outline: none; min-width: 220px; }
        .dp-select:focus { border-color: #3B82F6; }

        .dp-stat-row { display: flex; gap: 10px; margin-bottom: 1.25rem; }
        .dp-stat { background: #fff; border: 1px solid #F1F5F9; border-radius: 10px; padding: 0.875rem 1.25rem; display: flex; align-items: center; gap: 10px; }
        .dp-stat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .dp-stat-label { font-size: 0.75rem; color: #64748B; font-weight: 500; }
        .dp-stat-val { font-size: 1.25rem; font-weight: 700; color: #0F172A; margin-left: auto; padding-left: 1.5rem; }

        .dp-card { background: #fff; border-radius: 12px; border: 1px solid #F1F5F9; overflow: hidden; }
        .dp-card-header { padding: 0.9375rem 1.25rem; border-bottom: 1px solid #F1F5F9; display: flex; align-items: center; justify-content: space-between; }
        .dp-card-title { font-size: 0.875rem; font-weight: 700; color: #0F172A; display: flex; align-items: center; gap: 8px; }
        .dp-card-title::before { content:''; display:inline-block; width:3px; height:1rem; background:#3B82F6; border-radius:2px; }

        .dp-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
        .dp-table th { padding: 0.65rem 1rem; background: #F9FAFB; color: #6B7280; font-weight: 600; text-align: left; border-bottom: 1px solid #F1F5F9; white-space: nowrap; font-size: 0.75rem; }
        .dp-table th.center { text-align: center; }
        .dp-table td { padding: 0.875rem 1rem; border-bottom: 1px solid #F9FAFB; vertical-align: middle; color: #374151; }
        .dp-table td.center { text-align: center; }
        .dp-table tr:last-child td { border-bottom: none; }
        .dp-table tr:hover td { background: #FAFBFD; }

        .dp-badge { display: inline-block; font-size: 0.6875rem; font-weight: 700; padding: 3px 9px; border-radius: 20px; }
        .dp-badge-dedicated { background: #EFF6FF; color: #1D4ED8; }
        .dp-badge-normal { background: #F3F4F6; color: #6B7280; }

        /* 토글 스위치 */
        .dp-toggle-wrap { display: flex; align-items: center; justify-content: center; gap: 8px; }
        .dp-toggle { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
        .dp-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
        .dp-toggle-slider { position: absolute; inset: 0; border-radius: 999px; background: #E5E7EB; cursor: pointer; transition: background 0.2s; }
        .dp-toggle-slider::after { content: ''; position: absolute; width: 18px; height: 18px; border-radius: 50%; background: #fff; top: 3px; left: 3px; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
        .dp-toggle input:checked + .dp-toggle-slider { background: #3B82F6; }
        .dp-toggle input:checked + .dp-toggle-slider::after { transform: translateX(20px); }
        .dp-toggle input:disabled + .dp-toggle-slider { opacity: 0.5; cursor: not-allowed; }
        .dp-toggle-label { font-size: 0.75rem; font-weight: 600; color: #6B7280; min-width: 36px; }
        .dp-toggle-label.on { color: #1D4ED8; }

        .dp-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #3B82F6, #1A3A5C); display: inline-flex; align-items: center; justify-content: center; font-size: 0.8125rem; font-weight: 700; color: #fff; flex-shrink: 0; margin-right: 10px; vertical-align: middle; }

        .dp-empty { padding: 3.5rem; text-align: center; color: #CBD5E1; font-size: 0.8125rem; }
      `}</style>

      <div className="dp-wrap">
        <div className="dp-header">
          <div className="dp-title">전담교수 관리</div>
          <div className="dp-subtitle">학과별 교수 목록에서 전담교수를 지정하거나 해제합니다.</div>
        </div>

        {/* 학과 필터 */}
        <div className="dp-filter-card">
          <span className="dp-filter-label">학과 선택</span>
          <select
            className="dp-select"
            value={selectedDeptId}
            onChange={e => setSelectedDeptId(e.target.value)}
          >
            <option value="">전체 학과</option>
            {depts.map(d => (
              <option key={d.deptId} value={d.deptId}>{d.deptName}</option>
            ))}
          </select>
        </div>

        {/* 통계 */}
        <div className="dp-stat-row">
          <div className="dp-stat">
            <div className="dp-stat-dot" style={{ background: '#3B82F6' }} />
            <div className="dp-stat-label">전체 교수</div>
            <div className="dp-stat-val">{filtered.length}<span style={{ fontSize: '0.75rem', color: '#94A3B8', marginLeft: 3 }}>명</span></div>
          </div>
          <div className="dp-stat">
            <div className="dp-stat-dot" style={{ background: '#1D4ED8' }} />
            <div className="dp-stat-label">전담교수 지정</div>
            <div className="dp-stat-val" style={{ color: '#1D4ED8' }}>{dedicatedCount}<span style={{ fontSize: '0.75rem', color: '#94A3B8', marginLeft: 3 }}>명</span></div>
          </div>
          <div className="dp-stat">
            <div className="dp-stat-dot" style={{ background: '#E5E7EB' }} />
            <div className="dp-stat-label">미지정</div>
            <div className="dp-stat-val" style={{ color: '#94A3B8' }}>{filtered.length - dedicatedCount}<span style={{ fontSize: '0.75rem', color: '#94A3B8', marginLeft: 3 }}>명</span></div>
          </div>
        </div>

        {/* 교수 목록 테이블 */}
        <div className="dp-card">
          <div className="dp-card-header">
            <div className="dp-card-title">교수 목록</div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              {selectedDeptId ? depts.find(d => String(d.deptId) === String(selectedDeptId))?.deptName : '전체'} · {filtered.length}명
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="dp-empty">해당 학과에 등록된 교수가 없습니다.</div>
          ) : (
            <table className="dp-table">
              <thead>
                <tr>
                  <th>교수 정보</th>
                  <th>소속 학과</th>
                  <th>이메일</th>
                  <th className="center">전담교수 여부</th>
                  <th className="center">전담교수 지정</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(prof => (
                  <tr key={prof.professorId}>
                    <td>
                      <span className="dp-avatar">{prof.name?.[0] ?? '?'}</span>
                      <span style={{ fontWeight: 700, color: '#111827' }}>{prof.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginLeft: 6 }}>#{prof.professorId}</span>
                    </td>
                    <td>{prof.deptName || '–'}</td>
                    <td style={{ color: '#64748B' }}>{prof.email || '–'}</td>
                    <td className="center">
                      <span className={`dp-badge ${prof.isDedicated ? 'dp-badge-dedicated' : 'dp-badge-normal'}`}>
                        {prof.isDedicated ? '전담교수' : '일반'}
                      </span>
                    </td>
                    <td className="center">
                      <div className="dp-toggle-wrap">
                        <label className="dp-toggle">
                          <input
                            type="checkbox"
                            checked={!!prof.isDedicated}
                            disabled={toggling === prof.professorId}
                            onChange={() => handleToggle(prof)}
                          />
                          <span className="dp-toggle-slider" />
                        </label>
                        <span className={`dp-toggle-label ${prof.isDedicated ? 'on' : ''}`}>
                          {toggling === prof.professorId ? '...' : prof.isDedicated ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}