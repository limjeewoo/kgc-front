import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// API 설정
const api = axios.create({
  baseURL: 'https://api.kmgc.world', // 운영 서버 기준 (로컬 시 http://localhost:8080)
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 로컬 스토리지에서 토큰을 가져와 헤더에 삽입
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const WEEK_LABELS = ['1주','2주','3주','4주','5주','6주','7주','8주','9주','10주','11주','12주','13주','14주','15주'];
const CURRENT_WEEK = 13; // 실제 운영 시에는 서버의 '현재 주차' 데이터를 사용하는 것이 좋습니다.

const getStatusCell = (code) => {
  if (code === 1) return { label:'출', bg:'#EFF6FF', color:'#3B82F6' };
  if (code === 2) return { label:'결', bg:'#FEF2F2', color:'#EF4444' };
  if (code === 3) return { label:'지', bg:'#FFFBEB', color:'#D97706' };
  if (code === 4) return { label:'공', bg:'#F0FDF4', color:'#16A34A' };
  return { label:'-', bg:'#F9FAFB', color:'#D1D5DB' };
};

export default function SearchByCourse({ deptId, classSec, onBack }) {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseData, setCourseData] = useState(null);
  const [policy, setPolicy] = useState({ warningThreshold: 3, dangerThreshold: 6 });
  const [isLoading, setIsLoading] = useState(false);
  const [quickFilter, setQuickFilter] = useState(false);

  // 1. 정책 및 과목 목록 초기 로드
  useEffect(() => {
    const initLoad = async () => {
      try {
        // 출결 정책 조회
        const policyRes = await api.get('/api/v1/policies/attend');
        if (policyRes.data.success) setPolicy(policyRes.data.data);

        // 반별 과목 목록 조회 (/api/v1/search/class)
        const coursesRes = await api.get(`/api/v1/search/class`, {
          params: { deptId, classSec }
        });
        
        if (coursesRes.data.success) {
          const courses = coursesRes.data.data.courses || []; // API 응답 구조에 따라 조정
          setAvailableCourses(courses);
          if (courses.length > 0) setSelectedCourseId(courses[0].courseId);
        }
      } catch (error) {
        console.error("초기 데이터 로드 실패:", error);
        alert("데이터를 가져오는 중 오류가 발생했습니다.");
      }
    };
    initLoad();
  }, [deptId, classSec]);

  // 2. 선택된 과목의 상세 데이터(학생/출결) 조회
  const fetchCourseDetail = useCallback(async () => {
    if (!selectedCourseId) return;
    setIsLoading(true);
    try {
      // 과목별 검색 API 호출 (/api/v1/search/course)
      const res = await api.get(`/api/v1/search/course`, {
        params: { courseId: selectedCourseId }
      });
      if (res.data.success) {
        setCourseData(res.data.data);
      }
    } catch (error) {
      console.error("과목 상세 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    fetchCourseDetail();
  }, [fetchCourseDetail]);

  const students = courseData?.students || [];
  const displayed = quickFilter 
    ? students.filter(s => s.totalAbsent >= policy.warningThreshold) 
    : students;

  // 통계 계산
  const stats = {
    total: students.length,
    danger: students.filter(s => s.totalAbsent >= policy.dangerThreshold).length,
    warning: students.filter(s => s.totalAbsent >= policy.warningThreshold && s.totalAbsent < policy.dangerThreshold).length,
    avgRate: students.length
      ? Math.round(students.reduce((a, s) => a + (s.attendanceRate || 0), 0) / students.length)
      : 0,
  };

  // 주차별 결석 인원 합계 계산
  const weeklyAbsents = WEEK_LABELS.map((_, wi) => 
    students.filter(s => s.weeklyAttend && s.weeklyAttend[wi] === 2).length
  );
  const maxAbsent = Math.max(...weeklyAbsents, 1);

  return (
    <div style={{ fontFamily:"'DM Sans','Noto Sans KR',sans-serif", fontSize:'14px', color:'#111827' }}>
      <style>{`
        .sbc-topbar { background:#fff; padding:0 28px; height:58px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #E5E7EB; margin-bottom:24px; }
        .sbc-topbar-left { display:flex; align-items:center; gap:10px; }
        .sbc-back-btn { width:30px; height:30px; border-radius:7px; background:#F3F4F6; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#374151; }
        .sbc-breadcrumb { font-size:13px; color:#9CA3AF; }
        .sbc-breadcrumb span { color:#111827; font-weight:600; }
        .sbc-btn { padding:7px 14px; border-radius:8px; font-size:12.5px; font-weight:500; cursor:pointer; display:flex; align-items:center; gap:5px; border:none; }
        .sbc-btn-secondary { background:#F9FAFB; border:1px solid #E5E7EB; color:#374151; }
        .sbc-btn-danger { background:#FEF2F2; border:1px solid #FECACA; color:#DC2626; }
        .sbc-course-tabs { display:flex; gap:8px; margin-bottom:18px; flex-wrap:wrap; }
        .sbc-course-tab { padding:8px 16px; border-radius:8px; border:1px solid #E5E7EB; background:#fff; font-size:12.5px; cursor:pointer; }
        .sbc-course-tab.active { background:#1A3A5C; border-color:#1A3A5C; color:#fff; font-weight:600; }
        .sbc-stat-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:18px; }
        .sbc-stat-card { background:#fff; border-radius:12px; border:1px solid #F3F4F6; padding:16px 18px; }
        .sbc-stat-label { font-size:11px; color:#9CA3AF; margin-bottom:6px; }
        .sbc-stat-val { font-size:24px; font-weight:700; }
        .sbc-course-banner { background:#fff; border-radius:14px; border:1px solid #F3F4F6; padding:18px 22px; margin-bottom:18px; display:flex; align-items:center; gap:18px; }
        .sbc-card { background:#fff; border-radius:14px; border:1px solid #F3F4F6; padding:20px 22px; }
        .sbc-grid { width:100%; border-collapse:collapse; }
        .sbc-grid th { padding:8px 10px; font-size:11px; background:#FAFAFA; border-bottom:1px solid #F3F4F6; }
        .sbc-grid td { padding:8px 6px; font-size:12px; border-bottom:1px solid #F9FAFB; text-align:center; }
        .sbc-week-cell { width:28px; height:24px; border-radius:5px; display:inline-flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; }
        .sbc-chip { font-size:11px; font-weight:600; padding:3px 9px; border-radius:20px; }
        .sbc-chip-red { background:#FEF2F2; color:#DC2626; }
        .sbc-chip-amber { background:#FFFBEB; color:#D97706; }
        .sbc-chip-gray { background:#F3F4F6; color:#6B7280; }
      `}</style>

      {/* 탑바 */}
      <div className="sbc-topbar">
        <div className="sbc-topbar-left">
          <button className="sbc-back-btn" onClick={onBack}>←</button>
          <div className="sbc-breadcrumb">
            학사 › 출결 관리 › <span>과목별 출결 조회</span>
          </div>
        </div>
        <div className="sbc-topbar-right">
          <button 
            className={`sbc-btn ${quickFilter ? 'sbc-btn-danger' : 'sbc-btn-secondary'}`}
            onClick={() => setQuickFilter(!quickFilter)}
          >
            {quickFilter ? '▲ 필터 해제' : `결석 ${policy.warningThreshold}회 이상 필터`}
          </button>
        </div>
      </div>

      {/* 과목 선택 탭 */}
      <div className="sbc-course-tabs">
        {availableCourses.map(c => (
          <button
            key={c.courseId}
            className={`sbc-course-tab ${selectedCourseId === c.courseId ? 'active' : ''}`}
            onClick={() => setSelectedCourseId(c.courseId)}
          >
            {c.courseName}
          </button>
        ))}
      </div>

      {courseData && (
        <>
          {/* 과목 정보 배너 */}
          <div className="sbc-course-banner">
            <div style={{ fontSize: '24px' }}>📚</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>{courseData.courseName}</div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>
                {courseData.courseId} · {courseData.credits}학점 · {courseData.courseType}
              </div>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="sbc-stat-row">
            <div className="sbc-stat-card">
              <div className="sbc-stat-label">수강 인원</div>
              <div className="sbc-stat-val" style={{ color: '#3B82F6' }}>{stats.total}</div>
            </div>
            <div className="sbc-stat-card">
              <div className="sbc-stat-label">결석 위험</div>
              <div className="sbc-stat-val" style={{ color: '#EF4444' }}>{stats.danger}</div>
            </div>
            <div className="sbc-stat-card">
              <div className="sbc-stat-label">결석 주의</div>
              <div className="sbc-stat-val" style={{ color: '#D97706' }}>{stats.warning}</div>
            </div>
            <div className="sbc-stat-card">
              <div className="sbc-stat-label">평균 출석률</div>
              <div className="sbc-stat-val">{stats.avgRate}%</div>
            </div>
          </div>

          {/* 출결 테이블 */}
          <div className="sbc-card">
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>데이터 로딩 중...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="sbc-grid">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>학생 정보</th>
                      {WEEK_LABELS.map((lbl) => <th key={lbl}>{lbl}</th>)}
                      <th>결석</th>
                      <th>지각</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map(s => (
                      <tr key={s.studentId}>
                        <td style={{ textAlign: 'left', padding: '10px' }}>
                          <div style={{ fontWeight: 600 }}>{s.korName}</div>
                          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{s.studentId}</div>
                        </td>
                        {WEEK_LABELS.map((_, wi) => {
                          const code = s.weeklyAttend ? s.weeklyAttend[wi] : null;
                          const cell = getStatusCell(code);
                          return (
                            <td key={wi}>
                              <div className="sbc-week-cell" style={{ background: cell.bg, color: cell.color }}>
                                {cell.label}
                              </div>
                            </td>
                          );
                        })}
                        <td>
                          <span className={`sbc-chip ${s.totalAbsent >= policy.dangerThreshold ? 'sbc-chip-red' : s.totalAbsent >= policy.warningThreshold ? 'sbc-chip-amber' : 'sbc-chip-gray'}`}>
                            {s.totalAbsent}회
                          </span>
                        </td>
                        <td>{s.totalLate}회</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}