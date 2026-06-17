import React, { useState, useEffect } from 'react';
import api from '../../../api/axios'; // 🚀 공통 API 인스턴스 가져오기 (경로 주의!)

const ProfessorRegister = ({ onComplete, onCancel }) => {
  // 2. 폼 데이터 상태 관리
  const [formData, setFormData] = useState({
    professorId: '',
    deptId: '',
    name: '',
    email: '',
    phone: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]); // 추출된 학과 목록 상태

  // 🚀 컴포넌트 마운트 시 전체 교수 목록을 조회하여 고유한 학과(deptId) 추출
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        // 🚀 주소 앞부분 지우고 api 인스턴스 사용
        const response = await api.get('/api/v1/professors');
        
        if (response.data.success) {
          const professors = response.data.data || [];
          
          // Map을 이용해 중복 학과 제거 (deptId 기준)
          const deptMap = new Map();
          professors.forEach(prof => {
            if (prof.deptId && !deptMap.has(prof.deptId)) {
              const deptName = prof.deptName || prof.departmentName || prof.deptId;
              deptMap.set(prof.deptId, deptName);
            }
          });
          
          // 드롭다운 렌더링을 위한 배열로 변환
          const uniqueDepts = Array.from(deptMap, ([id, name]) => ({ id, name }));
          setDepartments(uniqueDepts);
        }
      } catch (error) {
        console.error('교수 목록(학과 정보) 로드 중 에러:', error);
      }
    };

    fetchDepartments();
  }, []);

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. 실제 백엔드 전송 함수 (DB 추가 로직)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 간단한 유효성 검사
    if (!formData.professorId || !formData.deptId || !formData.name) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    if (!window.confirm(`${formData.name} 교수를 신규 등록하시겠습니까?`)) return;

    setIsLoading(true);
    try {
      // 🚀 주소 앞부분 지우고 공통 api.post 사용
      const response = await api.post('/api/v1/professors', formData);

      if (response.data.success) {
        alert('성공적으로 DB에 저장되었습니다.');
        
        // 4. 등록 완료 후 처리 (목록 새로고침 로직 호출)
        if (onComplete) {
          onComplete(); 
        }
      }
    } catch (error) {
      console.error('DB 저장 중 에러 발생:', error);
      const errorMsg = error.response?.data?.message || '서버 통신 중 오류가 발생했습니다.';
      alert(`등록 실패: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <style>{`
        .register-wrapper { background: #fff; padding: 30px; border-radius: 12px; border: 1px solid #E5E7EB; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); max-width: 450px; margin: auto; }
        .form-title { font-size: 20px; font-weight: 800; color: #1E3A8A; margin-bottom: 20px; border-bottom: 2px solid #EFF6FF; padding-bottom: 10px; }
        .input-row { margin-bottom: 15px; }
        .input-row label { display: block; font-size: 13px; font-weight: 600; color: #4B5563; margin-bottom: 5px; }
        .input-field { width: 100%; padding: 12px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 14px; box-sizing: border-box; transition: all 0.2s; }
        select.input-field { appearance: auto; cursor: pointer; } /* select 스타일 추가 */
        .input-field:focus { outline: none; border-color: #1E3A8A; ring: 2px solid #DBEAFE; }
        .action-btns { display: flex; gap: 10px; margin-top: 25px; }
        .btn { flex: 1; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; border: none; font-size: 14px; }
        .btn-cancel { background: #F3F4F6; color: #4B5563; }
        .btn-save { background: #1E3A8A; color: #fff; }
        .btn-save:disabled { background: #94A3B8; cursor: not-allowed; }
        .helper-text { font-size: 11px; color: #9CA3AF; margin-top: 5px; }
      `}</style>

      <div className="form-title">교수 등록</div>

      <form onSubmit={handleSubmit}>
        <div className="input-row">
          <label>교수 사번</label>
          <input 
            className="input-field"
            name="professorId"
            value={formData.professorId}
            onChange={handleChange}
            placeholder="예: P001"
            required
          />
        </div>

        {/* 🚀 학과 코드를 입력란에서 드롭다운(Select)으로 변경 */}
        <div className="input-row">
          <label>학과 (코드)</label>
          <select 
            className="input-field"
            name="deptId"
            value={formData.deptId}
            onChange={handleChange}
            required
          >
            <option value="" disabled>학과를 선택하세요</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name === dept.id ? dept.id : `${dept.name} (${dept.id})`}
              </option>
            ))}
          </select>
        </div>

        <div className="input-row">
          <label>성명</label>
          <input 
            className="input-field"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="한글 또는 영문 성명"
            required
          />
        </div>

        <div className="input-row">
          <label>이메일</label>
          <input 
            className="input-field"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@kmgc.ac.kr"
          />
        </div>

        <div className="input-row">
          <label>연락처</label>
          <input 
            className="input-field"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="010-0000-0000"
          />
        </div>

        <p className="helper-text">※ 등록 시 초기 비밀번호는 사번과 동일하게 설정됩니다.</p>

        <div className="action-btns">
          <button type="button" className="btn btn-cancel" onClick={onCancel}>취소</button>
          <button type="submit" className="btn btn-save" disabled={isLoading}>
            {isLoading ? 'DB 저장 중...' : '교수 등록 확인'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfessorRegister;