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
  const [isLoading, setIsLoading] = useState(true);
  
  // 학생 데이터 상태 관리 (등록/조회 공통)
  const [student, setStudent] = useState({
    studentId: '', korName: '', engName: '', deptId: '', deptName: '',
    gender: 'MALE', nationality: '', birthDate: '', phone: '', address: '',
    classSec: '', grade: '1', admissionDate: '', enrollStatus: '재학',
    foreignRegNo: '', visaType: '정보없음', topikLevel: '정보없음', 
    maxWorkHours: '정보없음', attendance: '-', gpa: '0.0', photoUrl: null
  });

  // 드롭다운 바인딩을 위한 기초 데이터 상태
  const [departments, setDepartments] = useState([]);
  const [nationalities, setNationalities] = useState([]);

  const isNewMode = id === 'new'; // 신규 등록 모드 여부

  useEffect(() => {
    const initComponent = async () => {
      setIsLoading(true);
      try {
        // 1. 학과 목록 및 국적 목록 기본 로드 (공통 활용)
        const [deptRes, natRes] = await Promise.all([
          api.get('/api/v1/depts').catch(() => ({ data: { success: false } })),
          api.get('/api/v1/nationalities').catch(() => ({ data: { success: false } }))
        ]);
        
        if (deptRes.data && deptRes.data.success) setDepartments(deptRes.data.data);
        
        // 국적 데이터 처리 보완
        if (natRes.data && natRes.data.success) {
          setNationalities(natRes.data.data);
        } else {
          // 백엔드 API 연결 실패 시 프론트엔드 비상용 기본 국적 리스트 하드코딩 (방어 코드)
          setNationalities(['대한민국', '베트남', '중국', '몽골', '우즈베키스탄', '일본', '미국']);
        }

        // 2. 신규 모드일 때와 조회 모드일 때 분기
        if (isNewMode) {
          setStudent({
            studentId: '', korName: '', engName: '', deptId: '', deptName: '',
            gender: 'MALE', nationality: '', birthDate: '', phone: '', address: '',
            classSec: '', grade: '1', admissionDate: '', enrollStatus: '재학',
            foreignRegNo: '', visaType: '정보없음', topikLevel: '정보없음', 
            maxWorkHours: '정보없음', attendance: '-', gpa: '0.0', photoUrl: null
          });
        } else {
          const response = await api.get(`/api/v1/students/${id}`);
          if (response.data.success) {
            const s = response.data.data;
            setStudent({
              studentId: s.studentId || id,
              deptId: s.deptId || '',
              deptName: s.deptName || '소속 정보 없음',
              engName: s.engName || '',
              korName: s.korName || '이름 없음',
              gender: s.gender || 'MALE',
              nationality: s.nationality || '-',
              birthDate: s.birthDate || '',
              phone: s.phone || '',
              address: s.address || '',
              classSec: s.classSec || '',
              grade: s.grade || '1',
              admissionDate: s.admissionDate || '',
              enrollStatus: s.enrollStatus || '재학',
              foreignRegNo: s.foreignRegNo || '',
              visaType: s.visaType || (s.currentVisa && s.currentVisa.visaType) || '정보없음',
              topikLevel: s.topikLevel || '정보없음', 
              maxWorkHours: s.maxWorkHoursPerWeek ? `주 ${s.maxWorkHoursPerWeek}시간` : '정보없음',
              attendance: s.totalAttendRate ? `${s.totalAttendRate}%` : '-', 
              gpa: s.totalGpa || s.gpa || '0.0', 
              photoUrl: s.photoUrl || null
            });
          }
        }
      } catch (error) {
        console.error("데이터 로드 중 오류 발생:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initComponent();
  }, [id, isNewMode]);

  // 입력값 변경 핸들러
  const handleInputChange = (field, value) => {
    setStudent(prev => ({ ...prev, [field]: value }));
  };

  // 백엔드 서버로 학생 등록 요청 (POST /api/v1/students)
  const handleRegisterSubmit = async () => {
    if (!student.studentId || !student.korName || !student.deptId || !student.nationality) {
      alert("학번, 한글 이름, 소속 학과, 국적은 필수 입력 항목입니다.");
      return;
    }

    try {
      const payload = {
        studentId: student.studentId,
        korName: student.korName,
        engName: student.engName,
        deptId: student.deptId,
        grade: parseInt(student.grade),
        classSec: student.classSec,
        gender: student.gender,
        nationality: student.nationality,
        birthDate: student.birthDate,
        phone: student.phone,
        address: student.address,
        admissionDate: student.admissionDate,
        enrollStatus: student.enrollStatus,
        foreignRegNo: student.foreignRegNo
      };

      const response = await api.post('/api/v1/students', payload);
      
      if (response.data.success) {
        alert("학생 단건 등록이 완료되었습니다.");
        navigate('/admin/dashboard'); 
      } else {
        alert(`등록 실패: ${response.data.message}`);
      }
    } catch (error) {
      console.error("학생 등록 실패:", error);
      alert(error.response?.data?.message || "서버 통신 중 에러가 발생했습니다.");
    }
  };

  if (isLoading) return <div style={{ padding: '5rem', textAlign: 'center', color: '#9CA3AF' }}>데이터 로드 중...</div>;
  if (!student && !isNewMode) return <div style={{ padding: '5rem', textAlign: 'center', color: '#EF4444' }}>학생 정보를 찾을 수 없습니다.</div>;

  const initials = student.korName ? student.korName.slice(0, 2) : 'NEW';

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: '0.875rem', color: '#111827', padding: '1.25rem', backgroundColor: '#FDFDFD', minHeight: '100vh' }}>
      <style>{`
        .bt-topbar { background: #fff; padding: 0 1.75rem; height: 3.625rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E5E7EB; margin-bottom: 1.5rem; }
        .bt-back-btn { width: 1.875rem; height: 1.875rem; border-radius: 0.4375rem; background: #F3F4F6; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; margin-right: 1rem; }
        .bt-profile-header { background: #fff; border-radius: 0.875rem; border: 1px solid #F3F4F6; padding: 1.5rem 1.75rem; margin-bottom: 1.125rem; display: flex; align-items: center; gap: 1.5rem; }
        .bt-profile-photo { width: 4.5rem; height: 4.5rem; border-radius: 0.875rem; background: linear-gradient(135deg, #3B82F6, #1A3A5C); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; color: #fff; overflow: hidden; }
        .bt-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .bt-info-card { background: #fff; border-radius: 0.875rem; border: 1px solid #F3F4F6; padding: 1.25rem; }
        .bt-info-card-title { font-size: 0.8125rem; font-weight: 700; border-bottom: 1px solid #F3F4F6; padding-bottom: 0.5rem; margin-bottom: 1rem; color: #1A3A5C; }
        .bt-info-row { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #F9FAFB; }
        .bt-info-key { color: #6B7280; font-weight: 600; }
        .bt-info-val { font-weight: 500; text-align: right; }
        
        .bt-form-input { padding: 6px 10px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 13px; width: 65%; text-align: right; box-sizing: border-box; }
        .bt-form-input:focus { border-color: #3B82F6; outline: none; }
        .bt-form-select { padding: 6px 10px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 13px; width: 65%; background: #fff; text-align-last: right; padding-right: 5px; }
        .bt-submit-btn { background: #1A3A5C; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; transition: background 0.2s; }
        .bt-submit-btn:hover { background: #2A4A6C; }
      `}</style>

      <div className="bt-topbar">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className="bt-back-btn" onClick={() => navigate('/admin/dashboard')}>
            <svg width="1rem" height="1rem" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div style={{ color: '#9CA3AF' }}>학생 관리 › <span style={{ color: '#111827', fontWeight: 600 }}>{isNewMode ? '신규 학생 등록' : `${student.korName} 정보`}</span></div>
        </div>
        {isNewMode && (
          <button className="bt-submit-btn" onClick={handleRegisterSubmit}>등록 완료</button>
        )}
      </div>

      <div className="bt-profile-header">
        <div className="bt-profile-photo">
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          {isNewMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="bt-form-input" style={{ width: '140px', textAlign: 'left' }} placeholder="한글 이름 (필수)" value={student.korName} onChange={(e) => handleInputChange('korName', e.target.value)} />
                <input className="bt-form-input" style={{ width: '160px', textAlign: 'left' }} placeholder="영문 이름" value={student.engName} onChange={(e) => handleInputChange('engName', e.target.value)} />
              </div>
              <div style={{ color: '#6B7280', fontSize: '13px' }}>학번과 학과는 하단 학적 상세에서 입력해 주세요.</div>
            </div>
          ) : (
            <>
              <div className="bt-profile-name">{student.korName} <span style={{ fontSize: '0.9rem', color: '#9CA3AF', fontWeight: 400 }}>{student.engName}</span></div>
              <div style={{ color: '#6B7280', marginBottom: '0.5rem' }}>{student.studentId} | {student.deptName}</div>
              <div>
                <span className="bt-chip bt-chip-green">{student.enrollStatus}</span>
                <span className="bt-chip bt-chip-blue">{student.visaType}</span>
                <span className="bt-chip" style={{ background: '#F3F4F6' }}>{student.nationality}</span>
              </div>
            </>
          )}
        </div>
        
        {!isNewMode && (
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
        )}
      </div>

      <div className="bt-info-grid">
        {/* 인적 사항 카드 */}
        <div className="bt-info-card">
          <div className="bt-info-card-title">인적 사항</div>
          
          <div className="bt-info-row">
            <span className="bt-info-key">생년월일</span>
            {isNewMode ? (
              <input type="date" className="bt-form-input" value={student.birthDate} onChange={(e) => handleInputChange('birthDate', e.target.value)} />
            ) : (
              <span className="bt-info-val">{student.birthDate}</span>
            )}
          </div>

          <div className="bt-info-row">
            <span className="bt-info-key">연락처</span>
            {isNewMode ? (
              <input type="tel" className="bt-form-input" placeholder="010-0000-0000" value={student.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
            ) : (
              <span className="bt-info-val">{student.phone}</span>
            )}
          </div>

          <div className="bt-info-row">
            <span className="bt-info-key">성별</span>
            {isNewMode ? (
              <select className="bt-form-select" value={student.gender} onChange={(e) => handleInputChange('gender', e.target.value)}>
                <option value="MALE">남성 (MALE)</option>
                <option value="FEMALE">여성 (FEMALE)</option>
              </select>
            ) : (
              <span className="bt-info-val">{student.gender === 'MALE' ? '남성' : '여성'}</span>
            )}
          </div>

          <div className="bt-info-row">
            <span className="bt-info-key">외국인등록번호</span>
            {isNewMode ? (
              <input type="text" className="bt-form-input" placeholder="비밀번호 초기화용 필수" value={student.foreignRegNo} onChange={(e) => handleInputChange('foreignRegNo', e.target.value)} />
            ) : (
              <span className="bt-info-val">{student.foreignRegNo || '-'}</span>
            )}
          </div>

          <div className="bt-info-row">
            <span className="bt-info-key">주소</span>
            {isNewMode ? (
              <input type="text" className="bt-form-input" placeholder="거주 주소 입력" value={student.address} onChange={(e) => handleInputChange('address', e.target.value)} />
            ) : (
              <span className="bt-info-val" style={{ fontSize: '0.75rem' }}>{student.address}</span>
            )}
          </div>
        </div>

        {/* 학적 상세 카드 */}
        <div className="bt-info-card">
          <div className="bt-info-card-title">학적 상세</div>
          
          <div className="bt-info-row">
            <span className="bt-info-key">학번 (ID)</span>
            {isNewMode ? (
              <input type="text" className="bt-form-input" placeholder="학번 입력 (필수)" value={student.studentId} onChange={(e) => handleInputChange('studentId', e.target.value)} />
            ) : (
              <span className="bt-info-val">{student.studentId}</span>
            )}
          </div>

          <div className="bt-info-row">
            <span className="bt-info-key">소속학과</span>
            {isNewMode ? (
              <select className="bt-form-select" value={student.deptId} onChange={(e) => handleInputChange('deptId', e.target.value)}>
                <option value="">학과 선택</option>
                {departments.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
              </select>
            ) : (
              <span className="bt-info-val">{student.deptName}</span>
            )}
          </div>

          <div className="bt-info-row">
            <span className="bt-info-key">학년/반</span>
            {isNewMode ? (
              <div style={{ width: '65%', display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                <select className="bt-form-select" style={{ width: '45%' }} value={student.grade} onChange={(e) => handleInputChange('grade', e.target.value)}>
                  {[1,2,3,4].map(g => <option key={g} value={String(g)}>{g}학년</option>)}
                </select>
                <input className="bt-form-input" style={{ width: '45%' }} placeholder="A반" value={student.classSec} onChange={(e) => handleInputChange('classSec', e.target.value)} />
              </div>
            ) : (
              <span className="bt-info-val">{student.grade}학년 ({student.classSec}반)</span>
            )}
          </div>

          <div className="bt-info-row">
            <span className="bt-info-key">입학일</span>
            {isNewMode ? (
              <input type="date" className="bt-form-input" value={student.admissionDate} onChange={(e) => handleInputChange('admissionDate', e.target.value)} />
            ) : (
              <span className="bt-info-val">{student.admissionDate}</span>
            )}
          </div>

          <div className="bt-info-row">
            <span className="bt-info-key">학적상태</span>
            {isNewMode ? (
              <select className="bt-form-select" value={student.enrollStatus} onChange={(e) => handleInputChange('enrollStatus', e.target.value)}>
                <option value="재학">재학</option>
                <option value="휴학">휴학</option>
                <option value="제적">제적</option>
                <option value="졸업">졸업</option>
              </select>
            ) : (
              <span className="bt-info-val">{student.enrollStatus}</span>
            )}
          </div>
        </div>

        {/* 비자 및 국적 카드 */}
        <div className="bt-info-card">
          <div className="bt-info-card-title">비자 및 국적</div>
          
          <div className="bt-info-row">
            <span className="bt-info-key">국적</span>
            {isNewMode ? (
              <select className="bt-form-select" value={student.nationality} onChange={(e) => handleInputChange('nationality', e.target.value)}>
                <option value="">국적 선택</option>
                {nationalities.map((n, idx) => {
                  // 객체 구조(n.name)와 일반 문자열(n) 형태 모두를 완벽하게 지원
                  const val = n && typeof n === 'object' ? (n.name || n.nationalityName) : n;
                  return <option key={idx} value={val}>{val}</option>;
                })}
              </select>
            ) : (
              <span className="bt-info-val">{student.nationality}</span>
            )}
          </div>

          <div className="bt-info-row">
            <span className="bt-info-key">현재 비자 상태</span>
            <span className="bt-info-val" style={{ color: isNewMode ? '#9CA3AF' : '#111827' }}>
              {isNewMode ? '등록 완료 후 학생 상세에서 지정 가능' : student.visaType}
            </span>
          </div>

          <div className="bt-info-row">
            <span className="bt-info-key">TOPIK 급수</span>
            <span className="bt-info-val" style={{ color: isNewMode ? '#9CA3AF' : '#111827' }}>
              {isNewMode ? '등록 완료 후 역량 메뉴에서 지정 가능' : student.topikLevel}
            </span>
          </div>
        </div>
      </div>
      
      {isNewMode && (
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button className="bt-submit-btn" style={{ padding: '12px 40px', fontSize: '15px' }} onClick={handleRegisterSubmit}>
            학생 정보 시스템 등록하기
          </button>
        </div>
      )}
    </div>
  );
}