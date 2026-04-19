import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import CourseRegister from './CourseRegister.jsx'; // 등록 모달 컴포넌트 임포트

// ─── 더미 데이터 (API 연동 전 테스트용) ──────────────────────────────
const DUMMY_COURSES = [
  { courseId: 'CS-JAVA-01', courseName: 'Java 프로그래밍 기초', credits: 3, isOnline: false, courseType: '전공필수', departmentId: 'CS01', semesterId: '2025-1', professorName: '홍길동' },
  { courseId: 'CS-DB-01', courseName: '데이터베이스 시스템', credits: 3, isOnline: false, courseType: '전공필수', departmentId: 'CS01', semesterId: '2025-1', professorName: '김영희' },
  { courseId: 'LIB-KOR-01', courseName: '외국인을 위한 실용 한국어', credits: 2, isOnline: true, courseType: '교양필수', departmentId: 'COMMON', semesterId: '2025-1', professorName: null },
  { courseId: 'LIB-ENG-01', courseName: '글로벌 영어회화', credits: 2, isOnline: true, courseType: '교양선택', departmentId: 'COMMON', semesterId: '2025-1', professorName: '제임스' },
  { courseId: 'BS-TRD-01', courseName: '국제무역실무', credits: 3, isOnline: false, courseType: '전공선택', departmentId: 'BS01', semesterId: '2025-1', professorName: '이경영' },
];

export default function CourseList({ onBack }) {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterDept, setFilterDept] = useState('ALL');

  // 모달창 열림/닫힘 상태를 관리하는 State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // 데이터 로딩 시뮬레이션 (API 명세서: GET /api/v1/courses)
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setCourses(DUMMY_COURSES);
      setIsLoading(false);
    }, 400);
  }, []);

  const handleDelete = (courseId, courseName) => {
    if (window.confirm(`'${courseName}' 과목을 정말 삭제하시겠습니까?`)) {
      setCourses(courses.filter(c => c.courseId !== courseId));
      alert('삭제되었습니다.');
    }
  };

  const handleAssignProfessor = (courseName) => {
    alert(`'${courseName}' 과목의 담당 교수를 배정하는 팝업이 열립니다.`);
  };

  // 필터 적용
  const displayedCourses = filterDept === 'ALL' 
    ? courses 
    : courses.filter(c => c.departmentId === filterDept || c.departmentId === 'COMMON');

  return (
    <div className="course-list-container">
      <style>{`
        /* 기존 레이아웃 보호를 위해 .course-list-container 내부로 스타일 격리 */
        .course-list-container { font-family: 'DM Sans', 'Noto Sans KR', sans-serif; color: #111827; }

        /* 탑바 영역 */
        .cl-topbar { background: #fff; padding: 0 28px; height: 58px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E5E7EB; margin-bottom: 24px; border-radius: 12px; }
        .cl-topbar-left { display: flex; align-items: center; gap: 10px; }
        .cl-back-btn { width: 30px; height: 30px; border-radius: 7px; background: #F3F4F6; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #374151; transition: 0.15s; }
        .cl-back-btn:hover { background: #E5E7EB; }
        .cl-breadcrumb { font-size: 13px; color: #9CA3AF; }
        .cl-breadcrumb span { color: #111827; font-weight: 600; }
        .cl-register-btn { background: #1A3A5C; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.15s; }
        .cl-register-btn:hover { background: #112740; }

        /* 필터 영역 */
        .cl-filter-card { background: #fff; border-radius: 14px; border: 1px solid #F3F4F6; padding: 16px 22px; margin-bottom: 18px; display: flex; gap: 16px; align-items: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .cl-filter-label { font-size: 12px; font-weight: 700; color: #6B7280; margin-right: 8px; }
        .cl-select { padding: 8px 12px; border-radius: 8px; border: 1px solid #E5E7EB; font-size: 13px; color: #111827; outline: none; min-width: 160px; cursor: pointer; }

        /* 과목 리스트 테이블 */
        .cl-card { background: #fff; border-radius: 14px; border: 1px solid #F3F4F6; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .cl-table { width: 100%; border-collapse: collapse; text-align: left; }
        .cl-table th { background: #F8FAFC; padding: 14px 20px; font-size: 12px; font-weight: 600; color: #64748B; border-bottom: 1px solid #E2E8F0; }
        .cl-table td { padding: 14px 20px; font-size: 13px; border-bottom: 1px solid #F1F5F9; vertical-align: middle; }
        .cl-table tr:hover td { background: #F8FAFC; }

        /* 배지 및 아이콘 스타일 */
        .cl-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; display: inline-block; }
        .badge-online { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
        .badge-offline { background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; }
        .badge-major { background: #F3F4F6; color: #4B5563; }
        .badge-liberal { background: #FFFBEB; color: #D97706; }

        .cl-course-name { font-weight: 700; color: #111827; font-size: 14px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
        .cl-course-id { font-size: 12px; color: #9CA3AF; font-family: monospace; }
        
        .cl-action-btn { padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; background: #F3F4F6; color: #374151; transition: 0.2s; }
        .cl-action-btn:hover { background: #E5E7EB; }
        .btn-assign { background: #EFF6FF; color: #1D4ED8; margin-right: 6px; }
        .btn-assign:hover { background: #DBEAFE; }
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
        {/* 등록 버튼 클릭 시 모달 열기 */}
        <button className="cl-register-btn" onClick={() => setIsRegisterModalOpen(true)}>
          + 신규 과목 등록
        </button>
      </div>

      {/* 검색 필터 */}
      <div className="cl-filter-card">
        <div>
          <span className="cl-filter-label">학과 기준</span>
          <select className="cl-select" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
            <option value="ALL">전체 학과 보기</option>
            <option value="CS01">컴퓨터소프트웨어과</option>
            <option value="BS01">국제통상과</option>
          </select>
        </div>
        <div>
          <span className="cl-filter-label">학기</span>
          <select className="cl-select" defaultValue="2025-1">
            <option value="2025-1">2025년 1학기</option>
            <option value="2024-2">2024년 2학기</option>
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
              {displayedCourses.map((course) => (
                <tr key={course.courseId}>
                  <td>
                    <div className="cl-course-name">
                      {course.courseName}
                    </div>
                    <div className="cl-course-id">{course.courseId} • {course.departmentId === 'COMMON' ? '공통교양' : '학과전공'}</div>
                  </td>
                  <td>
                    <span className={`cl-badge ${course.courseType.includes('전공') ? 'badge-major' : 'badge-liberal'}`}>
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
                    {course.professorName ? (
                      <span style={{ fontWeight: 600, color: '#1A3A5C' }}>👨‍🏫 {course.professorName} 교수</span>
                    ) : (
                      <span style={{ color: '#EF4444', fontSize: '12px', fontWeight: 600 }}>배정 필요</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="cl-action-btn btn-assign" onClick={() => handleAssignProfessor(course.courseName)}>
                      {course.professorName ? '교수 변경' : '교수 배정'}
                    </button>
                    <button className="cl-action-btn btn-delete" onClick={() => handleDelete(course.courseId, course.courseName)}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 신규 과목 등록 모달 컴포넌트 삽입 */}
      <CourseRegister 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
        onSuccess={(newCourse) => setCourses(prev => [newCourse, ...prev])} 
      />

    </div>
  );
}