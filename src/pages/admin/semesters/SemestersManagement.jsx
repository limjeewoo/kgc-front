import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios'; 

const GLOBAL_STYLE_CSS = `
  .sw-content { padding: 4px 4px 24px; animation: jobsFadeUp 0.28s ease; }
  @keyframes jobsFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  
  .data-card { background: #fff; border-radius: 14px; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); overflow: hidden; margin-bottom: 1.5rem; }
  .card-hd { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem; border-bottom: 1px solid #F1F5F9; flex-wrap: wrap; gap: .75rem; background: #fff; }
  .card-hd-title { font-size: 1rem; font-weight: 700; color: #1E293B; }
  .card-body { padding: 1.25rem; }

  .form-row { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
  .form-group { flex: 1; min-width: 180px; }
  .form-label { display: block; font-size: .8125rem; font-weight: 600; color: #475569; margin-bottom: .5rem; }
  .form-select, .form-input { width: 100%; padding: .625rem .875rem; border: 1px solid #CBD5E1; border-radius: 8px; font-size: .875rem; color: #334155; background-color: #fff; outline: none; transition: all .15s; box-sizing: border-box; height: 42px; }
  .form-select:focus, .form-input:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

  .btn-primary { background: #3B82F6; color: #fff; border: none; padding: .625rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background .15s ease; white-space: nowrap; height: 42px; }
  .btn-primary:hover:not(:disabled) { background: #2563EB; }
  .btn-primary:disabled { background: #94A3B8; cursor: not-allowed; }
  
  .btn-danger-outline { background: #fff; color: #DC2626; border: 1px solid #FECACA; padding: .375rem .75rem; border-radius: 6px; font-size: .75rem; font-weight: 600; cursor: pointer; transition: all .15s; }
  .btn-danger-outline:hover { background: #FEF2F2; border-color: #F87171; }

  .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
  .admin-table th { padding: 1rem 1.25rem; background: #F8FAFC; color: #64748B; font-size: .75rem; font-weight: 600; border-bottom: 1px solid #E2E8F0; text-transform: uppercase; letter-spacing: 0.05em; }
  .admin-table td { padding: 1rem 1.25rem; color: #334155; font-size: .875rem; border-bottom: 1px solid #F1F5F9; vertical-align: middle; font-weight: 500; }
  .admin-table tbody tr:hover { background: #F8FAFC; }
  .admin-table tbody tr:last-child td { border-bottom: none; }

  .toggle-btn { display: inline-flex; align-items: center; gap: .375rem; padding: 6px 12px; border-radius: 20px; font-size: .75rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all .2s; }
  .toggle-active { background: #ECFDF5; color: #059669; border-color: #A7F3D0; cursor: default; }
  .toggle-inactive { background: #F1F5F9; color: #64748B; border-color: #E2E8F0; }
  .toggle-inactive:hover { background: #E2E8F0; color: #334155; }
  .toggle-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

  .empty-state { padding: 3rem 1.5rem; text-align: center; color: #94A3B8; font-size: .875rem; }
`;

function ErrBanner({ msg, onClear }) {
  if (!msg) return null;
  return (
    <div style={{ padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '.875rem' }}>
      <span>⚠️ {msg}</span>
      {onClear && <button onClick={onClear} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}>×</button>}
    </div>
  );
}

