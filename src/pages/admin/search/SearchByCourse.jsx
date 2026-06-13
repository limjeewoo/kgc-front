import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const WEEK_LABELS = Array.from({ length: 15 }, (_, i) => `${i + 1}`);

const getStatusDisplay = (code) => {
  switch (code) {
    case 1: return { label: '출', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' };
    case 2: return { label: '결', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' };
    case 3: return { label: '지', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' };
    case 4: return { label: '공', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' };
    default: return { label: '–', color: '#D1D5DB', bg: 'transparent', border: 'transparent' };
  }
};

export default function SearchByCourse({ deptId, classSec, onBack }) {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseData, setCourseData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // 기본값: 명세서 기준 ATTEND_WARNING_COUNT=2, ATTEND_DANGER_COUNT=4
  const [policy, setPolicy] = useState({ warningThreshold: 2, dangerThreshold: 4 });

  const [searchTerm, setSearchTerm] = useState('');
  const [executedSearchTerm, setExecutedSearchTerm] = useState('');
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);

  const cleanCourseName = (name) => {
    if (!name) return '';
    return name.replace(/\s+\d{6}-[A-Z0-9]+.*$/i, '').trim();
  };

  const initData = useCallback(async () => {
    try {
      const params = classSec ? { classSec } : {};
      const courseRes = await api.get('/api/v1/courses', { params });

      let dataList = courseRes.data?.data || courseRes.data || [];

      if (deptId) {
        dataList = dataList.filter(c => c.departmentId === deptId || c.deptId === deptId);
      }

      const courses = dataList.map(course => ({
        ...course,
        courseName: cleanCourseName(course.courseName),
      }));

      setAvailableCourses(courses);
    } catch (error) {
      console.error('❌ 과목 목록 로드 오류:', error);
    }

    // ── 출결 정책 조회: GET /api/v1/admin/scheduler ──────────────
    try {
      const policyRes = await api.get('/api/v1/admin/scheduler');
      if (policyRes.data?.success) {
        const configs = policyRes.data.data; // 배열: [{configKey, configValue, description}]
        const warningCfg = configs.find(c => c.configKey === 'ATTEND_WARNING_COUNT');
        const dangerCfg  = configs.find(c => c.configKey === 'ATTEND_DANGER_COUNT');
        setPolicy({
          warningThreshold: Number(warningCfg?.configValue ?? 2),
          dangerThreshold:  Number(dangerCfg?.configValue  ?? 4),
        });
      }
    } catch (error) {
      console.warn('⚠️ 출결 정책 로드 실패. 기본값(주의 2회 / 위험 4회)을 사용합니다.');
    }
  }, [deptId, classSec]);

  useEffect(() => { initData(); }, [initData]);

  const fetchAllCourses = async () => {
    try {
      const res = await api.get('/api/v1/courses');
      const dataList = res.data?.data || res.data || [];
      setAllCourses(dataList.map(course => ({
        ...course,
        courseName: cleanCourseName(course.courseName),
      })));
    } catch (error) {
      console.error('전체 과목 목록 로드 실패:', error);
    }
  };

  const openSelectModal = () => {
    fetchAllCourses();
    setIsSelectModalOpen(true);
  };

  const fetchCourseDetail = useCallback(async () => {
    if (!selectedCourseId) { setCourseData([]); return; }
    setIsLoading(true);
    try {
      const res = await api.get(`/api/v1/courses/${selectedCourseId}/enrollments`, {
        params: { semesterId: '2026-1' },
      });
      const enrollments = res.data?.data || res.data || [];
      setCourseData(Array.isArray(enrollments) ? enrollments : []);
    } catch (error) {
      console.error(`❌ 과목 ID: ${selectedCourseId} 수강생 로드 실패`);
      setCourseData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => { fetchCourseDetail(); }, [selectedCourseId, fetchCourseDetail]);

  const handleSearch = () => {
    if (!searchTerm.trim()) { alert('검색어를 입력해 주세요.'); return; }
    setExecutedSearchTerm(searchTerm);
    const searchPool = [...availableCourses, ...allCourses];
    const match = searchPool.find(course =>
      course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.courseId.toString().includes(searchTerm)
    );
    if (match) {
      setSelectedCourseId(match.courseId);
      setSearchTerm(match.courseName);
    } else {
      alert('일치하는 과목을 찾을 수 없습니다.');
      setSelectedCourseId('');
    }
  };

  const handleSelectFromModal = (course) => {
    setSearchTerm(course.courseName);
    setExecutedSearchTerm(course.courseName);
    setSelectedCourseId(course.courseId);
    setIsSelectModalOpen(false);
  };

  const students = courseData;
  const dangerCount  = students.filter(s => (s.totalAbsent || 0) >= policy.dangerThreshold).length;
  const warningCount = students.filter(s => (s.totalAbsent || 0) >= policy.warningThreshold && (s.totalAbsent || 0) < policy.dangerThreshold).length;
  const safeCount    = students.length - dangerCount - warningCount;

  const selectedCourse = [...availableCourses, ...allCourses].find(c => c.courseId === selectedCourseId);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Noto Sans KR', sans-serif", color: '#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .sbc-wrap { animation: fadeUp 0.28s ease; }
        .sbc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
        .sbc-back { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #E5E7EB; border-radius: 8px; padding: 7px 14px; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.15s; }
        .sbc-back:hover { background: #F9FAFB; border-color: #D1D5DB; }
        .sbc-title { font-size: 1.25rem; font-weight: 700; color: #0F172A; }
        .sbc-subtitle { font-size: 0.8rem; color: #94A3B8; margin-top: 3px; }
        .sbc-policy-badge { display: inline-flex; align-items: center; gap: 6px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 5px 12px; font-size: 11px; color: #64748B; font-weight: 500; }
        .sbc-stats { display: flex; gap: 10px; margin-bottom: 1.25rem; }
        .sbc-stat { background: #fff; border: 1px solid #F1F5F9; border-radius: 10px; padding: 12px 18px; display: flex; align-items: center; gap: 10px; flex: 1; }
        .sbc-stat-dot { width: 8px; height: 8px; border-radius: 50%; }
        .sbc-stat-label { font-size: 12px; color: #64748B; font-weight: 500; }
        .sbc-stat-val { font-size: 18px; font-weight: 700; color: #0F172A; margin-left: auto; }
        .sbc-stat-unit { font-size: 12px; color: #94A3B8; }
        .sbc-search-bar { display: flex; gap: 8px; margin-bottom: 1.5rem; background: #F8FAFC; padding: 12px; border-radius: 10px; border: 1px solid #E2E8F0; align-items: center; }
        .sbc-search-input { flex: 1; max-width: 320px; padding: 8px 14px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 13px; outline: none; font-family: inherit; }
        .sbc-search-input:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .sbc-select-modal-btn { background: #fff; color: #4B5563; border: 1px solid #D1D5DB; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; }
        .sbc-select-modal-btn:hover { background: #F3F4F6; }
        .sbc-search-btn { background: #3B82F6; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .sbc-search-btn:hover { background: #2563EB; }
        .sbc-search-reset { background: #E2E8F0; color: #475569; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .sbc-card { background: #fff; border-radius: 12px; border: 1px solid #F1F5F9; overflow: hidden; }
        .sbc-table-wrap { overflow-x: auto; }
        .sbc-table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
        .sbc-table th { padding: 10px 6px; font-size: 11px; font-weight: 700; color: #64748B; border-bottom: 1.5px solid #E2E8F0; text-align: center; background: #F8FAFC; }
        .sbc-table th.th-name { text-align: left; padding-left: 14px; }
        .sbc-table td { padding: 9px 6px; border-bottom: 1px solid #F1F5F9; text-align: center; color: #374151; }
        .sbc-table td.td-name { text-align: left; padding-left: 14px; font-weight: 600; color: #0F172A; position: sticky; left: 0; background: #fff; border-right: 1px solid #F1F5F9; }
        .week-cell { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 5px; font-size: 10px; font-weight: 700; }
        .absent-val { font-weight: 700; }
        .eval-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; }
        .eval-danger  { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
        .eval-warning { background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A; }
        .eval-caution { background: #FFF7ED; color: #EA580C; border: 1px solid #FDBA74; }
        .sbc-empty { padding: 3.5rem; text-align: center; color: #CBD5E1; }
        .sbc-loading { padding: 3rem; text-align: center; color: #64748B; font-size: 13px; }
        .sbc-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.4); display: flex; align-items: center; justify-content: center; z-index: 2100; }
        .sbc-modal-content { background: #fff; border-radius: 12px; width: 960px; max-height: 75vh; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; }
        .sbc-modal-header { padding: 16px 20px; border-bottom: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: space-between; }
        .sbc-modal-title { font-size: 14px; font-weight: 700; color: #1E293B; }
        .sbc-modal-close { background: none; border: none; font-size: 22px; color: #94A3B8; cursor: pointer; outline: none; }
        .sbc-modal-body { padding: 20px; overflow-y: auto; flex: 1; }
        .sbc-modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .sbc-modal-list-item { text-align: left; padding: 11px 14px; border: 1px solid #E2E8F0; background: #fff; border-radius: 6px; font-size: 13px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.15s; font-family: inherit; }
        .sbc-modal-list-item:hover { background: #F1F5F9; border-color: #CBD5E1; }
        .sbc-modal-course-id { font-size: 11px; color: #94A3B8; font-family: monospace; background: #F8FAFC; padding: 2px 6px; border-radius: 4px; border: 1px solid #E2E8F0; }
      `}</style>

      <div className="sbc-wrap">
        <div className="sbc-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="sbc-back" onClick={onBack}>← 뒤로</button>
            <div>
              <div className="sbc-title">과목별 출결 검색</div>
              <div className="sbc-subtitle">
                {selectedCourse
                  ? `${selectedCourse.courseName} · 수강생 주차별 출결 상세 현황`
                  : '검색창이나 목록을 이용해 과목을 선택해 주세요.'}
              </div>
            </div>
          </div>
          {/* 현재 적용 중인 정책 기준 표시 */}
          <div className="sbc-policy-badge">
            ⚙️ 주의 {policy.warningThreshold}회 이상 · 위험 {policy.dangerThreshold}회 이상
          </div>
        </div>

        <div className="sbc-search-bar">
          <input
            type="text"
            className="sbc-search-input"
            placeholder="과목명 또는 과목코드를 입력하세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="sbc-select-modal-btn" onClick={openSelectModal}>📋 과목 목록에서 선택</button>
          <button className="sbc-search-btn" onClick={handleSearch}>🔍 검색</button>
          {executedSearchTerm && (
            <button className="sbc-search-reset" onClick={() => {
              setSearchTerm('');
              setExecutedSearchTerm('');
              setSelectedCourseId('');
            }}>초기화</button>
          )}
        </div>

        {selectedCourseId && (
          <div className="sbc-stats">
            <div className="sbc-stat"><div className="sbc-stat-dot" style={{ background: '#3B82F6' }} /><div className="sbc-stat-label">전체 수강생</div><div className="sbc-stat-val">{students.length}<span className="sbc-stat-unit"> 명</span></div></div>
            <div className="sbc-stat"><div className="sbc-stat-dot" style={{ background: '#10B981' }} /><div className="sbc-stat-label">정상</div><div className="sbc-stat-val" style={{ color: '#059669' }}>{safeCount}<span className="sbc-stat-unit"> 명</span></div></div>
            <div className="sbc-stat"><div className="sbc-stat-dot" style={{ background: '#F59E0B' }} /><div className="sbc-stat-label">주의 ({policy.warningThreshold}회+)</div><div className="sbc-stat-val" style={{ color: '#D97706' }}>{warningCount}<span className="sbc-stat-unit"> 명</span></div></div>
            <div className="sbc-stat"><div className="sbc-stat-dot" style={{ background: '#EF4444' }} /><div className="sbc-stat-label">위험 ({policy.dangerThreshold}회+)</div><div className="sbc-stat-val" style={{ color: '#EF4444' }}>{dangerCount}<span className="sbc-stat-unit"> 명</span></div></div>
          </div>
        )}

        <div className="sbc-card">
          {isLoading ? (
            <div className="sbc-loading">데이터 동기화 중...</div>
          ) : !selectedCourseId ? (
            <div className="sbc-empty">상단 검색창 또는 과목 목록 버튼을 통해 과목을 지정해 주세요.</div>
          ) : (
            <div className="sbc-table-wrap">
              <table className="sbc-table">
                <thead>
                  <tr>
                    <th>No</th><th>학과</th><th>분반</th><th>학번</th><th className="th-name">성명</th><th>국적</th>
                    {WEEK_LABELS.map(w => <th key={w}>{w}주</th>)}
                    <th>결석</th><th>평가</th><th>평점</th><th>이수학점</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length > 0 ? students.map((student, idx) => {
                    const calcAbsent = student.attendances?.filter(a => a.status === 2 || a.statusLabel === '결석').length || 0;
                    const totalAbsent = student.totalAbsent !== undefined ? student.totalAbsent : calcAbsent;

                    // 명세서 기준 정책값으로 평가
                    const isDanger  = totalAbsent >= policy.dangerThreshold;
                    const isWarning = totalAbsent >= policy.warningThreshold && totalAbsent < policy.dangerThreshold;
                    const evalLabel = isDanger ? '위험' : isWarning ? '주의' : '';
                    const evalClass = isDanger ? 'eval-danger' : isWarning ? 'eval-warning' : '';

                    return (
                      <tr key={student.studentId || idx}>
                        <td>{idx + 1}</td>
                        <td>{student.deptName || '–'}</td>
                        <td>{student.classSec || selectedCourse?.classSec || classSec || '–'}</td>
                        <td>{student.studentId}</td>
                        <td className="td-name">{student.studentName}</td>
                        <td>{student.nationality || '–'}</td>
                        {Array.from({ length: 15 }).map((_, i) => {
                          const attendance = student.attendances?.find(a => a.weekNo === i + 1);
                          const d = getStatusDisplay(attendance?.status);
                          return (
                            <td key={i}>
                              {attendance
                                ? <span className="week-cell" style={{ background: d.bg, color: d.color }}>{d.label}</span>
                                : '–'}
                            </td>
                          );
                        })}
                        <td><span className="absent-val">{totalAbsent}</span></td>
                        <td>{evalLabel ? <span className={`eval-badge ${evalClass}`}>{evalLabel}</span> : '–'}</td>
                        <td>{student.gpa || '–'}</td>
                        <td>{student.credits || student.totalCredits || '–'}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={WEEK_LABELS.length + 10} style={{ padding: '3rem', color: '#94A3B8' }}>
                        등록된 수강생 목록이 비어 있습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isSelectModalOpen && (
        <div className="sbc-modal-overlay" onClick={() => setIsSelectModalOpen(false)}>
          <div className="sbc-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="sbc-modal-header">
              <div className="sbc-modal-title">📂 전체 개설 과목 선택 목록</div>
              <button className="sbc-modal-close" onClick={() => setIsSelectModalOpen(false)}>×</button>
            </div>
            <div className="sbc-modal-body">
              {allCourses.length > 0 ? (
                <div className="sbc-modal-grid">
                  {allCourses.map((course) => (
                    <button key={course.courseId} className="sbc-modal-list-item" onClick={() => handleSelectFromModal(course)}>
                      <span>
                        <strong>{course.courseName}</strong>
                        <span style={{ marginLeft: 6, fontSize: 11, color: '#64748B' }}>
                          ({course.grade ? `${course.grade}학년` : ''} {course.classSec ? `${course.classSec}반` : ''})
                        </span>
                      </span>
                      <span className="sbc-modal-course-id">{course.courseId}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem 0' }}>
                  개설되어 있는 전체 과목 데이터가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}