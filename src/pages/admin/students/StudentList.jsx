import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../api/axios.js';

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [visaMap, setVisaMap] = useState({});
  const [topikMap, setTopikMap] = useState({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ dept: 'all', year: 'all', visa: 'all' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [checkedStudentId, setCheckedStudentId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const [studentRes, deptRes] = await Promise.all([
          api.get('/api/v1/students'),
          api.get('/api/v1/depts').catch(() => null)
        ]);

        let fetchedStudents = [];
        if (studentRes.data?.success) {
          fetchedStudents = studentRes.data.data || [];
          setStudents(fetchedStudents);
        } else if (Array.isArray(studentRes.data)) {
          fetchedStudents = studentRes.data;
          setStudents(fetchedStudents);
        }

        if (deptRes && deptRes.data?.success) {
          setDepartments(deptRes.data.data || []);
        } else {
          const uniqueDepts = Array.from(
            new Set(fetchedStudents.map(s => s.department || s.deptName).filter(Boolean))
          );
          setDepartments(uniqueDepts.map(name => ({ deptId: name, deptName: name })));
        }

      } catch (err) {
        console.error("데이터 로드 실패:", err);
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return students.filter(student => {
      const studentId = student.studentId?.toString() || '';
      const korName = (student.korName || '').toLowerCase();
      const engName = (student.engName || '').toLowerCase();
      const studentDept = student.department || student.deptName || '';
      
      const matchSearch = korName.includes(searchTerm.toLowerCase()) || 
                          engName.includes(searchTerm.toLowerCase()) || 
                          studentId.includes(searchTerm);
                          
      const matchDept = filters.dept === 'all' || studentDept === filters.dept;
      const matchYear = filters.year === 'all' || student.grade?.toString() === filters.year;
      const matchVisa = filters.visa === 'all' || student.visaType === filters.visa;
      
      return matchSearch && matchDept && matchYear && matchVisa;
    });
  }, [students, searchTerm, filters]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  useEffect(() => {
    const fetchExtraDataForCurrentPage = async () => {
      const newVisaMap = { ...visaMap };
      const newTopikMap = { ...topikMap };
      let hasChanges = false;

      const fetchPromises = currentData.map(async (student) => {
        const id = student.studentId;
        
        if (newVisaMap[id] === undefined) {
          try {
            const res = await api.get(`/api/v1/students/${id}/visas`);
            const visaList = res.data?.success ? res.data.data : res.data;
            if (Array.isArray(visaList) && visaList.length > 0) {
              const currentVisa = visaList.find(v => v.isCurrent) || visaList[0];
              newVisaMap[id] = currentVisa.visaType; 
            } else {
              newVisaMap[id] = null;
            }
            hasChanges = true;
          } catch (err) {
            newVisaMap[id] = null;
            hasChanges = true;
          }
        }

        if (newTopikMap[id] === undefined) {
          try {
            const res = await api.get(`/api/v1/students/${id}/topik`);
            let topikList = [];
            
            if (res.data?.success) {
              topikList = res.data.data?.topiks || res.data.data || [];
            } else if (Array.isArray(res.data)) {
              topikList = res.data;
            }

            if (topikList.length > 0) {
              const latestTopik = [...topikList].sort(
                (a, b) => new Date(b.examDate || 0) - new Date(a.examDate || 0)
              )[0];
              newTopikMap[id] = latestTopik.topikLevel;
            } else {
              newTopikMap[id] = null;
            }
            hasChanges = true;
          } catch (err) {
            newTopikMap[id] = null;
            hasChanges = true;
          }
        }
      });

      await Promise.all(fetchPromises);

      if (hasChanges) {
        setVisaMap(newVisaMap);
        setTopikMap(newTopikMap);
      }
    };

    if (currentData.length > 0) {
      fetchExtraDataForCurrentPage();
    }
  }, [currentData, visaMap, topikMap]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
    setCheckedStudentId(null);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const switchMenu = (menuName, studentId = null) => {
    window.dispatchEvent(
      new CustomEvent('switch-admin-menu', {
        detail: { menu: menuName, studentId }
      })
    );
  };

  const handleTopikRegisterClick = () => {
    if (!checkedStudentId) return alert('TOPIK을 관리할 학생을 먼저 체크해 주세요.');
    switchMenu('학생 TOPIK 정보', checkedStudentId);
  };

  const handleVisaRegisterClick = () => {
    if (!checkedStudentId) return alert('비자를 관리할 학생을 먼저 체크해 주세요.');
    switchMenu('학생 비자 정보', checkedStudentId);
  };

  return (
    <div className="main-content">
      <style>{`
        .main-content { padding: 1.5rem 1.75rem; background: #F0F2F7; min-height: 100vh; font-family: 'DM Sans', 'Noto Sans KR', sans-serif; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .page-title { font-size: 1.375rem; font-weight: 700; color: #111827; }
        
        .header-btn-group { display: flex; gap: 0.5rem; align-items: center; }
        
        .btn-topik { background: #fff; color: #4B5563; border: 1px solid #D1D5DB; padding: 0.625rem 1.125rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-topik:hover { background: #F9FAFB; border-color: #9CA3AF; color: #1F2937; }
        
        .btn-visa { background: #fff; color: #1D4ED8; border: 1px solid #BFDBFE; padding: 0.625rem 1.125rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-visa:hover { background: #EFF6FF; border-color: #93C5FD; }

        .btn-register { background: #1A3A5C; color: #fff; padding: 0.625rem 1.125rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; border: none; cursor: pointer; transition: background 0.2s; }
        .btn-register:hover { background: #112740; }

        .filter-card { background: #fff; border-radius: 0.875rem; border: 1px solid #F3F4F6; padding: 1.25rem; margin-bottom: 1.25rem; display: flex; gap: 0.75rem; align-items: center; }
        .search-container { position: relative; flex: 1; }
        .search-input { width: 100%; padding: 0.625rem 1rem 0.625rem 2.25rem; border: 1px solid #E5E7EB; border-radius: 0.5rem; font-size: 0.875rem; }
        .search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #9CA3AF; width: 1rem; }
        .filter-group { display: flex; gap: 0.5rem; }
        .filter-select { padding: 0.625rem 1.5rem 0.625rem 0.75rem; border: 1px solid #E5E7EB; border-radius: 0.5rem; font-size: 0.8125rem; background-color: #fff; cursor: pointer; }

        .table-card { background: #fff; border-radius: 0.875rem; border: 1px solid #F3F4F6; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .data-table { width: 100%; border-collapse: collapse; text-align: left; }
        .data-table th { background: #F9FAFB; color: #6B7280; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; padding: 1rem 1.25rem; border-bottom: 1px solid #F3F4F6; }
        .data-table td { padding: 1rem 1.25rem; border-bottom: 1px solid #F9FAFB; font-size: 0.875rem; }
        .data-table tr:hover { background: #F9FAFB; cursor: pointer; }
        
        .checkbox-cell { width: 3%; text-align: center; }
        .custom-checkbox { width: 1.125rem; height: 1.125rem; cursor: pointer; accent-color: #1A3A5C; }

        .student-info-cell { display: flex; align-items: center; gap: 0.75rem; }
        .avatar { width: 2.25rem; height: 2.25rem; border-radius: 0.625rem; background: #EFF6FF; color: #3B82F6; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; }
        .name-main { font-weight: 700; color: #111827; }
        .name-sub { font-size: 0.75rem; color: #9CA3AF; }

        .chip { padding: 0.25rem 0.625rem; border-radius: 1.25rem; font-size: 0.6875rem; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; }
        .chip-visa { background: #EFF6FF; color: #1D4ED8; }
        .chip-topik { background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; }
        .chip-topik-none { background: #F3F4F6; color: #6B7280; border: 1px solid #E5E7EB; }
        
        .chip-status-on { background: #F0FDF4; color: #16A34A; }
        .chip-status-off { background: #FEF2F2; color: #DC2626; }
        .chip-status-pause { background: #FFFBEB; color: #D97706; }

        .pagination { display: flex; justify-content: center; align-items: center; padding: 1rem 1.25rem; border-top: 1px solid #F3F4F6; }
        .page-btns { display: flex; gap: 0.25rem; }
        .page-num { width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; border-radius: 0.375rem; border: 1px solid #E5E7EB; font-size: 0.8125rem; cursor: pointer; background: #fff; transition: all 0.2s; }
        .page-num:hover:not(:disabled) { background: #F3F4F6; }
        .page-num.active { background: #1A3A5C; color: #fff; border-color: #1A3A5C; }
        .page-num:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">학생 목록 관리</h1>
        <div className="header-btn-group">
          <button className="btn-topik" onClick={handleTopikRegisterClick}>
            TOPIK 관리
          </button>
          <button className="btn-visa" onClick={handleVisaRegisterClick}>
            비자 관리
          </button>
          <button className="btn-register" onClick={() => switchMenu('학생 기본 정보', 'new')}>
            + 신규 학생 등록
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="filter-card">
        <div className="search-container">
          <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            className="search-input" 
            placeholder="이름 또는 학번 검색..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
              setCheckedStudentId(null);
            }}
          />
        </div>
        <div className="filter-group">
          <select name="dept" className="filter-select" value={filters.dept} onChange={handleFilterChange}>
            <option value="all">전체 학과</option>
            {departments.map(d => (
              <option key={d.deptId || d.deptName} value={d.deptName}>{d.deptName}</option>
            ))}
          </select>
          <select name="year" className="filter-select" value={filters.year} onChange={handleFilterChange}>
            <option value="all">전체 학년</option>
            <option value="1">1학년</option>
            <option value="2">2학년</option>
            <option value="3">3학년</option>
            <option value="4">4학년</option>
          </select>
          <select name="visa" className="filter-select" value={filters.visa} onChange={handleFilterChange}>
            <option value="all">전체 비자</option>
            <option value="D-2">D-2 (유학)</option>
            <option value="D-4">D-4 (일반연수)</option>
          </select>
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th className="checkbox-cell">선택</th>
              <th>학번</th>
              <th>이름 / 국적</th>
              <th>학과 / 학년</th>
              <th>비자 상태</th>
              <th>TOPIK</th>
              <th>출석률</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" style={{textAlign:'center', padding:'4rem', color:'#9CA3AF'}}>
                  데이터를 불러오는 중입니다...
                </td>
              </tr>
            ) : currentData.length > 0 ? (
              currentData.map(student => {
                const enrollStatusClass = 
                  student.enrollmentStatus === '재학' || student.enrollStatus === '등록' ? 'chip-status-on' :
                  student.enrollmentStatus === '휴학' || student.enrollStatus === '휴학' ? 'chip-status-pause' : 'chip-status-off';
                
                const displayVisa = visaMap[student.studentId] !== undefined 
                                    ? (visaMap[student.studentId] || '미등록') 
                                    : (student.visaType || '로딩중...');

                const displayTopik = topikMap[student.studentId] !== undefined 
                                     ? topikMap[student.studentId] 
                                     : '로딩중...';

                return (
                  <tr 
                    key={student.studentId} 
                    onClick={() => switchMenu('학생 기본 정보', student.studentId)}
                    style={{ backgroundColor: checkedStudentId === student.studentId ? '#F3F4F6' : '' }}
                  >
                    <td className="checkbox-cell" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="custom-checkbox"
                        checked={checkedStudentId === student.studentId}
                        onChange={() => {
                          setCheckedStudentId(checkedStudentId === student.studentId ? null : student.studentId);
                        }}
                      />
                    </td>
                    <td style={{color:'#6B7280', fontWeight:500}}>{student.studentId}</td>
                    <td>
                      <div className="student-info-cell">
                        <div className="avatar">{(student.korName || '학').charAt(0)}</div>
                        <div>
                          <div className="name-main">{student.korName || '-'}</div>
                          <div className="name-sub">{student.engName || '-'} · {student.nationality || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{fontWeight:600}}>{student.department || student.deptName || '-'}</div>
                      <div className="name-sub">
                        {student.grade ? `${student.grade}학년` : '-'} {student.classSection || student.classSec ? `${student.classSection || student.classSec}반` : ''}
                      </div>
                    </td>
                    <td>
                      <span 
                        className="chip chip-visa" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          switchMenu('학생 비자 정보', student.studentId); 
                        }}
                      >
                        {displayVisa}
                      </span>
                    </td>
                    <td>
                      <span 
                        className={`chip ${displayTopik && displayTopik !== '로딩중...' ? 'chip-topik' : 'chip-topik-none'}`}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          switchMenu('학생 TOPIK 정보', student.studentId); 
                        }}
                      >
                        {displayTopik && displayTopik !== '로딩중...' ? `${displayTopik}급` : (displayTopik || '미등록')}
                      </span>
                    </td>
                    <td style={{fontWeight:700, color:'#1A3A5C'}}>
                      {student.attendanceRate ? (student.attendanceRate.toString().includes('%') ? student.attendanceRate : `${student.attendanceRate}%`) : '-'}
                    </td>
                    <td>
                      <span className={`chip ${enrollStatusClass}`}>
                        {student.enrollmentStatus || student.enrollStatus || '미상'}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" style={{textAlign:'center', padding:'4rem', color:'#9CA3AF'}}>
                  조회된 학생이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {!isLoading && (
          <div className="pagination">
            <div className="page-btns">
              <button 
                className="page-num" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &lt;
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i + 1} 
                  className={`page-num ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </button>
              ))}

              <button 
                className="page-num" 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}