import { useState, useEffect, useRef } from 'react';
import api from '../../../api/axios';

//   상수 / 유틸 (비즈니스 로직)

const getRiskLevel = (ratio) => {
  const pct = ratio * 100;
  if (pct < 20) return { level: 'safe',      label: 'Safe',      color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', barColor: '#22C55E' };
  if (pct < 30) return { level: 'warning',   label: 'Warning',   color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', barColor: '#F59E0B' };
  return         { level: 'violation', label: 'Violation', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', barColor: '#EF4444' };
};

const fmtPct = (ratio) => (ratio * 100).toFixed(1) + '%';

/* 확인서 프린트 유틸 */
const printCert = (student, enrollments, semesterName) => {
  const onlineCourses = (enrollments || []).filter(e => e.isOnline);
  const totalCredits  = (enrollments || []).reduce((s, e) => s + (e.credits || 0), 0);
  const onlineCredits = onlineCourses.reduce((s, e) => s + (e.credits || 0), 0);
  const ratio         = totalCredits > 0 ? onlineCredits / totalCredits : 0;
  
  const html = `
    <html><head><meta charset="utf-8"/>
    <style>
      body{font-family:'Malgun Gothic',sans-serif;padding:60px;color:#111;font-size:14px;line-height:1.6;}
      h1{font-size:24px;text-align:center;margin-bottom:10px;letter-spacing:1px;}
      .sub{text-align:center;color:#666;font-size:14px;margin-bottom:50px; border-bottom: 2px solid #1A3A5C; padding-bottom: 10px;}
      table{width:100%;border-collapse:collapse;margin-bottom:30px;}
      th,td{padding:12px 15px;border:1px solid #aaa;font-size:13px; text-align: left;}
      th{background:#f8f9fa;font-weight:700; width: 20%;}
      .ratio{font-size:18px;font-weight:700;color:${ratio >= 0.3 ? '#DC2626' : '#16A34A'};}
      .footer{margin-top:80px;text-align:center; position: relative;}
      .date{text-align: right; margin-bottom: 20px; color: #555;}
      .seal-text{font-size: 20px; font-weight: 800; color: #1A3A5C; letter-spacing: 2px;}
      .notice{margin-top: 40px; font-size: 12px; color: #777; border: 1px dashed #ccc; padding: 10px;}
    </style></head><body>
    <h1>온라인 수업 수강 확인서</h1>
    <div class="sub">경민대학교 국제교육원 · Certificate of Online Course Enrollment</div>
    
    <h3>1. 학생 인적사항</h3>
    <table>
      <tr><th>학번</th><td>${student.studentId}</td><th>성명</th><td>${student.korName || ''} (${student.engName || ''})</td></tr>
      <tr><th>학과</th><td>${student.deptName || ''}</td><th>해당학기</th><td>${semesterName}</td></tr>
    </table>

    <h3>2. 수강 및 온라인 비율 현황</h3>
    <table>
      <tr><th>총 수강학점</th><td>${totalCredits}학점</td><th>온라인 수강학점</th><td>${onlineCredits}학점</td></tr>
      <tr><th>온라인 비율</th><td colspan="3" class="ratio">${fmtPct(ratio)} ${ratio >= 0.3 ? ' (기준 30% 초과 - 관리대상)' : ' (정상)'}</td></tr>
    </table>

    <h3>3. 세부 수강 내역</h3>
    <table>
      <thead><tr style="background:#eee;"><th>과목코드</th><th>과목명</th><th>학점</th><th>이수형태</th></tr></thead>
      <tbody>
        ${(enrollments || []).map(e => `<tr><td>${e.courseId}</td><td>${e.courseName}</td><td>${e.credits}</td><td>${e.isOnline ? '<b>온라인(Online)</b>' : '오프라인(Face-to-face)'}</td></tr>`).join('')}
      </tbody>
    </table>

    <div class="notice">
      ※ 본 확인서는 법무부 유학생 관리 지침(온라인 수업 30% 이내 제한)에 따른 수강 현황을 증명함.
    </div>

    <div class="footer">
      <div class="date">${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      <div class="seal-text">경민대학교 국제교육원장</div>
    </div>
    </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 500);
};

/* ────────────────────────────────────────────────
   컴포넌트 시작
──────────────────────────────────────────────── */
export default function OnlineViolation() {
  const [loading, setLoading]         = useState(true);
  const [depts, setDepts]             = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [semester, setSemester]       = useState(null);
  const [students, setStudents]       = useState([]);   
  const [filterLevel, setFilterLevel] = useState('all'); 
  const [sortBy, setSortBy]           = useState('ratio_desc');
  const [searchQ, setSearchQ]         = useState('');
  const [detail, setDetail]           = useState(null);  
  const [detailLoading, setDL]        = useState(false);
  const detailRef = useRef(null);

  // 1. 초기 로드 (현재 학기 및 학과 목록)
  useEffect(() => {
    const init = async () => {
      try {
        const [semRes, deptRes] = await Promise.all([
          api.get('/api/v1/semesters/current'),
          api.get('/api/v1/depts'),
        ]);
        if (semRes.data.success) setSemester(semRes.data.data);
        if (deptRes.data.success) setDepts(deptRes.data.data);
      } catch (err) {
        console.error("초기 데이터 로드 실패", err);
      }
    };
    init();
  }, []);

  // 2. 위반 목록 로드 (학과 선택 시마다 실행)
  const loadList = async (deptId = '') => {
    setLoading(true);
    try {
      // 명세서 8-2: GET /api/v1/academic/online-violations
      const res = await api.get('/api/v1/academic/online-violations', {
        params: { deptId: deptId || undefined }
      });
      if (res.data.success) {
        setStudents(res.data.data);
      }
    } catch (e) {
      console.error("목록 조회 실패", e);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList(selectedDept);
  }, [selectedDept]);

  // 3. 학생 상세 수강 내역 조회
  const openDetail = async (student) => {
    if (detail?.student?.studentId === student.studentId) {
      setDetail(null);
      return;
    }

    setDetail({ student, enrollments: null });
    setDL(true);
    try {
      // 명세서 7-2: GET /api/v1/students/{studentId}/enrollments
      const r = await api.get(`/api/v1/students/${student.studentId}/enrollments`, {
        params: { semesterId: semester?.semesterId },
      });
      if (r.data.success) {
        setDetail({ student, enrollments: r.data.data });
      }
    } catch (e) {
      console.error("상세 내역 조회 실패", e);
    } finally {
      setDL(false);
      // 상세 패널로 스크롤 이동
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
  };

  /* 프론트엔드 필터링 및 정렬 로직 */
  const displayed = students
    .filter(s => {
      // 위험도 레벨 필터
      if (filterLevel !== 'all' && getRiskLevel(s.onlineRatio).level !== filterLevel) return false;
      // 검색 필터
      if (searchQ) {
        const q = searchQ.toLowerCase();
        return (s.korName || '').includes(q) || 
               (s.engName || '').toLowerCase().includes(q) || 
               (s.studentId || '').includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'ratio_desc') return b.onlineRatio - a.onlineRatio;
      if (sortBy === 'ratio_asc')  return a.onlineRatio - b.onlineRatio;
      if (sortBy === 'name')       return (a.korName || '').localeCompare(b.korName || '');
      return 0;
    });

  const counts = {
    violation: students.filter(s => s.onlineRatio >= 0.3).length,
    warning:   students.filter(s => s.onlineRatio >= 0.2 && s.onlineRatio < 0.3).length,
    safe:      students.filter(s => s.onlineRatio < 0.2).length,
  };

  return (
    <>
      <style>{`
        /* 기존 스타일 코드 유지 (생략 가능하나 가독성을 위해 핵심만 남김) */
        .ov-wrap { padding: 24px; background: #F3F4F6; min-height: 100vh; font-family: 'Noto Sans KR', sans-serif; }
        .ov-banner { background: #1e293b; border-radius: 12px; padding: 20px; color: #fff; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .ov-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .ov-sum-card { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; cursor: pointer; transition: 0.2s; }
        .ov-sum-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .ov-sum-card.active { border: 2px solid #3b82f6; }
        .ov-sum-val { font-size: 28px; font-weight: 800; margin: 8px 0; }
        
        .ov-toolbar { background: #fff; padding: 16px; border-radius: 12px; display: flex; gap: 12px; align-items: center; margin-bottom: 20px; }
        .ov-search-input { flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; }
        .ov-select { padding: 8px; border-radius: 8px; border: 1px solid #ddd; }
        
        .ov-card { background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
        .ov-row { display: flex; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f3f4f6; cursor: pointer; }
        .ov-row:hover { background: #f9fafb; }
        .ov-row.selected { background: #eff6ff; }
        
        .ov-bar-bg { width: 100%; height: 10px; background: #e5e7eb; border-radius: 5px; position: relative; margin-top: 8px; }
        .ov-bar-fill { height: 100%; border-radius: 5px; }
        .ov-deadline-mark { position: absolute; left: 30%; top: -5px; bottom: -5px; width: 2px; background: #ef4444; }
        
        .ov-badge { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
        .ov-detail { margin-top: 24px; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 24px; animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .ov-enroll-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .ov-enroll-table th { background: #f9fafb; padding: 12px; text-align: left; font-size: 12px; color: #6b7280; }
        .ov-enroll-table td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
        .ov-print-btn { background: #1A3A5C; color: #fff; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; }
      `}</style>

      <div className="ov-wrap">
        {/* 상단 섹션: 학기 정보 */}
        <div className="ov-banner">
          <div>
            <h2 style={{ margin: 0, fontSize: '20px' }}>온라인 수강 비율 모니터링</h2>
            <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '13px' }}>
              외국인 유학생 비자 연장 기준 (온라인 30% 미만) 준수 여부를 확인합니다.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px' }}>
              {semester ? `${semester.year}학년도 ${semester.term}학기` : '학기 정보 조회 중...'}
            </span>
          </div>
        </div>

        {/* 위험도별 요약 */}
        <div className="ov-summary">
          {[
            { key: 'all', label: '전체 학생', count: students.length, color: '#3b82f6' },
            { key: 'violation', label: '기준 초과 (30%+)', count: counts.violation, color: '#ef4444' },
            { key: 'warning', label: '주의 (20~30%)', count: counts.warning, color: '#f59e0b' },
            { key: 'safe', label: '안전 (<20%)', count: counts.safe, color: '#10b981' },
          ].map(c => (
            <div 
              key={c.key} 
              className={`ov-sum-card ${filterLevel === c.key ? 'active' : ''}`}
              onClick={() => setFilterLevel(c.key)}
            >
              <div style={{ color: c.color, fontSize: '12px', fontWeight: 700 }}>{c.label}</div>
              <div className="ov-sum-val" style={{ color: c.color }}>{c.count}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>대상 인원(명)</div>
            </div>
          ))}
        </div>

        {/* 컨트롤바 */}
        <div className="ov-toolbar">
          <input 
            className="ov-search-input" 
            placeholder="이름 또는 학번으로 검색..." 
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
          <select className="ov-select" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
            <option value="">전체 학과</option>
            {depts.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
          </select>
          <select className="ov-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="ratio_desc">비율 높은 순</option>
            <option value="ratio_asc">비율 낮은 순</option>
            <option value="name">이름 순</option>
          </select>
          <button className="ov-print-btn" style={{ background: '#fff', color: '#374151', border: '1px solid #ddd' }} onClick={() => loadList(selectedDept)}>
            새로고침
          </button>
        </div>

        {/* 메인 리스트 */}
        <div className="ov-card">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>데이터를 불러오는 중입니다...</div>
          ) : displayed.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>조회된 학생이 없습니다.</div>
          ) : (
            displayed.map(s => {
              const risk = getRiskLevel(s.onlineRatio);
              const isSelected = detail?.student?.studentId === s.studentId;
              return (
                <div key={s.studentId} className={`ov-row ${isSelected ? 'selected' : ''}`} onClick={() => openDetail(s)}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: risk.bg, color: risk.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginRight: '16px' }}>
                    {(s.korName || 'U')[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{s.korName} <span style={{ fontWeight: 400, fontSize: '12px', color: '#6b7280' }}>({s.studentId})</span></div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{s.deptName}</div>
                  </div>
                  <div style={{ flex: 2, padding: '0 40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: risk.color }}>
                      <span>온라인 비율</span>
                      <span>{fmtPct(s.onlineRatio)}</span>
                    </div>
                    <div className="ov-bar-bg">
                      <div className="ov-deadline-mark" />
                      <div className="ov-bar-fill" style={{ width: `${s.onlineRatio * 100}%`, background: risk.barColor }} />
                    </div>
                  </div>
                  <div style={{ width: '100px', textAlign: 'right', marginRight: '20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{s.onlineCredits} / {s.totalCredits}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>수강 학점</div>
                  </div>
                  <div style={{ width: '80px' }}>
                    <span className="ov-badge" style={{ background: risk.bg, color: risk.color }}>{risk.label}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 상세 수강 내역 패널 */}
        {detail && (
          <div className="ov-detail" ref={detailRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0 }}>{detail.student.korName} 학생 수강 상세 내역</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                  {semester?.year}년 {semester?.term}학기 기준 실시간 수강 정보입니다.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {detail.enrollments && (
                  <button className="ov-print-btn" onClick={() => printCert(detail.student, detail.enrollments, `${semester?.year}년 ${semester?.term}학기`)}>
                    확인서 출력
                  </button>
                )}
                <button onClick={() => setDetail(null)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>닫기</button>
              </div>
            </div>

            {detailLoading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>수강 정보를 조회 중입니다...</div>
            ) : (
              <table className="ov-enroll-table">
                <thead>
                  <tr>
                    <th>과목코드</th>
                    <th>과목명</th>
                    <th>학점</th>
                    <th>이수형태</th>
                    <th>성적</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.enrollments?.map(e => (
                    <tr key={e.enrollId}>
                      <td>{e.courseId}</td>
                      <td style={{ fontWeight: 600 }}>{e.courseName}</td>
                      <td>{e.credits}학점</td>
                      <td>
                        {e.isOnline ? 
                          <span style={{ color: '#ef4444', fontWeight: 700 }}>🌐 온라인</span> : 
                          <span style={{ color: '#6b7280' }}>오프라인</span>
                        }
                      </td>
                      <td>{e.grade || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}