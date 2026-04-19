import React, { useState, useEffect, useCallback } from 'react';

const DUMMY_COURSE_DATA = {
  'CS-JAVA-01': {
    courseId: 'CS-JAVA-01', courseName: 'Java기초', credits: 3,
    isOnline: false, courseType: '전공필수',
    professor: { name: '홍길동', email: 'hong@kmgc.ac.kr', phone: '010-1111-2222' },
    students: [
      { studentId: '25071001', korName: '응우옌반안',   nationality: '베트남',       weeklyAttend: [1,1,2,1,1,3,1,2,1,1,2,1,1,null,null], totalAttend:10, totalAbsent:3, totalLate:2 },
      { studentId: '25071002', korName: '천샤오민',     nationality: '중국',         weeklyAttend: [1,1,1,1,1,1,1,1,1,1,1,1,1,null,null], totalAttend:13, totalAbsent:0, totalLate:0 },
      { studentId: '25071005', korName: '아마라쿠마르', nationality: '인도',         weeklyAttend: [1,1,1,2,1,1,1,3,1,1,1,1,1,null,null], totalAttend:11, totalAbsent:1, totalLate:1 },
      { studentId: '25071006', korName: '호앙민',       nationality: '베트남',       weeklyAttend: [1,2,1,2,1,2,1,2,1,2,1,2,1,null,null], totalAttend:7,  totalAbsent:6, totalLate:0 },
      { studentId: '25071008', korName: '왕레이',       nationality: '중국',         weeklyAttend: [1,1,1,1,1,1,1,1,1,1,1,1,1,null,null], totalAttend:13, totalAbsent:0, totalLate:0 },
    ],
  },
  'CS-DB-01': {
    courseId: 'CS-DB-01', courseName: '데이터베이스', credits: 3,
    isOnline: false, courseType: '전공필수',
    professor: { name: '김영희', email: 'kim@kmgc.ac.kr', phone: '010-3333-4444' },
    students: [
      { studentId: '25071003', korName: '이반페트로프', nationality: '러시아',        weeklyAttend: [1,1,1,1,1,1,2,1,3,1,1,1,1,null,null], totalAttend:11, totalAbsent:1, totalLate:1 },
      { studentId: '25071004', korName: '파티마알리',   nationality: '우즈베키스탄',  weeklyAttend: [2,1,2,1,2,1,2,1,2,1,2,1,2,null,null], totalAttend:6,  totalAbsent:7, totalLate:0 },
      { studentId: '25071010', korName: '카마로프',     nationality: '우즈베키스탄',  weeklyAttend: [1,1,1,1,1,1,1,1,3,1,1,1,1,null,null], totalAttend:12, totalAbsent:0, totalLate:1 },
    ],
  },
  'CS-WEB-01': {
    courseId: 'CS-WEB-01', courseName: '웹프로그래밍', credits: 2,
    isOnline: true, courseType: '전공선택',
    professor: null,
    students: [
      { studentId: '25071001', korName: '응우옌반안', nationality: '베트남', weeklyAttend: [1,1,1,1,3,1,1,2,1,1,1,1,1,null,null], totalAttend:11, totalAbsent:1, totalLate:1 },
      { studentId: '25071009', korName: '린다오',     nationality: '중국',   weeklyAttend: [1,1,1,1,1,1,1,3,1,1,1,1,1,null,null], totalAttend:12, totalAbsent:0, totalLate:1 },
    ],
  },
  'CS-AI-01': {
    courseId: 'CS-AI-01', courseName: '인공지능개론', credits: 3,
    isOnline: true, courseType: '전공선택',
    professor: { name: '홍길동', email: 'hong@kmgc.ac.kr', phone: '010-1111-2222' },
    students: [
      { studentId: '25071002', korName: '천샤오민', nationality: '중국', weeklyAttend: [1,1,1,1,1,1,1,1,1,1,1,1,1,null,null], totalAttend:13, totalAbsent:0, totalLate:0 },
      { studentId: '25071008', korName: '왕레이',   nationality: '중국', weeklyAttend: [1,1,2,1,1,1,1,1,1,1,1,1,1,null,null], totalAttend:12, totalAbsent:1, totalLate:0 },
    ],
  },
};

