import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = 'http://localhost:8080';

const fmtDate = (d) => d ? d.replace(/-/g, '. ') : '-';

export default function VisaTab({ studentId }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [visaHistory, setVisaHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [visaInfo, setVisaInfo] = useState({
    visaType: 'D-2',
    issueDate: '',
    expireDate: ''
  });

  const api = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
  });

  const switchMenu = (menuName) => {
    window.dispatchEvent(
      new CustomEvent('switch-admin-menu', {
        detail: { menu: menuName }
      })
    );
  };

  const fetchVisaData = async () => {
    if (!studentId) return;
    try {
      setIsLoading(true);

      const [studentRes, visaRes] = await Promise.all([
        api.get(`/api/v1/students/${studentId}`).catch(() => ({ data: null })),
        api.get(`/api/v1/students/${studentId}/visas`).catch(() => ({ data: [] }))
      ]);

      if (studentRes.data?.success) {
        setSelectedStudent(studentRes.data.data);
      } else if (studentRes.data) {
        setSelectedStudent(studentRes.data);
      }

      let rawList = [];
      if (visaRes.data?.success) {
        rawList = visaRes.data.data || [];
      } else if (Array.isArray(visaRes.data)) {
        rawList = visaRes.data;
      }

      const sortedHistory = [...rawList].sort(
        (a, b) => new Date(b.expireDate || '') - new Date(a.expireDate || '')
      );
      setVisaHistory(sortedHistory);

      if (sortedHistory.length > 0) {
        const currentVisa = sortedHistory.find(v => v.isCurrent) || sortedHistory[0];
        setVisaInfo({
          visaType: currentVisa.visaType || 'D-2',
          issueDate: currentVisa.issueDate || '',
          expireDate: currentVisa.expireDate || ''
        });
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!studentId) {
      alert('비자를 등록할 학생이 선택되지 않았습니다. 학생 목록에서 대상을 선택해 주세요.');
      switchMenu('학생 목록');
      return;
    }

    fetchVisaData();
  }, [studentId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setVisaInfo(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'issueDate' && updated.expireDate && updated.expireDate < value) {
        updated.expireDate = '';
      }
      return updated;
    });
  };

  const handleBackToStudentList = () => {
    switchMenu('학생 목록');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...visaInfo,
        isCurrent: true 
      };

      const response = await api.post(`/api/v1/students/${studentId}/visas`, payload);
      
      if (response.data?.success || response.status === 200 || response.status === 201) {
        alert(`${selectedStudent?.korName || '해당'} 학생의 비자 정보 등록이 완료되었습니다.`);
        switchMenu('학생 목록');
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (visaId) => {
    if (!visaId) {
      alert('삭제할 항목의 식별자(ID)가 올바르지 않습니다.');
      return;
    }

    if (!window.confirm('해당 비자 체류 이력을 정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await api.delete(`/api/v1/visas/${visaId}`);
      
      if (response.data?.success || response.status === 200) {
        alert('비자 체류 이력이 성공적으로 삭제되었습니다.');
        fetchVisaData();
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || '삭제 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="main-content">
      <style>{`
        .main-content { padding: 1.5rem 1.75rem; background: #F0F2F7; min-height: 100vh; font-family: 'DM Sans', 'Noto Sans KR', sans-serif; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .page-title { font-size: 1.375rem; font-weight: 700; color: #111827; margin: 0; }
        .tab-desc { font-size: 0.8125rem; color: #6B7280; margin: 0.25rem 0 0 0; }
        .visa-tab-wrapper { background: #fff; border-radius: 0.875rem; padding: 1.5rem; border: 1px solid #E5E7EB; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); margin-bottom: 1.5rem; }
        .selected-student-panel { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 0.5rem; padding: 1.25rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #1A3A5C; }
        .student-info-meta h4 { margin: 0 0 0.375rem 0; font-size: 1.0625rem; color: #0F172A; font-weight: 700; }
        .student-info-meta p { margin: 0; font-size: 0.875rem; color: #475569; }
        .student-info-meta span { font-weight: 600; color: #1A3A5C; }
        .badge-target { background: #E2E8F0; color: #475569; font-size: 0.75rem; padding: 0.375rem 0.75rem; border-radius: 1rem; font-weight: 600; }
        .section-subtitle { font-size: 0.9375rem; font-weight: 700; color: #111827; margin: 0 0 1.25rem 0; padding-bottom: 0.75rem; border-bottom: 1px solid #F3F4F6; }
        .visa-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
        .form-group.full { grid-column: span 2; }
        .form-group label { font-size: 0.8125rem; font-weight: 600; color: #374151; }
        .form-group input, .form-group select { padding: 0.625rem 0.875rem; border: 1px solid #E5E7EB; border-radius: 0.5rem; font-size: 0.875rem; background: #fff; transition: border-color 0.2s; }
        .form-group input:focus, .form-group select:focus { border-color: #1A3A5C; outline: none; box-shadow: 0 0 0 1px #1A3A5C; }
        .action-row { grid-column: span 2; margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 0.5rem; border-top: 1px solid #F3F4F6; padding-top: 1.25rem; }
        .btn-cancel { background: #fff; border: 1px solid #D1D5DB; color: #374151; padding: 0.625rem 1.25rem; border-radius: 0.5rem; font-size: 0.8125rem; cursor: pointer; font-weight: 600; transition: all 0.2s; }
        .btn-cancel:hover { background: #F9FAFB; border-color: #9CA3AF; color: #1F2937; }
        .btn-submit { background: #1A3A5C; color: #fff; border: none; padding: 0.625rem 1.5rem; border-radius: 0.5rem; font-size: 0.8125rem; cursor: pointer; font-weight: 600; transition: background-color 0.2s; }
        .btn-submit:hover { background: #112740; }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .history-table { width: 100%; border-collapse: collapse; text-align: left; }
        .history-table th { background: #F9FAFB; color: #6B7280; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; padding: 0.875rem 1.25rem; border-bottom: 1px solid #F3F4F6; }
        .history-table td { padding: 1rem 1.25rem; border-bottom: 1px solid #F9FAFB; font-size: 0.875rem; color: #111827; }
        .chip-current-true { background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; padding: 0.25rem 0.625rem; border-radius: 1.25rem; font-size: 0.6875rem; font-weight: 600; display: inline-flex; }
        .chip-current-false { background: #F3F4F6; color: #6B7280; border: 1px solid #E5E7EB; padding: 0.25rem 0.625rem; border-radius: 1.25rem; font-size: 0.6875rem; font-weight: 600; display: inline-flex; }
        .btn-delete { background: #EF4444; color: #fff; border: none; padding: 0.375rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; cursor: pointer; font-weight: 600; transition: background-color 0.2s; }
        .btn-delete:hover { background: #DC2626; }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">체류 자격(비자) 정보 등록</h1>
          <p className="tab-desc">외국인 유학생의 비자 코드 정보 및 기한 만료일을 조회하고 갱신 처리합니다.</p>
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', color: '#1A3A5C', fontSize: '0.875rem', marginBottom: '1.5rem', fontWeight: 600 }}>
          🔄 학생 프로필 및 비자 이력 동기화 중...
        </div>
      )}

      <div className="visa-tab-wrapper">
        {selectedStudent && (
          <div className="selected-student-panel">
            <div className="student-info-meta">
              <h4>{selectedStudent.korName || '이름 없음'} {selectedStudent.engName ? `(${selectedStudent.engName})` : ''}</h4>
              <p>
                학번: <span>{selectedStudent.studentId || selectedStudent.id}</span> &nbsp;|&nbsp; 
                국적: <span>{selectedStudent.nationality || '-'}</span> &nbsp;|&nbsp; 
                소속: <span>{selectedStudent.department || selectedStudent.deptName || '-'}</span>
              </p>
            </div>
            <span className="badge-target">대상 학생 지정됨</span>
          </div>
        )}

        <h3 className="section-subtitle">신규 비자 정보 등록</h3>

        <form onSubmit={handleSubmit} className="visa-form-grid">
          <div className="form-group">
            <label>비자 발급일 </label>
            <input type="date" name="issueDate" value={visaInfo.issueDate} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label>체류 만료일</label>
            <input type="date" name="expireDate" value={visaInfo.expireDate} min={visaInfo.issueDate} onChange={handleInputChange} required />
          </div>

          <div className="form-group full">
            <label>비자 자격 코드</label>
            <select name="visaType" value={visaInfo.visaType} onChange={handleInputChange}>
              <option value="D-2">D-2 (유학)</option>
              <option value="D-4">D-4 (일반연수)</option>
              <option value="F-2">F-2 (거주)</option>
              <option value="E-7">E-7 (특정활동)</option>
            </select>
          </div>

          <div className="action-row">
            <button type="button" className="btn-cancel" onClick={handleBackToStudentList}>취소</button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>

      <div className="visa-tab-wrapper" style={{ padding: '1.25rem 0 0 0', overflow: 'hidden' }}>
        <div style={{ padding: '0 1.5rem 1rem 1.5rem' }}>
          <h3 className="section-subtitle" style={{ margin: 0, border: 'none', padding: 0 }}>비자 현황 목록</h3>
        </div>

        <table className="history-table">
          <thead>
            <tr>
              <th>비자 종류</th>
              <th>발급일</th>
              <th>만료일</th>
              <th>현재 비자 여부</th>
              <th style={{ textAlign: 'center' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {visaHistory.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>
                  등록된 과거 비자 체류 이력이 없습니다.
                </td>
              </tr>
            ) : (
              visaHistory.map((item, idx) => (
                <tr key={item.visaId || item.id || idx}>
                  <td style={{ fontWeight: 600, color: '#1A3A5C' }}>
                    {item.visaType ? `${item.visaType}` : '-'}
                  </td>
                  <td style={{ color: '#4B5563' }}>{fmtDate(item.issueDate)}</td>
                  <td style={{ fontWeight: 600, color: '#4B5563' }}>{fmtDate(item.expireDate)}</td>
                  <td>
                    {item.isCurrent ? (
                      <span className="chip-current-true">현재 비자</span>
                    ) : (
                      <span className="chip-current-false">이전 이력</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      type="button" 
                      className="btn-delete"
                      onClick={() => handleDelete(item.visaId || item.id)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}