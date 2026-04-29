import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// 1. Axios 인스턴스 설정
const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

// 토큰 헤더 자동 주입
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function BasicTab({ onTabChange }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);

        /**
         * 만약 통합 검색(/api/v1/search/student/${id})이 안 된다면
         * 다시 개별 호출 방식으로 돌아가되, 데이터를 안전하게 매핑합니다.
         */
        const response = await api.get(`/api/v1/students/${id}`);
        
        // [중요] 콘솔을 확인하여 백엔드에서 실제 데이터가 어떻게 오는지 보세요.
        console.log("백엔드 응답 데이터:", response.data);

        if (response.data.success) {
          const s = response.data.data;
          
          setStudent({
            studentId: s.studentId || id,
            deptName: s.deptName || '소속 정보 없음',
            engName: s.engName || '',
            korName: s.korName || '이름 없음',
            gender: s.gender || '-',
            nationality: s.nationality || '-',
            birthDate: s.birthDate || '-',
            phone: s.phone || '-',
            address: s.address || '-',
            classSec: s.classSec || '-',
            grade: s.grade || '-',
            admissionDate: s.admissionDate || '-',
            enrollStatus: s.enrollStatus || '재학',
            
            // 데이터가 없을 경우를 대비한 기본값 설정
            visaType: s.visaType || (s.currentVisa && s.currentVisa.visaType) || '정보없음',
            topikLevel: s.topikLevel || '정보없음', 
            maxWorkHours: s.maxWorkHoursPerWeek ? `주 ${s.maxWorkHoursPerWeek}시간` : '정보없음',
            
            attendance: s.totalAttendRate ? `${s.totalAttendRate}%` : '-', 
            gpa: s.totalGpa || s.gpa || '0.0', 
            photoUrl: s.photoUrl || null
          });
        } else {
          console.error("데이터 조회 실패:", response.data.message);
        }
      } catch (error) {
        console.error("API 호출 중 오류 발생:", error);
        // 서버 연결 자체가 안되거나 404/500 에러 시
        alert("학생 정보를 가져오는 데 실패했습니다. 서버 상태를 확인하세요.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [id]);

  if (isLoading) return <div style={{ padding: '5rem', textAlign: 'center', color: '#9CA3AF' }}>데이터 로드 중...</div>;
  if (!student) return <div style={{ padding: '5rem', textAlign: 'center', color: '#EF4444' }}>학생 정보를 찾을 수 없습니다. (ID: {id})</div>;

  const initials = student.korName ? student.korName.slice(0, 2) : 'NA';

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: '0.875rem', color: '#111827', padding: '1.25rem', backgroundColor: '#FDFDFD', minHeight: '100vh' }}>
      <style>{`
        .bt-topbar { background: #fff; padding: 0 1.75rem; height: 3.625rem; display: flex; align-items: center; border-bottom: 1px solid #E5E7EB; margin-bottom: 1.5rem; }
        .bt-back-btn { width: 1.875rem; height: 1.875rem; border-radius: 0.4375rem; background: #F3F4F6; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; margin-right: 1rem; }
        .bt-profile-header { background: #fff; border-radius: 0.875rem; border: 1px solid #F3F4F6; padding: 1.5rem 1.75rem; margin-bottom: 1.125rem; display: flex; align-items: center; gap: 1.5rem; }
        .bt-profile-photo { width: 4.5rem; height: 4.5rem; border-radius: 0.875rem; background: linear-gradient(135deg, #3B82F6, #1A3A5C); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; color: #fff; overflow: hidden; }
        .bt-profile-photo img { width: 100%; height: 100%; object-fit: cover; }
        .bt-profile-name { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.25rem; }
        .bt-chip { font-size: 0.7188rem; font-weight: 500; padding: 0.25rem 0.625rem; border-radius: 1.25rem; margin-right: 0.5rem; }
        .bt-chip-blue { background: #EFF6FF; color: #1D4ED8; }
        .bt-chip-green { background: #F0FDF4; color: #16A34A; }
        .bt-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem; }
        .bt-info-card { background: #fff; border-radius: 0.875rem; border: 1px solid #F3F4F6; padding: 1.25rem; }
        .bt-info-card-title { font-size: 0.8125rem; font-weight: 700; border-bottom: 1px solid #F3F4F6; padding-bottom: 0.5rem; margin-bottom: 1rem; }
        .bt-info-row { display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #F9FAFB; }
        .bt-info-key { color: #9CA3AF; }
        .bt-info-val { font-weight: 500; text-align: right; }
      `}</style>

      <div className="bt-topbar">
        <button className="bt-back-btn" onClick={() => navigate('/admin/dashboard')}>
          <svg width="1rem" height="1rem" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div style={{ color: '#9CA3AF' }}>학생 관리 › <span style={{ color: '#111827', fontWeight: 600 }}>{student.korName} 정보</span></div>
      </div>

      <div className="bt-profile-header">
        <div className="bt-profile-photo">
          {student.photoUrl ? <img src={student.photoUrl} alt="Profile" /> : initials}
        </div>
        <div style={{ flex: 1 }}>
          <div className="bt-profile-name">{student.korName} <span style={{ fontSize: '0.9rem', color: '#9CA3AF', fontWeight: 400 }}>{student.engName}</span></div>
          <div style={{ color: '#6B7280', marginBottom: '0.5rem' }}>{student.studentId} | {student.deptName}</div>
          <div>
            <span className="bt-chip bt-chip-green">{student.enrollStatus}</span>
            <span className="bt-chip bt-chip-blue">{student.visaType}</span>
            <span className="bt-chip" style={{ background: '#F3F4F6' }}>{student.nationality}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#3B82F6' }}>{student.attendance}</div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>출석현황</div>
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#111827' }}>{student.gpa}</div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>누적평점</div>
          </div>
        </div>
      </div>

      <div className="bt-info-grid">
        <div className="bt-info-card">
          <div className="bt-info-card-title">인적 사항</div>
          <div className="bt-info-row"><span className="bt-info-key">생년월일</span><span className="bt-info-val">{student.birthDate}</span></div>
          <div className="bt-info-row"><span className="bt-info-key">연락처</span><span className="bt-info-val">{student.phone}</span></div>
          <div className="bt-info-row"><span className="bt-info-key">성별</span><span className="bt-info-val">{student.gender}</span></div>
          <div className="bt-info-row"><span className="bt-info-key">주소</span><span className="bt-info-val" style={{fontSize:'0.75rem'}}>{student.address}</span></div>
        </div>

        <div className="bt-info-card">
          <div className="bt-info-card-title">학적 상세</div>
          <div className="bt-info-row"><span className="bt-info-key">입학일</span><span className="bt-info-val">{student.admissionDate}</span></div>
          <div className="bt-info-row"><span className="bt-info-key">학년/반</span><span className="bt-info-val">{student.grade}학년 ({student.classSec}반)</span></div>
          <div className="bt-info-row"><span className="bt-info-key">소속학과</span><span className="bt-info-val">{student.deptName}</span></div>
        </div>

        <div className="bt-info-card">
          <div className="bt-info-card-title">비자 및 역량</div>
          <div className="bt-info-row"><span className="bt-info-key">현재 비자</span><span className="bt-info-val">{student.visaType}</span></div>
          <div className="bt-info-row"><span className="bt-info-key">TOPIK 급수</span><span className="bt-info-val">{student.topikLevel}</span></div>
          <div className="bt-info-row"><span className="bt-info-key">합법 근로시간</span><span className="bt-info-val" style={{color: '#3B82F6'}}>{student.maxWorkHours}</span></div>
        </div>
      </div>
    </div>
  );
}