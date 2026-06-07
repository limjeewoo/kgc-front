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
  const [pendingCount, setPendingCount]         = useState(0);

  // 사이드바 드롭다운
  const [isStudentMenuOpen, setIsStudentMenuOpen]     = useState(true);
  const [isAttendConsultOpen, setIsAttendConsultOpen] = useState(false);
  
  // 🚧 [임시 주석 처리] 메뉴 열림 상태 변수 잠시 미사용 처리
  // const [isJobMenuOpen, setIsJobMenuOpen]             = useState(false);

  // ── 데이터 로드 ──────────────────────────────────────────
  useEffect(() => {
    if (!token || !professorId) {
      navigate('/login');
      return;
    }

    setLoading(true);
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    Promise.all([
      fetch(`http://localhost:8080/api/v1/advisors/professor/${professorId}`, { headers }).then(r => r.json()),
      // 🚧 [임시 주석 처리] 필요 시 대기 건수 조회를 위해 주석 해제 및 아래 Promise.resolve 제거
      // fetch('/api/v1/jobs/pending', { headers }).then(r => r.json()),
      Promise.resolve({ data: [] }),
    ]).then(([studentsRes, jobsRes]) => {
      const data = studentsRes.data || [];
      setStudents(data);
      setFilteredStudents(data);
      setDeptList([...new Set(data.map(s => s.deptName).filter(Boolean))]);
      setClassList([...new Set(data.map(s => s.className).filter(Boolean))]);
      const myPending = (jobsRes.data || []).filter(j => data.some(s => s.studentId === j.studentId));
      setPendingCount(myPending.length);
    }).catch(e => console.error('데이터 조회 오류:', e))
      .finally(() => setLoading(false));
  }, [professorId, token, navigate]);

  // ── 프론트 필터링 ─────────────────────────────────────────
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

  const SidebarArrow = ({ open }) => (
    <svg className={`arrow-icon ${open ? 'open' : ''}`} viewBox="0 0 20 20" fill="currentColor" style={{ marginLeft:'auto', width:12, height:12, transition:'transform .2s', opacity:.5 }}>
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
    </svg>
  );

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

        .msl-wrap  { display:flex; min-height:100vh; background:#F0F2F7; font-family:'DM Sans','Noto Sans KR',sans-serif; font-size:14px; color:#111827; }
        .sidebar   { width:230px; min-height:100vh; background:#1A3A5C; display:flex; flex-direction:column; flex-shrink:0; position:sticky; top:0; height:100vh; overflow-y:auto; }
        
        .sb-logo { display:flex; align-items:center; gap:10px; padding:22px 18px 18px; border-bottom:1px solid rgba(255,255,255,.08); margin-bottom:8px; cursor:pointer; }
        .logo-img { width: 32px; height: 32px; object-fit: contain; flex-shrink: 0; }
        .logo-text { font-size:12.5px; font-weight:700; color:#fff; line-height:1.3; }
        .logo-text span { display:block; font-size:10px; font-weight:400; color:rgba(255,255,255,.45); }
        
        .sb-sec { padding:6px 10px 2px; margin-bottom:8px; }
        .sb-lbl { font-size:10px; font-weight:600; color:rgba(255,255,255,.3); letter-spacing:1px; text-transform:uppercase; padding:0 8px; margin-bottom:5px; }
        .ni { display:flex; align-items:center; gap:8px; padding:9px 10px; border-radius:8px; color:rgba(255,255,255,.6); font-size:12.5px; cursor:pointer; transition:all .15s; margin-bottom:2px; user-select:none; }
        .ni:hover { background:rgba(255,255,255,.07); color:#fff; }
        .ni.active { background:#3B82F6; color:#fff; font-weight:500; }
        .sub-menu { display:flex; flex-direction:column; padding-left:24px; margin-top:2px; margin-bottom:6px; gap:2px; }
        .sub-ni { font-size:12px; color:rgba(255,255,255,.55); padding:6px 10px; cursor:pointer; border-radius:6px; transition:all .15s; display:flex; align-items:center; justify-content:space-between; }
        .sub-ni:hover { background:rgba(255,255,255,.05); color:rgba(255,255,255,.9); }
        .sub-ni.active { color:#60A5FA; font-weight:600; }
        .nb { margin-left:auto; background:#EF4444; color:#fff; font-size:10px; font-weight:600; padding:1px 6px; border-radius:20px; }

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

      <div className="msl-wrap">

        <div className="sidebar">
          <div className="sb-logo" onClick={() => navigate('/professor/dashboard')}>
            <img src="/logo-fff.png" alt="Logo" className="logo-img" />
            <div className="logo-text">KMGC <span>경민대학교 국제교육원</span></div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">메인</div>
            <div className="ni" onClick={() => navigate('/professor/dashboard')}>교수 대시보드</div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">업무 메뉴</div>

            <div className="ni" onClick={() => setIsStudentMenuOpen(p => !p)}>
              지도학생 관리 <SidebarArrow open={isStudentMenuOpen} />
            </div>
            {isStudentMenuOpen && (
              <div className="sub-menu">
                <div className="sub-ni active">담당 학생 목록</div>
              </div>
            )}

            <div className="ni" onClick={() => setIsAttendConsultOpen(p => !p)}>
              출결 및 상담 관리 <SidebarArrow open={isAttendConsultOpen} />
            </div>
            {isAttendConsultOpen && (
              <div className="sub-menu">
                <div className="sub-ni" onClick={() => navigate('/professor/attendance')}>출결 입력</div>
                <div className="sub-ni" onClick={() => navigate('/professor/consult')}>상담 목록</div>
                <div className="sub-ni" onClick={() => navigate('/professor/consult/write')}>상담 일지 작성</div>
              </div>
            )}

            {/* 🚧 [임시 주석 처리] 근로 및 마일리지 관리 사이드바 메뉴 전체 숨김 */}
            {/*
            <div className="ni" onClick={() => setIsJobMenuOpen(p => !p)}>
              근로 및 마일리지 관리 <SidebarArrow open={isJobMenuOpen} />
            </div>
            {isJobMenuOpen && (
              <div className="sub-menu">
                <div className="sub-ni" onClick={() => navigate('/professor/jobs')}>
                  교수 1차 승인 {pendingCount > 0 && <span className="nb">{pendingCount}</span>}
                </div>
              </div>
            )}
            */}
          </div>
        </div>

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
      </div>
    </>
  );
}