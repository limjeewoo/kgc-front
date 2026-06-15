import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = 'http://localhost:8080';

const fmtDate = (d) => d ? d.replace(/-/g, '. ') : '-';

export default function TopikTab({ studentId }) {
  const [student, setStudent] = useState(null);
  const [topikHistory, setTopikHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [topikInfo, setTopikInfo] = useState({
    topikLevel: 1,
    examDate: '',
    instituteName: '',
    instituteLevel: '',
    koreanStartDate: '',
    basicTestResult: ''
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

  // 삭제 후 목록 리프레시를 위해 useEffect 외부로 로직 추출
  const fetchTopikData = async () => {
    if (!studentId) return;
    try {
      setIsLoading(true);

      const [studentRes, topikRes] = await Promise.all([
        api.get(`/api/v1/students/${studentId}`).catch(() => ({ data: null })),
        api.get(`/api/v1/students/${studentId}/topik`).catch(() => ({ data: [] }))
      ]);

      if (studentRes.data?.success) {
        setStudent(studentRes.data.data);
      } else if (studentRes.data) {
        setStudent(studentRes.data);
      }

      let rawList = [];
      if (topikRes.data?.success) {
        rawList = topikRes.data.data?.topiks || topikRes.data.data || [];
      } else if (Array.isArray(topikRes.data)) {
        rawList = topikRes.data;
      }

      const sortedHistory = [...rawList].sort(
        (a, b) => new Date(b.examDate || '') - new Date(a.examDate || '')
      );
      setTopikHistory(sortedHistory);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!studentId) {
      alert('대상 학생이 지정되지 않았습니다. 학생 목록으로 이동합니다.');
      switchMenu('학생 목록');
      return;
    }

    fetchTopikData();
  }, [studentId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTopikInfo(prev => ({
      ...prev,
      [name]: (name === 'topikLevel' || name === 'instituteLevel') && value ? Number(value) : value
    }));
  };

  const handleBackToStudentList = () => {
    switchMenu('학생 목록');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId) return alert('학생 정보가 없습니다.');

    setIsSubmitting(true);
    try {
      const response = await api.post(`/api/v1/students/${studentId}/topik`, topikInfo);

      if (response.data?.success || response.status === 200 || response.status === 201) {
        alert('TOPIK/어학 성적이 성공적으로 저장되었습니다.');
        switchMenu('학생 목록');
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || '서버 전송 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 삭제 처리 핸들러 함수
  const handleDelete = async (langId) => {
    if (!langId) {
      alert('삭제할 항목의 식별자(ID)가 올바르지 않습니다.');
      return;
    }

    if (!window.confirm('해당 어학 성적 이력을 정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await api.delete(`/api/v1/topik/${langId}`);
      
      if (response.data?.success || response.status === 200) {
        alert('성적 이력이 성공적으로 삭제되었습니다.');
        fetchTopikData(); // 삭제 후 목록 최신화
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

        .topik-tab-wrapper { background: #fff; border-radius: 0.875rem; padding: 1.5rem; border: 1px solid #E5E7EB; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); margin-bottom: 1.5rem; }

        .selected-student-panel { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 0.5rem; padding: 1.25rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #1A3A5C; }
        .student-info-meta h4 { margin: 0 0 0.375rem 0; font-size: 1.0625rem; color: #0F172A; font-weight: 700; }
        .student-info-meta p { margin: 0; font-size: 0.875rem; color: #475569; }
        .student-info-meta span { font-weight: 600; color: #1A3A5C; }
        .badge-target { background: #E2E8F0; color: #475569; font-size: 0.75rem; padding: 0.375rem 0.75rem; border-radius: 1rem; font-weight: 600; }

        .section-subtitle { font-size: 0.9375rem; font-weight: 700; color: #111827; margin: 0 0 1.25rem 0; padding-bottom: 0.75rem; border-bottom: 1px solid #F3F4F6; }

        .topik-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
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
        
        .chip-topik-level { background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; padding: 0.25rem 0.625rem; border-radius: 1.25rem; font-size: 0.6875rem; font-weight: 600; display: inline-flex; }
        .institute-sub { color: #6B7280; font-size: 0.75rem; margin-left: 0.375rem; }

        /* 삭제 버튼 스타일 추가 */
        .btn-delete { background: #EF4444; color: #fff; border: none; padding: 0.375rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; cursor: pointer; font-weight: 600; transition: background-color 0.2s; }
        .btn-delete:hover { background: #DC2626; }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">TOPIK 및 어학 성적 등록</h1>
          <p className="tab-desc">외국인 유학생의 한국어 능력 시험 급수 및 연계 어학원 수강 정보를 관리합니다.</p>
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', color: '#1A3A5C', fontSize: '0.875rem', marginBottom: '1.5rem', fontWeight: 600 }}>
          🔄 학생 프로필 동기화 중...
        </div>
      )}

      <div className="topik-tab-wrapper">
        {student && (
          <div className="selected-student-panel">
            <div className="student-info-meta">
              <h4>{student.korName || '이름 없음'} {student.engName ? `(${student.engName})` : ''}</h4>
              <p>
                학번: <span>{student.studentId || student.id}</span> &nbsp;|&nbsp; 
                국적: <span>{student.nationality || '-'}</span> &nbsp;|&nbsp; 
                소속: <span>{student.department || student.deptName || '-'}</span>
              </p>
            </div>
            <span className="badge-target">대상 학생 지정됨</span>
          </div>
        )}

        <h3 className="section-subtitle">신규 어학 성적 등록</h3>
        
        <form onSubmit={handleSubmit} className="topik-form-grid">
          <div className="form-group">
            <label>TOPIK 급수</label>
            <select name="topikLevel" value={topikInfo.topikLevel} onChange={handleInputChange} required>
              <option value="1">1급</option>
              <option value="2">2급</option>
              <option value="3">3급</option>
              <option value="4">4급</option>
              <option value="5">5급</option>
              <option value="6">6급</option>
            </select>
          </div>

          <div className="form-group">
            <label>시험일</label>
            <input type="date" name="examDate" value={topikInfo.examDate} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label>어학원명</label>
            <input type="text" name="instituteName" value={topikInfo.instituteName} onChange={handleInputChange} placeholder="예: 서울한국어학원" />
          </div>

          <div className="form-group">
            <label>어학원 수강급수</label>
            <input type="number" name="instituteLevel" value={topikInfo.instituteLevel} onChange={handleInputChange} placeholder="숫자로 입력 (예: 4)" />
          </div>

          <div className="form-group">
            <label>한국어학습 시작년월</label>
            <input type="date" name="koreanStartDate" value={topikInfo.koreanStartDate} onChange={handleInputChange} />
          </div>

          <div className="form-group">
            <label>기초한국어능력평가 결과</label>
            <input type="text" name="basicTestResult" value={topikInfo.basicTestResult} onChange={handleInputChange} placeholder="결과 입력 (예: 48)" />
          </div>

          <div className="action-row">
            <button type="button" className="btn-cancel" onClick={handleBackToStudentList}>취소</button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>

      <div className="topik-tab-wrapper" style={{ padding: '1.25rem 0 0 0', overflow: 'hidden' }}>
        <div style={{ padding: '0 1.5rem 1rem 1.5rem' }}>
          <h3 className="section-subtitle" style={{ margin: 0, border: 'none', padding: 0 }}>과거 취득 이력 목록</h3>
        </div>

        <table className="history-table">
          <thead>
            <tr>
              <th>시험일</th>
              <th>TOPIK 급수</th>
              <th>어학원 정보</th>
              <th>한국어학습 시작년월</th>
              <th>기초한국어능력평가</th>
              <th style={{ textAlign: 'center' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {topikHistory.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}> {/* colSpan을 6으로 확장 */}
                  등록된 과거 TOPIK/어학 이력이 없습니다.
                </td>
              </tr>
            ) : (
              topikHistory.map((item, idx) => (
                <tr key={item.langId || item.id || item.topikId || idx}>
                  <td style={{ fontWeight: 600, color: '#4B5563' }}>{fmtDate(item.examDate)}</td>
                  <td>
                    <span className="chip-topik-level">
                      {item.topikLevel ? `${item.topikLevel}급` : '-'}
                    </span>
                  </td>
                  <td>
                    {item.instituteName ? (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontWeight: 500 }}>{item.instituteName}</span>
                        {item.instituteLevel && <span className="institute-sub">({item.instituteLevel}급 수강)</span>}
                      </div>
                    ) : '-'}
                  </td>
                  <td style={{ color: '#4B5563' }}>{fmtDate(item.koreanStartDate)}</td>
                  <td style={{ fontWeight: 600, color: '#1A3A5C' }}>{item.basicTestResult || '-'}</td>
                  <td style={{ textAlign: 'center' }}> {/* 삭제 버튼 열 구현 */}
                    <button 
                      type="button" 
                      className="btn-delete"
                      onClick={() => handleDelete(item.langId || item.id || item.topikId)}
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