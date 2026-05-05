import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import CourseRegister from './CourseRegister.jsx';
import CourseExcelUpload from './CourseExcelUpload.jsx';

export default function CourseList({ onBack }) {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterClass, setFilterClass] = useState('');

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // 1. 데이터 로드 (전체 과목 조회 API는 GET /api/v1/courses)
  const fetchCourses = async () => {
    try {
      const res = await api.get('/api/v1/courses');
      if (res.data.success) setCourses(res.data.data);
    } catch (err) { console.error("과목 로드 실패", err); }
  };

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
          const current = semesterRes.data.data.find(s => s.isCurrent);
          if (current) setFilterSemester(current.semesterId);
        }
      } catch (error) {
        console.error("초기 데이터 로드 실패");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. 삭제 (명세서 9번: DELETE /api/v1/courses/{courseId})
  const handleDelete = async (courseId, courseName) => {
    if (!window.confirm(`'${courseName}' 과목을 삭제하시겠습니까?`)) return;
    try {
      const res = await api.delete(`/api/v1/courses/${courseId}`);
      if (res.data.success) {
        setCourses(prev => prev.filter(c => c.courseId !== courseId));
        alert('삭제 성공');
      }
    } catch (error) {
      alert(error.response?.data?.message || "삭제 실패");
    }
  };

  // 3. 필터링 로직
  const displayedCourses = courses.filter(c => {
    const matchDept = filterDept === 'ALL' || c.departmentId === filterDept;
    const matchSemester = !filterSemester || c.semesterId === filterSemester;
    const matchGrade = !filterGrade || String(c.grade) === filterGrade;
    const matchClass = !filterClass || c.classSec === filterClass;
    return matchDept && matchSemester && matchGrade && matchClass;
  });

  return (
    <div className="course-list-container">
      <style>{`
        .course-list-container { font-family: 'DM Sans', sans-serif; color: #111827; }
        .cl-topbar { background: #fff; padding: 0 24px; height: 60px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E5E7EB; border-radius: 12px; margin-bottom: 20px; }
        .cl-btn-group { display: flex; gap: 8px; }
        .cl-excel-btn { background: #10B981; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; }
        .cl-register-btn { background: #1A3A5C; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; }
        .cl-filter-card { background: #fff; border-radius: 12px; border: 1px solid #F3F4F6; padding: 16px; margin-bottom: 16px; display: flex; flex-wrap: wrap; gap: 15px; align-items: center; }
        .cl-select { padding: 8px; border-radius: 6px; border: 1px solid #E5E7EB; font-size: 13px; }
        .cl-card { background: #fff; border-radius: 12px; border: 1px solid #F3F4F6; overflow: hidden; }
        .cl-table { width: 100%; border-collapse: collapse; }
        .cl-table th { background: #F8FAFC; padding: 12px 20px; font-size: 12px; color: #64748B; border-bottom: 1px solid #E2E8F0; text-align: left; }
        .cl-table td { padding: 14px 20px; font-size: 13px; border-bottom: 1px solid #F1F5F9; }
        .badge-type { padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; border: 1px solid #E5E7EB; }
        .online-warn { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-left: 5px; font-weight: 800; }
      `}</style>

      <div className="cl-topbar">
        <div style={{fontWeight: 700}}>과목 정보 관리</div>
        <div className="cl-btn-group">
          <button className="cl-excel-btn" onClick={() => setIsExcelModalOpen(true)}>엑셀 일괄 등록</button>
          <button className="cl-register-btn" onClick={() => setIsRegisterModalOpen(true)}>+ 신규 과목</button>
        </div>
      </div>

      <div className="cl-filter-card">
        <select className="cl-select" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
          <option value="ALL">전체 학과</option>
          {departments.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
        </select>
        <select className="cl-select" value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
          <option value="">전체 학기</option>
          {semesters.map(s => <option key={s.semesterId} value={s.semesterId}>{s.year}-{s.term}</option>)}
        </select>
        <select className="cl-select" value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
          <option value="">전체 학년</option>
          {[1,2,3,4].map(g => <option key={g} value={g}>{g}학년</option>)}
        </select>
      </div>

      <div className="cl-card">
        {isLoading ? (
          <div style={{padding:'40px', textAlign:'center'}}>데이터를 불러오는 중...</div>
        ) : (
          <table className="cl-table">
            <thead>
              <tr>
                <th>과목명(ID)</th>
                <th>이수구분</th>
                <th>학년/반</th>
                <th>수업방식/비중</th>
                <th>교수</th>
                <th style={{textAlign:'right'}}>관리</th>
              </tr>
            </thead>
            <tbody>
              {displayedCourses.map(course => (
                <tr key={course.courseId}>
                  <td>
                    <div style={{fontWeight: 700}}>{course.courseName}</div>
                    <div style={{fontSize: '11px', color:'#9CA3AF'}}>{course.courseId}</div>
                  </td>
                  <td><span className="badge-type">{course.courseType}</span></td>
                  <td>{course.grade}학년 {course.classSec}반</td>
                  <td>
                    {/* ✅ 명세서의 onlineType 적용 */}
                    <span style={{fontWeight: 600}}>{course.onlineType}</span>
                    {/* ✅ 명세서의 onlineRatio 적용 (30% 초과 시 경고) */}
                    {course.onlineRatio > 0.3 && (
                      <span className="online-warn">주의 {(course.onlineRatio * 100).toFixed(0)}%</span>
                    )}
                  </td>
                  <td>{course.professorName || '미배정'}</td>
                  <td style={{textAlign:'right'}}>
                    <button 
                      style={{color: '#DC2626', background:'none', border:'none', cursor:'pointer', fontSize:'12px'}}
                      onClick={() => handleDelete(course.courseId, course.courseName)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CourseRegister 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
        onSuccess={fetchCourses} 
      />

      <CourseExcelUpload 
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={fetchCourses}
      />
    </div>
  );
}