import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// 1. API 설정 및 인터셉터
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

/**
 * 출결 상태 코드 매핑
 * 1=출석(1), 2=결석(X), 3=지각(▲), 4=공결(공)
 */
const getStatusDisplay = (code) => {
  switch (code) {
    case 1: return { label: '1', color: '#374151', bg: 'transparent' };
    case 2: return { label: 'X', color: '#EF4444', bg: '#FEF2F2' };
    case 3: return { label: '▲', color: '#D97706', bg: '#FFFBEB' };
    case 4: return { label: '공', color: '#16A34A', bg: '#F0FDF4' };
    default: return { label: '', color: '#D1D5DB', bg: 'transparent' };
  }
};

export default function SearchByCourse({ deptId, classSec, onBack }) {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseData, setCourseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [policy, setPolicy] = useState({ warningThreshold: 3, dangerThreshold: 6 });

  // A. 초기 로드
  useEffect(() => {
    const initData = async () => {
      if (!deptId || !classSec) return;
      try {
        const courseRes = await api.get('/api/v1/search/class', { 
          params: { deptId, classSec } 
        });
        if (courseRes.data.success) {
          const courses = courseRes.data.data || [];
          setAvailableCourses(courses);
          if (courses.length > 0) setSelectedCourseId(courses[0].courseId);
        }

        const policyRes = await api.get('/api/v1/policies/attend');
        if (policyRes.data.success) {
          setPolicy(policyRes.data.data);
        }
      } catch (error) {
        console.error("초기 데이터 로드 실패:", error);
      }
    };
    initData();
  }, [deptId, classSec]);

  // B. 과목 상세 정보 조회
  const fetchCourseDetail = useCallback(async () => {
    if (!selectedCourseId) return;
    setIsLoading(true);
    try {
      const res = await api.get('/api/v1/search/course', { 
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

  return (
    <div style={{ backgroundColor: '#F3F4F6', minHeight: '100vh', padding: '20px' }}>
      <style>{`
        .excel-container { background: #fff; border: 1px solid #D1D5DB; overflow-x: auto; position: relative; }
        .excel-table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }
        .excel-table th { background: #E5E7EB; border: 1px solid #D1D5DB; padding: 8px 2px; color: #374151; font-weight: 600; position: sticky; top: 0; z-index: 10; }
        .excel-table td { border: 1px solid #D1D5DB; padding: 6px 4px; text-align: center; white-space: nowrap; }
        .sticky-name { position: sticky; left: 0; background: #fff; z-index: 5; border-right: 2px solid #D1D5DB !important; }
        .bg-gray { background: #F9FAFB; }
        .badge { padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; }
        .badge-danger { background: #EF4444; color: #fff; }
        .badge-warning { background: #F59E0B; color: #fff; }
        .badge-caution { background: #FBBF24; color: #1F2937; }
        .tab-menu { display: flex; gap: 2px; margin-bottom: 15px; }
        .tab-item { padding: 10px 20px; border: 1px solid #D1D5DB; background: #fff; cursor: pointer; font-size: 13px; font-weight: 600; }
        .tab-item.active { background: #1E3A8A; color: #fff; border-color: #1E3A8A; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={onBack} style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>←</button>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>과목별 수강생 출결 관리</h1>
        </div>
      </div>

      <div className="tab-menu">
        {availableCourses.map(course => (
          <div 
            key={course.courseId} 
            className={`tab-item ${selectedCourseId === course.courseId ? 'active' : ''}`}
            onClick={() => setSelectedCourseId(course.courseId)}
          >
            {course.courseName}
          </div>
        ))}
      </div>

      {isLoading ? (
        <div style={{ padding: '50px', textAlign: 'center', color: '#6B7280' }}>데이터 로딩 중...</div>
      ) : (
        <div className="excel-container">
          <table className="excel-table">
            {/* 수정 포인트: col 태그 사이의 공백을 제거하여 Hydration 에러 방지 */}
            <colgroup>
              <col width="40px" /><col width="110px" /><col width="50px" /><col width="90px" /><col width="140px" /><col width="80px" />
              {WEEK_LABELS.map((_, i) => <col key={i} width="32px" />)}
              <col width="50px" /><col width="70px" /><col width="60px" /><col width="70px" />
            </colgroup>
            <thead>
              <tr>
                <th>No</th>
                <th>학과</th>
                <th>분반</th>
                <th>학번</th>
                <th>성명 (English Name)</th>
                <th>국적</th>
                {WEEK_LABELS.map(w => <th key={w}>{w}</th>)}
                <th>결석</th>
                <th>평가</th>
                <th>평점</th>
                <th>이수학점</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? students.map((student, idx) => {
                const totalAbsent = student.totalAbsent || 0;
                
                let evalLabel = '';
                let badgeClass = '';
                if (totalAbsent >= policy.dangerThreshold) {
                  evalLabel = '위험';
                  badgeClass = 'badge-danger';
                } else if (totalAbsent >= policy.warningThreshold) {
                  evalLabel = '경고';
                  badgeClass = 'badge-warning';
                } else if (totalAbsent > 0) {
                  evalLabel = '주의';
                  badgeClass = 'badge-caution';
                }

                return (
                  <tr key={student.studentId}>
                    <td className="bg-gray">{idx + 1}</td>
                    <td>{student.deptName || '-'}</td>
                    <td>{student.classSec || classSec}</td>
                    <td>{student.studentId}</td>
                    <td className="sticky-name" style={{ textAlign: 'left', fontWeight: '600' }}>
                      {student.engName || student.korName}
                    </td>
                    <td>{student.nationality || '-'}</td>
                    
                    {Array.from({ length: 15 }).map((_, i) => {
                      const weekNo = i + 1;
                      const attendance = student.attendances?.find(a => a.weekNo === weekNo);
                      const display = getStatusDisplay(attendance?.status);
                      return (
                        <td key={weekNo} style={{ backgroundColor: display.bg, color: display.color, fontWeight: 'bold' }}>
                          {display.label}
                        </td>
                      );
                    })}

                    <td style={{ color: totalAbsent > 0 ? '#EF4444' : 'inherit', fontWeight: 'bold' }}>
                      {totalAbsent}
                    </td>
                    <td>
                      {evalLabel && <span className={`badge ${badgeClass}`}>{evalLabel}</span>}
                    </td>
                    <td>{student.gpa || '-'}</td>
                    <td>{student.totalCredits || '-'}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={WEEK_LABELS.length + 10} style={{ padding: '40px', color: '#9CA3AF' }}>수강생 데이터가 존재하지 않습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}