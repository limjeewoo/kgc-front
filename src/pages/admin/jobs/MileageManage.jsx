import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function MileageManage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 모달 제어 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔐 인증 헤더 생성 함수
  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // 학생 데이터에서 안전하게 마일리지 값을 가져오는 헬퍼 함수
  const getStudentMileage = (student) => {
    // 백엔드 필드명이 mileage 일 수도, totalMileage 일 수도 있으므로 병합 처리
    return student.mileage !== undefined ? student.mileage : (student.totalMileage || 0);
  };

  // 1. 학생 목록 조회
  const initFetch = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/students', {
        headers: getAuthHeaders()
      });
      
      const resData = response.data?.data ?? response.data;
      const isSuccess = response.data?.success;

      let rawStudents = [];
      if (isSuccess && Array.isArray(resData)) {
        rawStudents = resData;
      } else if (Array.isArray(response.data)) {
        rawStudents = response.data;
      }

      // 높은 점수 순으로 정렬 정렬
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

  // 2. 수동 점수 조정 모달 열기
  const openAdjustModal = (student) => {
    setSelectedStudent(student);
    setPoints('');
    setReason('');
    setIsModalOpen(true);
  };

  // 3. 🎯 점수 조정 처리 및 프론트 상태 즉시 변동(Optimistic Update)
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
        reason: reason.trim(),
        studentId: targetStudentId 
      };

      const targetUrl = `/api/v1/students/${targetStudentId}/mileage`;

      const response = await axios.post(
        targetUrl, 
        requestBody,
        { headers: getAuthHeaders() }
      );

      if (response.data && response.data.success === false) {
        throw new Error(response.data.message || "서버 유효성 검증 실패");
      }

      if (response.status === 200 || response.status === 201 || response.data?.success === true) {
        alert(`${selectedStudent.korName || selectedStudent.name || '선택한'} 학생의 마일리지가 정상적으로 조정되었습니다.`);
        setIsModalOpen(false);

        // 🔥 [화면 실시간 반영 파트 필드명 이중 방어]
        setStudents(prevStudents => 
          prevStudents.map(student => {
            if (student.studentId === targetStudentId) {
              const currentMileage = getStudentMileage(student);
              const updatedMileage = currentMileage + numPoints;
              return { 
                ...student, 
                mileage: updatedMileage,       // 둘 다 업데이트해 버려서 
                totalMileage: updatedMileage  // 렌더링 오류 원천 차단
              };
            }
            return student;
          }).sort((a, b) => getStudentMileage(b) - getStudentMileage(a))
        );

        // 최신 서버 데이터 동기화
        initFetch(); 
      } else {
        alert(`반영 실패: ${response.data?.message || '처리 중 오류가 발생했습니다.'}`);
      }
    } catch (error) {
      console.error('⚠️ [디버깅 로그]:', error);
      const serverMessage = error.response?.data?.message || error.message;
      alert(`🚨 실패 안내: ${serverMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 검색 필터링
  const filteredStudents = students.filter(student => {
    const name = student.korName || student.name || '';
    const id = student.studentId || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || id.includes(searchTerm);
  });

  // 상단 요약 대시보드 계산 시에도 헬퍼 함수 사용
  const totalDistributedMileage = students.reduce((acc, curr) => acc + getStudentMileage(curr), 0);
  const topScore = students[0] ? getStudentMileage(students[0]) : 0;

  if (loading) return (
    <div className="mileage-loading">
      <div className="spinner" />
      <p>KGC 시스템에서 마일리지 데이터를 분석 중입니다...</p>
    </div>
  );

  return (
    <div className="mileage-container">
      <style>{`
        .mileage-container { animation: fadeUp 0.28s ease; }
        .mileage-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; color: #6b7280; font-size: 0.875rem; }
        .spinner { width: 40px; height: 40px; border: 3px solid #E5E7EB; border-top-color: #3B82F6; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }
        
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.75rem; }
        .summary-card { background: #fff; border: 1px solid #F1F5F9; border-radius: 1rem; padding: 1.25rem; position: relative; overflow: hidden; }
        .summary-card::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: #3B82F6; }
        .summary-card.orange::after { background: #F59E0B; }
        .summary-card.purple::after { background: #8B5CF6; }
        .summary-lbl { font-size: 0.75rem; color: #64748B; margin-bottom: 0.25rem; font-weight: 500; }
        .summary-val { font-size: 1.5rem; font-weight: 700; color: #0F172A; }
        .summary-val .unit { font-size: 0.8125rem; font-weight: 400; color: #94A3B8; margin-left: 2px; }

        .table-ctrl { background: #fff; border: 1px solid #F1F5F9; border-radius: 1rem 1rem 0 0; padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; border-bottom: none; }
        .search-input { width: 18rem; padding: 0.5rem 0.875rem; border: 1px solid #E2E8F0; border-radius: 0.5rem; font-size: 0.8125rem; outline: none; transition: 0.15s; }
        .search-input:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

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

        .action-btn { background: #1A3A5C; color: #fff; border: none; padding: 0.375rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: 0.15s; }
        .action-btn:hover { background: #15304e; box-shadow: 0 2px 8px rgba(26,58,92,0.2); }

        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); display: flex; align-items: center; justify-content: center; z-index: 999; backdrop-filter: blur(2px); }
        .modal-box { background: #fff; border-radius: 1rem; width: 26rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; animation: fadeUp 0.2s ease; }
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
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* 대시보드 스탯 요약 */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-lbl">누적 배정 마일리지</div>
          <div className="summary-val">{totalDistributedMileage.toLocaleString()}<span className="unit">점</span></div>
        </div>
        <div className="summary-card orange">
          <div className="summary-lbl">최고 점수 보유자</div>
          <div className="summary-val">{topScore.toLocaleString()}<span className="unit">점</span></div>
        </div>
        <div className="summary-card purple">
          <div className="summary-lbl">평가 대상 명수</div>
          <div className="summary-val">{filteredStudents.length}<span className="unit">명</span></div>
        </div>
      </div>

      {/* 검색 바 */}
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

      {/* 테이블 리스트 */}
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
              <th style={{ width: '120px', textAlign: 'center' }}>조정</th>
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
                      <button 
                        className="action-btn"
                        onClick={() => openAdjustModal(student)}
                      >
                        점수 조정
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 수동 조정 모달 팝업 */}
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