const DUMMY_CLASS_COURSES = {
  'CS01-A': [
    { courseId: 'CS-JAVA-01', courseName: 'Java기초',     isOnline: false },
    { courseId: 'CS-WEB-01',  courseName: '웹프로그래밍', isOnline: true  },
    { courseId: 'CS-AI-01',   courseName: '인공지능개론', isOnline: true  },
  ],
  'CS01-B': [
    { courseId: 'CS-DB-01',  courseName: '데이터베이스', isOnline: false },
    { courseId: 'CS-WEB-01', courseName: '웹프로그래밍', isOnline: true  },
  ],
  'CS01-C': [
    { courseId: 'CS-WEB-01', courseName: '웹프로그래밍', isOnline: true },
    { courseId: 'CS-AI-01',  courseName: '인공지능개론', isOnline: true },
  ],
};

const WEEK_LABELS = ['1주','2주','3주','4주','5주','6주','7주','8주','9주','10주','11주','12주','13주','14주','15주'];
const CURRENT_WEEK = 13;

const getStatusCell = (code) => {
  if (code === 1) return { label:'출', bg:'#EFF6FF', color:'#3B82F6' };
  if (code === 2) return { label:'결', bg:'#FEF2F2', color:'#EF4444' };
  if (code === 3) return { label:'지', bg:'#FFFBEB', color:'#D97706' };
  if (code === 4) return { label:'공', bg:'#F0FDF4', color:'#16A34A' };
  return { label:'-', bg:'#F9FAFB', color:'#D1D5DB' };
};

const getAttendRate = (s) => {
  const total = s.totalAbsent + s.totalLate + s.totalAttend;
  return total ? Math.round((s.totalAttend / total) * 100) : 0;
};

const getRateColor = (rate) => {
  if (rate < 70) return '#EF4444';
  if (rate < 80) return '#D97706';
  return '#16A34A';
};

const calcWeeklyAbsents = (students) =>
  WEEK_LABELS.map((_, wi) => students.filter(s => s.weeklyAttend[wi] === 2).length);

