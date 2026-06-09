import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// 공통 API 인스턴스 설정
const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

// 로컬 스토리지 토큰 주입 인터셉터
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
  const [availableCourses, setAvailableCourses] = useState([]); // 탭 전용 분반별 과목 리스트
  const [allCourses, setAllCourses] = useState([]);             // 명세서 팝업창 전용 전체 과목 리스트
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseData, setCourseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [policy, setPolicy] = useState({ warningThreshold: 3, dangerThreshold: 6 });

  // 검색 및 제어 스위치 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [executedSearchTerm, setExecutedSearchTerm] = useState('');
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);

  // 과목명 뒤에 붙은 불필요한 코드(예: 200609-A 등)를 제거하는 정제 함수
  const cleanCourseName = (name) => {
    if (!name) return '';
    return name.replace(/\s+\d{6}-[A-Z0-9]+.*$/i, '').trim();
  };

  // 학과 및 분반별 강의 데이터 로딩
  const initData = useCallback(async () => {
    if (!deptId || !classSec) return;
    try {
      const courseRes = await api.get('/api/v1/search/class', { params: { deptId, classSec } });
      if (courseRes.data.success) {
        const courses = (courseRes.data.data || []).map(course => ({
          ...course,
          courseName: cleanCourseName(course.courseName)
        }));
        setAvailableCourses(courses);
        if (courses.length > 0 && !selectedCourseId) setSelectedCourseId(courses[0].courseId);
      }
      const policyRes = await api.get('/api/v1/policies/attend');
      if (policyRes.data.success) setPolicy(policyRes.data.data);
    } catch (error) {
      console.error('초기 데이터 로드 오류:', error);
    }
  }, [deptId, classSec, selectedCourseId]);

  useEffect(() => { initData(); }, [initData]);

  // 명세서 API 적용: 전체 과목 조회 호출 함수
  const fetchAllCourses = async () => {
    try {
      // 명세서 1항: GET /api/v1/courses
      const res = await api.get('/api/v1/courses');
      const dataList = res.data.data || res.data || [];
      const cleanedData = dataList.map(course => ({
        ...course,
        courseName: cleanCourseName(course.courseName)
      }));
      setAllCourses(cleanedData);
    } catch (error) {
      console.error('전체 과목 목록 로드 실패:', error);
    }
  };

  const openSelectModal = () => {
    fetchAllCourses();
    setIsSelectModalOpen(true);
  };

  // 선택된 특정 과목 출결 상세 로드
  const fetchCourseDetail = useCallback(async () => {
    if (!selectedCourseId) {
      setCourseData(null);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.get('/api/v1/search/course', { params: { courseId: selectedCourseId } });
      if (res.data.success) setCourseData(res.data.data);
    } catch (error) {
      console.error('과목 상세 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => { fetchCourseDetail(); }, [selectedCourseId, fetchCourseDetail]);

  const handleSearch = () => {
    setExecutedSearchTerm(searchTerm);
    const matches = availableCourses.filter(course =>
      course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.courseId.toString().includes(searchTerm)
    );
    if (matches.length > 0) setSelectedCourseId(matches[0].courseId);
    else setSelectedCourseId('');
  };

  const handleSelectFromModal = (courseName) => {
    setSearchTerm(courseName);
    setIsSelectModalOpen(false);
  };

  const filteredCourses = availableCourses.filter(course =>
    course.courseName.toLowerCase().includes(executedSearchTerm.toLowerCase()) ||
    course.courseId.toString().includes(executedSearchTerm)
  );

  const students = courseData?.students || [];
  const dangerCount  = students.filter(s => (s.totalAbsent || 0) >= policy.dangerThreshold).length;
  const warningCount = students.filter(s => (s.totalAbsent || 0) >= policy.warningThreshold && (s.totalAbsent || 0) < policy.dangerThreshold).length;
  const safeCount    = students.length - dangerCount - warningCount;
  const selectedCourse = availableCourses.find(c => c.courseId === selectedCourseId);

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

        .sbc-stats { display: flex; gap: 10px; margin-bottom: 1.25rem; }
        .sbc-stat { background: #fff; border: 1px solid #F1F5F9; border-radius: 10px; padding: 12px 18px; display: flex; align-items: center; gap: 10px; flex: 1; }
        .sbc-stat-dot { width: 8px; height: 8px; border-radius: 50%; }
        .sbc-stat-label { font-size: 12px; color: #64748B; font-weight: 500; }
        .sbc-stat-val { font-size: 18px; font-weight: 700; color: #0F172A; margin-left: auto; }
        .sbc-stat-unit { font-size: 12px; color: #94A3B8; }

        .sbc-search-bar { display: flex; gap: 8px; margin-bottom: 1rem; background: #F8FAFC; padding: 12px; border-radius: 10px; border: 1px solid #E2E8F0; align-items: center; }
        .sbc-search-input { flex: 1; max-width: 320px; padding: 8px 14px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 13px; outline: none; }
        .sbc-search-input:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .sbc-select-modal-btn { background: #fff; color: #4B5563; border: 1px solid #D1D5DB; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; }
        .sbc-select-modal-btn:hover { background: #F3F4F6; }
        .sbc-search-btn { background: #3B82F6; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .sbc-search-btn:hover { background: #2563EB; }
        .sbc-search-reset { background: #E2E8F0; color: #475569; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }

        .sbc-tabs { display: flex; gap: 6px; margin-bottom: 1rem; flex-wrap: wrap; }
        .sbc-tab { padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid #E5E7EB; background: #fff; color: #6B7280; }
        .sbc-tab.active { background: #1A3A5C; color: #fff; border-color: #1A3A5C; }

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

        /* 모달 디자인 (확장 크기 960px 유지) */
        .sbc-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); display: flex; align-items: center; justify-content: center; z-index: 2100; animation: fadeIn 0.18s ease; }
        .sbc-modal-content { background: #fff; border-radius: 12px; width: 960px; max-height: 75vh; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); animation: scaleUp 0.18s ease; overflow: hidden; }
        .sbc-modal-header { padding: 16px 20px; border-bottom: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: space-between; }
        .sbc-modal-title { font-size: 14px; font-weight: 700; color: #1E293B; }
        .sbc-modal-close { background: none; border: none; font-size: 22px; color: #94A3B8; cursor: pointer; outline: none; }
        .sbc-modal-body { padding: 20px; overflow-y: auto; flex: 1; }
        
        .sbc-modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .sbc-modal-list-item { text-align: left; padding: 11px 14px; border: 1px solid #E2E8F0; background: #fff; border-radius: 6px; font-size: 13px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.15s; }
        .sbc-modal-list-item:hover { background: #F1F5F9; border-color: #CBD5E1; }
        .sbc-modal-course-id { font-size: 11px; color: #94A3B8; font-family: monospace; background: #F8FAFC; padding: 2px 6px; border-radius: 4px; border: 1px solid #E2E8F0; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      <div className="sbc-wrap">
        {/* 상단 타이틀 바 */}
        <div className="sbc-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="sbc-back" onClick={onBack}>← 뒤로</button>
            <div>
              <div className="sbc-title">과목별 출결 검색</div>
              <div className="sbc-subtitle">
                {selectedCourse ? `${selectedCourse.courseName} · ` : ''}수강생 주차별 출결 상세 현황
              </div>
            </div>
          </div>
        </div>

        {/* 대시보드 검색 제어존 */}
        <div className="sbc-search-bar">
          <input
            type="text"
            className="sbc-search-input"
            placeholder="과목명 또는 과목코드를 입력하세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="sbc-select-modal-btn" onClick={openSelectModal}>
            📋 과목 목록에서 선택
          </button>
          <button className="sbc-search-btn" onClick={handleSearch}>🔍 검색</button>
          
          {executedSearchTerm && (
            <button className="sbc-search-reset" onClick={() => {
              setSearchTerm('');
              setExecutedSearchTerm('');
              initData();
            }}>초기화</button>
          )}
        </div>

        {/* 통계 현황판 */}
        <div className="sbc-stats">
          <div className="sbc-stat"><div className="sbc-stat-dot" style={{ background: '#3B82F6' }} /><div className="sbc-stat-label">전체 수강생</div><div className="sbc-stat-val">{students.length}<span className="sbc-stat-unit"> 명</span></div></div>
          <div className="sbc-stat"><div className="sbc-stat-dot" style={{ background: '#10B981' }} /><div className="sbc-stat-label">정상</div><div className="sbc-stat-val" style={{ color: '#059669' }}>{safeCount}<span className="sbc-stat-unit"> 명</span></div></div>
          <div className="sbc-stat"><div className="sbc-stat-dot" style={{ background: '#F59E0B' }} /><div className="sbc-stat-label">경고</div><div className="sbc-stat-val" style={{ color: '#D97706' }}>{warningCount}<span className="sbc-stat-unit"> 명</span></div></div>
          <div className="sbc-stat"><div className="sbc-stat-dot" style={{ background: '#EF4444' }} /><div className="sbc-stat-label">위험</div><div className="sbc-stat-val" style={{ color: '#EF4444' }}>{dangerCount}<span className="sbc-stat-unit"> 명</span></div></div>
        </div>

        {/* 필터 탭 라인 */}
        <div className="sbc-tabs">
          {filteredCourses.length > 0 ? (
            filteredCourses.map(course => (
              <button key={course.courseId} className={`sbc-tab ${selectedCourseId === course.courseId ? 'active' : ''}`} onClick={() => setSelectedCourseId(course.courseId)}>
                {course.courseName}
              </button>
            ))
          ) : (
            <div style={{ fontSize: '13px', color: '#94A3B8', padding: '10px 4px' }}>조회 범위 내 일치하는 과목이 없습니다.</div>
          )}
        </div>

        {/* 메인 출결 시트 카드 */}
        <div className="sbc-card">
          {isLoading ? (
            <div className="sbc-loading">데이터 동기화 중...</div>
          ) : !selectedCourseId ? (
            <div className="sbc-empty">상단 탭 또는 검색을 통해 과목을 지정해 주세요.</div>
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
                    const totalAbsent = student.totalAbsent || 0;
                    let evalLabel = totalAbsent >= policy.dangerThreshold ? '위험' : totalAbsent >= policy.warningThreshold ? '경고' : totalAbsent > 0 ? '주의' : '';
                    let evalClass = totalAbsent >= policy.dangerThreshold ? 'eval-danger' : totalAbsent >= policy.warningThreshold ? 'eval-warning' : 'eval-caution';

                    return (
                      <tr key={student.studentId}>
                        <td>{idx + 1}</td>
                        <td>{student.deptName || '–'}</td>
                        <td>{student.classSec || classSec}</td>
                        <td>{student.studentId}</td>
                        <td className="td-name">{student.engName || student.korName}</td>
                        <td>{student.nationality || '–'}</td>
                        {Array.from({ length: 15 }).map((_, i) => {
                          const attendance = student.attendances?.find(a => a.weekNo === i + 1);
                          const d = getStatusDisplay(attendance?.status);
                          return (
                            <td key={i}>
                              {attendance ? <span className="week-cell" style={{ background: d.bg, color: d.color }}>{d.label}</span> : '–'}
                            </td>
                          );
                        })}
                        <td><span className="absent-val">{totalAbsent}</span></td>
                        <td>{evalLabel ? <span className={`eval-badge ${evalClass}`}>{evalLabel}</span> : '–'}</td>
                        <td>{student.gpa || '–'}</td>
                        <td>{student.totalCredits || '–'}</td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={WEEK_LABELS.length + 10} style={{ padding: '3rem', color: '#94A3B8' }}>등록된 수강생 목록이 비어 있습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* [명세서 API 반영] 과목 선택 팝업 모달창 (너비 960px 확장형) */}
      {isSelectModalOpen && (
        <div className="sbc-modal-overlay" onClick={() => setIsSelectModalOpen(false)}>
          <div className="sbc-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="sbc-modal-header">
              <div className="sbc-modal-title">📂 전체 개설 과목 선택 목록 (GET /api/v1/courses)</div>
              <button className="sbc-modal-close" onClick={() => setIsSelectModalOpen(false)}>×</button>
            </div>
            <div className="sbc-modal-body">
              {allCourses.length > 0 ? (
                <div className="sbc-modal-grid">
                  {allCourses.map((course) => (
                    <button key={course.courseId} className="sbc-modal-list-item" onClick={() => handleSelectFromModal(course.courseName)}>
                      <strong>{course.courseName}</strong>
                      <span className="sbc-modal-course-id">{course.courseId}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem 0' }}>개설되어 있는 전체 과목 데이터가 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}