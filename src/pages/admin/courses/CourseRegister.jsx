import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';

export default function CourseRegister({ isOpen, onClose, onSuccess }) {
  // 기본 입력 폼 상태
  const initialForm = {
    semesterId: '2025-1',
    departmentId: 'CS01',
    courseType: '전공필수',
    courseId: '',
    courseName: '',
    credits: 3,
    isOnline: false
  };

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  // 모달이 열릴 때마다 폼을 초기 상태로 비워줍니다.
  useEffect(() => {
    if (isOpen) {
      setFormData(initialForm);
    }
  }, [isOpen]);

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null;

  // 일반 텍스트/셀렉트 입력 처리
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 온라인 여부 토글 스위치 처리
  const handleToggle = () => {
    setFormData(prev => ({ ...prev, isOnline: !prev.isOnline }));
  };

  // 폼 제출 (API 연동)
  const handleSubmit = async (e) => {
    e.preventDefault(); // 페이지 새로고침 방지
    setLoading(true);

    try {
      // 💡 백엔드 API 연동 시 아래 주석을 해제하세요.
      // const res = await api.post('/api/v1/courses', formData);
      // if (res.data.success) { ... }

      // [임시] API 호출 대기 시간 시뮬레이션
      setTimeout(() => {
        alert(`'${formData.courseName}' 과목이 성공적으로 등록되었습니다.`);
        setLoading(false);
        
        // 새로 등록된 데이터를 부모(CourseList)로 전달하여 목록에 즉시 추가되게 함
        onSuccess({
          ...formData,
          professorName: null // 신규 과목이므로 아직 교수는 없음
        });
        
        onClose(); // 모달 닫기
      }, 600);

    } catch (error) {
      console.error('과목 등록 실패:', error);
      alert('등록에 실패했습니다. 입력 정보를 확인해 주세요.');
      setLoading(false);
    }
  };

  return (
    <div className="cr-overlay">
      <style>{`
        /* 모달 전체 화면 덮개 */
        .cr-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(17, 24, 39, 0.4); backdrop-filter: blur(2px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
        
        /* 모달 본체 */
        .cr-modal { background: #fff; width: 100%; max-width: 520px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); display: flex; flex-direction: column; overflow: hidden; animation: cr-fade-up 0.3s ease-out; }
        @keyframes cr-fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        /* 헤더 */
        .cr-header { padding: 20px 24px; border-bottom: 1px solid #F3F4F6; display: flex; justify-content: space-between; align-items: center; }
        .cr-title { font-size: 1.125rem; font-weight: 700; color: #111827; }
        .cr-close-btn { background: transparent; border: none; font-size: 1.5rem; color: #9CA3AF; cursor: pointer; transition: 0.2s; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .cr-close-btn:hover { background: #F3F4F6; color: #111827; }

        /* 바디 (입력 폼) */
        .cr-body { padding: 24px; display: grid; gap: 20px; max-height: 75vh; overflow-y: auto; }
        .cr-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cr-group { display: flex; flex-direction: column; gap: 6px; }
        .cr-label { font-size: 0.8125rem; font-weight: 600; color: #374151; }
        .cr-label span { color: #EF4444; margin-left: 2px; } /* 필수입력 빨간별 */
        
        .cr-input, .cr-select { padding: 10px 14px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 0.875rem; color: #111827; font-family: inherit; transition: 0.2s; outline: none; background: #fff; }
        .cr-input:focus, .cr-select:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .cr-input::placeholder { color: #9CA3AF; }

        /* 온라인 여부 토글 스위치 (특화 디자인) */
        .cr-toggle-box { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; cursor: pointer; }
        .cr-toggle-text { display: flex; flex-direction: column; }
        .cr-toggle-main { font-size: 0.875rem; font-weight: 600; color: #111827; }
        .cr-toggle-sub { font-size: 0.75rem; color: #64748B; margin-top: 2px; }
        
        .cr-switch { width: 44px; height: 24px; background: #CBD5E1; border-radius: 24px; position: relative; transition: 0.3s; }
        .cr-switch.on { background: #3B82F6; }
        .cr-knob { width: 18px; height: 18px; background: #fff; border-radius: 50%; position: absolute; top: 3px; left: 3px; transition: 0.3s; box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
        .cr-switch.on .cr-knob { left: 23px; }

        /* 푸터 (버튼) */
        .cr-footer { padding: 16px 24px; border-top: 1px solid #F3F4F6; background: #F9FAFB; display: flex; justify-content: flex-end; gap: 10px; }
        .cr-btn { padding: 10px 18px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; transition: 0.2s; font-family: inherit; }
        .cr-btn-cancel { background: #fff; border: 1px solid #D1D5DB; color: #4B5563; }
        .cr-btn-cancel:hover { background: #F3F4F6; }
        .cr-btn-submit { background: #1A3A5C; color: #fff; }
        .cr-btn-submit:hover { background: #112740; }
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
                  <option value="2025-1">2025년 1학기</option>
                  <option value="2024-2">2024년 2학기</option>
                </select>
              </div>
              <div className="cr-group">
                <label className="cr-label">개설 학과<span>*</span></label>
                <select name="departmentId" value={formData.departmentId} onChange={handleChange} className="cr-select" required>
                  <option value="CS01">컴퓨터소프트웨어과</option>
                  <option value="BS01">국제통상과</option>
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