import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../../components/layout/TopBar.jsx';

export default function ProfDashboard() {
  const navigate = useNavigate();

  // 상태 관리 (State)
  const [loading, setLoading] = useState(true);
  const [profInfo, setProfInfo] = useState({ name: '', email: '', dept: '' });
  const [stats, setStats] = useState({ totalStudents: 0, crisis: 0, warnings: 0, pendingJobs: 0 });
  
  const [crisisList, setCrisisList] = useState([]);
  const [absenceList, setAbsenceList] = useState([]);
  const [mileageList, setMileageList] = useState([]);

  // 사이드바 드롭다운 토글 상태 관리
  const [isStudentMenuOpen, setIsStudentMenuOpen] = useState(false);
  const [isAttendConsultOpen, setIsAttendConsultOpen] = useState(false);
  const [isJobMenuOpen, setIsJobMenuOpen] = useState(false);

  // 로컬 스토리지 권한 정보
  const token = localStorage.getItem('accessToken');
  const professorId = localStorage.getItem('userId') || 'PROF001'; 

  // 데이터 페칭 (Data Fetching)
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const [
          profRes,
          studentsRes,
          warningsRes,
          jobsRes
        ] = await Promise.all([
          fetch(`/api/v1/professors/${professorId}`, { headers }).then(res => res.json()),
          fetch(`/api/v1/advisors/professor/${professorId}`, { headers }).then(res => res.json()),
          fetch('/api/v1/attend/warnings', { headers }).then(res => res.json()),
          fetch('/api/v1/jobs/pending', { headers }).then(res => res.json())
        ]);

        setProfInfo({
          name: profRes.data?.name || '홍길동',
          email: profRes.data?.email || 'hong@kyungmin.ac.kr',
          dept: profRes.data?.deptName || '컴퓨터공학과'
        });

        const assignedStudents = studentsRes.data || [];
        const myWarnings = (warningsRes.data || []).filter(w => 
          assignedStudents.some(s => s.studentId === w.studentId)
        );
        const myPendingJobs = (jobsRes.data || []).filter(j => 
          assignedStudents.some(s => s.studentId === j.studentId)
        );

        setStats({
          totalStudents: assignedStudents.length,
          crisis: 2, 
          warnings: myWarnings.length,
          pendingJobs: myPendingJobs.length,
        });

        setAbsenceList(myWarnings.map(w => ({
          id: w.studentId,
          name: w.studentName,
          course: w.courseName,
          count: w.absentCount,
          level: w.warningLevel === '위험' ? 'danger' : 'warn'
        })));

        setMileageList(myPendingJobs.map(j => ({
          id: j.jobId,
          name: j.studentName,
          job: j.companyName,
          date: j.createdAt,
          note: j.workHours > 25 ? '허용 한도(25시간) 초과 — 검토 필요' : '합법 범위 이내',
          warn: j.workHours > 25
        })));

        setCrisisList([
          { name: 'Wang Xiaoming', date: '2026.05.15', keywords: '초과근로 및 경제적어려움', level: 'crisis' },
          { name: 'Tran Thi Lan', date: '2026.05.10', keywords: '심리적불안 및 학업포기', level: 'crisis' },
        ]);

      } catch (error) {
        console.error('대시보드 데이터를 불러오는 중 오류가 발생했습니다:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchDashboardData();
  }, [professorId, token]);

  // 근로 승인/반려 핸들러
  const handleJobApproval = async (jobId, isApproved) => {
    try {
      const bodyData = isApproved 
        ? { approved: true } 
        : { approved: false, reason: '지도교수 면담 요망 및 조건 미충족' };

      const response = await fetch(`/api/v1/jobs/${jobId}/approval`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      });

      if (response.ok) {
        alert(`성공적으로 ${isApproved ? '승인' : '반려'} 처리되었습니다.`);
        setMileageList(prev => prev.filter(job => job.id !== jobId));
        setStats(prev => ({ ...prev, pendingJobs: prev.pendingJobs - 1 }));
      } else {
        alert('처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('승인/반려 처리 오류:', error);
    }
  };

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center', color: '#1A3A5C', fontWeight: 'bold' }}>데이터를 불러오는 중입니다...</div>;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        
        .prof-wrap { display: flex; min-height: 100vh; background: #F0F2F7; font-family: 'DM Sans','Noto Sans KR',sans-serif; font-size: 14px; color: #111827; }
        .sidebar { width: 230px; min-height: 100vh; background: #1A3A5C; display: flex; flex-direction: column; flex-shrink: 0; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
        .sb-logo { display: flex; align-items: center; gap: 10px; padding: 22px 18px 18px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 8px; }
        .logo-icon { width: 32px; height: 32px; background: #3B82F6; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .logo-text { font-size: 12.5px; font-weight: 700; color: #fff; line-height: 1.3; }
        .logo-text span { display: block; font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.45); }
        .sb-sec { padding: 6px 10px 2px; margin-bottom: 8px; }
        .sb-lbl { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.3); letter-spacing: 1px; text-transform: uppercase; padding: 0 8px; margin-bottom: 5px; }
        
        .ni { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 8px; color: rgba(255,255,255,0.6); font-size: 12.5px; cursor: pointer; transition: all 0.15s; margin-bottom: 2px; user-select: none; }
        .ni:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .ni.active { background: #3B82F6; color: #fff; font-weight: 500; }
        .ni-icon { width: 15px; height: 15px; flex-shrink: 0; opacity: 0.7; }
        .ni.active .ni-icon { opacity: 1; }
        .arrow-icon { margin-left: auto; width: 12px; height: 12px; transition: transform 0.2s; opacity: 0.5; }
        .arrow-icon.open { transform: rotate(90deg); opacity: 0.9; }

        .sub-menu { display: flex; flex-direction: column; padding-left: 24px; margin-top: 2px; margin-bottom: 6px; gap: 2px; }
        .sub-ni { font-size: 12px; color: rgba(255,255,255,0.55); padding: 6px 10px; cursor: pointer; border-radius: 6px; transition: all 0.15s; display: flex; align-items: center; justify-content: space-between; }
        .sub-ni:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.9); }
        
        .nb { margin-left: auto; background: #EF4444; color: #fff; font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 20px; }
        
        .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .content { flex: 1; padding: 22px 24px; overflow-y: auto; }
        .prof-banner { background: linear-gradient(135deg,#1A3A5C,#2563EB); border-radius: 14px; padding: 22px 26px; margin-bottom: 18px; display: flex; align-items: center; gap: 20px; }
        .prof-av { width: 54px; height: 54px; border-radius: 12px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .prof-info { flex: 1; }
        .prof-name { font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 3px; }
        .prof-sub { font-size: 12.5px; color: rgba(255,255,255,0.65); }
        .prof-stats { display: flex; gap: 16px; }
        .pst { text-align: center; background: rgba(255,255,255,0.12); border-radius: 10px; padding: 8px 14px; }
        .pst-val { font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
        .pst-lbl { font-size: 10.5px; color: rgba(255,255,255,0.6); margin-top: 2px; }
        
        .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 18px; }
        .sc { background: #fff; border-radius: 12px; padding: 16px 18px; border: 1px solid #F3F4F6; }
        .sc-lbl { font-size: 11.5px; color: #9CA3AF; font-weight: 500; margin-bottom: 8px; display: flex; align-items: center; gap: 5px; }
        .sc-dot { width: 6px; height: 6px; border-radius: 50%; }
        .sc-val { font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.5px; line-height: 1; }
        .sc-val span { font-size: 13px; font-weight: 400; color: #9CA3AF; }
        
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
        .card { background: #fff; border-radius: 12px; border: 1px solid #F3F4F6; overflow: hidden; margin-bottom: 14px; }
        .ch { padding: 14px 18px; border-bottom: 1px solid #F3F4F6; display: flex; align-items: center; justify-content: space-between; }
        .ct { font-size: 13px; font-weight: 700; color: #111827; }
        .cbadge { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px; }
        .b-red { background: #FEF2F2; color: #DC2626; }
        .b-amber { background: #FFFBEB; color: #D97706; }
        .b-purple { background: #F5F3FF; color: #7C3AED; }
        
        .li { display: flex; align-items: center; padding: 11px 18px; border-bottom: 1px solid #F9FAFB; gap: 10px; cursor: pointer; transition: background 0.1s; }
        .li:last-child { border-bottom: none; }
        .li:hover { background: #FAFAFA; }
        .lav { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
        .linf { flex: 1; min-width: 0; }
        .lname { font-size: 12.5px; font-weight: 500; color: #111827; }
        .lsub { font-size: 11px; color: #9CA3AF; margin-top: 1px; }
        .lright { text-align: right; flex-shrink: 0; }
        .chip-sm { font-size: 10.5px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }
        
        .approve-btn { padding: 4px 10px; background: #1A3A5C; color: #fff; border: none; border-radius: 6px; font-size: 11px; cursor: pointer; font-family: inherit; transition: opacity 0.2s; }
        .approve-btn:hover { opacity: 0.9; }
        .reject-btn { padding: 4px 10px; background: #F3F4F6; color: #6B7280; border: none; border-radius: 6px; font-size: 11px; cursor: pointer; font-family: inherit; transition: opacity 0.2s; }
        .reject-btn:hover { opacity: 0.8; }
        .reject-btn.danger { background: #FEF2F2; color: #DC2626; }
      `}</style>

      <div className="prof-wrap">
        {/* 사이드바 영역 */}
        <div className="sidebar">
          <div className="sb-logo" onClick={() => navigate('/professor/dashboard')} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" width="16" height="16">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="logo-text">KMGC <span>경민대학교 국제교육원</span></div>
          </div>

          {/* 메인 섹션 */}
          <div className="sb-sec">
            <div className="sb-lbl">메인</div>
            <div className="ni active" onClick={() => navigate('/professor/dashboard')}>
              <svg className="ni-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
              교수 대시보드
            </div>
          </div>

          {/* 지도 학생 관리 섹션 */}
          <div className="sb-sec">
            <div className="sb-lbl">업무 메뉴</div>
            
            {/* 1. 지도학생 관리 드롭박스 */}
            <div className="ni" onClick={() => setIsStudentMenuOpen(!isStudentMenuOpen)}>
              <span>지도학생 관리</span>
              <svg className={`arrow-icon ${isStudentMenuOpen ? 'open' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            {isStudentMenuOpen && (
              <div className="sub-menu">
                <div className="sub-ni" onClick={() => navigate('/professor/students')}>담당 학생 목록</div>
                <div className="sub-ni" onClick={() => navigate('/professor/students/detail')}>학생 상세 조회</div>
              </div>
            )}

            {/* 2. 출결 및 상담 관리 드롭박스 */}
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

            {/* 3. 근로 및 마일리지 관리 드롭박스 */}
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
                  {stats.pendingJobs > 0 && <span className="nb">{stats.pendingJobs}</span>}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="main">
          <TopBar title="교수 대시보드" />

          <div className="content">
            {/* 프로필 대시보드 상단 배너 */}
            <div className="prof-banner">
              <div className="prof-av">{profInfo.name.charAt(0)}</div>
              <div className="prof-info">
                <div className="prof-name">{profInfo.name} 교수</div>
                <div className="prof-sub">{profInfo.dept} · 지도교수 · {profInfo.email}</div>
              </div>
              <div className="prof-stats">
                <div className="pst" onClick={() => navigate('/professor/students')} style={{ cursor: 'pointer' }}><div className="pst-val">{stats.totalStudents}</div><div className="pst-lbl">담당 학생</div></div>
                <div className="pst" onClick={() => navigate('/professor/consult')} style={{ cursor: 'pointer' }}><div className="pst-val">{stats.crisis}</div><div className="pst-lbl">위기 징후</div></div>
                <div className="pst" onClick={() => navigate('/professor/attendance')} style={{ cursor: 'pointer' }}><div className="pst-val">{stats.warnings}</div><div className="pst-lbl">출결 위험</div></div>
                <div className="pst" onClick={() => navigate('/professor/jobs')} style={{ cursor: 'pointer' }}><div className="pst-val">{stats.pendingJobs}</div><div className="pst-lbl">승인 대기</div></div>
              </div>
            </div>

            {/* 통계 요약 카드 현황 */}
            <div className="stats-row">
              <div className="sc" onClick={() => navigate('/professor/students')} style={{ cursor: 'pointer' }}>
                <div className="sc-lbl"><div className="sc-dot" style={{ background: '#3B82F6' }} />담당 학생 수</div>
                <div className="sc-val">{stats.totalStudents} <span>명</span></div>
              </div>
              <div className="sc" onClick={() => navigate('/professor/consult')} style={{ cursor: 'pointer' }}>
                <div className="sc-lbl"><div className="sc-dot" style={{ background: '#EF4444' }} />위기 징후 학생</div>
                <div className="sc-val">{stats.crisis} <span>명</span></div>
              </div>
              <div className="sc" onClick={() => navigate('/professor/attendance')} style={{ cursor: 'pointer' }}>
                <div className="sc-lbl"><div className="sc-dot" style={{ background: '#F59E0B' }} />출결 위험군</div>
                <div className="sc-val">{stats.warnings} <span>명</span></div>
              </div>
              <div className="sc" onClick={() => navigate('/professor/jobs')} style={{ cursor: 'pointer' }}>
                <div className="sc-lbl"><div className="sc-dot" style={{ background: '#8B5CF6' }} />마일리지 승인 대기</div>
                <div className="sc-val">{stats.pendingJobs} <span>건</span></div>
              </div>
            </div>

            <div className="grid2">
              {/* 위기 징후 리스트 */}
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="ch"><div className="ct">위기 징후 학생</div><div className="cbadge b-red">{stats.crisis}명</div></div>
                {crisisList.map((s, idx) => (
                  <div key={idx} className="li" onClick={() => navigate('/professor/consult')}>
                    <div className="lav" style={{ background: '#FEE2E2', color: '#DC2626' }}>{s.name[0]}</div>
                    <div className="linf">
                      <div className="lname">{s.name}</div>
                      <div className="lsub">{s.date} 상담 · {s.keywords}</div>
                    </div>
                    <div className="lright"><div className="chip-sm b-red">위기</div></div>
                  </div>
                ))}
              </div>

              {/* 출결 위험군 리스트 */}
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="ch"><div className="ct">출결 위험군</div><div className="cbadge b-amber">{stats.warnings}명</div></div>
                {absenceList.length > 0 ? absenceList.map((s, idx) => (
                  <div key={idx} className="li" onClick={() => navigate('/professor/attendance')}>
                    <div className="lav" style={s.level === 'danger' ? { background: '#FEE2E2', color: '#DC2626' } : { background: '#FFFBEB', color: '#D97706' }}>{s.name[0]}</div>
                    <div className="linf">
                      <div className="lname">{s.name}</div>
                      <div className="lsub">{s.course} · 결석 {s.count}회</div>
                    </div>
                    <div className="lright"><div className={`chip-sm ${s.level === 'danger' ? 'b-red' : 'b-amber'}`}>{s.level === 'danger' ? '위험' : '주의'}</div></div>
                  </div>
                )) : <div className="li"><div className="lsub">출결 위험군 학생이 없습니다.</div></div>}
              </div>
            </div>

            {/* 마일리지/근로 교수 1차 승인 내역 */}
            <div className="card">
              <div className="ch"><div className="ct">마일리지 승인 대기 내역 (교수 1차 승인)</div><div className="cbadge b-purple">{stats.pendingJobs}건</div></div>
              {mileageList.length > 0 ? mileageList.map((m) => (
                <div key={m.id} className="li">
                  <div className="lav" style={m.warn ? { background: '#FEF3C7', color: '#D97706' } : { background: '#EDE9FE', color: '#7C3AED' }} onClick={() => navigate('/professor/jobs')}>{m.name[0]}</div>
                  <div className="linf" onClick={() => navigate('/professor/jobs')}>
                    <div className="lname">{m.name} · {m.job}</div>
                    <div className="lsub" style={m.warn ? { color: '#D97706' } : {}}>{new Date(m.date).toLocaleDateString()} 신청 · {m.note}</div>
                  </div>
                  <div className="lright">
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="approve-btn" onClick={() => handleJobApproval(m.id, true)}>승인</button>
                      <button className={`reject-btn ${m.warn ? 'danger' : ''}`} onClick={() => handleJobApproval(m.id, false)}>반려</button>
                    </div>
                  </div>
                </div>
              )) : <div className="li"><div className="lsub">승인 대기 중인 내역이 없습니다.</div></div>}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}