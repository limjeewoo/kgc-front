import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';

export default function AdvisorAssign() {
  // 데이터 상태
  const [students, setStudents] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [assignments, setAssignments] = useState([]); // 최근 배정 내역 (검색 결과)
  
  // 폼 상태
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState(''); // 교수 또는 학생 ID로 배정 내역 조회용

  // 1. 초기 데이터 로드 (학생/교수 목록)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stuRes, profRes] = await Promise.all([
          api.get('/api/v1/students'),
          api.get('/api/v1/professors')
        ]);
        if (stuRes.data.success) setStudents(stuRes.data.data);
        if (profRes.data.success) setProfessors(profRes.data.data);
      } catch (error) {
        console.error("데이터 로드 실패", error);
      }
    };
    fetchData();
  }, []);

  // 2. 지도교수 배정 실행 (POST /api/v1/advisors)
  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedProfessor) {
      alert("학생과 교수를 모두 선택해주세요.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/api/v1/advisors', {
        studentId: selectedStudent,
        professorId: selectedProfessor,
        assignedDate: assignedDate
      });

      if (response.data.success) {
        alert("지도교수 배정이 완료되었습니다.");
        // 배정 후 리스트 갱신
        fetchAdvisorList(selectedProfessor, 'professor');
        // 폼 초기화
        setSelectedStudent('');
      }
    } catch (error) {
      alert(error.response?.data?.message || "배정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 3. 배정 내역 조회 (교수별 또는 학생별)
  const fetchAdvisorList = async (id, type) => {
    if(!id) { alert("조회할 ID를 입력해주세요."); return; }
    try {
      setLoading(true);
      const url = type === 'professor' 
        ? `/api/v1/advisors/professor/${id}` 
        : `/api/v1/advisors/student/${id}`;
      const response = await api.get(url);
      if (response.data.success) {
        setAssignments(Array.isArray(response.data.data) ? response.data.data : [response.data.data]);
      }
    } catch (error) {
      setAssignments([]);
      alert("조회된 결과가 없거나 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 4. 배정 해제 (DELETE /api/v1/advisors/{id})
  const handleDelete = async (advisorId) => {
    if (!window.confirm("정말 배정을 해제하시겠습니까?")) return;
    try {
      const response = await api.delete(`/api/v1/advisors/${advisorId}`);
      if (response.data.success) {
        setAssignments(assignments.filter(a => a.advisorId !== advisorId));
        alert("해제되었습니다.");
      }
    } catch (error) {
      alert("해제 실패");
    }
  };

  return (
    <div className="advisor-container">
      <style>{`
        .advisor-container { animation: fadeIn 0.3s ease; width: 100%; padding: 30px; box-sizing: border-box; background: #f8fafc; min-height: 100vh; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        
        .page-header { margin-bottom: 25px; }
        .page-title { font-size: 1.6rem; font-weight: 800; color: #1e293b; }
        
        /* 수직 스택 레이아웃 */
        .stack-layout { display: flex; flex-direction: column; gap: 25px; }
        
        .card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .card-title { font-size: 1.1rem; font-weight: 700; color: #334155; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        
        /* 등록 폼 한 줄 배치 */
        .assign-form-row { display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap; }
        .form-group { flex: 1; min-width: 200px; margin-bottom: 0; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #64748b; margin-bottom: 8px; }
        
        .select-input, .date-input { 
          width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; outline: none; transition: all 0.2s; background-color: #fcfcfc;
        }
        .select-input:focus, .date-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        
        .btn-assign-submit { 
          background: #2563eb; color: #fff; border: none; padding: 0 25px; height: 46px; border-radius: 10px; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: background 0.2s;
        }
        .btn-assign-submit:hover { background: #1d4ed8; }
        .btn-assign-submit:disabled { background: #94a3b8; cursor: not-allowed; }
        
        /* 조회 영역 스타일 */
        .search-section { display: flex; gap: 10px; margin-bottom: 25px; background: #f1f5f9; padding: 20px; border-radius: 12px; align-items: center; }
        .search-section input { flex: 1; padding: 12px 15px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.95rem; }
        .btn-search { padding: 12px 20px; border-radius: 8px; border: none; font-weight: 700; cursor: pointer; font-size: 0.9rem; transition: 0.2s; }
        .btn-search.prof { background: #334155; color: white; }
        .btn-search.stu { background: #64748b; color: white; }
        .btn-search:hover { opacity: 0.9; }

        /* 테이블 스타일 */
        .data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .data-table th { background: #f8fafc; padding: 10px 0px; font-size: 0.9rem; font-weight: 600; color: #475569; text-align: left; border-bottom: 2px solid #e2e8f0; }
        .data-table td { padding: 18px 20px; font-size: 0.95rem; color: #334155; border-bottom: 1px solid #f1f5f9; }
        
        .badge-stu { background: #eff6ff; color: #1e40af; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 0.85rem; }
        .badge-prof { background: #fdf2f8; color: #9d174d; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 0.85rem; }
        
        .btn-delete { color: #ef4444; background: #fff1f2; border: 1px solid #fecdd3; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.6rem; font-weight: 600; transition: 0.2s; }
        .btn-delete:hover { background: #fee2e2; }
      `}</style>

      <header className="page-header">
        <h1 className="page-title">지도교수 배정 관리</h1>
      </header>

      <div className="stack-layout">
        {/* 상단: 배정 등록 폼 (수평 구조) */}
        <div className="card">
          <h3 className="card-title">신규 배정 등록</h3>
          <form onSubmit={handleAssign} className="assign-form-row">
            <div className="form-group">
              <label>교수 선택</label>
              <select 
                className="select-input"
                value={selectedProfessor}
                onChange={(e) => setSelectedProfessor(e.target.value)}
              >
                <option value="">교수를 선택하세요</option>
                {professors.map(p => (
                  <option key={p.professorId} value={p.professorId}>
                    [{p.professorId}] {p.name} - {p.deptName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>학생 선택</label>
              <select 
                className="select-input"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
              >
                <option value="">학생을 선택하세요</option>
                {students.map(s => (
                  <option key={s.studentId} value={s.studentId}>
                    [{s.studentId}] {s.korName} ({s.nationality})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>배정 일자</label>
              <input 
                type="date" 
                className="date-input"
                value={assignedDate}
                onChange={(e) => setAssignedDate(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-assign-submit" disabled={loading}>
              {loading ? "처리 중..." : "배정 실행"}
            </button>
          </form>
        </div>

        {/* 하단: 배정 현황 리스트 (전체 너비 가로 확장) */}
        <div className="card">
          <h3 className="card-title">배정 현황 조회</h3>
          
          <div className="search-section">
            <input 
              type="text" 
              placeholder="조회할 교수의 사번 또는 학생의 학번을 입력하세요" 
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAdvisorList(searchId, 'professor')}
            />
            <button className="btn-search prof" onClick={() => fetchAdvisorList(searchId, 'professor')}>사번으로 조회</button>
            <button className="btn-search stu" onClick={() => fetchAdvisorList(searchId, 'student')}>학번으로 조회</button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th style={{width: '25%'}}>학생 정보 (학번/이름)</th>
                <th style={{width: '25%'}}>지도교수 정보 (사번/이름)</th>
                <th style={{width: '20%'}}>배정일</th>
                <th style={{width: '15%', textAlign: 'center'}}>상태</th>
                <th style={{width: '15%', textAlign: 'center'}}>관리</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{textAlign: 'center', padding: '80px', color: '#94a3b8'}}>
                    조회된 데이터가 없습니다. 사번 또는 학번을 입력하여 검색해주세요.
                  </td>
                </tr>
              ) : (
                assignments.map((item) => (
                  <tr key={item.advisorId}>
                    <td>
                      <span className="badge-stu">{item.studentId}</span>
                      <span style={{fontWeight: 700, marginLeft: '10px'}}>{item.studentName}</span>
                    </td>
                    <td>
                      <span className="badge-prof">{item.professorId}</span>
                      <span style={{fontWeight: 700, marginLeft: '10px'}}>{item.professorName}</span>
                    </td>
                    <td>{item.assignedDate}</td>
                    <td style={{textAlign: 'center'}}>
                      <span style={{fontSize: '0.85rem', color: '#10b981', fontWeight: 600}}>연결됨</span>
                    </td>
                    <td style={{textAlign: 'center'}}>
                      <button className="btn-delete" onClick={() => handleDelete(item.advisorId)}>배정 해제</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}