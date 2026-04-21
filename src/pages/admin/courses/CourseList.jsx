import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import CourseRegister from './CourseRegister.jsx';

export default function CourseList({ onBack }) {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]); // 학과 목록
  const [semesters, setSemesters] = useState([]);     // 학기 목록
  const [isLoading, setIsLoading] = useState(true);
  
  // 필터 상태
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterSemester, setFilterSemester] = useState('');

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // 1. 데이터 초기 로드 (과목, 학과, 학기)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [courseRes, deptRes, semesterRes] = await Promise.all([
          api.get('/api/v1/courses'),
          api.get('/api/v1/depts'),
          api.get('/api/v1/semesters')
        ]);

        if (courseRes.data.success) setCourses(courseRes.data.data);
        if (deptRes.data.success) setDepartments(deptRes.data.data);
        if (semesterRes.data.success) {
          setSemesters(semesterRes.data.data);
          // 현재 학기 조회 API가 있다면 해당 값을 초기값으로 설정 가능
          const current = semesterRes.data.data.find(s => s.isCurrent);
          if (current) setFilterSemester(current.semesterId);
        }
      } catch (error) {
        console.error("데이터 로드 실패:", error);
        alert("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. 과목 삭제 (ADMIN 전용)
  const handleDelete = async (courseId, courseName) => {
    if (!window.confirm(`'${courseName}' 과목을 정말 삭제하시겠습니까?`)) return;

    try {
      const res = await api.delete(`/api/v1/courses/${courseId}`);
      if (res.data.success) {
        setCourses(prev => prev.filter(c => c.courseId !== courseId));
        alert('삭제되었습니다.');
      }
    } catch (error) {
      const msg = error.response?.data?.message || "삭제에 실패했습니다.";
      alert(msg);
    }
  };

  // 3. 담당 교수 배정 (팝업/모달 연결용)
  const handleAssignProfessor = (courseId, courseName) => {
    // 명세서 9번: POST /api/v1/courses/{courseId}/professors 연동 필요
    alert(`'${courseName}' 과목의 담당 교수 배정 기능은 구현 예정입니다.`);
  };

  // 4. 클라이언트 사이드 필터링 logic
  const displayedCourses = courses.filter(c => {
    const matchDept = filterDept === 'ALL' || c.departmentId === filterDept || c.departmentId === 'COMMON';
    const matchSemester = filterSemester === '' || c.semesterId === filterSemester;
    return matchDept && matchSemester;
  });

  return (
    <div className="course-list-container">
      <style>{`
        .course-list-container { font-family: 'DM Sans', 'Noto Sans KR', sans-serif; color: #111827; }
        .cl-topbar { background: #fff; padding: 0 28px; height: 58px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E5E7EB; margin-bottom: 24px; border-radius: 12px; }
        .cl-topbar-left { display: flex; align-items: center; gap: 10px; }
        .cl-back-btn { width: 30px; height: 30px; border-radius: 7px; background: #F3F4F6; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #374151; transition: 0.15s; }
        .cl-back-btn:hover { background: #E5E7EB; }
        .cl-breadcrumb { font-size: 13px; color: #9CA3AF; }
        .cl-breadcrumb span { color: #111827; font-weight: 600; }
        .cl-register-btn { background: #1A3A5C; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.15s; }
        .cl-register-btn:hover { background: #112740; }
        .cl-filter-card { background: #fff; border-radius: 14px; border: 1px solid #F3F4F6; padding: 16px 22px; margin-bottom: 18px; display: flex; gap: 16px; align-items: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .cl-filter-label { font-size: 12px; font-weight: 700; color: #6B7280; margin-right: 8px; }
        .cl-select { padding: 8px 12px; border-radius: 8px; border: 1px solid #E5E7EB; font-size: 13px; color: #111827; outline: none; min-width: 160px; cursor: pointer; }
        .cl-card { background: #fff; border-radius: 14px; border: 1px solid #F3F4F6; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .cl-table { width: 100%; border-collapse: collapse; text-align: left; }
        .cl-table th { background: #F8FAFC; padding: 14px 20px; font-size: 12px; font-weight: 600; color: #64748B; border-bottom: 1px solid #E2E8F0; }
        .cl-table td { padding: 14px 20px; font-size: 13px; border-bottom: 1px solid #F1F5F9; vertical-align: middle; }
        .cl-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; display: inline-block; }
        .badge-online { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
        .badge-offline { background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; }
        .badge-major { background: #F3F4F6; color: #4B5563; }
        .badge-liberal { background: #FFFBEB; color: #D97706; }
        .cl-course-name { font-weight: 700; color: #111827; font-size: 14px; margin-bottom: 4px; }
        .cl-course-id { font-size: 12px; color: #9CA3AF; font-family: monospace; }
        .cl-action-btn { padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; background: #F3F4F6; color: #374151; transition: 0.2s; }
        .btn-assign { background: #EFF6FF; color: #1D4ED8; margin-right: 6px; }
        .btn-delete { color: #DC2626; background: transparent; }
        .btn-delete:hover { background: #FEF2F2; }
      `}</style>

      {/* 상단 네비게이션 */}
      <div className="cl-topbar">
        <div className="cl-topbar-left">
          <button className="cl-back-btn" onClick={onBack}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="cl-breadcrumb">학사 관리 › <span>과목 관리</span></div>
        </div>
        <button className="cl-register-btn" onClick={() => setIsRegisterModalOpen(true)}>
          + 신규 과목 등록
        </button>
      </div>

      {/* 검색 필터 - 서버 데이터 연동 */}
      <div className="cl-filter-card">
        <div>
          <span className="cl-filter-label">학과 기준</span>
          <select className="cl-select" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
            <option value="ALL">전체 학과 보기</option>
            {departments.map(dept => (
              <option key={dept.deptId} value={dept.deptId}>{dept.deptName}</option>
            ))}
          </select>
        </div>
        <div>
          <span className="cl-filter-label">학기</span>
          <select className="cl-select" value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
            <option value="">전체 학기</option>
            {semesters.map(sem => (
              <option key={sem.semesterId} value={sem.semesterId}>
                {sem.year}년 {sem.term}학기 {sem.isCurrent && '(현재)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 과목 리스트 테이블 */}
      <div className="cl-card">
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF' }}>과목 데이터를 불러오는 중입니다...</div>
        ) : (
          <table className="cl-table">
            <thead>
              <tr>
                <th>과목 정보</th>
                <th>이수 구분</th>
                <th>학점</th>
                <th>수업 방식</th>
                <th>담당 교수</th>
                <th style={{ textAlign: 'right' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {displayedCourses.length > 0 ? (
                displayedCourses.map((course) => (
                  <tr key={course.courseId}>
                    <td>
                      <div className="cl-course-name">{course.courseName}</div>
                      <div className="cl-course-id">{course.courseId} • {course.departmentId}</div>
                    </td>
                    <td>
                      <span className={`cl-badge ${course.courseType?.includes('전공') ? 'badge-major' : 'badge-liberal'}`}>
                        {course.courseType}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{course.credits}학점</td>
                    <td>
                      {course.isOnline ? (
                        <span className="cl-badge badge-online">💻 100% 온라인</span>
                      ) : (
                        <span className="cl-badge badge-offline">대면 수업</span>
                      )}
                    </td>
                    <td>
                      {/* 명세서에는 course 조회 시 professorName이 포함되지 않을 수 있으므로 API 응답 구조에 따라 조정 필요 */}
                      {course.professorName ? (
                        <span style={{ fontWeight: 600, color: '#1A3A5C' }}>👨‍🏫 {course.professorName} 교수</span>
                      ) : (
                        <span style={{ color: '#EF4444', fontSize: '12px', fontWeight: 600 }}>배정 필요</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="cl-action-btn btn-assign" onClick={() => handleAssignProfessor(course.courseId, course.courseName)}>
                        {course.professorName ? '교수 변경' : '교수 배정'}
                      </button>
                      <button className="cl-action-btn btn-delete" onClick={() => handleDelete(course.courseId, course.courseName)}>
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>조건에 맞는 과목이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 등록 성공 시 목록을 다시 불러오거나 상태 업데이트 */}
      <CourseRegister 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
        onSuccess={() => {
          // 과목 재조회
          api.get('/api/v1/courses').then(res => {
            if(res.data.success) setCourses(res.data.data);
          });
        }} 
      />
    </div>
  );
}