export default function SearchByCourse({ deptId, classSec, onBack }) {
  const classKey        = `${deptId}-${classSec}`;
  const availableCourses = DUMMY_CLASS_COURSES[classKey] || [];

  const [selectedCourseId, setSelectedCourseId] = useState(availableCourses[0]?.courseId || '');
  const [courseData, setCourseData]   = useState(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [quickFilter, setQuickFilter] = useState(false);

  const fetchCourse = useCallback(() => {
    if (!selectedCourseId) return;
    setIsLoading(true);
    setTimeout(() => {
      setCourseData(DUMMY_COURSE_DATA[selectedCourseId] || null);
      setIsLoading(false);
    }, 250);
  }, [selectedCourseId]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  const students      = courseData?.students || [];
  const displayed     = quickFilter ? students.filter(s => s.totalAbsent >= 3) : students;
  const weeklyAbsents = calcWeeklyAbsents(students);
  const maxAbsent     = Math.max(...weeklyAbsents, 1);

  const stats = {
    total:   students.length,
    danger:  students.filter(s => s.totalAbsent >= 6).length,
    warning: students.filter(s => s.totalAbsent >= 3 && s.totalAbsent < 6).length,
    avgRate: students.length
      ? Math.round(students.reduce((a, s) => a + getAttendRate(s), 0) / students.length)
      : 0,
  };

  return (
    <div style={{ fontFamily:"'DM Sans','Noto Sans KR',sans-serif", fontSize:'14px', color:'#111827' }}>
      <style>{`
        .sbc-topbar { background:#fff; padding:0 28px; height:58px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #E5E7EB; margin-bottom:24px; }
        .sbc-topbar-left  { display:flex; align-items:center; gap:10px; }
        .sbc-topbar-right { display:flex; align-items:center; gap:8px; }
        .sbc-back-btn { width:30px; height:30px; border-radius:7px; background:#F3F4F6; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#374151; transition:background 0.15s; }
        .sbc-back-btn:hover { background:#E5E7EB; }
        .sbc-breadcrumb { font-size:13px; color:#9CA3AF; }
        .sbc-breadcrumb span { color:#111827; font-weight:600; }

        .sbc-btn { padding:7px 14px; border-radius:8px; font-size:12.5px; font-weight:500; cursor:pointer; font-family:inherit; display:flex; align-items:center; gap:5px; transition:all 0.15s; border:none; }
        .sbc-btn-secondary { background:#F9FAFB; border:1px solid #E5E7EB; color:#374151; }
        .sbc-btn-secondary:hover { background:#F3F4F6; }
        .sbc-btn-danger { background:#FEF2F2; border:1px solid #FECACA; color:#DC2626; }
        .sbc-btn-danger:hover { background:#FEE2E2; }

        .sbc-chip { font-size:11px; font-weight:600; padding:3px 9px; border-radius:20px; }
        .sbc-chip-blue   { background:#EFF6FF; color:#1D4ED8; }
        .sbc-chip-green  { background:#F0FDF4; color:#16A34A; }
        .sbc-chip-amber  { background:#FFFBEB; color:#D97706; }
        .sbc-chip-red    { background:#FEF2F2; color:#DC2626; }
        .sbc-chip-gray   { background:#F3F4F6; color:#6B7280; }
        .sbc-chip-purple { background:#F5F3FF; color:#7C3AED; }
        .sbc-chip-online { background:#ECFDF5; color:#059669; border:1px solid #A7F3D0; }

        /* 과목 탭 */
        .sbc-course-tabs { display:flex; gap:8px; margin-bottom:18px; flex-wrap:wrap; }
        .sbc-course-tab { padding:8px 16px; border-radius:8px; border:1px solid #E5E7EB; background:#fff; font-size:12.5px; font-weight:500; color:#6B7280; cursor:pointer; transition:all 0.15s; font-family:inherit; display:flex; align-items:center; gap:6px; }
        .sbc-course-tab:hover { background:#F3F4F6; }
        .sbc-course-tab.active { background:#1A3A5C; border-color:#1A3A5C; color:#fff; font-weight:600; }

        /* 통계 */
        .sbc-stat-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:18px; }
        .sbc-stat-card { background:#fff; border-radius:12px; border:1px solid #F3F4F6; padding:16px 18px; }
        .sbc-stat-label { font-size:11px; color:#9CA3AF; margin-bottom:6px; }
        .sbc-stat-val { font-size:24px; font-weight:700; letter-spacing:-0.5px; }

        /* 과목 배너 */
        .sbc-course-banner { background:#fff; border-radius:14px; border:1px solid #F3F4F6; padding:18px 22px; margin-bottom:18px; display:flex; align-items:center; gap:18px; }
        .sbc-course-icon { width:46px; height:46px; border-radius:12px; background:linear-gradient(135deg,#3B82F6,#1A3A5C); display:flex; align-items:center; justify-content:center; color:#fff; font-size:20px; flex-shrink:0; }
        .sbc-course-name { font-size:16px; font-weight:700; color:#111827; margin-bottom:5px; display:flex; align-items:center; gap:7px; }
        .sbc-course-meta { font-size:12px; color:#6B7280; display:flex; gap:12px; align-items:center; }
        .sbc-prof-box { margin-left:auto; display:flex; align-items:center; gap:10px; padding:10px 14px; background:#F8FAFC; border-radius:10px; border:1px solid #F1F5F9; }
        .sbc-prof-avatar { width:34px; height:34px; border-radius:9px; background:linear-gradient(135deg,#3B82F6,#1A3A5C); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#fff; flex-shrink:0; }
        .sbc-prof-name { font-size:13px; font-weight:600; color:#111827; }
        .sbc-prof-sub  { font-size:11px; color:#9CA3AF; }
        .sbc-contact-btns { display:flex; gap:5px; }
        .sbc-contact-btn { padding:4px 9px; border-radius:6px; font-size:11px; font-weight:500; cursor:pointer; font-family:inherit; transition:all 0.15s; display:flex; align-items:center; gap:3px; text-decoration:none; }
        .sbc-contact-email { background:#EFF6FF; border:1px solid #BFDBFE; color:#1D4ED8; }
        .sbc-contact-phone { background:#F0FDF4; border:1px solid #BBF7D0; color:#16A34A; }

        /* 카드 */
        .sbc-card { background:#fff; border-radius:14px; border:1px solid #F3F4F6; padding:20px 22px; }
        .sbc-card-title { font-size:13px; font-weight:700; color:#111827; margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid #F3F4F6; display:flex; align-items:center; justify-content:space-between; gap:8px; }

        /* 바 차트 */
        .sbc-chart-wrap { display:flex; align-items:flex-end; gap:6px; height:80px; padding:0 4px; }
        .sbc-bar-col { display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; }
        .sbc-bar-track { width:100%; display:flex; align-items:flex-end; height:60px; }
        .sbc-bar-fill { width:100%; border-radius:4px 4px 0 0; transition:height 0.4s ease; min-height:3px; }
        .sbc-bar-lbl { font-size:9px; white-space:nowrap; }
        .sbc-bar-cnt { font-size:10px; font-weight:600; }

        /* 그리드 */
        .sbc-grid-wrap { overflow-x:auto; }
        .sbc-grid { width:100%; border-collapse:collapse; }
        .sbc-grid th { padding:8px 10px; font-size:11px; font-weight:600; color:#9CA3AF; text-align:center; border-bottom:1px solid #F3F4F6; white-space:nowrap; background:#FAFAFA; }
        .sbc-grid th.left { text-align:left; }
        .sbc-grid td { padding:8px 6px; font-size:12px; text-align:center; border-bottom:1px solid #F9FAFB; vertical-align:middle; }
        .sbc-grid td.left { text-align:left; padding-left:10px; }
        .sbc-grid tr:last-child td { border-bottom:none; }
        .sbc-grid tr.danger-row td  { background:#FFF5F5; }
        .sbc-grid tr.warning-row td { background:#FFFBEB; }
        .sbc-grid tr:hover td { background:#F8FAFC !important; }

        .sbc-week-cell { width:28px; height:24px; border-radius:5px; display:inline-flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; }
        .sbc-week-future { width:28px; height:24px; border-radius:5px; background:#F9FAFB; display:inline-block; }
        .sbc-rate-bar { display:flex; align-items:center; gap:6px; }
        .sbc-rate-track { width:44px; height:4px; background:#F3F4F6; border-radius:99px; overflow:hidden; }
        .sbc-rate-fill  { height:100%; border-radius:99px; }
        .sbc-empty { padding:40px; text-align:center; color:#9CA3AF; font-size:13px; }
      `}</style>

      {/* 탑바 */}
      <div className="sbc-topbar">
        <div className="sbc-topbar-left">
          <button className="sbc-back-btn" onClick={onBack}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="sbc-breadcrumb">
            학사 › 출결 관리 › 반별 출결 ({deptId} {classSec}반) › <span>과목별 출결</span>
          </div>
        </div>
        <div className="sbc-topbar-right">
          <button
            className={`sbc-btn ${quickFilter ? 'sbc-btn-danger' : 'sbc-btn-secondary'}`}
            onClick={() => setQuickFilter(v => !v)}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 4h18M7 8h10M11 12h4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {quickFilter ? '▲ 위험군만 보는 중' : '결석 3회+ 필터'}
          </button>
        </div>
      </div>

      {availableCourses.length === 0 ? (
        <div className="sbc-empty">해당 반의 개설 과목이 없습니다.</div>
      ) : (
        <>
          {/* 과목 탭 */}
          <div className="sbc-course-tabs">
            {availableCourses.map(c => (
              <button
                key={c.courseId}
                className={`sbc-course-tab ${selectedCourseId === c.courseId ? 'active' : ''}`}
                onClick={() => { setSelectedCourseId(c.courseId); setQuickFilter(false); }}
              >
                {c.courseName}
                {c.isOnline && (
                  <span className="sbc-chip sbc-chip-online" style={selectedCourseId === c.courseId ? { background:'rgba(255,255,255,0.2)', color:'#fff', borderColor:'rgba(255,255,255,0.3)' } : {}}>
                    온라인
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* 과목 정보 배너 */}
          {courseData && (
            <div className="sbc-course-banner">
              <div className="sbc-course-icon">📚</div>
              <div>
                <div className="sbc-course-name">
                  {courseData.courseName}
                  {courseData.isOnline && <span className="sbc-chip sbc-chip-online">온라인</span>}
                </div>
                <div className="sbc-course-meta">
                  <span>{courseData.courseId}</span>
                  <span>·</span>
                  <span>{courseData.credits}학점</span>
                  <span>·</span>
                  <span className={`sbc-chip ${courseData.courseType === '전공필수' ? 'sbc-chip-blue' : 'sbc-chip-purple'}`}>
                    {courseData.courseType}
                  </span>
                </div>
              </div>
              {courseData.professor ? (
                <div className="sbc-prof-box">
                  <div className="sbc-prof-avatar">{courseData.professor.name[0]}</div>
                  <div>
                    <div className="sbc-prof-name">{courseData.professor.name} 교수</div>
                    <div className="sbc-prof-sub">담당 교수</div>
                  </div>
                  <div className="sbc-contact-btns">
                    <a href={`mailto:${courseData.professor.email}`} className="sbc-contact-btn sbc-contact-email">
                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round"/></svg>
                      메일
                    </a>
                    <a href={`tel:${courseData.professor.phone}`} className="sbc-contact-btn sbc-contact-phone">
                      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round"/></svg>
                      전화
                    </a>
                  </div>
                </div>
              ) : (
                <div style={{ marginLeft:'auto' }}>
                  <span className="sbc-chip sbc-chip-amber">교수 미배정</span>
                </div>
              )}
            </div>
          )}

          {/* 통계 */}
          <div className="sbc-stat-row">
            <div className="sbc-stat-card">
              <div className="sbc-stat-label">수강 인원</div>
              <div className="sbc-stat-val" style={{ color:'#3B82F6' }}>{stats.total}<span style={{fontSize:13,color:'#9CA3AF',fontWeight:400}}> 명</span></div>
            </div>
            <div className="sbc-stat-card">
              <div className="sbc-stat-label">결석 위험 (6회+)</div>
              <div className="sbc-stat-val" style={{ color:'#EF4444' }}>{stats.danger}<span style={{fontSize:13,color:'#9CA3AF',fontWeight:400}}> 명</span></div>
            </div>
            <div className="sbc-stat-card">
              <div className="sbc-stat-label">결석 주의 (3~5회)</div>
              <div className="sbc-stat-val" style={{ color:'#D97706' }}>{stats.warning}<span style={{fontSize:13,color:'#9CA3AF',fontWeight:400}}> 명</span></div>
            </div>
            <div className="sbc-stat-card">
              <div className="sbc-stat-label">과목 평균 출석률</div>
              <div className="sbc-stat-val" style={{ color:getRateColor(stats.avgRate) }}>{stats.avgRate}<span style={{fontSize:13,color:'#9CA3AF',fontWeight:400}}> %</span></div>
            </div>
          </div>

          {isLoading ? (
            <div className="sbc-empty">데이터 로딩 중...</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* 바 차트 */}
              <div className="sbc-card">
                <div className="sbc-card-title">
                  <span>주차별 결석 인원 추이 — {courseData?.courseName}</span>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#9CA3AF' }}>
                      <span style={{ width:8, height:8, borderRadius:2, background:'#EF4444', display:'inline-block' }}/>결석 인원
                    </span>
                    <span className="sbc-chip sbc-chip-gray">현재 {CURRENT_WEEK}주차</span>
                  </div>
                </div>
                <div className="sbc-chart-wrap">
                  {WEEK_LABELS.map((lbl, wi) => {
                    const cnt    = weeklyAbsents[wi];
                    const isPast = (wi + 1) <= CURRENT_WEEK;
                    const barH   = isPast ? Math.round((cnt / maxAbsent) * 52) : 0;
                    const barColor = cnt >= 3 ? '#EF4444' : cnt >= 1 ? '#F59E0B' : '#BFDBFE';
                    return (
                      <div key={lbl} className="sbc-bar-col">
                        <span className="sbc-bar-cnt" style={{ color: isPast && cnt > 0 ? barColor : '#D1D5DB' }}>
                          {isPast ? cnt : ''}
                        </span>
                        <div className="sbc-bar-track">
                          {isPast && cnt > 0 && (
                            <div className="sbc-bar-fill" style={{ height:barH, background:barColor, marginTop:'auto', width:'100%' }}/>
                          )}
                        </div>
                        <span className="sbc-bar-lbl" style={{ color:(wi+1)===CURRENT_WEEK ? '#1D4ED8':'#9CA3AF', fontWeight:(wi+1)===CURRENT_WEEK ? 700:400 }}>
                          {lbl}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 개인 출결 그리드 */}
              <div className="sbc-card">
                <div className="sbc-card-title">
                  <span>
                    학생별 주차 출결 현황
                    {quickFilter && <span className="sbc-chip sbc-chip-red" style={{marginLeft:8}}>결석 3회+ 필터 중</span>}
                  </span>
                  <div style={{ display:'flex', gap:8 }}>
                    {[
                      { label:'출석', bg:'#EFF6FF', color:'#3B82F6' },
                      { label:'결석', bg:'#FEF2F2', color:'#EF4444' },
                      { label:'지각', bg:'#FFFBEB', color:'#D97706' },
                      { label:'공결', bg:'#F0FDF4', color:'#16A34A' },
                    ].map(l => (
                      <span key={l.label} style={{ fontSize:11, color:l.color, display:'flex', alignItems:'center', gap:3 }}>
                        <span style={{ width:8, height:8, borderRadius:2, background:l.bg, border:`1px solid ${l.color}`, display:'inline-block' }}/>
                        {l.label}
                      </span>
                    ))}
                  </div>
                </div>

                {displayed.length === 0 ? (
                  <div className="sbc-empty">결석 3회 이상 학생이 없습니다. 👍</div>
                ) : (
                  <div className="sbc-grid-wrap">
                    <table className="sbc-grid">
                      <thead>
                        <tr>
                          <th className="left" style={{ minWidth:130 }}>학생</th>
                          {WEEK_LABELS.map((lbl, wi) => (
                            <th key={lbl} style={{ color:(wi+1)===CURRENT_WEEK ? '#1D4ED8':undefined }}>{lbl}</th>
                          ))}
                          <th>출석률</th>
                          <th>결석</th>
                          <th>지각</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayed.map(s => {
                          const rate      = getAttendRate(s);
                          const isDanger  = s.totalAbsent >= 6;
                          const isWarning = s.totalAbsent >= 3 && s.totalAbsent < 6;
                          return (
                            <tr key={s.studentId} className={isDanger ? 'danger-row' : isWarning ? 'warning-row' : ''}>
                              <td className="left">
                                <div style={{ fontWeight:600, color:'#111827', fontSize:13 }}>{s.korName}</div>
                                <div style={{ fontSize:11, color:'#9CA3AF' }}>{s.studentId}</div>
                              </td>
                              {s.weeklyAttend.map((code, wi) => {
                                const isPast = (wi + 1) <= CURRENT_WEEK;
                                if (!isPast) return <td key={wi}><span className="sbc-week-future"/></td>;
                                const cell = getStatusCell(code);
                                return (
                                  <td key={wi}>
                                    <div className="sbc-week-cell" style={{ background:cell.bg, color:cell.color }}>{cell.label}</div>
                                  </td>
                                );
                              })}
                              <td>
                                <div className="sbc-rate-bar">
                                  <div className="sbc-rate-track">
                                    <div className="sbc-rate-fill" style={{ width:`${rate}%`, background:getRateColor(rate) }}/>
                                  </div>
                                  <span style={{ fontSize:12, fontWeight:600, color:getRateColor(rate) }}>{rate}%</span>
                                </div>
                              </td>
                              <td><span className={`sbc-chip ${isDanger ? 'sbc-chip-red' : isWarning ? 'sbc-chip-amber' : 'sbc-chip-gray'}`}>{s.totalAbsent}회</span></td>
                              <td><span className={`sbc-chip ${s.totalLate > 0 ? 'sbc-chip-amber' : 'sbc-chip-gray'}`}>{s.totalLate}회</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}