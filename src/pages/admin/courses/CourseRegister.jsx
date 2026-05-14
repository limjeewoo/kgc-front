import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';

export default function CourseRegister({ isOpen, onClose, onSuccess }) {
  // 입력 폼 상태
  const [formData, setFormData] = useState({
    semesterId: '',
    departmentId: '',
    courseType: '전공필수',
    courseId: '',
    courseName: '',
    credits: 3,
    isOnline: false
  });

  // 셀렉트 박스용 옵션 데이터 상태
  const [depts, setDepts] = useState([]);
  const [sems, setSems] = useState([]);
  const [loading, setLoading] = useState(false);

  // 모달이 열릴 때 학과/학기 목록 로드 및 폼 초기화
  useEffect(() => {
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

  const fetchOptions = async () => {
    try {
      const [deptRes, semRes] = await Promise.all([
        api.get('/api/v1/depts'),
        api.get('/api/v1/semesters')
      ]);

      if (deptRes.data.success) setDepts(deptRes.data.data);
      if (semRes.data.success) {
        const semesterList = semRes.data.data;
        setSems(semesterList);
        
        // 초기값 설정: 현재 학기가 있으면 그것으로, 없으면 첫 번째 항목으로
        const currentSem = semesterList.find(s => s.isCurrent)?.semesterId || semesterList[0]?.semesterId;
        const firstDept = deptRes.data.data[0]?.deptId;

        setFormData(prev => ({
          ...prev,
          semesterId: currentSem || '',
          departmentId: firstDept || '',
          courseId: '',
          courseName: '',
          credits: 3,
          isOnline: false
        }));
      }
    } catch (error) {
      console.error("옵션 데이터 로드 실패:", error);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // 학점(credits)은 숫자형으로 저장
    const val = type === 'number' ? Number(value) : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleToggle = () => {
    setFormData(prev => ({ ...prev, isOnline: !prev.isOnline }));
  };

  // 폼 제출 (POST /api/v1/courses)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.semesterId || !formData.departmentId) {
      alert("학기와 학과를 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/v1/courses', formData);
      
      if (res.data.success) {
        alert(`'${formData.courseName}' 과목이 등록되었습니다.`);
        onSuccess(res.data.data); // 부모 컴포넌트에 알림
        onClose(); // 모달 닫기
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || '등록 중 오류가 발생했습니다.';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cr-overlay" onClick={onClose}>
      <style>{`
        .cr-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(17, 24, 39, 0.4); backdrop-filter: blur(2px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
        .cr-modal { background: #fff; width: 100%; max-width: 520px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); display: flex; flex-direction: column; overflow: hidden; animation: cr-fade-up 0.3s ease-out; }
        @keyframes cr-fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .cr-header { padding: 20px 24px; border-bottom: 1px solid #F3F4F6; display: flex; justify-content: space-between; align-items: center; }
        .cr-title { font-size: 1.125rem; font-weight: 700; color: #111827; }
        .cr-close-btn { background: transparent; border: none; font-size: 1.5rem; color: #9CA3AF; cursor: pointer; transition: 0.2s; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .cr-close-btn:hover { background: #F3F4F6; color: #111827; }
        .cr-body { padding: 24px; display: grid; gap: 20px; max-height: 75vh; overflow-y: auto; }
        .cr-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cr-group { display: flex; flex-direction: column; gap: 6px; }
        .cr-label { font-size: 0.8125rem; font-weight: 600; color: #374151; }
        .cr-label span { color: #EF4444; margin-left: 2px; }
        .cr-input, .cr-select { padding: 10px 14px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 0.875rem; color: #111827; font-family: inherit; transition: 0.2s; outline: none; background: #fff; }
        .cr-input:focus, .cr-select:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .cr-toggle-box { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; cursor: pointer; }
        .cr-toggle-main { font-size: 0.875rem; font-weight: 600; color: #111827; }
        .cr-toggle-sub { font-size: 0.75rem; color: #64748B; margin-top: 2px; }
        .cr-switch { width: 44px; height: 24px; background: #CBD5E1; border-radius: 24px; position: relative; transition: 0.3s; }
        .cr-switch.on { background: #3B82F6; }
        .cr-knob { width: 18px; height: 18px; background: #fff; border-radius: 50%; position: absolute; top: 3px; left: 3px; transition: 0.3s; box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
        .cr-switch.on .cr-knob { left: 23px; }
        .cr-footer { padding: 16px 24px; border-top: 1px solid #F3F4F6; background: #F9FAFB; display: flex; justify-content: flex-end; gap: 10px; }
        .cr-btn { padding: 10px 18px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; transition: 0.2s; font-family: inherit; }
        .cr-btn-cancel { background: #fff; border: 1px solid #D1D5DB; color: #4B5563; }
        .cr-btn-submit { background: #1A3A5C; color: #fff; }
        .cr-btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>

      <div className="cr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cr-header">
          <div className="cr-title">📚 신규 과목 등록</div>
          <button className="cr-close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cr-body">
            
            <div className="cr-row-2">
              <div className="cr-group">
                <label className="cr-label">개설 학기<span>*</span></label>
                <select name="semesterId" value={formData.semesterId} onChange={handleChange} className="cr-select" required>
                  {sems.map(s => (
                    <option key={s.semesterId} value={s.semesterId}>
                      {s.year}년 {s.term}학기 {s.isCurrent ? '(현재)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cr-group">
                <label className="cr-label">개설 학과<span>*</span></label>
                <select name="departmentId" value={formData.departmentId} onChange={handleChange} className="cr-select" required>
                  {depts.map(d => (
                    <option key={d.deptId} value={d.deptId}>{d.deptName}</option>
                  ))}
                  <option value="COMMON">공통 교양</option>
                </select>
              </div>
            </div>

            <div className="cr-row-2">
              <div className="cr-group">
                <label className="cr-label">이수 구분<span>*</span></label>
                <select name="courseType" value={formData.courseType} onChange={handleChange} className="cr-select" required>
                  <option value="전공필수">전공필수</option>
                  <option value="전공선택">전공선택</option>
                  <option value="교양필수">교양필수</option>
                  <option value="교양선택">교양선택</option>
                </select>
              </div>
              <div className="cr-group">
                <label className="cr-label">학점<span>*</span></label>
                <input type="number" name="credits" value={formData.credits} onChange={handleChange} min="1" max="6" className="cr-input" required />
              </div>
            </div>

            <div className="cr-group">
              <label className="cr-label">과목 코드<span>*</span></label>
              <input type="text" name="courseId" value={formData.courseId} onChange={handleChange} placeholder="예) CS-JAVA-01" className="cr-input" required />
            </div>

            <div className="cr-group">
              <label className="cr-label">과목명<span>*</span></label>
              <input type="text" name="courseName" value={formData.courseName} onChange={handleChange} placeholder="과목 이름을 입력하세요" className="cr-input" required />
            </div>

            <div className="cr-group">
              <label className="cr-label">온라인 수업 여부</label>
              <div className="cr-toggle-box" onClick={handleToggle}>
                <div className="cr-toggle-text">
                  <span className="cr-toggle-main">100% 온라인 강의입니다.</span>
                  <span className="cr-toggle-sub">유학생의 온라인 30% 초과 모니터링에 반영됩니다.</span>
                </div>
                <div className={`cr-switch ${formData.isOnline ? 'on' : ''}`}>
                  <div className="cr-knob" />
                </div>
              </div>
            </div>

          </div>

          <div className="cr-footer">
            <button type="button" className="cr-btn cr-btn-cancel" onClick={onClose} disabled={loading}>취소</button>
            <button type="submit" className="cr-btn cr-btn-submit" disabled={loading}>
              {loading ? '등록 중...' : '과목 등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}