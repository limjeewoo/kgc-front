import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// 1. 설정 변수 수정 (API_BASE_URL로 통일)
const API_BASE_URL = 'http://localhost:8080'; 

export default function BasicTab({ onTabChange }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Axios 인스턴스 (인터셉터 대신 인스턴스 생성 시점에 토큰 주입)
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('accessToken')}` 
    }
  });

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const [integratedRes, summaryRes] = await Promise.allSettled([
          api.get(`/api/v1/search/student/${id}`),
          api.get(`/api/v1/students/${id}/academic-summary`) // 학업 요약은 별도 유지 가능
        ]);

        if (integratedRes.status === 'fulfilled' && integratedRes.value.data.success) {
          const d = integratedRes.value.data.data;
          
          // 학업 요약 데이터 (실패 시 기본값)
          const acaInfo = summaryRes.status === 'fulfilled' 
            ? summaryRes.value.data.data 
            : { totalGpa: 0, totalAttendRate: 0, absenceCount: 0 };

          // [매핑 수정] 통합 검색 API 응답 구조에 맞춤
          setStudent({
            studentId: d.studentId,
            deptName: d.deptName,
            engName: d.engName,
            korName: d.korName,
            gender: d.gender,
            nationality: d.nationality,
            birthDate: d.birthDate,
            phone: d.phone,
            address: d.address,
            classSec: d.classSec,
            grade: d.grade,
            admissionDate: d.admissionDate,
            enrollStatus: d.enrollStatus,
            
            // 비자 정보 (통합 검색 결과의 객체 구조 반영)
            visaType: d.currentVisa?.visaType || d.visaType || '정보없음',
            
            // TOPIK 정보
            topikLevel: d.currentTopik?.topikLevel || d.topikLevel || '미보유',
            
            // 근로 가능 시간 (통합 검색 결과에 포함된 필드 사용)
            maxWorkHours: d.maxWorkHoursPerWeek ? `주 ${d.maxWorkHoursPerWeek}시간` : '확인 불가',
            
            // 출결 및 성적
            attendance: d.totalAttendRate || acaInfo.totalAttendRate || 0,
            absenceCount: d.absenceCount || acaInfo.absenceCount || 0,
            gpa: d.totalGpa || acaInfo.totalGpa || '0.0',
            
            // 기타 정보
            langSchool: d.langSchool || '정보없음',
            basicTestResult: d.basicTestResult || '미응시'
          });
        }
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [id]);

  if (isLoading) return <div style={{ padding: '5rem', textAlign: 'center', color: '#9CA3AF' }}>데이터 로딩 중...</div>;
  if (!student) return <div style={{ padding: '5rem', textAlign: 'center', color: '#EF4444' }}>학생 데이터를 찾을 수 없습니다.</div>;

  const initials = student.korName ? student.korName.slice(0, 2) : 'NA';

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: '0.875rem', color: '#111827', padding: '1.25rem', backgroundColor: '#FDFDFD', minHeight: '100vh' }}>
      <style>{`
        .bt-topbar { background: #fff; padding: 0 1.75rem; height: 3.625rem; display: flex; align-items: center; border-bottom: 1px solid #E5E7EB; margin-bottom: 1.5rem; }
        .bt-back-btn { width: 1.875rem; height: 1.875rem; border-radius: 0.4375rem; background: #F3F4F6; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; margin-right: 1rem; }
        .bt-profile-header { background: #fff; border-radius: 0.875rem; border: 1px solid #F3F4F6; padding: 1.5rem 1.75rem; margin-bottom: 1.125rem; display: flex; align-items: center; gap: 1.5rem; }
        .bt-profile-photo { width: 4.5rem; height: 4.5rem; border-radius: 0.875rem; background: linear-gradient(135deg, #3B82F6, #1A3A5C); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; color: #fff; }
        .bt-profile-name { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.25rem; }
        .bt-chip { font-size: 0.7188rem; font-weight: 500; padding: 0.25rem 0.625rem; border-radius: 1.25rem; margin-right: 0.5rem; }
        .bt-chip-blue { background: #EFF6FF; color: #1D4ED8; }
        .bt-chip-green { background: #F0FDF4; color: #16A34A; }
        .bt-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(18.75rem, 1fr)); gap: 1rem; }
        .bt-info-card { background: #fff; border-radius: 0.875rem; border: 1px solid #F3F4F6; padding: 1.25rem; }
        .bt-info-card-title { font-size: 0.8125rem; font-weight: 700; border-bottom: 1px solid #F3F4F6; padding-bottom: 0.5rem; margin-bottom: 1rem; }
        .bt-info-row { display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #F9FAFB; }
        .bt-info-key { color: #9CA3AF; }
        .bt-info-val { font-weight: 500; }
      `}</style>

      {/* 상단바 */}
      <div className="bt-topbar">
        <button className="bt-back-btn" onClick={() => navigate('/admin/dashboard')}>
          <svg width="1rem" height="1rem" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div style={{ color: '#9CA3AF' }}>학생 관리 › <span style={{ color: '#111827', fontWeight: 600 }}>{student.korName} 정보</span></div>
      </div>

      {/* 프로필 헤더 */}
      <div className="bt-profile-header">
        <div className="bt-profile-photo">{initials}</div>
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
            <div style={{ fontSize: '1.375rem', fontWeight: 700, color: '#3B82F6' }}>{student.attendance}%</div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>출석현황</div>
          </div>
          <div>
            <div style={{ fontSize: '1.375rem', fontWeight: 700 }}>{student.gpa}</div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>누적평점</div>
          </div>
        </div>
      </div>

      {/* 상세 정보 그리드 */}
      <div className="bt-info-grid">
        <div className="bt-info-card">
          <div className="bt-info-card-title">인적 사항</div>
          <div className="bt-info-row"><span className="bt-info-key">생년월일</span><span className="bt-info-val">{student.birthDate}</span></div>
          <div className="bt-info-row"><span className="bt-info-key">연락처</span><span className="bt-info-val">{student.phone}</span></div>
          <div className="bt-info-row"><span className="bt-info-key">성별</span><span className="bt-info-val">{student.gender}</span></div>
        </div>

        <div className="bt-info-card">
          <div className="bt-info-card-title">학적 상세</div>
          <div className="bt-info-row"><span className="bt-info-key">입학일</span><span className="bt-info-val">{student.admissionDate}</span></div>
          <div className="bt-info-row"><span className="bt-info-key">학년/반</span><span className="bt-info-val">{student.grade}학년 ({student.classSec}반)</span></div>
          <div className="bt-info-row"><span className="bt-info-key">소속학과</span><span className="bt-info-val">{student.deptName}</span></div>
        </div>

        <div className="bt-info-card" onClick={() => onTabChange && onTabChange('topik')} style={{ cursor: 'pointer' }}>
          <div className="bt-info-card-title">비자 및 역량 ❯</div>
          <div className="bt-info-row"><span className="bt-info-key">현재 비자</span><span className="bt-info-val">{student.visaType}</span></div>
          <div className="bt-info-row"><span className="bt-info-key">TOPIK 급수</span><span className="bt-info-val" style={{ color: '#1A3A5C', fontWeight: 700 }}>{student.topikLevel}</span></div>
          <div className="bt-info-row"><span className="bt-info-key">합법 근로시간</span><span className="bt-info-val" style={{ color: '#3B82F6' }}>{student.maxWorkHours}</span></div>
        </div>
      </div>
    </div>
  );
}