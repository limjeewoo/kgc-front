import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../../components/layout/TopBar.jsx';

export default function MyStudentList() {
  const navigate    = useNavigate();

  const token       = localStorage.getItem('accessToken');
  const professorId = localStorage.getItem('userId');

  const [loading, setLoading]                   = useState(true);
  const [students, setStudents]                 = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [deptList, setDeptList]                 = useState([]);
  const [classList, setClassList]               = useState([]);
  const [selectedDept, setSelectedDept]         = useState('all');
  const [selectedClass, setSelectedClass]       = useState('all');
  const [searchTerm, setSearchTerm]             = useState('');

  useEffect(() => {
    if (!token || !professorId) {
      navigate('/login');
      return;
    }

    setLoading(true);
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    
    fetch(`http://localhost:8080/api/v1/advisors/professor/${professorId}`, { headers })
      .then(r => r.json())
      .then(studentsRes => {
        const data = studentsRes.data || [];
        setStudents(data);
        setFilteredStudents(data);
        setDeptList([...new Set(data.map(s => s.deptName).filter(Boolean))]);
        setClassList([...new Set(data.map(s => s.className).filter(Boolean))]);
      })
      .catch(e => console.error('데이터 조회 오류:', e))
      .finally(() => setLoading(false));
  }, [professorId, token, navigate]);

  useEffect(() => {
    let result = [...students];
    if (selectedDept !== 'all')  result = result.filter(s => s.deptName  === selectedDept);
    if (selectedClass !== 'all') result = result.filter(s => s.className === selectedClass);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.studentName?.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q)
      );
    }
    setFilteredStudents(result);
  }, [selectedDept, selectedClass, searchTerm, students]);

  if (!token || !professorId) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F0F2F7' }}>
      <div style={{ textAlign: 'center', color: '#1A3A5C', fontSize: 14 }}>인증 정보를 확인 중입니다...</div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

        .msl-main { flex:1; display:flex; flex-direction:column; min-width:0; }
        .msl-content { flex:1; padding:22px 24px; overflow-y:auto; animation:fadeUp .28s ease; }

        .msl-page-hd { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
        .msl-page-title { font-size:20px; font-weight:700; color:#0F172A; }
        .msl-count { font-size:13px; color:#6B7280; }
        .msl-count strong { color:#2563EB; font-weight:700; }

        .msl-filter-card { background:#fff; border-radius:12px; border:1px solid #F1F5F9; padding:14px 20px; margin-bottom:18px; display:flex; gap:12px; align-items:flex-end; flex-wrap:wrap; }
        .msl-filter-group { display:flex; flex-direction:column; gap:5px; }
        .msl-filter-lbl { font-size:10px; font-weight:700; color:#94A3B8; text-transform:uppercase; letter-spacing:.05em; }
        .msl-select { height:36px; min-width:150px; border:1.5px solid #E5E7EB; border-radius:8px; padding:0 12px; font-size:13px; background:#fff; outline:none; font-family:inherit; transition:border-color .15s; }
        .msl-select:focus { border-color:#93C5FD; }
        .msl-search { height:36px; min-width:220px; border:1.5px solid #E5E7EB; border-radius:8px; padding:0 12px; font-size:13px; outline:none; font-family:inherit; transition:border-color .15s; }
        .msl-search:focus { border-color:#93C5FD; }

        .msl-table-card { background:#fff; border-radius:12px; border:1px solid #F1F5F9; overflow:hidden; }
        .msl-table { width:100%; border-collapse:collapse; font-size:13px; text-align:left; }
        .msl-table thead tr { background:#F8FAFC; }
        .msl-table th { padding:12px 18px; font-size:11px; font-weight:700; color:#64748B; border-bottom:1.5px solid #E2E8F0; white-space:nowrap; }
        .msl-table tbody tr { cursor:pointer; transition:background .12s; }
        .msl-table tbody tr:hover td { background:#F0F7FF; }
        .msl-table tbody tr:last-child td { border-bottom:none; }
        .msl-table td { padding:13px 18px; border-bottom:1px solid #F8FAFC; color:#374151; vertical-align:middle; }

        .msl-avatar { width:30px; height:30px; border-radius:50%; background:#EFF6FF; color:#1D4ED8; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0; }
        .msl-student-cell { display:flex; align-items:center; gap:10px; }
        .msl-name { font-weight:600; color:#0F172A; }
        .msl-sid  { font-size:11px; color:#94A3B8; margin-top:2px; font-family:monospace; }

        .msl-visa-badge { display:inline-block; padding:2px 9px; border-radius:6px; font-size:11px; font-weight:700; background:#EFF6FF; color:#1D4ED8; }
        .msl-visa-badge.warn { background:#FEF2F2; color:#DC2626; }

        .msl-btn-detail { padding:6px 13px; background:#1A3A5C; color:#fff; border:none; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; transition:background .15s; }
        .msl-btn-detail:hover { background:#2563EB; }

        .msl-empty { padding:4rem; text-align:center; color:#CBD5E1; font-size:13px; }
        .msl-loading { padding:4rem; text-align:center; color:#94A3B8; font-size:13px; }
      `}</style>

      <div className="msl-main">
        <TopBar title="담당 학생 조회" />
        
        <div className="msl-content">
          <div className="msl-page-hd">
            <div className="msl-page-title">담당 학생 목록</div>
            <div className="msl-count">
              검색 결과: <strong>{filteredStudents.length}</strong> / {students.length} 명
            </div>
          </div>

          <div className="msl-filter-card">
            <div className="msl-filter-group">
              <div className="msl-filter-lbl">학과</div>
              <select className="msl-select" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                <option value="all">전체 학과</option>
                {deptList.map((d, i) => <option key={i} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="msl-filter-group">
              <div className="msl-filter-lbl">분반</div>
              <select className="msl-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                <option value="all">전체 반</option>
                {classList.map((c, i) => <option key={i} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="msl-filter-group" style={{ marginLeft:'auto' }}>
              <div className="msl-filter-lbl">검색</div>
              <input
                className="msl-search"
                placeholder="이름 또는 학번 입력"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="msl-table-card">
            {loading ? (
              <div className="msl-loading">데이터를 불러오는 중...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="msl-empty">조건에 맞는 담당 학생이 없습니다.</div>
            ) : (
              <table className="msl-table">
                <thead>
                  <tr>
                    <th>학생</th>
                    <th>소속 학과</th>
                    <th>분반</th>
                    <th>학년</th>
                    <th>비자 상태</th>
                    <th style={{ textAlign:'right' }}>상세</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => {
                    const visaWarn = s.visaDDay != null && s.visaDDay <= 30;
                    return (
                      <tr
                        key={s.studentId}
                        onClick={() => navigate(`/professor/students/${s.studentId}`, { 
                          state: { role: 'PROFESSOR', isReadOnly: true } 
                        })}
                      >
                        <td>
                          <div className="msl-student-cell">
                            <div className="msl-avatar">
                              {(s.studentName || '?')[0]}
                            </div>
                            <div>
                              <div className="msl-name">{s.studentName || '이름 없음'}</div>
                              <div className="msl-sid">{s.studentId}</div>
                            </div>
                          </div>
                        </td>
                        <td>{s.deptName || '–'}</td>
                        <td>{s.className || '–'}</td>
                        <td>{s.grade ? `${s.grade}학년` : '–'}</td>
                        <td>
                          <span className={`msl-visa-badge ${visaWarn ? 'warn' : ''}`}>
                            {visaWarn ? `D-${s.visaDDay}` : (s.visaStatus || 'D-2')}
                          </span>
                        </td>
                        <td style={{ textAlign:'right' }}>
                          <button
                            className="msl-btn-detail"
                            onClick={e => {
                              e.stopPropagation();
                              navigate(`/professor/students/${s.studentId}`, { 
                                state: { role: 'PROFESSOR', isReadOnly: true } 
                              });
                            }}
                          >
                            상세 보기
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </>
  );
}