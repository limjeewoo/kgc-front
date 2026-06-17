import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../../api/axios';

// 백엔드(GRADE_INPUT)가 허용하는 등급 값만 선택할 수 있도록 고정 목록 사용
// → 자유 텍스트 입력 시 발생하던 400 Bad Request 방지
const GRADE_OPTIONS = ['A+', 'A0', 'B+', 'B0', 'C+', 'C0', 'D+', 'D0', 'F', 'P', 'NP'];

export default function GradeTab({ readOnly = false, studentId: studentIdProp }) {
  const params = useParams();
  
  // 1. 디버깅을 위해 콘솔 확인 (id가 정상적으로 매핑되는지 확인용)
  const id = studentIdProp || params.studentId || params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  
  const [editTargetId, setEditTargetId] = useState(null);
  const [editGrade, setEditGrade] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchEnrollments = async () => {
    // 2. 🚨 [수정] id가 유효하지 않을 때 로딩 상태를 false로 풀고 리턴합니다.
    if (!id || id === 'new' || id === 'undefined') {
      console.warn("GradeTab: 유효한 studentId가 전달되지 않았습니다. 현재 id 값 ->", id);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const res = await api.get(`/api/v1/students/${id}/enrollments`);
      if (res.data.success) {
        setEnrollments(res.data.data || []);
      }
    } catch (e) {
      console.error('수강 내역 조회 실패:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [id]);

  const handleEditClick = (enrollment) => {
    setEditTargetId(enrollment.enrollId);
    // 기존 등급이 선택 목록에 있는 값이면 그대로, 없으면 빈 값(선택 안 함)으로 시작
    setEditGrade(GRADE_OPTIONS.includes(enrollment.grade) ? enrollment.grade : '');
  };

  const handleCancelEdit = () => {
    setEditTargetId(null);
    setEditGrade('');
  };

  // A-2 / B-3: PATCH /api/v1/enrollments/{enrollId}/grade
  // body는 { grade: "A+" } 형태로 grade만 전송 (gradePoint는 보내지 않음 — 백엔드가 자동 계산)
  const handleSaveGrade = async (enrollId) => {
    if (!editGrade) {
      alert('성적 등급을 선택해주세요. (예: A+, B0, F)');
      return;
    }

    try {
      setIsSaving(true);
      const payload = { grade: editGrade };

      const res = await api.patch(`/api/v1/enrollments/${enrollId}/grade`, payload);

      if (res.data.success) {
        alert('성적이 정상적으로 반영되었습니다.');
        setEditTargetId(null);
        setEditGrade('');
        fetchEnrollments();
      } else {
        alert(`저장 실패: ${res.data.message}`);
      }
    } catch (e) {
      alert(e.response?.data?.message || '성적 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div style={{ padding: '5rem', textAlign: 'center', color: '#9CA3AF' }}>수강 및 성적 데이터 로드 중...</div>
  );

  // 3. 🚨 [추가] 만약 로딩은 끝났는데 id가 유효하지 않다면 안내 메시지 표시
  if (!id || id === 'new' || id === 'undefined') {
    return (
      <div style={{ padding: '5rem', textAlign: 'center', color: '#9CA3AF' }}>
        ⚠️ 학생 정보가 올바르지 않거나 신규 등록 중에는 성적을 입력할 수 없습니다.
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans','Noto Sans KR',sans-serif", fontSize: '0.875rem', color: '#111827', padding: '1.25rem', background: '#FDFDFD', minHeight: '100vh' }}>
      <style>{`
        .bt-info-card { background: #fff; border-radius: 14px; border: 1px solid #F1F5F9; padding: 1.25rem; margin-bottom: 1.5rem; }
        .bt-info-card-title { font-size: 0.95rem; font-weight: 700; border-bottom: 1px solid #F3F4F6; padding-bottom: 0.75rem; margin-bottom: 1rem; color: #1A3A5C; display: flex; justify-content: space-between; align-items: center; }
        .bt-readonly-banner { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px; font-size: 12px; color: #D97706; font-weight: 600; margin-bottom: 1rem; }
        
        .bt-form-select { padding: 5px 8px; border: 1.5px solid #E5E7EB; border-radius: 6px; font-size: 13px; background: #fff; font-family: inherit; outline: none; transition: border-color .15s; text-align: center; cursor: pointer; }
        .bt-form-select:focus { border-color: #93C5FD; }
        .bt-submit-btn { background: #1A3A5C; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px; font-family: inherit; transition: background .15s; }
        .bt-submit-btn:hover { background: #15304e; }
        .bt-submit-btn:disabled { background: #94A3B8; cursor: not-allowed; }
        .bt-edit-btn { background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; padding: 5px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px; font-family: inherit; transition: all .15s; }
        .bt-edit-btn:hover { background: #DBEAFE; border-color: #93C5FD; }
        .bt-cancel-btn { background: #F3F4F6; color: #374151; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px; font-family: inherit; transition: background .15s; margin-right: 6px; }
        .bt-cancel-btn:hover { background: #E5E7EB; }

        .gt-table { width: 100%; border-collapse: collapse; text-align: left; }
        .gt-th { padding: 0.75rem 1rem; background: #F8FAFC; color: #64748B; font-weight: 600; font-size: 12px; border-bottom: 2px solid #E2E8F0; }
        .gt-td { padding: 0.875rem 1rem; border-bottom: 1px solid #F1F5F9; color: #334155; vertical-align: middle; }
        .gt-tr:hover { background: #F8FAFC; }
        .gt-credit-badge { display: inline-block; padding: 2px 8px; background: #F1F5F9; color: #475569; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .gt-grade-badge { display: inline-block; padding: 4px 10px; background: #ECFDF5; color: #059669; border-radius: 6px; font-size: 13px; font-weight: 700; }
        .gt-empty { text-align: center; padding: 3rem; color: #9CA3AF; font-size: 13px; }
      `}</style>

      {readOnly && (
        <div className="bt-readonly-banner">
          🔒 조회 권한으로 접속 중입니다. 성적 수정은 관리자(GRADE_INPUT 권한)만 가능합니다.
        </div>
      )}

      <div className="bt-info-card">
        <div className="bt-info-card-title">
          <span>수강 및 성적 내역</span>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
            총 {enrollments.length}건
          </span>
        </div>

        {enrollments.length === 0 ? (
          <div className="gt-empty">등록된 수강 내역이 없습니다.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="gt-table">
              <thead>
                <tr>
                  <th className="gt-th">이수 년도/학기</th>
                  <th className="gt-th">과목명</th>
                  <th className="gt-th" style={{ textAlign: 'center' }}>학점</th>
                  <th className="gt-th" style={{ textAlign: 'center' }}>등급 (Grade)</th>
                  <th className="gt-th" style={{ textAlign: 'center' }}>평점 (Point)</th>
                  {!readOnly && <th className="gt-th" style={{ textAlign: 'center' }}>관리</th>}
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enroll) => {
                  const isEditing = editTargetId === enroll.enrollId;

                  return (
                    <tr key={enroll.enrollId} className="gt-tr">
                      <td className="gt-td">{enroll.year}년 {enroll.semester}학기</td>
                      <td className="gt-td" style={{ fontWeight: 600 }}>{enroll.courseName}</td>
                      <td className="gt-td" style={{ textAlign: 'center' }}>
                        <span className="gt-credit-badge">{enroll.credit}학점</span>
                      </td>
                      
                      <td className="gt-td" style={{ textAlign: 'center' }}>
                        {isEditing ? (
                          <select
                            className="bt-form-select"
                            style={{ width: '70px' }}
                            value={editGrade}
                            onChange={(e) => setEditGrade(e.target.value)}
                            autoFocus
                          >
                            <option value="">선택</option>
                            {GRADE_OPTIONS.map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        ) : (
                          enroll.grade ? <span className="gt-grade-badge">{enroll.grade}</span> : '-'
                        )}
                      </td>

                      <td className="gt-td" style={{ textAlign: 'center', color: '#64748B' }}>
                        {enroll.gradePoint !== null && enroll.gradePoint !== undefined 
                          ? enroll.gradePoint.toFixed(1) 
                          : '-'}
                      </td>

                      {!readOnly && (
                        <td className="gt-td" style={{ textAlign: 'center' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                              <button 
                                className="bt-cancel-btn" 
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                              >
                                취소
                              </button>
                              <button 
                                className="bt-submit-btn" 
                                onClick={() => handleSaveGrade(enroll.enrollId)}
                                disabled={isSaving}
                              >
                                {isSaving ? '저장중' : '저장'}
                              </button>
                            </div>
                          ) : (
                            <button 
                              className="bt-edit-btn" 
                              onClick={() => handleEditClick(enroll)}
                            >
                              성적 입력
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}