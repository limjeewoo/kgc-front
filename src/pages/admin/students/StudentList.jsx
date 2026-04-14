import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../api/axios.js';

export default function StudentList() {
  const [students, setStudents] = useState([]); 
  const [departments, setDepartments] = useState([]); 
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ dept: 'all', year: 'all', visa: 'all' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [deptRes, stdRes] = await Promise.all([
          api.get('/api/v1/depts'),
          api.get('/api/v1/students')
        ]);

        if (deptRes.data.success) {
          setDepartments(deptRes.data.data);
        }

        if (stdRes.data.success) {
          setStudents(stdRes.data.data);
        } else {
          setError(stdRes.data.message || '학생 데이터를 불러오지 못했습니다.');
        }
      } catch (err) {
        console.error('API Fetch Error:', err);
        setError(err.response?.data?.message || '데이터 통신 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return students.filter(student => {
      const nameMatch = (student.korName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (student.engName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const idMatch = student.studentId.includes(searchTerm);
      const matchSearch = nameMatch || idMatch;
      
      const matchDept = filters.dept === 'all' || student.deptName === filters.dept;
      const matchYear = filters.year === 'all' || student.grade?.toString() === filters.year;
      
      const studentVisa = student.visaType || '정보없음'; 
      const matchVisa = filters.visa === 'all' || studentVisa === filters.visa;

      return matchSearch && matchDept && matchYear && matchVisa;
    });
  }, [students, searchTerm, filters]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); 
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <>
      <style>{`
        /* 1rem = 16px 기준. 반응형 및 유지보수를 위해 rem과 % 위주로 수정 */
        .list-wrap { padding: 1.5rem; font-family: 'DM Sans', 'Noto Sans KR', sans-serif; color: #111827; }
        
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
        .page-title { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.03rem; }
        .btn-primary { background: #1A3A5C; color: #fff; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.375rem; transition: 0.2s; }
        .btn-primary:hover { background: #122B45; }

        /* 필터 영역: Flexbox를 활용해 화면 크기에 따라 유연하게 배치 */
        .filter-card { background: #fff; border-radius: 0.75rem; border: 1px solid #E5E7EB; padding: 1rem 1.25rem; margin-bottom: 1.25rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
        .search-box { position: relative; flex: 1; min-width: 15rem; }
        .search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #9CA3AF; width: 1rem; height: 1rem; }
        .search-input { width: 100%; padding: 0.5625rem 0.75rem 0.5625rem 2.25rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 0.875rem; outline: none; transition: border 0.2s; font-family: inherit; box-sizing: border-box; }
        .search-input:focus { border-color: #3B82F6; box-shadow: 0 0 0 0.1875rem rgba(59,130,246,0.1); }
        
        .filter-group { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .filter-select { padding: 0.5625rem 2rem 0.5625rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 0.8125rem; color: #374151; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E") no-repeat right 0.5rem center/1rem 1rem; appearance: none; outline: none; cursor: pointer; }
        .filter-select:focus { border-color: #3B82F6; }

        /* 데스크탑 전용 테이블 구조 (추후 모바일 카드뷰 전환 고려하여 wrapper로 감쌈) */
        .table-card { background: #fff; border-radius: 0.75rem; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
        .data-table { width: 100%; border-collapse: collapse; text-align: left; }
        .data-table th { background: #F9FAFB; color: #6B7280; font-size: 0.75rem; font-weight: 600; padding: 0.875rem 1.25rem; border-bottom: 1px solid #E5E7EB; }
        .data-table td { padding: 0.875rem 1.25rem; font-size: 0.875rem; border-bottom: 1px solid #F3F4F6; color: #111827; vertical-align: middle; }
        .data-table tbody tr { transition: background 0.15s; cursor: pointer; }
        .data-table tbody tr:hover { background: #F9FAFB; }
        
        .badge { display: inline-flex; align-items: center; justify-content: center; padding: 0.25rem 0.625rem; border-radius: 1.25rem; font-size: 0.7rem; font-weight: 600; }
        .badge-visa-d2 { background: #EFF6FF; color: #1D4ED8; }
        .badge-visa-d4 { background: #F5F3FF; color: #7C3AED; }
        .badge-status-on { background: #ECFDF5; color: #059669; }
        .badge-status-off { background: #FEF2F2; color: #DC2626; }
        .badge-default { background: #F3F4F6; color: #4B5563; }
        
        .student-name-cell { display: flex; align-items: center; gap: 0.625rem; }
        .student-av { width: 2rem; height: 2rem; border-radius: 50%; background: #E0E7FF; color: #3B82F6; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
        .name-txt { font-weight: 500; display: flex; flex-direction: column; }
        .eng-name { font-size: 0.6875rem; color: #6B7280; margin-top: 0.125rem; }

        .pagination-wrap { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-top: 1px solid #F3F4F6; flex-wrap: wrap; gap: 1rem; }
        .page-info { font-size: 0.8125rem; color: #6B7280; }
        .page-info span { font-weight: 600; color: #111827; }
        .page-controls { display: flex; gap: 0.375rem; }
        .page-btn { padding: 0.375rem 0.625rem; border: 1px solid #D1D5DB; background: #fff; border-radius: 0.375rem; color: #374151; font-size: 0.8125rem; cursor: pointer; transition: 0.15s; }
        .page-btn:hover:not(:disabled) { background: #F3F4F6; }
        .page-btn.active { background: #1A3A5C; color: #fff; border-color: #1A3A5C; font-weight: 600; }
        .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .empty-state { padding: 3.75rem 1.25rem; text-align: center; color: #6B7280; font-size: 0.875rem; }
        .loading-state { padding: 3.75rem 1.25rem; text-align: center; color: #3B82F6; font-size: 0.9375rem; font-weight: 500; }
      `}</style>

      <div className="list-wrap">
        <div className="page-header">
          <div className="page-title">학생 목록 관리</div>
          <button className="btn-primary">
            <svg viewBox="0 0 20 20" fill="currentColor" width="1rem" height="1rem">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            신규 학생 등록
          </button>
        </div>

        <div className="filter-card">
          <div className="search-box">
            <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input 
              type="text" 
              className="search-input" 
              placeholder="이름 또는 학번 검색..." 
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          <div className="filter-group">
            <select name="dept" className="filter-select" value={filters.dept} onChange={handleFilterChange}>
              <option value="all">전체 학과</option>
              {departments.map(dept => (
                <option key={dept.deptId} value={dept.deptName}>
                  {dept.deptName}
                </option>
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
              <option value="D-4">D-4 (어학연수)</option>
              <option value="F-4">F-4 (재외동포)</option>
            </select>
            
            <select 
              className="filter-select" 
              value={itemsPerPage} 
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            >
              <option value="10">10개씩 보기</option>
              <option value="20">20개씩 보기</option>
              <option value="50">50개씩 보기</option>
            </select>
          </div>
        </div>

        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>학번</th>
                <th>이름</th>
                <th>학과</th>
                <th>학년/반</th>
                <th>비자 (예정)</th>
                <th>상태</th>
                <th>출석률 (예정)</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7">
                    <div className="loading-state">데이터를 불러오는 중입니다...</div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state" style={{ color: '#DC2626' }}>{error}</div>
                  </td>
                </tr>
              ) : currentData.length > 0 ? (
                currentData.map(student => (
                  <tr key={student.studentId}>
                    <td style={{ color: '#6B7280', fontWeight: '500' }}>{student.studentId}</td>
                    <td>
                      <div className="student-name-cell">
                        {student.photoUrl ? (
                          <img src={student.photoUrl} alt="profile" style={{ width: '2rem', height: '2rem', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div className="student-av">{student.korName ? student.korName.charAt(0) : 'S'}</div>
                        )}
                        <div className="name-txt">
                          {student.korName}
                          <span className="eng-name">{student.engName}</span>
                        </div>
                      </div>
                    </td>
                    <td>{student.deptName}</td>
                    <td>{student.grade}학년 {student.classSec}반</td>
                    <td>
                      <span className="badge badge-default">-</span>
                    </td>
                    <td>
                      <span className={`badge ${student.enrollStatus === '등록' ? 'badge-status-on' : 'badge-status-off'}`}>
                        {student.enrollStatus}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#9CA3AF', fontSize: '0.8125rem' }}>-</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">조건에 맞는 학생이 없습니다.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {!isLoading && totalItems > 0 && (
            <div className="pagination-wrap">
              <div className="page-info">
                총 <span>{totalItems}</span>명 중 <span>{(currentPage - 1) * itemsPerPage + 1}</span> - <span>{Math.min(currentPage * itemsPerPage, totalItems)}</span>
              </div>
              <div className="page-controls">
                <button 
                  className="page-btn" 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  이전
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i + 1} 
                    className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button 
                  className="page-btn" 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}