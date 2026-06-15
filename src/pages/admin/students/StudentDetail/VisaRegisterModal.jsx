import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../../api/axios.js';

export default function VisaTab() {
  const navigate = useNavigate();
  const { id: studentId } = useParams(); 

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visaHistory, setVisaHistory] = useState([]);

  const [visaInfo, setVisaInfo] = useState({
    visaType: 'D-2',
    passportNumber: '',
    visaNumber: '',
    issuingAuthority: '',
    issueDate: '',
    expireDate: '',
    memo: ''
  });

  useEffect(() => {
    if (!studentId) return;

    const fetchStudentAndVisaDetails = async () => {
      setIsLoading(true);
      try {
        const studentRes = await api.get(`/api/v1/students/${studentId}`);
        if (studentRes.data?.success) {
          setSelectedStudent(studentRes.data.data);
        } else {
          setSelectedStudent(studentRes.data);
        }

        try {
          const visaRes = await api.get(`/api/v1/students/${studentId}/visas`);
          const visasList = visaRes.data?.success ? visaRes.data.data : visaRes.data;
          
          if (Array.isArray(visasList) && visasList.length > 0) {
            setVisaHistory(visasList);
            const currentVisa = visasList.find(v => v.isCurrent) || visasList[0];
            
            setVisaInfo({
              visaType: currentVisa.visaType || 'D-2',
              passportNumber: currentVisa.passportNumber || '',
              visaNumber: currentVisa.visaNumber || '',
              issuingAuthority: currentVisa.issuingAuthority || '',
              issueDate: currentVisa.issueDate || '',
              expireDate: currentVisa.expireDate || '',
              memo: currentVisa.memo || ''
            });
          }
        } catch (visaErr) {
          console.log("기존 비자 기록 없음");
        }

      } catch (err) {
        console.error("데이터 로드 실패:", err);
        alert("유학생 정보를 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentAndVisaDetails();
  }, [studentId]);

  const handleStudentSearch = async () => {
    if (!searchQuery.trim()) {
      alert('학번 또는 이름을 입력해 주세요.');
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await api.get(`/api/v1/students`, {
        params: { search: searchQuery }
      });

      let studentsList = [];
      if (res.data?.success) studentsList = res.data.data || [];
      else if (Array.isArray(res.data)) studentsList = res.data;

      const exactMatch = studentsList.find(s => 
        s.studentId?.toString() === searchQuery.trim() || 
        s.korName?.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );

      if (exactMatch) {
        setSelectedStudent(exactMatch);
        
        try {
          const targetId = exactMatch.studentId || exactMatch.id;
          const visaRes = await api.get(`/api/v1/students/${targetId}/visas`);
          const vData = visaRes.data?.success ? visaRes.data.data : visaRes.data;
          
          if (Array.isArray(vData) && vData.length > 0) {
            setVisaHistory(vData);
            const activeVisa = vData.find(v => v.isCurrent) || vData[0];
            setVisaInfo({
              visaType: activeVisa.visaType || 'D-2',
              passportNumber: activeVisa.passportNumber || '',
              visaNumber: activeVisa.visaNumber || '',
              issuingAuthority: activeVisa.issuingAuthority || '',
              issueDate: activeVisa.issueDate || '',
              expireDate: activeVisa.expireDate || '',
              memo: activeVisa.memo || ''
            });
          } else {
            setVisaHistory([]);
            setVisaInfo({ visaType: 'D-2', passportNumber: '', visaNumber: '', issuingAuthority: '', issueDate: '', expireDate: '', memo: '' });
          }
        } catch {}
      } else {
        alert('정확히 일치하는 학번 또는 이름의 유학생을 찾을 수 없습니다.');
        setSelectedStudent(null);
      }
    } catch (err) {
      console.error("학생 검색 에러:", err);
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVisaInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const activeId = studentId || selectedStudent?.studentId;

    if (!activeId) {
      alert('비자를 등록할 대상을 먼저 지정해야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post(`/api/v1/students/${activeId}/visas`, visaInfo);

      if (response.data?.success || response.status === 200 || response.status === 201) {
        alert(`${selectedStudent?.korName || '선택된'} 학생의 비자 정보가 저장되었습니다.`);
        navigate('/admin/students'); 
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (err) {
      console.error("비자 등록 실패:", err);
      alert(err.response?.data?.message || '비자 저장 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="visa-tab-wrapper">
      <style>{`
        .visa-tab-wrapper { background: #fff; border-radius: 0.875rem; padding: 1.5rem; border: 1px solid #E5E7EB; box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-family: 'DM Sans', 'Noto Sans KR', sans-serif; }
        .tab-header { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #F3F4F6; }
        .tab-title { font-size: 1.125rem; font-weight: 700; color: #1E40AF; margin: 0; }
        .tab-desc { font-size: 0.8125rem; color: #6B7280; margin: 0.25rem 0 0 0; }

        .student-picker-box { background: #F9FAFB; padding: 1rem; border-radius: 0.625rem; border: 1px solid #E5E7EB; margin-bottom: 1.5rem; }
        .search-row { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
        .search-row input { flex: 1; padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; font-size: 0.875rem; }
        .btn-inline-search { background: #1E40AF; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; font-size: 0.875rem; cursor: pointer; font-weight: 500; }

        .selected-student-panel { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 0.625rem; padding: 1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
        .student-info-meta h4 { margin: 0; font-size: 0.9375rem; color: #1E40AF; font-weight: 700; }
        .student-info-meta p { margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: #1D4ED8; }
        .badge-target { background: #3B82F6; color: #fff; font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-weight: 600; }

        .visa-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; margin-bottom: 2rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
        .form-group.full { grid-column: span 2; }
        .form-group label { font-size: 0.8125rem; font-weight: 600; color: #374151; }
        .form-group input, .form-group select, .form-group textarea { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; font-size: 0.875rem; background: #fff; }
        .form-group input:focus, .form-group select:focus { border-color: #1A3A5C; outline: none; }
        
        .action-row { margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 0.5rem; border-top: 1px solid #F3F4F6; padding-top: 1rem; }
        .btn-cancel { background: #fff; border: 1px solid #D1D5DB; color: #374151; padding: 0.5rem 1rem; border-radius: 0.375rem; font-size: 0.875rem; cursor: pointer; }
        .btn-submit { background: #1A3A5C; color: #fff; border: none; padding: 0.5rem 1.25rem; border-radius: 0.375rem; font-size: 0.875rem; cursor: pointer; font-weight: 600; }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .history-table { width: 100%; border-collapse: collapse; margin-top: 1rem; text-align: left; }
        .history-table th { background: #F9FAFB; color: #4B5563; font-size: 0.75rem; font-weight: 600; padding: 0.75rem 1rem; border-bottom: 1px solid #E5E7EB; }
        .history-table td { padding: 0.875rem 1rem; font-size: 0.8125rem; border-bottom: 1px solid #F3F4F6; }
        .badge-status { padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.6875rem; font-weight: 600; }
        .badge-active { background: #E0F2FE; color: #0369A1; }
        .badge-normal { background: #F3F4F6; color: #6B7280; }
      `}</style>

      <div className="tab-header">
        <h3 className="tab-title">체류 자격(비자) 관리</h3>
        <p className="tab-desc">외국인 유학생의 비자 코드 정보 및 기한 만료일을 실시간 검증하고 승인 처리를 진행합니다.</p>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', color: '#1E40AF', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600 }}>
          🔄 데이터 동기화 중...
        </div>
      )}

      {!studentId && !selectedStudent && (
        <div className="student-picker-box">
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4B5563' }}>대상 유학생 실시간 검색 지정</label>
          <div className="search-row">
            <input 
              type="text" 
              placeholder="학번 혹은 이름을 정확히 입력하세요..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStudentSearch()}
            />
            <button type="button" className="btn-inline-search" onClick={handleStudentSearch}>
              확인
            </button>
          </div>
        </div>
      )}

      {selectedStudent && (
        <div className="selected-student-panel">
          <div className="student-info-meta">
            <h4>{selectedStudent.korName || '-'} ({selectedStudent.engName || 'N/A'})</h4>
            <p>
              학번: {selectedStudent.studentId || '-'} · 
              국적: {selectedStudent.nationality || '-'} · 
              소속학과: {selectedStudent.deptName || selectedStudent.department || '-'} · 
              상태: <span style={{fontWeight:700}}>{selectedStudent.enrollStatus || '-'}</span>
            </p>
          </div>
          <span className="badge-target">동기화 완료</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="visa-form-grid">
        <div className="form-group">
          <label>비자 자격 종류 (Visa Type)</label>
          <select name="visaType" value={visaInfo.visaType} onChange={handleInputChange}>
            <option value="D-2">D-2 (유학)</option>
            <option value="D-4">D-4 (일반연수)</option>
            <option value="F-2">F-2 (거주)</option>
            <option value="E-7">E-7 (특정활동)</option>
          </select>
        </div>

        <div className="form-group">
          <label>여권 번호 (Passport No.)</label>
          <input 
            type="text" 
            name="passportNumber" 
            value={visaInfo.passportNumber} 
            onChange={handleInputChange} 
            placeholder="여권 사증 번호 입력" 
            required 
          />
        </div>

        <div className="form-group">
          <label>외국인등록번호 / 사증번호</label>
          <input 
            type="text" 
            name="visaNumber" 
            value={visaInfo.visaNumber} 
            onChange={handleInputChange} 
            placeholder="등록번호 필수 기재" 
          />
        </div>

        <div className="form-group">
          <label>발급 사무소 및 출입국청</label>
          <input 
            type="text" 
            name="issuingAuthority" 
            value={visaInfo.issuingAuthority} 
            onChange={handleInputChange} 
            placeholder="예: 서울출입국청" 
          />
        </div>

        <div className="form-group">
          <label>비자 발급일 (Issue Date)</label>
          <input 
            type="date" 
            name="issueDate" 
            value={visaInfo.issueDate} 
            onChange={handleInputChange} 
            required 
          />
        </div>

        <div className="form-group">
          <label>체류 만료일 (Expire Date)</label>
          <input 
            type="date" 
            name="expireDate" 
            value={visaInfo.expireDate} 
            onChange={handleInputChange} 
            required 
          />
        </div>

        <div className="form-group full">
          <label>행정 특이사항 및 비고 메모</label>
          <textarea 
            name="memo" 
            rows="2" 
            value={visaInfo.memo} 
            onChange={handleInputChange} 
            placeholder="연장 심사 결과 및 보증 서류 보완 기록..."
          ></textarea>
        </div>

        <div className="form-group full action-row">
          <button type="button" className="btn-cancel" onClick={() => navigate('/admin/students')}>
            취소
          </button>
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? '통신 중...' : '비자 정보 저장'}
          </button>
        </div>
      </form>

      {selectedStudent && (
        <div style={{ marginTop: '2.5rem', borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9375rem', fontWeight: 700, color: '#374151' }}>
            📜 체류 자격 변동 이력
          </h4>
          <table className="history-table">
            <thead>
              <tr>
                <th>비자 종류</th>
                <th>만료 기한</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {visaHistory.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem 0' }}>
                    등록된 비자 변동 이력이 존재하지 않습니다.
                  </td>
                </tr>
              ) : (
                visaHistory.map((v, index) => (
                  <tr key={v.visaId || index}>
                    <td style={{ fontWeight: 600, color: '#1E40AF' }}>{v.visaType}</td>
                    <td style={{ color: '#4B5563' }}>{v.expireDate || '-'}</td>
                    <td>
                      <span className={`badge-status ${v.isCurrent ? 'badge-active' : 'badge-normal'}`}>
                        {v.isCurrent ? '현재 비자' : '이전 이력'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}