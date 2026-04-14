import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../api/axios.js';
import { useNavigate } from 'react-router-dom';

export default function StudentList() {
  const navigate = useNavigate();
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
      
      
      // --- [임시 더미 데이터] ---
      setTimeout(() => {
        const dummyDepts = [
          { deptId: "CS01", deptName: "컴퓨터소프트웨어과" },
          { deptId: "BI01", deptName: "경영학과" },
          { deptId: "KL01", deptName: "한국어학과" }
        ];

        const dummyStudents = [
          {
            studentId: "25071001",
            deptName: "컴퓨터소프트웨어과",
            engName: "NGUYEN VAN AN",
            korName: "응우옌반안",
            nationality: "베트남",
            classSec: "A",
            grade: 2,
            enrollStatus: "등록",
            visaType: "D-2",
            attendanceRate: "98%"
          },
          {
            studentId: "25071002",
            deptName: "경영학과",
            engName: "LEE YOUNG HEE",
            korName: "이영희",
            nationality: "한국",
            classSec: "B",
            grade: 1,
            enrollStatus: "휴학",
            visaType: "D-4",
            attendanceRate: "85%"
          }
        ];

        setDepartments(dummyDepts);
        setStudents(dummyStudents);
        setIsLoading(false);
      }, 500);
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
      const matchVisa = filters.visa === 'all' || student.visaType === filters.visa;
      return matchSearch && matchDept && matchYear && matchVisa;
    });
  }, [students, searchTerm, filters]);

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); 
  };

  return (
    <div className="main-content">
      <style>{`
        .main-content { 
          padding: 1.5rem 1.75rem; 
          background: #F0F2F7; 
          min-height: 100vh;
          font-family: 'DM Sans', 'Noto Sans KR', sans-serif;
        }

        /* 상단 헤더 영역 - Flexbox */
        .page-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 1.5rem; 
        }
        .page-title { font-size: 1.375rem; font-weight: 700; color: #111827; }
        .btn-register { 
          background: #1A3A5C; 
          color: #fff; 
          padding: 0.625rem 1.125rem; 
          border-radius: 0.5rem; 
          font-size: 0.8125rem; 
          font-weight: 600;
          border: none; 
          cursor: pointer; 
        }

        /* 필터 카드 - Flexbox & Grid */
        .filter-card { 
          background: #fff; 
          border-radius: 0.875rem; 
          border: 1px solid #F3F4F6; 
          padding: 1.25rem; 
          margin-bottom: 1.25rem;
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }
        .search-container { position: relative; flex: 1; }
        .search-input { 
          width: 100%; 
          padding: 0.625rem 1rem 0.625rem 2.25rem; 
          border: 1px solid #E5E7EB; 
          border-radius: 0.5rem; 
          font-size: 0.875rem; 
        }
        .search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #9CA3AF; width: 1rem; }
        
        .filter-group { display: flex; gap: 0.5rem; }
        .filter-select { 
          padding: 0.625rem 1.5rem 0.625rem 0.75rem; 
          border: 1px solid #E5E7EB; 
          border-radius: 0.5rem; 
          font-size: 0.8125rem; 
          background-color: #fff;
          cursor: pointer;
        }

        /* 테이블 카드 - HTML 레이아웃 적용 */
        .table-card { 
          background: #fff; 
          border-radius: 0.875rem; 
          border: 1px solid #F3F4F6; 
          overflow: hidden; 
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .data-table { width: 100%; border-collapse: collapse; text-align: left; }
        .data-table th { 
          background: #F9FAFB; 
          color: #6B7280; 
          font-size: 0.75rem; 
          font-weight: 600;
          text-transform: uppercase;
          padding: 1rem 1.25rem; 
          border-bottom: 1px solid #F3F4F6; 
        }
        .data-table td { padding: 1rem 1.25rem; border-bottom: 1px solid #F9FAFB; font-size: 0.875rem; }
        .data-table tr:hover { background: #F9FAFB; cursor: pointer; }

        /* 학생 프로필 셀 - Flexbox */
        .student-info-cell { display: flex; align-items: center; gap: 0.75rem; }
        .avatar { 
          width: 2.25rem; height: 2.25rem; 
          border-radius: 0.625rem; 
          background: #EFF6FF; 
          color: #3B82F6; 
          display: flex; align-items: center; justify-content: center; 
          font-weight: 700; font-size: 0.875rem;
        }
        .name-main { font-weight: 700; color: #111827; }
        .name-sub { font-size: 0.75rem; color: #9CA3AF; }

        /* 뱃지 스타일 */
        .chip { 
          padding: 0.25rem 0.625rem; 
          border-radius: 1.25rem; 
          font-size: 0.6875rem; 
          font-weight: 600; 
          display: inline-flex;
        }
        .chip-visa { background: #EFF6FF; color: #1D4ED8; }
        .chip-status-on { background: #F0FDF4; color: #16A34A; }
        .chip-status-off { background: #FEF2F2; color: #DC2626; }

        /* 페이지네이션 - Flexbox */
        .pagination { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          padding: 1rem 1.25rem; 
          border-top: 1px solid #F3F4F6; 
        }
        .page-info { font-size: 0.75rem; color: #9CA3AF; }
        .page-btns { display: flex; gap: 0.25rem; }
        .page-num { 
          width: 2rem; height: 2rem; 
          display: flex; align-items: center; justify-content: center; 
          border-radius: 0.375rem; border: 1px solid #E5E7EB; 
          font-size: 0.8125rem; cursor: pointer; background: #fff;
        }
        .page-num.active { background: #1A3A5C; color: #fff; border-color: #1A3A5C; }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">학생 목록 관리</h1>
        <button className="btn-register">+ 신규 학생 등록</button>
      </div>

      <div className="filter-card">
        <div className="search-container">
          <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            className="search-input" 
            placeholder="이름 또는 학번 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select name="dept" className="filter-select" value={filters.dept} onChange={handleFilterChange}>
            <option value="all">전체 학과</option>
            {departments.map(d => <option key={d.deptId} value={d.deptName}>{d.deptName}</option>)}
          </select>
          <select name="year" className="filter-select" value={filters.year} onChange={handleFilterChange}>
            <option value="all">전체 학년</option>
            <option value="1">1학년</option><option value="2">2학년</option>
          </select>
          <select name="visa" className="filter-select" value={filters.visa} onChange={handleFilterChange}>
            <option value="all">전체 비자</option>
            <option value="D-2">D-2</option><option value="D-4">D-4</option>
          </select>
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>학번</th>
              <th>이름 / 국적</th>
              <th>학과 / 학년</th>
              <th>비자 상태</th>
              <th>출석률</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" style={{textAlign:'center', padding:'4rem', color:'#9CA3AF'}}>데이터를 불러오는 중입니다...</td></tr>
            ) : currentData.length > 0 ? (
              currentData.map(student => (
                <tr key={student.studentId} onClick={() => navigate(`/admin/students/${student.studentId}`)}>
                  <td style={{color:'#6B7280', fontWeight:500}}>{student.studentId}</td>
                  <td>
                    <div className="student-info-cell">
                      <div className="avatar">{student.korName?.charAt(0)}</div>
                      <div>
                        <div className="name-main">{student.korName}</div>
                        <div className="name-sub">{student.engName} · {student.nationality}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{fontWeight:600}}>{student.deptName}</div>
                    <div className="name-sub">{student.grade}학년 {student.classSec}반</div>
                  </td>
                  <td>
                    <span 
                      className="chip chip-visa" 
                      onClick={(e) => { e.stopPropagation(); navigate(`/admin/students/${student.studentId}/visa`); }}
                    >
                      {student.visaType}
                    </span>
                  </td>
                  <td style={{fontWeight:700, color:'#1A3A5C'}}>{student.attendanceRate}</td>
                  <td>
                    <span className={`chip ${student.enrollStatus === '등록' ? 'chip-status-on' : 'chip-status-off'}`}>
                      {student.enrollStatus}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" style={{textAlign:'center', padding:'4rem', color:'#9CA3AF'}}>조회된 학생이 없습니다.</td></tr>
            )}
          </tbody>
        </table>

        <div className="pagination">
          <div className="page-info">Showing {currentData.length} of {filteredData.length} students</div>
          <div className="page-btns">
            <button className="page-num">&lt;</button>
            <button className="page-num active">1</button>
            <button className="page-num">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
}