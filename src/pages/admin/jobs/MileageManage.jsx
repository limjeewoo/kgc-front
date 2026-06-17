import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import MileageTab from '../students/StudentDetail/MileageTab'; 

export default function MileageManage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsStudent, setDetailsStudent] = useState(null);

  const getStudentMileage = (student) => {
    return student.mileage !== undefined ? student.mileage : (student.totalMileage || 0);
  };

  const initFetch = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/students');
      
      const resData = response.data?.data ?? response.data;
      const isSuccess = response.data?.success;

      let rawStudents = [];
      if (isSuccess && Array.isArray(resData)) {
        rawStudents = resData;
      } else if (Array.isArray(response.data)) {
        rawStudents = response.data;
      }

      const sortedData = [...rawStudents].sort((a, b) => getStudentMileage(b) - getStudentMileage(a));
      setStudents(sortedData);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initFetch();
  }, []);

  const openAdjustModal = (student) => {
    setSelectedStudent(student);
    setPoints('');
    setReason('');
    setIsModalOpen(true);
  };

  const openDetailsModal = (student) => {
    setDetailsStudent(student);
    setIsDetailsModalOpen(true);
  };

  const handleAdjustPoints = async (e) => {
    e.preventDefault();
    if (!points || isNaN(points)) {
      alert('올바른 점수를 입력해주세요.');
      return;
    }
    if (!reason.trim()) {
      alert('조정 사유를 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      const targetStudentId = selectedStudent.studentId;
      const numPoints = Number(points);

      const requestBody = {
        changeAmount: numPoints,
        reason: reason.trim()
      };

      const response = await api.post(`/api/v1/students/${targetStudentId}/mileage`, requestBody);

      if (response.data && response.data.success === false) {
        throw new Error(response.data.message || "서버 유효성 검증 실패");
      }

      if (response.status === 200 || response.status === 201 || response.data?.success === true) {
        alert(`${selectedStudent.korName || selectedStudent.name || '선택한'} 학생의 마일리지가 정상적으로 조정되었습니다.`);
        setIsModalOpen(false);

        setStudents(prevStudents => 
          prevStudents.map(student => {
            if (student.studentId === targetStudentId) {
              const currentMileage = getStudentMileage(student);
              const updatedMileage = currentMileage + numPoints;
              return { 
                ...student, 
                mileage: updatedMileage, 
                totalMileage: updatedMileage 
              };
            }
            return student;
          }).sort((a, b) => getStudentMileage(b) - getStudentMileage(a))
        );

        initFetch(); 
      } else {
        alert(`반영 실패: ${response.data?.message || '처리 중 오류가 발생했습니다.'}`);
      }
    } catch (error) {
      console.error('오류 발생:', error);
      const serverMessage = error.response?.data?.message || error.message;
      alert(`실패 안내: ${serverMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const name = student.korName || student.name || '';
    const id = student.studentId || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || id.includes(searchTerm);
  });

  const totalDistributedMileage = students.reduce((acc, curr) => acc + getStudentMileage(curr), 0);
  const topScore = students[0] ? getStudentMileage(students[0]) : 0;

  if (loading) return (
    <div className="mileage-loading">
      <div className="spinner" />
      <p>마일리지 데이터를 분석 중입니다...</p>
    </div>
  );

  return (
    <div className="mileage-container">
      <style>{`
        .mileage-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; color: #6b7280; font-size: 0.875rem; }
        .spinner { width: 40px; height: 40px; border: 3px solid #E5E7EB; border-top-color: #3B82F6; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }
        
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.75rem; }
        .summary-card { background: #fff; border: 1px solid #F1F5F9; border-radius: 1rem; padding: 1.25rem; }
        .summary-lbl { font-size: 0.75rem; color: #64748B; margin-bottom: 0.25rem; font-weight: 500; }
        .summary-val { font-size: 1.5rem; font-weight: 700; color: #0F172A; }
        .summary-val .unit { font-size: 0.8125rem; font-weight: 400; color: #94A3B8; margin-left: 2px; }

        .table-ctrl { background: #fff; border: 1px solid #F1F5F9; border-radius: 1rem 1rem 0 0; padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; border-bottom: none; }
        .search-input { width: 18rem; padding: 0.5rem 0.875rem; border: 1px solid #E2E8F0; border-radius: 0.5rem; font-size: 0.8125rem; outline: none; }
        .search-input:focus { border-color: #3B82F6; }

        .table-card { background: #fff; border: 1px solid #F1F5F9; border-radius: 0 0 1rem 1rem; overflow: hidden; }
        .m-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.8125rem; }
        .m-table th { background: #F8FAFC; color: #64748B; font-weight: 600; padding: 0.875rem 1.25rem; border-bottom: 1px solid #E2E8F0; }
        .m-table td { padding: 0.875rem 1.25rem; border-bottom: 1px solid #F1F5F9; color: #334155; vertical-align: middle; }
        .m-table tr:last-child td { border-bottom: none; }
        .m-table tr:hover td { background: #FAFBFD; }

        .rank-badge { display: inline-flex; align-items: center; justify-content: center; width: 1.5rem; height: 1.5rem; border-radius: 50%; font-weight: 700; font-size: 0.75rem; }
        .rank-1 { background: #FEF3C7; color: #D97706; }
        .rank-2 { background: #F1F5F9; color: #475569; }
        .rank-3 { background: #FFEDD5; color: #EA580C; }
        .rank-default { color: #94A3B8; }
        .score-txt { font-weight: 700; color: #1E3A8A; }

        .btn-flex-container { display: flex; gap: 6px; justify-content: center; align-items: center; }
        .base-btn { padding: 0.375rem 0.625rem; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; white-space: nowrap; }

        .btn-details { background: #ffffff; color: #475569; border: 1px solid #CBD5E1; }
        .btn-details:hover { background: #F8FAFC; border-color: #94A3B8; color: #1E293B; }
        
        .btn-adjust { background: #1A3A5C; color: #fff; border: none; }
        .btn-adjust:hover { background: #15304e; }

        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); display: flex; align-items: center; justify-content: center; z-index: 999; }
        .modal-box { background: #fff; border-radius: 1rem; width: 26rem; overflow: hidden; }
        
        .details-modal-box { background: #fff; border-radius: 1rem; width: 85%; max-width: 1000px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
        .details-modal-bd { overflow-y: auto; padding: 1.25rem; flex: 1; background: #F8FAFC; }

        .modal-hd { padding: 1.25rem; border-bottom: 1px solid #F1F5F9; font-weight: 700; font-size: 0.9375rem; color: #0F172A; }
        .modal-bd { padding: 1.25rem; }
        .modal-ft { padding: 1rem 1.25rem; background: #F8FAFC; border-top: 1px solid #F1F5F9; display: flex; justify-content: flex-end; gap: 0.5rem; }
        
        .form-group { margin-bottom: 1rem; }
        .form-lbl { display: block; font-size: 0.75rem; font-weight: 600; color: #64748B; margin-bottom: 0.375rem; }
        .form-input { width: 100%; padding: 0.5625rem 0.75rem; border: 1px solid #E2E8F0; border-radius: 0.5rem; font-size: 0.8125rem; outline: none; box-sizing: border-box; }
        .form-input:focus { border-color: #3B82F6; }

        .btn-cancel { background: #E2E8F0; color: #475569; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; }
        .btn-submit { background: #3B82F6; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; }
        .btn-submit:disabled { background: #94A3B8; cursor: not-allowed; }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-lbl">누적 배정 마일리지</div>
          <div className="summary-val">{totalDistributedMileage.toLocaleString()}<span className="unit">점</span></div>
        </div>
        <div className="summary-card">
          <div className="summary-lbl">최고 점수 보유자</div>
          <div className="summary-val">{topScore.toLocaleString()}<span className="unit">점</span></div>
        </div>
        <div className="summary-card">
          <div className="summary-lbl">평가 대상 명수</div>
          <div className="summary-val">{filteredStudents.length}<span className="unit">명</span></div>
        </div>
      </div>

      <div className="table-ctrl">
        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>마일리지 랭킹 관리</div>
        <input 
          type="text" 
          placeholder="학생 이름 또는 학번 검색..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-card">
        <table className="m-table">
          <thead>
            <tr>
              <th style={{ width: '60px', textAlign: 'center' }}>랭킹</th>
              <th>학번</th>
              <th>이름</th>
              <th>학과</th>
              <th>분반</th>
              <th>국적</th>
              <th style={{ textAlign: 'right' }}>보유 마일리지</th>
              <th style={{ width: '160px', textAlign: 'center' }}>관리 작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                  조건에 일치하는 학생 정보가 없습니다.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student, index) => {
                const rank = index + 1;
                let rankClass = 'rank-default';
                if (rank === 1) rankClass = 'rank-1';
                else if (rank === 2) rankClass = 'rank-2';
                else if (rank === 3) rankClass = 'rank-3';

                return (
                  <tr key={student.studentId}>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`rank-badge ${rankClass}`}>{rank}</span>
                    </td>
                    <td style={{ fontWeight: '500' }}>{student.studentId}</td>
                    <td style={{ fontWeight: '600' }}>{student.korName || student.name}</td>
                    <td>{student.deptName || '미지정'}</td>
                    <td>{student.classSec || '-'}</td>
                    <td>{student.nationality || '-'}</td>
                    <td style={{ textAlign: 'right' }} className="score-txt">
                      {getStudentMileage(student).toLocaleString()}점
                    </td>
                    
                    <td style={{ textAlign: 'center' }}>
                      <div className="btn-flex-container">
                        <button 
                          className="base-btn btn-details"
                          onClick={() => openDetailsModal(student)}
                        >
                          상세보기
                        </button>
                        <button 
                          className="base-btn btn-adjust"
                          onClick={() => openAdjustModal(student)}
                        >
                          점수 조정
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isDetailsModalOpen && detailsStudent && (
        <div className="modal-overlay" onClick={() => setIsDetailsModalOpen(false)}>
          <div className="details-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📊 {detailsStudent.korName || detailsStudent.name} 학생 마일리지 상세 내역</span>
              <button 
                onClick={() => setIsDetailsModalOpen(false)} 
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748B', lineHeight: '1' }}
              >
                &times;
              </button>
            </div>
            <div className="details-modal-bd">
              <MileageTab studentId={detailsStudent.studentId} />
            </div>
          </div>
        </div>
      )}

      {isModalOpen && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-hd">
              ⚙️ 마일리지 수동 조정 ({selectedStudent.korName || selectedStudent.name})
            </div>
            <form onSubmit={handleAdjustPoints}>
              <div className="modal-bd">
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: '0.5rem' }}>
                  <strong>기존 보유량:</strong> {getStudentMileage(selectedStudent).toLocaleString()}점 <br />
                  <strong>대상 학번:</strong> {selectedStudent.studentId}
                </div>

                <div className="form-group">
                  <label className="form-lbl">추가/차감 점수 (변동치)</label>
                  <input 
                    type="number" 
                    placeholder="예: 50 또는 -20" 
                    className="form-input"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-lbl">변경 사유</label>
                  <input 
                    type="text" 
                    placeholder="예: 우수 출석, 공모전 수상" 
                    className="form-input"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-ft">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>닫기</button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? '통신 중...' : '확인'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}