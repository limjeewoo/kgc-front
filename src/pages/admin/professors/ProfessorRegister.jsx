import React, { useState } from 'react';
import axios from 'axios';

// 1. API 인스턴스 설정 (공통 설정)
const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

// 인터셉터: 로그인된 토큰을 헤더에 자동 포함
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const ProfessorRegister = ({ onComplete, onCancel }) => {
  // 2. 폼 데이터 상태 관리 (명세서 규격과 필드명 일치)
  const [formData, setFormData] = useState({
    professorId: '',
    deptId: '',
    name: '',
    email: '',
    phone: '',
  });

  const [isLoading, setIsLoading] = useState(false);

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
      /** * [명세서 6.1] 교수 등록 API 호출
       * 성공 시 백엔드 DB에 데이터가 INSERT 됨
       */
      const response = await api.post('/api/v1/professors', formData);

      if (response.data.success) {
        alert('성공적으로 DB에 저장되었습니다.');
        
        // 4. 등록 완료 후 처리 (목록 새로고침 로직 호출)
        if (onComplete) {
          onComplete(); // 부모 컴포넌트(목록 화면)를 리프레시하게 만듦
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

        <div className="input-row">
          <label>학과 코드</label>
          <input 
            className="input-field"
            name="deptId"
            value={formData.deptId}
            onChange={handleChange}
            placeholder="예: CS01"
            required
          />
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