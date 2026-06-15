import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// const BASE_URL = 'https://api.kmgc.world'; // 배포용
const BASE_URL = 'http://localhost:8080'; // 개발용

export default function TopikTab() {
  const { id } = useParams(); // App.jsx의 :id 파라미터 바인딩
  const navigate = useNavigate();
  
  // 1. 상태 관리 정의
  const [student, setStudent] = useState(null);
  const [topikHistory, setTopikHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // 전역 진입 시 검색어
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // TOPIK 신규 등록 폼 상태
  const [topikInfo, setTopikInfo] = useState({
    topikLevel: '1',
    testRound: '',
    totalScore: '',
    acquisitionDate: '',
    expiryDate: '',
    memo: ''
  });

  // 🎯 [교정 완료] API_BASE_URL 오타를 상단의 BASE_URL 변수로 변경 매핑
  const api = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
  });

  // 2. [비동기 연동] URL 파라미터에 id(studentId)가 존재할 때 기존 데이터 조회
  useEffect(() => {
    if (!id) return;

    const fetchTopikData = async () => {
      try {
        setIsLoading(true);

        const [studentRes, topikRes] = await Promise.all([
          api.get(`/api/v1/students/${id}`).catch(() => ({ data: { success: false } })),
          api.get(`/api/v1/students/${id}/topik`).catch(() => ({ data: { success: false } }))
        ]);

        if (studentRes.data?.success) {
          setStudent(studentRes.data.data);
        } else if (studentRes.data) {
          setStudent(studentRes.data); // 래핑이 없는 스펙일 때 예외 보완
        }

        if (topikRes.data?.success) {
          const sortedHistory = (topikRes.data.data || []).sort(
            (a, b) => new Date(b.acquisitionDate || b.testDate) - new Date(a.acquisitionDate || a.testDate)
          );
          setTopikHistory(sortedHistory);
        }
      } catch (error) {
        console.error("TOPIK 이력 데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopikData();
  }, [id]);

  // 3. 목록 버튼을 통해 진입했을 때 (id가 없을 때) 수동 유학생 검색 기능
  const handleStudentSearch = async () => {
    if (!searchQuery.trim()) return alert('학번 또는 이름을 입력해 주세요.');
    
    setIsLoading(true);
    try {
      const res = await api.get(`/api/v1/students`, { params: { search: searchQuery } });
      let studentsList = res.data?.success ? res.data.data : res.data;
      
      if (Array.isArray(studentsList) && studentsList.length > 0) {
        const matched = studentsList[0];
        setStudent(matched);
        
        // 검색된 대상을 바탕으로 기존 내역이 있는지 추가 연동 조회
        try {
          const tRes = await api.get(`/api/v1/students/${matched.studentId || matched.id}/topik`);
          const tData = tRes.data?.success ? tRes.data.data : tRes.data;
          if (Array.isArray(tData)) setTopikHistory(tData);
        } catch {}
      } else {
        alert('조회된 유학생 정보가 없습니다.');
        setStudent(null);
      }
    } catch (err) {
      alert('학생 검색 중 통신 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTopikInfo(prev => ({ ...prev, [name]: value }));
  };

  // 4. TOPIK 점수 백엔드 POST 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    const targetStudentId = id || student?.studentId || student?.id;
    
    if (!targetStudentId) {
      return alert('성적을 등록할 대상 학생을 먼저 지정해야 합니다.');
    }

    setIsSubmitting(true);
    try {
      const response = await api.post(`/api/v1/students/${targetStudentId}/topik`, topikInfo);

      if (response.data?.success || response.status === 200 || response.status === 201) {
        alert('TOPIK 자격 점수가 성공적으로 저장되었습니다.');
        navigate('/admin/students');
      } else {
        alert('저장에 실패했습니다. 백엔드 스펙을 확인하세요.');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || '서버 전송 중 에러가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkStatus = (expiryDate, apiStatus) => {
    if (apiStatus) return apiStatus;
    if (!expiryDate) return '-';
    return new Date(expiryDate) >= new Date() ? '유효' : '만료';
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: '#9CA3AF', fontSize: '14px' }}>
        🔄 백엔드 데이터 실시간 동기화 중...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', 'Noto Sans KR', sans-serif", fontSize: '14px', color: '#111827', padding: '20px' }}>
      <style>{`
        .tt-topbar { background: #fff; padding: 0 28px; height: 58px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E5E7EB; margin-bottom: 24px; }
        .tt-topbar-left { display: flex; align-items: center; gap: 10px; }
        .tt-back-btn { width: 32px; height: 32px; border-radius: 8px; background: #F3F4F6; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; color: #374151; }
        .tt-back-btn:hover { background: #E5E7EB; transform: translateX(-2px); }
        .tt-breadcrumb { font-size: 13px; color: #9CA3AF; }
        .tt-breadcrumb span { color: #111827; font-weight: 600; }

        .student-picker-box { background: #F9FAFB; padding: 18px; border-radius: 10px; border: 1px solid #E5E7EB; margin-bottom: 20px; }
        .search-row { display: flex; gap: 8px; margin-top: 8px; }
        .search-row input { flex: 1; padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 13px; }
        .btn-inline-search { background: #374151; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; cursor: pointer; font-weight: 500; }

        .selected-student-panel { background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        .student-meta h4 { margin: 0; font-size: 14px; color: #065F46; font-weight: 700; }
        .student-meta p { margin: 4px 0 0 0; font-size: 12px; color: #047857; }
        .badge-target { background: #10B981; color: #fff; font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight: 600; }

        .tt-card { background: #fff; border-radius: 14px; border: 1px solid #F3F4F6; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 24px; }
        .tt-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #F3F4F6; }
        .tt-title { font-size: 16px; font-weight: 700; color: #065F46; }

        .topik-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 10px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { grid-column: span 2; }
        .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
        .form-group input, .form-group select, .form-group textarea { padding: 9px 12px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 13px; background: #fff; }
        .form-group input:focus, .form-group select:focus { border-color: #10B981; outline: none; }

        .tt-table { width: 100%; border-collapse: collapse; }
        .tt-table th { background: #F9FAFB; padding: 12px; font-size: 12px; color: #6B7280; font-weight: 600; text-align: left; border-bottom: 1px solid #F3F4F6; }
        .tt-table td { padding: 14px 12px; font-size: 13px; border-bottom: 1px solid #F9FAFB; }
        
        .status-badge { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
        .status-valid { background: #F0FDF4; color: #16A34A; }
        .status-expired { background: #FEF2F2; color: #EF4444; }

        .action-row { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
        .btn-cancel { background: #fff; border: 1px solid #D1D5DB; color: #374151; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
        .btn-submit { background: #065F46; color: #fff; border: none; padding: 8px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      {/* 상단 네비게이션 */}
      <div className="tt-topbar">
        <div className="tt-topbar-left">
          <button className="tt-back-btn" onClick={() => navigate('/admin/students')} title="목록으로">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="tt-breadcrumb">
            학생 행정 관리 › {student?.korName || '미지정'} › <span>TOPIK 급수 취득 정보</span>
          </div>
        </div>
      </div>

      {/* [조건부 기본창] ID 없이 리스트 전역 버튼으로 직접 진입한 경우 검색 UI 표출 */}
      {!id && !student && (
        <div className="student-picker-box">
          <label style={{ fontWeights: 600, color: '#4B5563', fontSize: '13px' }}>TOPIK 자격증 등록 유학생 검색</label>
          <div className="search-row">
            <input 
              type="text" 
              placeholder="학번 또는 성명을 입력해 주세요..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStudentSearch()}
            />
            <button type="button" className="tt-back-btn" style={{width:'auto', padding:'0 14px', fontSize:'13px'}} onClick={handleStudentSearch}>검색 확인</button>
          </div>
        </div>
      )}

      {/* 매칭 또는 파라미터 로드 완료된 학생 프로필 바 */}
      {student && (
        <div className="selected-student-panel">
          <div className="student-meta">
            <h4>{student.korName} ({student.engName || 'N/A'})</h4>
            <p>학번: {student.studentId || student.id} · 국적: {student.nationality || '-'} · 소속학과: {student.department || student.deptName || '-'}</p>
          </div>
          <span className="badge-target">성적 추가 연동 대상</span>
        </div>
      )}

      {/* 1. 새로운 성적 입력 양식 */}
      <div className="tt-card">
        <div className="tt-card-header">
          <div className="tt-title">신규 TOPIK 성적 자격 등록</div>
        </div>
        
        <form onSubmit={handleSubmit} className="topik-form-grid">
          <div className="form-group">
            <label>합격 급수 (TOPIK Level)</label>
            <select name="topikLevel" value={topikInfo.topikLevel} onChange={handleInputChange}>
              <option value="1">1급</option>
              <option value="2">2급</option>
              <option value="3">3급</option>
              <option value="4">4급</option>
              <option value="5">5급</option>
              <option value="6">6급</option>
            </select>
          </div>

          <div className="form-group">
            <label>시험 회차 (선택 입력)</label>
            <input type="text" name="testRound" value={topikInfo.testRound} onChange={handleInputChange} placeholder="예: 제 92회" />
          </div>

          <div className="form-group">
            <label>취득 점수 (Score)</label>
            <input type="number" name="totalScore" value={topikInfo.totalScore} onChange={handleInputChange} placeholder="점수 입력" required />
          </div>

          <div className="form-group">
            <label>취득 일자 (합격 발표일)</label>
            <input type="date" name="acquisitionDate" value={topikInfo.acquisitionDate} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label>성적 만료 일자</label>
            <input type="date" name="expiryDate" value={topikInfo.expiryDate} onChange={handleInputChange} required />
          </div>

          <div className="form-group full">
            <label>특이사항 메모</label>
            <textarea name="memo" rows="2" value={topikInfo.memo} onChange={handleInputChange} placeholder="관리자 기재 정보 입력..."></textarea>
          </div>

          <div className="form-group full action-row">
            <button type="button" className="btn-cancel" onClick={() => navigate('/admin/students')}>취소</button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '급수 성적 저장'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. 기존 취득 이력 현황 테이블 */}
      <div className="tt-card">
        <div className="tt-card-header">
          <div className="tt-title" style={{color:'#111827', fontSize:'14px'}}>과거 취득 이력 현황 목록</div>
        </div>

        <table className="tt-table">
          <thead>
            <tr>
              <th>시험/취득 일자</th>
              <th>급수</th>
              <th>취득 점수</th>
              <th>유효 기간</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {topikHistory.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                  시스템에 누적 등록된 과거 TOPIK 이력이 존재하지 않습니다.
                </td>
              </tr>
            ) : (
              topikHistory.map((item, idx) => {
                const targetDate = item.acquisitionDate || item.testDate || '-';
                const status = checkStatus(item.expiryDate, item.status);
                
                return (
                  <tr key={item.topikId || item.id || idx}>
                    <td style={{ fontWeight: 500 }}>{targetDate}</td>
                    <td><span style={{ color: '#10B981', fontWeight: 700 }}>{item.topikLevel}급</span></td>
                    <td>{item.totalScore ? `${item.totalScore}점` : '-'}</td>
                    <td style={{ color: '#6B7280' }}>{item.expiryDate || '-'}</td>
                    <td>
                      <span className={`status-badge ${status === '유효' ? 'status-valid' : 'status-expired'}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}