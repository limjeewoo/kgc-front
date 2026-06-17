import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import TopBar from '../../../components/layout/TopBar.jsx';

const STATUS_MAP = {
  null: { label: '-', class: 'wc-none' },
  1: { label: '출', class: 'wc-ok' },
  2: { label: '결', class: 'wc-abs' },
  3: { label: '지', class: 'wc-late' },
  4: { label: '공', class: 'wc-pub' }
};

// API 값을 숫자/null로 정규화
const normalizeStatus = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
};

// STATUS_MAP 안전 조회
const getMapping = (val) => {
  const key = val === null || val === undefined ? 'null' : val;
  return STATUS_MAP[key] || STATUS_MAP['null'];
};

export default function AttendanceInput() {
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [studentsData, setStudentsData] = useState([]);
  const [originalStudentsData, setOriginalStudentsData] = useState([]);
  const [modifiedCells, setModifiedCells] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const courseRes = await api.get('/api/v1/courses?semesterId=2026-1');
        if (courseRes.data?.success && courseRes.data.data) {
          setCourses(courseRes.data.data);
          if (courseRes.data.data.length > 0) {
            setSelectedCourseId(courseRes.data.data[0].courseId);
          }
        }
      } catch (error) {
        console.error("초기 데이터 로드 실패:", error);
      }
    };
    fetchInitialData();
  }, [navigate]);

  useEffect(() => {
    if (!selectedCourseId) return;

    const fetchAttendance = async () => {
      try {
        setIsLoading(true);
        setModifiedCells(new Set());

        const res = await api.get(`/api/v1/courses/${selectedCourseId}/attendances`);
        if (res.data?.success && res.data.data) {
          // attend 배열의 각 값을 숫자/null로 정규화
          const normalized = res.data.data.map(student => ({
            ...student,
            attend: (student.attend || []).map(normalizeStatus),
          }));
          setStudentsData(normalized);
          setOriginalStudentsData(JSON.parse(JSON.stringify(normalized)));
        } else {
          setStudentsData([]);
          setOriginalStudentsData([]);
        }
      } catch (error) {
        console.error("출결 데이터 로드 실패:", error);
        setStudentsData([]);
        setOriginalStudentsData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedCourseId]);

  const toggleAttendance = (studentId, weekIndex) => {
    setStudentsData(prev => prev.map(student => {
      if (student.studentId === studentId) {
        const newAttend = [...student.attend];
        const current = normalizeStatus(newAttend[weekIndex]);
        const next = current === null ? 1 : current >= 4 ? null : current + 1;
        newAttend[weekIndex] = next;

        setModifiedCells(prevSet => {
          const newSet = new Set(prevSet);
          newSet.add(`${studentId}_${weekIndex}`);
          return newSet;
        });

        return { ...student, attend: newAttend };
      }
      return student;
    }));
  };

  const handleSave = async () => {
    if (modifiedCells.size === 0) return;
    try {
      setIsSaving(true);
      const savePromises = [];

      studentsData.forEach(student => {
        const originalStudent = originalStudentsData.find(o => o.studentId === student.studentId);
        if (!originalStudent) return;

        student.attend.forEach((currentStatus, weekIdx) => {
          if (currentStatus !== originalStudent.attend[weekIdx]) {
            const attendId = student.attendIds ? student.attendIds[weekIdx] : null;
            if (attendId) {
              savePromises.push(
                api.patch(`/api/v1/attendances/${attendId}`, { status: currentStatus })
              );
            }
          }
        });
      });

      await Promise.all(savePromises);
      alert('출결 변경 사항이 성공적으로 반영되었습니다.');
      setModifiedCells(new Set());
      setOriginalStudentsData(JSON.parse(JSON.stringify(studentsData)));
    } catch (error) {
      console.error("출결 데이터 수정 실패:", error);
      alert('데이터 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#F0F2F7', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .ai-body { padding: 2rem; flex: 1; overflow-y: auto; animation: fadeUp 0.3s ease; font-family:'DM Sans','Noto Sans KR',sans-serif; }
        .ai-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; }
        .ai-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem; }
        .ai-desc { font-size: 0.875rem; color: #6B7280; }
        .ai-controls { display: flex; gap: 1rem; align-items: center; }
        .ai-select { padding: 0.625rem 1rem; border-radius: 0.5rem; border: 1px solid #D1D5DB; font-size: 0.875rem; outline: none; min-width: 18rem; background: #fff; cursor: pointer; }
        .ai-select:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .ai-btn-save { padding: 0.625rem 1.25rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: 0.2s; border: none; }
        .ai-btn-save.active { background: #3B82F6; color: #fff; box-shadow: 0 2px 4px rgba(59,130,246,0.25); }
        .ai-btn-save.active:hover { background: #2563EB; }
        .ai-btn-save.disabled { background: #E5E7EB; color: #9CA3AF; cursor: not-allowed; }
        .ai-card { background: #fff; border-radius: 1rem; border: 1px solid #E5E7EB; box-shadow: 0 1px 3px rgba(0,0,0,0.02); overflow: hidden; }
        .legend-bar { display: flex; align-items: center; gap: 1.25rem; padding: 1rem 1.5rem; border-bottom: 1px solid #F3F4F6; background: #FAFAFA; }
        .legend-item { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: #4B5563; font-weight: 500; }
        .legend-cell { width: 1.375rem; height: 1.375rem; border-radius: 0.3125rem; display: flex; align-items: center; justify-content: center; font-size: 0.6875rem; font-weight: 700; border: 1px solid transparent; }
        .grid-container { overflow-x: auto; max-height: calc(100vh - 15rem); }
        .ai-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 60rem; }
        .ai-table th { background: #F9FAFB; padding: 0.875rem 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6B7280; text-align: center; border-bottom: 1px solid #E5E7EB; white-space: nowrap; position: sticky; top: 0; z-index: 10; }
        .ai-table td { padding: 0.625rem 0.5rem; border-bottom: 1px solid #F3F4F6; text-align: center; vertical-align: middle; }
        .sticky-col { position: sticky; left: 0; background: #fff; z-index: 5; border-right: 2px solid #F3F4F6; text-align: left !important; padding-left: 1.5rem !important; }
        .ai-table th.sticky-col { z-index: 15; background: #F9FAFB; }
        .student-name { font-size: 0.875rem; font-weight: 600; color: #111827; }
        .student-id { font-size: 0.75rem; color: #9CA3AF; font-family: monospace; }
        .click-cell { width: 2.25rem; height: 2.25rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; font-size: 0.8125rem; font-weight: 700; margin: 0 auto; border: 1px solid transparent; cursor: pointer; transition: all 0.15s; user-select: none; }
        .click-cell:hover { transform: scale(1.08); box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
        .click-cell.modified { border: 2px dashed #3B82F6; }
        .wc-ok { background: #EFF6FF; color: #3B82F6; border-color: #BFDBFE; }
        .wc-abs { background: #FEF2F2; color: #DC2626; border-color: #FECACA; }
        .wc-late { background: #FFFBEB; color: #D97706; border-color: #FDE68A; }
        .wc-pub { background: #F0FDF4; color: #16A34A; border-color: #A7F3D0; }
        .wc-none { background: #F3F4F6; color: #D1D5DB; border-color: #E5E7EB; }
      `}</style>

      <TopBar title="출결 관리" />

      <div className="ai-body">
        <div className="ai-header">
          <div>
            <h1 className="ai-title">출결 일괄 입력</h1>
            <p className="ai-desc">학기별 개설 교과목을 선택하고 출결 상태를 클릭하여 수정하세요.</p>
          </div>
          <div className="ai-controls">
            <select className="ai-select" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
              {courses.length === 0 && <option value="">개설된 과목 데이터를 불러올 수 없습니다</option>}
              {courses.map(course => (
                <option key={course.courseId} value={course.courseId}>{course.courseName} ({course.courseId})</option>
              ))}
            </select>
            <button
              className={`ai-btn-save ${modifiedCells.size > 0 ? 'active' : 'disabled'}`}
              onClick={handleSave}
              disabled={modifiedCells.size === 0 || isSaving}
            >
              {isSaving ? '저장 중...' : '변경사항 저장'}
            </button>
          </div>
        </div>

        <div className="ai-card">
          <div className="legend-bar">
            <div className="legend-item"><div className="legend-cell wc-ok">출</div>출석</div>
            <div className="legend-item"><div className="legend-cell wc-abs">결</div>결석</div>
            <div className="legend-item"><div className="legend-cell wc-late">지</div>지각</div>
            <div className="legend-item"><div className="legend-cell wc-pub">공</div>공결</div>
            <div className="legend-item"><div className="legend-cell wc-none">-</div>미입력</div>
          </div>

          <div className="grid-container">
            <table className="ai-table">
              <thead>
                <tr>
                  <th className="sticky-col" style={{ minWidth: '12rem' }}>수강생 정보</th>
                  {[...Array(15)].map((_, i) => <th key={i}>{i + 1}주차</th>)}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="16" style={{ padding: '4rem', color: '#9CA3AF' }}>데이터 로딩 중...</td></tr>
                ) : studentsData.length === 0 ? (
                  <tr><td colSpan="16" style={{ padding: '4rem', color: '#9CA3AF' }}>선택한 과목에 배정된 수강생 및 출결 이력이 존재하지 않습니다.</td></tr>
                ) : (
                  studentsData.map((student) => (
                    <tr key={student.studentId}>
                      <td className="sticky-col">
                        <div className="student-name">{student.studentName}</div>
                        <div className="student-id">{student.department || '학과 정보 없음'} · {student.studentId}</div>
                      </td>
                      {(student.attend || []).map((statusValue, weekIdx) => {
                        const mapping = getMapping(statusValue);
                        const isModified = modifiedCells.has(`${student.studentId}_${weekIdx}`);
                        return (
                          <td key={weekIdx}>
                            <div
                              className={`click-cell ${mapping.class} ${isModified ? 'modified' : ''}`}
                              onClick={() => toggleAttendance(student.studentId, weekIdx)}
                            >
                              {mapping.label}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}