export default function SemesterManagement() {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const currentYear = new Date().getFullYear();
  
  const [form, setForm] = useState({
    year: currentYear,
    season: '1학기',
    startDate: '',
    endDate: ''
  });

  const seasons = ['1학기', '여름학기', '2학기', '겨울학기'];
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

  const loadSemesters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/v1/semesters');
      
      if (res.data && res.data.success) {
        const dataList = res.data.data || [];
        const sorted = [...dataList].sort((a, b) => {
          if (b.year !== a.year) return b.year - a.year;
          return seasons.indexOf(a.season) - seasons.indexOf(b.season);
        });
        setSemesters(sorted);
      } else {
        setError(res.data?.message || '학기 목록 조회에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || '학기 목록을 불러오는 중 서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSemesters(); }, [loadSemesters]);

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!form.startDate || !form.endDate) {
      setError("시작일과 종료일을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const termCode = seasons.indexOf(form.season) + 1;

      const payload = {
        semesterId: `${form.year}-${termCode}`,
        year: Number(form.year),
        term: termCode,
        startDate: form.startDate,
        endDate: form.endDate
      };

      const res = await api.post('/api/v1/semesters', payload);
      
      if (res.data && res.data.success) {
        setForm(prev => ({ ...prev, season: '1학기', startDate: '', endDate: '' }));
        loadSemesters();
      } else {
        setError(res.data?.message || '학기 등록에 실패했습니다.');
      }
    } catch (err) {
      setError(err.response?.data?.message || '학기 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetCurrent = async (semesterId) => {
    if (!window.confirm('이 학기를 [현재 학기]로 활성화하시겠습니까?\n시스템 전체의 기준 학기가 변경됩니다.')) return;
    
    setError(null);
    try {
      const res = await api.patch(`/api/v1/semesters/${semesterId}/current`, {});
      
      if (res.data && res.data.success) {
        loadSemesters();
      } else {
        setError(res.data?.message || '현재 학기 설정에 실패했습니다.');
      }
    } catch (err) {
      setError(err.response?.data?.message || '현재 학기 설정 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (semesterId, year, season) => {
    if (!window.confirm(`[${year}년 ${season}] 학기를 정말 삭제하시겠습니까?`)) return;

    setError(null);
    try {
      const res = await api.delete(`/api/v1/semesters/${semesterId}`);
      
      if (res.data && res.data.success) {
        loadSemesters();
      } else {
        setError(res.data?.message || '학기 삭제에 실패했습니다.');
      }
    } catch (err) {
      setError(err.response?.data?.message || '학기를 삭제할 수 없습니다. 연관된 데이터가 존재할 수 있습니다.');
    }
  };

  return (
    <>
      <style>{GLOBAL_STYLE_CSS}</style>
      <div className="sw-main">
        <div className="sw-content">
          <ErrBanner msg={error} onClear={() => setError(null)} />

          <div className="data-card">
            <div className="card-hd">
              <div className="card-hd-title">신규 학기 운영 기간 등록</div>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreate} className="form-row">
                <div className="form-group">
                  <label className="form-label">개설 연도</label>
                  <select 
                    className="form-select" 
                    value={form.year} 
                    onChange={e => setForm({ ...form, year: e.target.value })}
                  >
                    {yearOptions.map(y => (
                      <option key={y} value={y}>{y}년도</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">학기 구분</label>
                  <select 
                    className="form-select" 
                    value={form.season} 
                    onChange={e => setForm({ ...form, season: e.target.value })}
                  >
                    {seasons.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">학기 시작일</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">학기 종료일</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={form.endDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>

                <div style={{ flexShrink: 0 }}>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? '등록 중...' : '+ 학기 생성'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="data-card">
            <div className="card-hd">
              <div className="card-hd-title">전체 학기 목록</div>
              <div style={{ fontSize: '.8125rem', color: '#64748B' }}>
                총 <strong>{semesters.length}</strong>개의 학기
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>연도</th>
                    <th>학기 구분</th>
                    <th>상태 (현재 학기 여부)</th>
                    <th style={{ textAlign: 'right' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                        데이터를 불러오는 중입니다...
                      </td>
                    </tr>
                  ) : semesters.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-state">
                        <div style={{ fontSize: '1.75rem', marginBottom: '.5rem' }}>📅</div>
                        등록된 학기가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    semesters.map((sem) => (
                      <tr key={sem.semesterId}>
                        <td>{sem.year || sem.연도}년</td>
                        <td>
                          {sem.term === 1 || sem.semester === '1' ? '1학기' :
                           sem.term === 2 || sem.semester === '2' ? '여름학기' :
                           sem.term === 3 || sem.semester === '3' ? '2학기' :
                           sem.term === 4 || sem.semester === '4' ? '겨울학기' : 
                           (sem.semester || sem.season || sem.학기 || `${sem.term}학기`)}
                        </td>
                        <td>
                          {sem.isCurrent ? (
                            <button type="button" className="toggle-btn toggle-active" disabled>
                              <span className="toggle-dot"></span>
                              현재 학기 적용중
                            </button>
                          ) : (
                            <button 
                              type="button" 
                              className="toggle-btn toggle-inactive"
                              onClick={() => handleSetCurrent(sem.semesterId)}
                            >
                              활성화 전환하기
                            </button>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn-danger-outline"
                            onClick={() => handleDelete(sem.semesterId, sem.year || sem.연도, sem.semester || sem.season || sem.학기)}
                            disabled={sem.isCurrent}
                            style={{ opacity: sem.isCurrent ? 0.4 : 1, cursor: sem.isCurrent ? 'not-allowed' : 'pointer' }}
                            title={sem.isCurrent ? "현재 학기는 삭제할 수 없습니다" : "학기 삭제"}
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}