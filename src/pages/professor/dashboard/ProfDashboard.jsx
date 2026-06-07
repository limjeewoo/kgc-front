import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../../components/layout/TopBar.jsx';

export default function ProfDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profInfo, setProfInfo] = useState({ name: '', email: '', dept: '' });
  const [stats, setStats] = useState({ totalStudents: 0, crisis: 0, warnings: 0, pendingJobs: 0 });
  const [crisisList, setCrisisList] = useState([]);
  const [absenceList, setAbsenceList] = useState([]);
  const [mileageList, setMileageList] = useState([]);

  const token = localStorage.getItem('accessToken');
  const professorId = localStorage.getItem('userId');

  useEffect(() => {
    if (!token || !professorId) {
      console.warn('인증 정보가 없어 로그인 페이지로 이동합니다.');
      navigate('/login');
      return; 
    }

    setLoading(true);
    Promise.all([
      fetch(`http://localhost:8080/api/v1/professors/${professorId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`http://localhost:8080/api/v1/advisors/professor/${professorId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('http://localhost:8080/api/v1/attend/warnings', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      // 🚧 [임시 주석 처리] 1차 승인 기능 개발 시 아래 주석 해제 및 Promise.resolve 삭제
      // fetch('http://localhost:8080/api/v1/jobs/pending', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      Promise.resolve({ data: [] }), // 403 에러 방지를 위해 임시로 빈 데이터 반환
    ]).then(([profRes, studentsRes, warningsRes, jobsRes]) => {
      setProfInfo({
        name: profRes.data?.name || '정보 없음',
        email: profRes.data?.email || '정보 없음',
        dept: profRes.data?.deptName || '정보 없음',
      });

      const assigned = studentsRes.data || [];
      const myWarnings = (warningsRes.data || []).filter(w => assigned.some(s => s.studentId === w.studentId));
      const myPending = (jobsRes.data || []).filter(j => assigned.some(s => s.studentId === j.studentId));

      setStats({ totalStudents: assigned.length, crisis: 2, warnings: myWarnings.length, pendingJobs: myPending.length });

      setAbsenceList(myWarnings.map(w => ({
        id: w.studentId, name: w.studentName, course: w.courseName,
        count: w.absentCount, level: w.warningLevel === '위험' ? 'danger' : 'warn',
      })));

      setMileageList(myPending.map(j => ({
        id: j.jobId, studentId: j.studentId, name: j.studentName,
        job: j.companyName, date: j.createdAt,
        note: j.workHours > 25 ? '허용 한도(25시간) 초과 — 검토 필요' : '합법 범위 이내',
        warn: j.workHours > 25,
      })));

      setCrisisList([
        { studentId: 'STU991', name: 'Wang Xiaoming', date: '2026.05.15', keywords: '초과근로 및 경제적어려움' },
        { studentId: 'STU992', name: 'Tran Thi Lan', date: '2026.05.10', keywords: '심리적불안 및 학업포기' },
      ]);
    }).catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [professorId, token, navigate]);

  const handleJobApproval = async (jobId, isApproved) => {
    alert("현재 개발 중인 기능입니다.");
  };

  const goToDetail = (studentId) => {
    if (!studentId) return;
    navigate(`/professor/students/${studentId}`);
  };

  // 🎯 [방어 로직] 인증 정보가 없으면 화면을 그리지 않고 대기 (에러 방지)
  if (!token || !professorId) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F0F2F7' }}>
      <div style={{ textAlign: 'center', color: '#1A3A5C', fontSize: 14 }}>인증 정보를 확인 중입니다...</div>
    </div>
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F0F2F7' }}>
      <div style={{ textAlign: 'center', color: '#1A3A5C', fontSize: 14 }}>데이터를 불러오는 중...</div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        .content { flex:1; padding:22px 24px; overflow-y:auto; animation:fadeUp .28s ease; }

        .prof-banner { background:linear-gradient(135deg,#1A3A5C,#2563EB); border-radius:14px; padding:22px 26px; margin-bottom:18px; display:flex; align-items:center; gap:20px; }
        .prof-av { width:54px; height:54px; border-radius:12px; background:rgba(255,255,255,.2); display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:700; color:#fff; flex-shrink:0; }
        .prof-name { font-size:17px; font-weight:700; color:#fff; margin-bottom:3px; }
        .prof-sub { font-size:12.5px; color:rgba(255,255,255,.65); }
        .prof-stats { display:flex; gap:16px; margin-left:auto; }
        .pst { text-align:center; background:rgba(255,255,255,.12); border-radius:10px; padding:8px 14px; cursor:pointer; transition:background .15s; }
        .pst:hover { background:rgba(255,255,255,.2); }
        .pst-val { font-size:18px; font-weight:700; color:#fff; }
        .pst-lbl { font-size:10.5px; color:rgba(255,255,255,.6); margin-top:2px; }

        .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px; }
        .sc { background:#fff; border-radius:12px; padding:16px 18px; border:1px solid #F3F4F6; cursor:pointer; transition:all .2s; }
        .sc:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.07); }
        .sc-lbl { font-size:11.5px; color:#9CA3AF; font-weight:500; margin-bottom:8px; display:flex; align-items:center; gap:5px; }
        .sc-dot { width:6px; height:6px; border-radius:50%; }
        .sc-val { font-size:24px; font-weight:700; color:#111827; line-height:1; }
        .sc-val span { font-size:13px; font-weight:400; color:#9CA3AF; }

        .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; }
        .card { background:#fff; border-radius:12px; border:1px solid #F3F4F6; overflow:hidden; margin-bottom:14px; }
        .ch { padding:14px 18px; border-bottom:1px solid #F3F4F6; display:flex; align-items:center; justify-content:space-between; }
        .ct { font-size:13px; font-weight:700; color:#111827; }
        .cbadge { font-size:11px; font-weight:600; padding:3px 9px; border-radius:20px; }
        .b-red { background:#FEF2F2; color:#DC2626; }
        .b-amber { background:#FFFBEB; color:#D97706; }
        .b-purple { background:#F5F3FF; color:#7C3AED; }

        .li { display:flex; align-items:center; padding:11px 18px; border-bottom:1px solid #F9FAFB; gap:10px; transition:background .1s; }
        .li:last-child { border-bottom:none; }
        .li:hover { background:#FAFAFA; }
        .li-clickable { cursor:pointer; }
        .lav { width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; }
        .linf { flex:1; min-width:0; cursor:pointer; }
        .lname { font-size:12.5px; font-weight:500; color:#111827; }
        .lsub { font-size:11px; color:#9CA3AF; margin-top:1px; }
        .chip-sm { font-size:10.5px; font-weight:600; padding:2px 8px; border-radius:10px; }
      `}</style>

      <TopBar title="교수 대시보드" />
      
      <div className="content">
        <div className="prof-banner">
          <div className="prof-av">{profInfo.name ? profInfo.name.charAt(0) : '?'}</div>
          <div>
            <div className="prof-name">{profInfo.name} 교수</div>
            <div className="prof-sub">{profInfo.dept} · 지도교수 · {profInfo.email}</div>
          </div>
          <div className="prof-stats">
            {[
              { val: stats.totalStudents, lbl: '담당 학생', path: '/professor/students' },
              { val: stats.crisis, lbl: '위기 징후', path: '/professor/consult' },
              { val: stats.warnings, lbl: '출결 위험', path: '/professor/attendance' },
              { val: stats.pendingJobs, lbl: '승인 대기', path: '/professor/jobs' },
            ].map(({ val, lbl, path }) => (
              <div key={lbl} className="pst" onClick={() => navigate(path)}>
                <div className="pst-val">{val}</div>
                <div className="pst-lbl">{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-row">
          {[
            { dot: '#3B82F6', lbl: '담당 학생 수', val: stats.totalStudents, unit: '명', path: '/professor/students' },
            { dot: '#EF4444', lbl: '위기 징후 학생', val: stats.crisis, unit: '명', path: '/professor/consult' },
            { dot: '#F59E0B', lbl: '출결 위험군', val: stats.warnings, unit: '명', path: '/professor/attendance' },
            { dot: '#8B5CF6', lbl: '마일리지 승인 대기', val: stats.pendingJobs, unit: '건', path: '/professor/jobs' },
          ].map(({ dot, lbl, val, unit, path }) => (
            <div key={lbl} className="sc" onClick={() => navigate(path)}>
              <div className="sc-lbl"><div className="sc-dot" style={{ background: dot }} />{lbl}</div>
              <div className="sc-val">{val} <span>{unit}</span></div>
            </div>
          ))}
        </div>

        <div className="grid2">
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="ch"><div className="ct">위기 징후 학생</div><div className="cbadge b-red">{stats.crisis}명</div></div>
            {crisisList.map((s, i) => (
              <div key={i} className="li li-clickable" onClick={() => goToDetail(s.studentId)}>
                <div className="lav" style={{ background: '#FEE2E2', color: '#DC2626' }}>{s.name[0]}</div>
                <div className="linf">
                  <div className="lname">{s.name}</div>
                  <div className="lsub">{s.date} 상담 · {s.keywords}</div>
                </div>
                <span className="chip-sm b-red">위기</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginBottom: 0 }}>
            <div className="ch"><div className="ct">출결 위험군</div><div className="cbadge b-amber">{stats.warnings}명</div></div>
            {absenceList.length === 0
              ? <div className="li"><div className="lsub">출결 위험군 학생이 없습니다.</div></div>
              : absenceList.map((s, i) => (
                <div key={i} className="li li-clickable" onClick={() => goToDetail(s.id)}>
                  <div className="lav" style={s.level === 'danger' ? { background: '#FEE2E2', color: '#DC2626' } : { background: '#FFFBEB', color: '#D97706' }}>{s.name[0]}</div>
                  <div className="linf">
                    <div className="lname">{s.name}</div>
                    <div className="lsub">{s.course} · 결석 {s.count}회</div>
                  </div>
                  <span className={`chip-sm ${s.level === 'danger' ? 'b-red' : 'b-amber'}`}>{s.level === 'danger' ? '위험' : '주의'}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}