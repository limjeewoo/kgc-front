import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../api/axios';

export default function StaffStudentList({ onStudentClick, permissions }) {
  const [students, setStudents]       = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState(null);

  const [searchTerm, setSearchTerm]   = useState('');
  const [filters, setFilters]         = useState({ dept:'all', year:'all' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const can = (key) => permissions?.find(p => p.permissionKey === key)?.isEnabled === true;

  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading]   = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [studentRes, deptRes] = await Promise.allSettled([
          api.get('/api/v1/students'),
          api.get('/api/v1/depts'),
        ]);
        if (studentRes.status === 'fulfilled' && studentRes.value.data?.success)
          setStudents(studentRes.value.data.data || []);
        if (deptRes.status === 'fulfilled' && deptRes.value.data?.success)
          setDepartments(deptRes.value.data.data || []);
      } catch (err) {
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return students.filter(s => {
      const id   = s.studentId?.toString() || '';
      const kor  = (s.korName || '').toLowerCase();
      const eng  = (s.engName || '').toLowerCase();
      const dept = s.deptName || s.department || '';
      const term = searchTerm.toLowerCase();
      return (kor.includes(term) || eng.includes(term) || id.includes(term))
        && (filters.dept === 'all' || dept === filters.dept)
        && (filters.year === 'all' || s.grade?.toString() === filters.year);
    });
  }, [students, searchTerm, filters]);

  const totalPages  = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const handleBulkUpload = async () => {
    if (!uploadFile) { alert('파일을 선택해주세요.'); return; }
    const formData = new FormData();
    formData.append('file', uploadFile);
    setUploading(true);
    try {
      const res = await api.post('/api/v1/students/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        alert('학생 일괄 등록이 완료되었습니다.');
        setShowUpload(false);
        setUploadFile(null);
        const res2 = await api.get('/api/v1/students');
        if (res2.data.success) setStudents(res2.data.data || []);
      }
    } catch (e) {
      alert(e.response?.data?.message || '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="ssl-wrap">
      <style>{`
        .ssl-wrap { padding:1.5rem 1.75rem; background:#F0F2F7; min-height:100vh; font-family:'DM Sans','Noto Sans KR',sans-serif; }
        .ssl-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
        .ssl-title  { font-size:1.375rem; font-weight:700; color:#111827; }
        .ssl-btn { background:#1A3A5C; color:#fff; padding:0.625rem 1.125rem; border-radius:0.5rem; font-size:0.8125rem; font-weight:600; border:none; cursor:pointer; font-family:inherit; }
        .ssl-btn:hover { background:#112740; }
        .ssl-filter { background:#fff; border-radius:0.875rem; border:1px solid #F3F4F6; padding:1.25rem; margin-bottom:1.25rem; display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap; }
        .ssl-search-wrap { position:relative; flex:1; min-width:180px; }
        .ssl-search-icon { position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); color:#9CA3AF; }
        .ssl-search-input { width:100%; padding:0.625rem 1rem 0.625rem 2.25rem; border:1px solid #E5E7EB; border-radius:0.5rem; font-size:0.875rem; font-family:inherit; outline:none; }
        .ssl-search-input:focus { border-color:#3B82F6; }
        .ssl-select { padding:0.625rem 0.75rem; border:1px solid #E5E7EB; border-radius:0.5rem; font-size:0.8125rem; background:#fff; font-family:inherit; outline:none; cursor:pointer; }
        .ssl-table-card { background:#fff; border-radius:0.875rem; border:1px solid #F3F4F6; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05); }
        .ssl-table { width:100%; border-collapse:collapse; text-align:left; }
        .ssl-table th { background:#F9FAFB; color:#6B7280; font-size:0.75rem; font-weight:600; text-transform:uppercase; padding:1rem 1.25rem; border-bottom:1px solid #F3F4F6; }
        .ssl-table td { padding:1rem 1.25rem; border-bottom:1px solid #F9FAFB; font-size:0.875rem; }
        .ssl-table tr:hover td { background:#F9FAFB; cursor:pointer; }
        .ssl-avatar { width:2.25rem; height:2.25rem; border-radius:0.625rem; background:#EFF6FF; color:#3B82F6; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.875rem; flex-shrink:0; }
        .ssl-name-main { font-weight:700; color:#111827; }
        .ssl-name-sub  { font-size:0.75rem; color:#9CA3AF; }
        .ssl-chip { padding:0.25rem 0.625rem; border-radius:1.25rem; font-size:0.6875rem; font-weight:600; display:inline-flex; }
        .chip-on    { background:#F0FDF4; color:#16A34A; }
        .chip-off   { background:#FEF2F2; color:#DC2626; }
        .chip-pause { background:#FFFBEB; color:#D97706; }
        .chip-visa  { background:#EFF6FF; color:#1D4ED8; }
        .ssl-pagination { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.25rem; border-top:1px solid #F3F4F6; }
        .ssl-page-info { font-size:0.75rem; color:#9CA3AF; }
        .ssl-page-btns { display:flex; gap:0.25rem; }
        .ssl-page-num { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; border-radius:0.375rem; border:1px solid #E5E7EB; font-size:0.8125rem; cursor:pointer; background:#fff; font-family:inherit; }
        .ssl-page-num:hover:not(:disabled) { background:#F3F4F6; }
        .ssl-page-num.active { background:#1A3A5C; color:#fff; border-color:#1A3A5C; }
        .ssl-page-num:disabled { opacity:0.5; cursor:not-allowed; }
        .ssl-modal-bg { position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:1000; }
        .ssl-modal { background:#fff; border-radius:1rem; width:26rem; padding:2rem; }
        .ssl-modal-title { font-size:1.125rem; font-weight:700; color:#111827; margin-bottom:0.25rem; }
        .ssl-modal-sub   { font-size:0.8125rem; color:#6B7280; margin-bottom:1.5rem; }
        .ssl-dropzone { border:2px dashed #E5E7EB; border-radius:0.75rem; padding:2.5rem 1.5rem; text-align:center; cursor:pointer; background:#F9FAFB; margin-bottom:1.5rem; transition:0.2s; }
        .ssl-dropzone:hover { border-color:#3B82F6; background:#F0F7FF; }
        .ssl-file-name { font-size:0.875rem; font-weight:600; color:#2563EB; margin-top:0.5rem; }
        .ssl-modal-footer { display:flex; gap:0.625rem; justify-content:flex-end; }
        .ssl-modal-cancel  { padding:0.625rem 1.25rem; border-radius:0.5rem; font-size:0.8125rem; font-weight:600; cursor:pointer; background:#fff; border:1px solid #E5E7EB; color:#374151; font-family:inherit; }
        .ssl-modal-confirm { padding:0.625rem 1.25rem; border-radius:0.5rem; font-size:0.8125rem; font-weight:600; cursor:pointer; background:#10B981; color:#fff; border:none; font-family:inherit; }
        .ssl-modal-confirm:disabled { background:#9CA3AF; cursor:not-allowed; }
      `}</style>

      <div className="ssl-header">
        <h1 className="ssl-title">학생 목록 관리</h1>
        {can('STUDENT_UPLOAD') && (
          <button className="ssl-btn" onClick={() => setShowUpload(true)}>+ 엑셀 일괄 등록</button>
        )}
      </div>

      {error && <div style={{ background:'#FEF2F2', color:'#DC2626', padding:'1rem', borderRadius:'0.5rem', marginBottom:'1rem' }}>{error}</div>}

      <div className="ssl-filter">
        <div className="ssl-search-wrap">
          <svg className="ssl-search-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input className="ssl-search-input" placeholder="이름 또는 학번 검색..." value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
        </div>
        <select className="ssl-select" value={filters.dept} onChange={e => { setFilters(p=>({...p,dept:e.target.value})); setCurrentPage(1); }}>
          <option value="all">전체 학과</option>
          {departments.map(d => <option key={d.deptId} value={d.deptName}>{d.deptName}</option>)}
        </select>
        <select className="ssl-select" value={filters.year} onChange={e => { setFilters(p=>({...p,year:e.target.value})); setCurrentPage(1); }}>
          <option value="all">전체 학년</option>
          {[1,2,3,4].map(y => <option key={y} value={y}>{y}학년</option>)}
        </select>
      </div>

      <div className="ssl-table-card">
        <table className="ssl-table">
          <thead>
            <tr>
              <th>학번</th><th>이름 / 국적</th><th>학과 / 학년</th><th>비자</th><th>학적상태</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" style={{textAlign:'center',padding:'4rem',color:'#9CA3AF'}}>불러오는 중...</td></tr>
            ) : currentData.length > 0 ? currentData.map(s => {
              const statusClass = s.enrollStatus==='재학' ? 'chip-on' : s.enrollStatus==='휴학' ? 'chip-pause' : 'chip-off';
              return (
                <tr key={s.studentId} onClick={() => onStudentClick(s.studentId, s.korName || s.engName)}>
                  <td style={{color:'#6B7280',fontWeight:500}}>{s.studentId}</td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                      <div className="ssl-avatar">{(s.korName||'학').charAt(0)}</div>
                      <div>
                        <div className="ssl-name-main">{s.korName||'-'}</div>
                        <div className="ssl-name-sub">{s.engName||'-'} · {s.nationality||'-'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{fontWeight:600}}>{s.deptName||s.department||'-'}</div>
                    <div className="ssl-name-sub">{s.grade?`${s.grade}학년`:'-'} {s.classSec?`${s.classSec}반`:''}</div>
                  </td>
                  <td><span className="ssl-chip chip-visa">{s.visaType||'미등록'}</span></td>
                  <td><span className={`ssl-chip ${statusClass}`}>{s.enrollStatus||'미상'}</span></td>
                </tr>
              );
            }) : (
              <tr><td colSpan="5" style={{textAlign:'center',padding:'4rem',color:'#9CA3AF'}}>조회된 학생이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
        {!isLoading && (
          <div className="ssl-pagination">
            <div className="ssl-page-info">{filteredData.length > 0 ? `${(currentPage-1)*itemsPerPage+1}–${Math.min(currentPage*itemsPerPage,filteredData.length)} / 총 ${filteredData.length}명` : '0명'}</div>
            <div className="ssl-page-btns">
              <button className="ssl-page-num" onClick={()=>setCurrentPage(p=>p-1)} disabled={currentPage===1}>&lt;</button>
              {[...Array(totalPages)].map((_,i)=>(
                <button key={i+1} className={`ssl-page-num ${currentPage===i+1?'active':''}`} onClick={()=>setCurrentPage(i+1)}>{i+1}</button>
              ))}
              <button className="ssl-page-num" onClick={()=>setCurrentPage(p=>p+1)} disabled={currentPage===totalPages}>&gt;</button>
            </div>
          </div>
        )}
      </div>

      {showUpload && (
        <div className="ssl-modal-bg" onClick={()=>setShowUpload(false)}>
          <div className="ssl-modal" onClick={e=>e.stopPropagation()}>
            <div className="ssl-modal-title">학생 일괄 등록</div>
            <div className="ssl-modal-sub">Excel 파일을 업로드하여 학생을 한 번에 등록합니다.</div>
            <div className="ssl-dropzone" onClick={()=>document.getElementById('staffStudentFile').click()}>
              <svg width="40" height="40" fill="none" stroke="#9CA3AF" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M12 4v12m0 0l-3-3m3 3l3-3M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div style={{fontSize:'0.8125rem',color:'#6B7280',marginTop:'0.5rem'}}>
                {uploadFile ? '파일을 변경하려면 클릭하세요' : '클릭하여 엑셀 파일을 선택하세요'}
              </div>
              <input id="staffStudentFile" type="file" hidden accept=".xlsx,.xls" onChange={e=>setUploadFile(e.target.files[0])} />
              {uploadFile && <div className="ssl-file-name">📄 {uploadFile.name}</div>}
            </div>
            <div className="ssl-modal-footer">
              <button className="ssl-modal-cancel" onClick={()=>{setShowUpload(false);setUploadFile(null);}} disabled={uploading}>취소</button>
              <button className="ssl-modal-confirm" onClick={handleBulkUpload} disabled={uploading||!uploadFile}>
                {uploading ? '업로드 중...' : '업로드 시작'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
