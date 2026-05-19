import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../../components/layout/TopBar.jsx';

export default function MyStudentList() {
  const navigate = useNavigate();

  // 대시보드와 통일감을 위한 사이드바 토글 상태 관리
  const [isStudentMenuOpen, setIsStudentMenuOpen] = useState(true); // 현재 페이지이므로 열어둠
  const [isAttendConsultOpen, setIsAttendConsultOpen] = useState(false);
  const [isJobMenuOpen, setIsJobMenuOpen] = useState(false);

  // 데이터 로딩 및 학생 데이터 관련 상태
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  
  // 필터 및 알림 배지 상태
  const [deptList, setDeptList] = useState([]);
  const [classList, setClassList] = useState([]);
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingCount, setPendingCount] = useState(0); 

  const token = localStorage.getItem('accessToken');
  const professorId = localStorage.getItem('userId') || 'PROF001';

  // 백엔드 API 데이터 패칭 연동
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        
        // 학생 목록 및 마일리지 승인대기 건수 동시 조회
        const [studentsRes, jobsRes] = await Promise.all([
          fetch(`/api/v1/advisors/professor/${professorId}`, { headers }).then(res => res.json()),
          fetch('/api/v1/jobs/pending', { headers }).then(res => res.json())
        ]);

        const studentData = studentsRes.data || [];
        setStudents(studentData);
        setFilteredStudents(studentData);

        // 고유 학과 및 반 추출
        const uDepts = [...new Set(studentData.map(s => s.deptName).filter(Boolean))];
        const uClasses = [...new Set(studentData.map(s => s.className).filter(Boolean))];
        setDeptList(uDepts);
        setClassList(uClasses);

        // 내 담당 학생의 근로 승인 대기 건수 필터링 후 사이드바 배지 개수 세팅
        const myPendingJobs = (jobsRes.data || []).filter(j => 
          studentData.some(s => s.studentId === j.studentId)
        );
        setPendingCount(myPendingJobs.length);

      } catch (error) {
        console.error('데이터 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [professorId, token]);

  // 프론트엔드 실시간 필터링 로직
  useEffect(() => {
    let result = [...students];
    if (selectedDept !== 'all') result = result.filter(s => s.deptName === selectedDept);
    if (selectedClass !== 'all') result = result.filter(s => s.className === selectedClass);
    if (searchTerm.trim() !== '') {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(s => 
        (s.studentName && s.studentName.toLowerCase().includes(lowerSearch)) || 
        (s.studentId && s.studentId.toLowerCase().includes(lowerSearch))
      );
    }
    setFilteredStudents(result);
  }, [selectedDept, selectedClass, searchTerm, students]);

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#1A3A5C', fontWeight: 'bold' }}>로딩 중...</div>;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        
        .prof-wrap { display: flex; min-height: 100vh; background: #F0F2F7; font-family: 'DM Sans','Noto Sans KR',sans-serif; font-size: 14px; color: #111827; width: 100%; }
        .sidebar { width: 230px; min-height: 100vh; background: #1A3A5C; display: flex; flex-direction: column; flex-shrink: 0; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
        .sb-logo { display: flex; align-items: center; gap: 10px; padding: 22px 18px 18px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 8px; cursor: pointer; }
        .logo-icon { width: 32px; height: 32px; background: #3B82F6; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .logo-text { font-size: 12.5px; font-weight: 700; color: #fff; line-height: 1.3; }
        .logo-text span { block; font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.45); }
        .sb-sec { padding: 6px 10px 2px; margin-bottom: 8px; }
        .sb-lbl { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.3); letter-spacing: 1px; text-transform: uppercase; padding: 0 8px; margin-bottom: 5px; }
        
        .ni { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 8px; color: rgba(255,255,255,0.6); font-size: 12.5px; cursor: pointer; transition: all 0.15s; margin-bottom: 2px; user-select: none; }
        .ni:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .ni-icon { width: 15px; height: 15px; flex-shrink: 0; opacity: 0.7; }
        .arrow-icon { margin-left: auto; width: 12px; height: 12px; transition: transform 0.2s; opacity: 0.5; }
        .arrow-icon.open { transform: rotate(90deg); opacity: 0.9; }

        .sub-menu { display: flex; flex-direction: column; padding-left: 24px; margin-top: 2px; margin-bottom: 6px; gap: 2px; }
        .sub-ni { font-size: 12px; color: rgba(255,255,255,0.55); padding: 6px 10px; cursor: pointer; border-radius: 6px; transition: all 0.15s; display: flex; align-items: center; justify-content: space-between; }
        .sub-ni:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.9); }
        .sub-ni.active { color: #3B82F6; font-weight: 600; }
        
        .nb { margin-left: auto; background: #EF4444; color: #fff; font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 20px; }
        
        .main { flex: 1; display: flex; flex-direction: column; min-width: 0; height: 100vh; overflow: hidden; }
        .container { flex: 1; padding: 22px 24px; overflow-y: auto; }
        
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .page-title { font-size: 20px; font-weight: 700; color: #1A3A5C; }
        .student-count { font-size: 13px; color: #6B7280; }
        .student-count span { color: #2563EB; font-weight: 700; }
        
        .filter-card { background: #fff; border-radius: 12px; border: 1px solid #F3F4F6; padding: 16px 20px; margin-bottom: 20px; display: flex; gap: 12px; align-items: center; }
        .filter-group { display: flex; flex-direction: column; gap: 6px; }
        .filter-label { font-size: 11px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; }
        .filter-select { height: 38px; min-width: 160px; border: 1px solid #E5E7EB; border-radius: 8px; padding: 0 12px; font-size: 13px; background: #fff; outline: none;}
        .search-input { height: 38px; min-width: 240px; border: 1px solid #E5E7EB; border-radius: 8px; padding: 0 12px; font-size: 13px; outline: none; }
        
        .table-card { background: #fff; border-radius: 12px; border: 1px solid #F3F4F6; overflow: hidden; }
        .student-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
        .student-table th { background: #F9FAFB; padding: 14px 18px; font-weight: 600; color: #4B5563; border-bottom: 1px solid #E5E7EB; }
        .student-table td { padding: 14px 18px; border-bottom: 1px solid #F3F4F6; color: #111827; }
        .student-table tr:hover td { background: #FAFAFA; }
        .sid { font-family: 'DM Sans', sans-serif; color: #6B7280; }
        .sname { font-weight: 500; }
        .badge-visa { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11.5px; font-weight: 600; background: #EFF6FF; color: #1D4ED8; }
        .btn-detail { padding: 6px 12px; background: #1A3A5C; color: #fff; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 500; }
        .btn-detail:hover { background: #2563EB; }
        .no-data { padding: 50px; text-align: center; color: #9CA3AF; }
      `}</style>

      <div className="prof-wrap">
        {/* 1. 고정 내장 사이드바 */}
        <div className="sidebar">
          <div className="sb-logo" onClick={() => navigate('/professor/dashboard')}>
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" width="16" height="16">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="logo-text">KMGC <span>경민대학교 국제교육원</span></div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">메인</div>
            <div className="ni" onClick={() => navigate('/professor/dashboard')}>
              <svg className="ni-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
              교수 대시보드
            </div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">업무 메뉴</div>
            
            <div className="ni" onClick={() => setIsStudentMenuOpen(!isStudentMenuOpen)}>
              <span>지도학생 관리</span>
              <svg className={`arrow-icon ${isStudentMenuOpen ? 'open' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            {isStudentMenuOpen && (
              <div className="sub-menu">
                <div className="sub-ni active" onClick={() => navigate('/professor/students')}>담당 학생 목록</div>
                <div className="sub-ni" onClick={() => navigate('/professor/students/detail')}>학생 상세 조회</div>
              </div>
            )}

            <div className="ni" onClick={() => setIsAttendConsultOpen(!isAttendConsultOpen)}>
              <span>출결 및 상담 관리</span>
              <svg className={`arrow-icon ${isAttendConsultOpen ? 'open' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            {isAttendConsultOpen && (
              <div className="sub-menu">
                <div className="sub-ni" onClick={() => navigate('/professor/attendance')}>출결 입력</div>
                <div className="sub-ni" onClick={() => navigate('/professor/consult')}>상담 목록</div>
                <div className="sub-ni" onClick={() => navigate('/professor/consult/write')}>상담 일지 작성</div>
              </div>
            )}

            <div className="ni" onClick={() => setIsJobMenuOpen(!isJobMenuOpen)}>
              <span>근로 및 마일리지 관리</span>
              <svg className={`arrow-icon ${isJobMenuOpen ? 'open' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            {isJobMenuOpen && (
              <div className="sub-menu">
                <div className="sub-ni" onClick={() => navigate('/professor/jobs')}>
                  교수 1차 승인 
                  {pendingCount > 0 && <span className="nb">{pendingCount}</span>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. 우측 콘텐츠 본문 영역 */}
        <div className="main">
          <TopBar title="담당 학생 조회" />
          <div className="container">
            <div className="page-header">
              <div className="page-title">담당 학생 목록</div>
              <div className="student-count">검색 결과: <span>{filteredStudents.length}</span> / {students.length} 명</div>
            </div>

            <div className="filter-card">
              <div className="filter-group">
                <label className="filter-label">학과 필터</label>
                <select className="filter-select" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                  <option value="all">전체 학과</option>
                  {deptList.map((d, i) => <option key={i} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">반 필터</label>
                <select className="filter-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                  <option value="all">전체 반</option>
                  {classList.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="filter-group" style={{ marginLeft: 'auto' }}>
                <label className="filter-label">학생 검색</label>
                <input type="text" className="search-input" placeholder="이름 또는 학번 입력" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
              </div>
            </div>

            <div className="table-card">
              {filteredStudents.length > 0 ? (
                <table className="student-table">
                  <thead>
                    <tr>
                      <th>학번</th>
                      <th>이름</th>
                      <th>소속 학과</th>
                      <th>분반</th>
                      <th>학년</th>
                      <th>비자 상태</th>
                      <th style={{ textAlign: 'right' }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr key={s.studentId}>
                        <td className="sid">{s.studentId}</td>
                        <td className="sname">{s.studentName || '이름 없음'}</td>
                        <td>{s.deptName || '-'}</td>
                        <td>{s.className || '-'}</td>
                        <td>{s.grade ? `${s.grade}학년` : '-'}</td>
                        <td><span className="badge-visa">{s.visaStatus || 'D-2'}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn-detail" onClick={() => navigate(`/professor/students/detail?id=${s.studentId}`)}>상세 보기</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data">조건에 일치하는 담당 학생이 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}