import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// const BASE_URL = 'https://api.kmgc.world'; // 배포용
const BASE_URL = 'http://localhost:8080'; // 개발용

export default function BasicTab({ onTabChange }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Axios 인스턴스 (인증 토큰 포함)
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
  });

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setIsLoading(true);

        // 명세서 기반 병렬 API 호출
        // 1. 학생 기본 정보 (4번)
        // 2. 근로 가능 시간 정보 (8번)
        // 3. 학업 요약 정보 (12번)
        const [studentRes, workHourRes, summaryRes] = await Promise.all([
          api.get(`/api/v1/students/${id}`),
          api.get(`/api/v1/topik/work-hours/${id}`).catch(() => ({ data: { data: { maxWorkHoursPerWeek: '-' } } })),
          api.get(`/api/v1/students/${id}/academic-summary`).catch(() => ({ data: { data: { totalGpa: 0, attendance: 0, absenceCount: 0 } } }))
        ]);

        if (studentRes.data.success) {
          const s = studentRes.data.data;
          const workInfo = workHourRes.data.data;
          const acaInfo = summaryRes.data.data;

          // 명세서의 응답 데이터를 프론트엔드 UI 변수명에 맞게 매핑
          setStudent({
            studentId: s.studentId,
            deptName: s.deptName,
            engName: s.engName,
            korName: s.korName,
            gender: s.gender,
            nationality: s.nationality,
            birthDate: s.birthDate,
            phone: s.phone,
            address: s.address,
            classSec: s.classSec,
            grade: s.grade,
            admissionDate: s.admissionDate,
            enrollStatus: s.enrollStatus,
            // 비자, TOPIK 등 통합 정보가 별도 API에 있다면 추가 호출 필요 (현재는 통합/단건 조회 객체에 있다고 가정)
            visaType: s.visaType || '정보없음',
            topikLevel: s.topikLevel || '미제출',
            langSchool: s.langSchool || '정보없음',
            basicTestResult: s.basicTestResult || '미응시',
            maxWorkHours: workInfo.maxWorkHoursPerWeek ? `주 ${workInfo.maxWorkHoursPerWeek}시간` : '제한됨',
            attendance: acaInfo.attendance || 0,
            absenceCount: acaInfo.absenceCount || 0,
            gpa: acaInfo.totalGpa || 0,
          });
        }
      } catch (error) {
        console.error("학생 정보 조회 실패:", error);
        alert("학생 정보를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchStudentData();
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: '#9CA3AF', fontSize: '0.875rem' }}>
        데이터 로딩 중...
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#EF4444' }}>
        학생 데이터를 찾을 수 없습니다.
      </div>
    );
  }

  const initials = student.korName ? student.korName.slice(0, 2) : 'NA';

  return (
    <div style={{ 
      fontFamily: "'DM Sans', 'Noto Sans KR', sans-serif", 
      fontSize: '0.875rem', 
      color: '#111827', 
      padding: '1.25rem', 
      backgroundColor: '#FDFDFD',
      minHeight: '100vh'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        .bt-topbar { 
          background: #fff; padding: 0 1.75rem; height: 3.625rem; 
          display: flex; align-items: center; justify-content: space-between; 
          border-bottom: 0.0625rem solid #E5E7EB; margin-bottom: 1.5rem; 
        }
        .bt-topbar-left { display: flex; align-items: center; gap: 0.625rem; }
        .bt-back-btn { 
          width: 1.875rem; height: 1.875rem; border-radius: 0.4375rem; 
          background: #F3F4F6; border: none; cursor: pointer; 
          display: flex; align-items: center; justify-content: center; 
          transition: background 0.15s; color: #374151; 
        }
        .bt-back-btn:hover { background: #E5E7EB; }
        .bt-breadcrumb { font-size: 0.8125rem; color: #9CA3AF; }
        .bt-breadcrumb span { color: #111827; font-weight: 600; }

        .bt-profile-header { 
          background: #fff; border-radius: 0.875rem; border: 0.0625rem solid #F3F4F6; 
          padding: 1.5rem 1.75rem; margin-bottom: 1.125rem; 
          display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;
        }
        .bt-profile-photo { 
          width: 4.5rem; height: 4.5rem; border-radius: 0.875rem; 
          background: linear-gradient(135deg, #3B82F6, #1A3A5C); 
          display: flex; align-items: center; justify-content: center; 
          font-size: 1.5rem; font-weight: 700; color: #fff; flex-shrink: 0; overflow: hidden; 
        }
        .bt-profile-main { flex: 1; min-width: 15rem; }
        .bt-profile-name { font-size: 1.25rem; font-weight: 700; color: #111827; letter-spacing: -0.0188rem; margin-bottom: 0.25rem; }
        .bt-profile-sub { font-size: 0.8125rem; color: #6B7280; margin-bottom: 0.625rem; }
        
        .bt-profile-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .bt-chip { font-size: 0.7188rem; font-weight: 500; padding: 0.25rem 0.625rem; border-radius: 1.25rem; }
        .bt-chip-blue { background: #EFF6FF; color: #1D4ED8; }
        .bt-chip-green { background: #F0FDF4; color: #16A34A; }
        .bt-chip-gray { background: #F3F4F6; color: #6B7280; }

        .bt-profile-stats { display: flex; gap: 1.75rem; margin-left: auto; text-align: center; }
        .bt-pstat-item.clickable {
          cursor: pointer;
          transition: all 0.2s;
          padding: 0.5rem 0.75rem;
          border-radius: 0.75rem;
          border: 1px solid transparent;
        }
        .bt-pstat-item.clickable:hover {
          background: #F9FAFB;
          border-color: #E5E7EB;
          transform: translateY(-2px);
        }
        .bt-pstat-val { font-size: 1.375rem; font-weight: 700; color: #111827; letter-spacing: -0.0313rem; }
        .bt-pstat-val.blue { color: #3B82F6; }
        .bt-pstat-val.red { color: #EF4444; }
        .bt-pstat-label { font-size: 0.6875rem; color: #9CA3AF; margin-top: 0.125rem; }

        .bt-info-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(18.75rem, 1fr)); 
          gap: 1rem; 
        }
        .bt-info-card { background: #fff; border-radius: 0.875rem; border: 0.0625rem solid #F3F4F6; padding: 1.25rem 1.375rem; }
        
        .bt-info-card.clickable { 
          cursor: pointer; 
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }
        .bt-info-card.clickable:hover { 
          transform: translateY(-0.125rem); 
          box-shadow: 0 0.25rem 0.75rem rgba(0,0,0,0.05);
          border-color: #3B82F6;
        }

        .bt-info-card-title { 
          font-size: 0.8125rem; font-weight: 700; color: #111827; 
          margin-bottom: 1rem; padding-bottom: 0.625rem; 
          border-bottom: 0.0625rem solid #F3F4F6; 
          display: flex; justify-content: space-between; align-items: center;
        }
        
        .bt-info-row { display: flex; justify-content: space-between; align-items: center; padding: 0.4375rem 0; border-bottom: 0.0625rem solid #F9FAFB; }
        .bt-info-row:last-child { border-bottom: none; }
        .bt-info-key { font-size: 0.7813rem; color: #9CA3AF; font-weight: 400; }
        .bt-info-val { font-size: 0.8125rem; color: #111827; font-weight: 500; text-align: right; }
        .bt-info-val.blue { color: #3B82F6; font-weight: 600; }
      `}</style>

      <div className="bt-topbar">
        <div className="bt-topbar-left">
          <button className="bt-back-btn" onClick={() => navigate('/admin/dashboard')} title="대시보드로 돌아가기">
            <svg width="1rem" height="1rem" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="bt-breadcrumb">관리자 대시보드 › 학생 목록 › <span>학생 기본 정보</span></div>
        </div>
      </div>

      <div className="bt-profile-header">
        <div className="bt-profile-photo">{initials}</div>
        <div className="bt-profile-main">
          <div className="bt-profile-name">
            {student.korName} <span style={{fontSize:'0.875rem', color:'#9CA3AF', fontWeight: 400}}>{student.engName}</span>
          </div>
          <div className="bt-profile-sub">{student.studentId} · {student.deptName}</div>
          <div className="bt-profile-chips">
            <span className="bt-chip bt-chip-green">{student.enrollStatus}</span>
            <span className="bt-chip bt-chip-blue">{student.visaType}</span>
            <span className="bt-chip bt-chip-gray">{student.nationality}</span>
          </div>
        </div>

        <div className="bt-profile-stats">
          <div 
            className="bt-pstat-item clickable" 
            onClick={() => {
              navigate(`/admin/students/${id}/attendance`);
              if (onTabChange) onTabChange('attendance');
            }}
            title="상세 출석 현황 보기"
          >
            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <div>
                <div className="bt-pstat-val blue">{student.attendance}%</div>
                <div className="bt-pstat-label">출석률 ❯</div>
              </div>
              <div>
                <div className="bt-pstat-val red">{student.absenceCount}</div>
                <div className="bt-pstat-label">결석 횟수</div>
              </div>
            </div>
          </div>

          <div 
            className="bt-pstat-item clickable" 
            onClick={() => {
              navigate(`/admin/students/${id}/enroll`);
              if (onTabChange) onTabChange('enroll');
            }}
            title="성적 상세 보기"
          >
            <div className="bt-pstat-val">{student.gpa}</div>
            <div className="bt-pstat-label">평점 ❯</div>
          </div>
        </div>
      </div>

      <div className="bt-info-grid">
        <div className="bt-info-card">
          <div className="bt-info-card-title">개인 정보</div>
          <div className="bt-info-row"><span className="bt-info-key">성명 (한국어)</span><span className="bt-info-val">{student.korName}</span></div>
          <div className="bt-info-row"><span className="bt-info-key">생년월일</span><span className="bt-info-val">{student.birthDate}</span></div>
          <div className="bt-info-row"><span className="bt-info-key">연락처</span><span className="bt-info-val">{student.phone}</span></div>
        </div>

        <div className="bt-info-card">
          <div className="bt-info-card-title">학적 정보</div>
          <div className="bt-info-row"><span className="bt-info-key">학번</span><span className="bt-info-val blue">{student.studentId}</span></div>
          <div className="bt-info-row"><span className="bt-info-key">소속 학과</span><span className="bt-info-val">{student.deptName}</span></div>
          <div className="bt-info-row"><span className="bt-info-key">비자 종류</span><span className="bt-info-val">{student.visaType}</span></div>
        </div>

        <div 
          className="bt-info-card clickable" 
          onClick={() => {
            navigate(`/admin/students/${id}/topik`);
            if (onTabChange) onTabChange('topik');
          }}
        >
          <div className="bt-info-card-title">
            한국어 능력
            <span style={{color:'#3B82F6', fontSize:'0.6875rem', fontWeight:400}}>상세보기 ❯</span>
          </div>
          <div className="bt-info-row">
            <span className="bt-info-key">TOPIK 급수</span>
            <span className="bt-info-val" style={{fontSize:'1rem', color:'#1A3A5C', fontWeight:700}}>{student.topikLevel}</span>
          </div>
          <div className="bt-info-row"><span className="bt-info-key">출신 어학원</span><span className="bt-info-val">{student.langSchool}</span></div>
          <div className="bt-info-row">
            <span className="bt-info-key">기초능력평가</span>
            <span className="bt-info-val">
              <span className="bt-chip bt-chip-green" style={{ fontSize: '0.6875rem' }}>{student.basicTestResult}</span>
            </span>
          </div>
        </div>

        <div className="bt-info-card">
          <div className="bt-info-card-title">근로 정보</div>
          <div className="bt-info-row">
            <span className="bt-info-key">합법 근로 가능시간</span>
            <span className="bt-info-val blue">{student.maxWorkHours}</span>
          </div>
        </div>
      </div>
    </div>
  );
}