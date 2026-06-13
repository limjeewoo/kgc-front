import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../api/axios';

export default function BasicTab({ readOnly = false, onTabChange, studentId: studentIdProp }) {
  const params = useParams();
  const navigate = useNavigate();

  const id = studentIdProp || params.studentId || params.id;
  const isNewMode = id === 'new';

  const EMPTY_STUDENT = {
    studentId:'', korName:'', engName:'', deptId:'', deptName:'',
    gender:'남', nationality:'', birthDate:'', phone:'', address:'',
    classSec:'', grade:'1', admissionDate:'', enrollStatus:'재학',
    foreignRegNo:'', visaType:'정보없음', topikLevel:'정보없음',
    maxWorkHours:'정보없음', gpa:null, totalCredits:null, photoUrl:null,
  };

  const [isLoading, setIsLoading]             = useState(true);
  const [student, setStudent]                 = useState(EMPTY_STUDENT);
  const [originalStudent, setOriginalStudent] = useState(EMPTY_STUDENT);
  const [departments, setDepartments]         = useState([]);
  const [nationalities, setNationalities]     = useState([]);
  const [isEditMode, setIsEditMode]           = useState(false);
  const [isSaving, setIsSaving]               = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.get('/api/v1/depts').catch(() => ({ data: { success: false } })),
      api.get('/api/v1/nationalities').catch(() => ({ data: { success: false } })),
    ]).then(([deptRes, natRes]) => {
      if (deptRes.data?.success) setDepartments(deptRes.data.data);
      if (natRes.data?.success) {
        setNationalities(natRes.data.data);
      } else {
        setNationalities(['베트남', '중국', '몽골', '우즈베키스탄', '일본', '미국', '기타']);
      }
    });

    if (isNewMode) {
      setStudent(EMPTY_STUDENT);
      setIsLoading(false);
      return;
    }

    if (!id || id === 'undefined') {
      console.warn('유효하지 않은 학생 ID:', params);
      setIsLoading(false);
      return;
    }

    api.get(`/api/v1/students/${id}`)
      .then(res => {
        if (res.data.success) {
          const s = res.data.data;
          const mapped = {
            studentId:    s.studentId || id,
            deptId:       s.deptId || '',
            deptName:     s.deptName || '소속 정보 없음',
            engName:      s.engName || '',
            korName:      s.korName || '이름 없음',
            // 백엔드: "남" / "여"
            gender:       s.gender || '남',
            nationality:  s.nationality || '-',
            birthDate:    s.birthDate || '',
            phone:        s.phone || '',
            address:      s.address || '',
            classSec:     s.classSec || '',
            grade:        String(s.grade || '1'),
            admissionDate: s.admissionDate || '',
            enrollStatus: s.enrollStatus || '재학',
            foreignRegNo: s.foreignRegNo || '',
            // 아래 세 필드는 /api/v1/students/{id} 응답에 없음
            // → 비자/TOPIK 탭 또는 별도 API에서 관리
            visaType:     '정보없음',
            topikLevel:   '정보없음',
            maxWorkHours: '정보없음',
            // 명세서 기준 필드명
            gpa:          s.gpa ?? null,
            totalCredits: s.totalCredits ?? null,
            photoUrl:     s.photoUrl || null,
          };
          setStudent(mapped);
          setOriginalStudent(mapped);
        }
      })
      .catch(e => console.error('학생 조회 실패:', e))
      .finally(() => setIsLoading(false));
  }, [id]);

  const set = (field) => (e) => setStudent(p => ({ ...p, [field]: e.target.value }));

  const handleRegisterSubmit = async () => {
    if (!student.studentId || !student.korName || !student.deptId || !student.nationality) {
      alert('학번, 한글 이름, 소속 학과, 국적은 필수 입력 항목입니다.');
      return;
    }
    try {
      const res = await api.post('/api/v1/students', {
        studentId:     student.studentId,
        korName:       student.korName,
        engName:       student.engName || null,
        deptId:        student.deptId,
        grade:         parseInt(student.grade) || 1,
        classSec:      student.classSec || null,
        gender:        student.gender,       // "남" / "여"
        nationality:   student.nationality,
        birthDate:     student.birthDate || null,
        phone:         student.phone || null,
        address:       student.address || null,
        admissionDate: student.admissionDate || null,
        enrollStatus:  student.enrollStatus,
        foreignRegNo:  student.foreignRegNo || null,
      });
      if (res.data.success) {
        alert('학생 등록이 완료되었습니다.');
        navigate('/admin/dashboard');
      } else {
        alert(`등록 실패: ${res.data.message}`);
      }
    } catch (e) {
      alert(e.response?.data?.message || '서버 통신 오류');
    }
  };

  const handleEditSave = async () => {
    if (!student.korName || !student.deptId || !student.nationality) {
      alert('한글 이름, 소속 학과, 국적은 필수 입력 항목입니다.');
      return;
    }
    try {
      setIsSaving(true);
      const res = await api.put(`/api/v1/students/${id}`, {
        studentId:     id,
        korName:       student.korName,
        engName:       student.engName || null,
        deptId:        student.deptId,
        grade:         parseInt(student.grade) || 1,
        classSec:      student.classSec || null,
        gender:        student.gender,       // "남" / "여"
        nationality:   student.nationality,
        birthDate:     student.birthDate || null,
        phone:         student.phone || null,
        address:       student.address || null,
        admissionDate: student.admissionDate || null,
        enrollStatus:  student.enrollStatus,
        foreignRegNo:  student.foreignRegNo || null,
      });
      if (res.data.success) {
        alert('학생 정보가 수정되었습니다.');
        setOriginalStudent(student);
        setIsEditMode(false);
      } else {
        alert(`수정 실패: ${res.data.message}`);
      }
    } catch (e) {
      alert(e.response?.data?.message || '서버 통신 오류');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCancel = () => {
    setStudent(originalStudent);
    setIsEditMode(false);
  };

  if (isLoading) return (
    <div style={{ padding:'5rem', textAlign:'center', color:'#9CA3AF' }}>데이터 로드 중...</div>
  );

  const initials = student.korName ? student.korName.slice(0, 2) : 'NEW';
  const isViewOnly = readOnly || (!isNewMode && !isEditMode);

  const renderInput = (field, type = 'text', placeholder = '') => {
    if (isViewOnly) return <span className="bt-info-val">{student[field] || '–'}</span>;
    return (
      <input
        type={type}
        className="bt-form-input"
        placeholder={placeholder}
        value={student[field] || ''}
        onChange={set(field)}
      />
    );
  };

  return (
    <div style={{ fontFamily:"'DM Sans','Noto Sans KR',sans-serif", fontSize:'0.875rem', color:'#111827', padding:'1.25rem', background:'#FDFDFD', minHeight:'100vh' }}>
      <style>{`
        .bt-topbar { background:#fff; padding:0 1.75rem; height:3.625rem; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #E5E7EB; margin-bottom:1.5rem; }
        .bt-back-btn { width:1.875rem; height:1.875rem; border-radius:7px; background:#F3F4F6; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; margin-right:1rem; }
        .bt-crumb { color:#9CA3AF; font-size:13px; }
        .bt-crumb strong { color:#111827; font-weight:600; }
        .bt-profile-header { background:#fff; border-radius:14px; border:1px solid #F1F5F9; padding:1.5rem 1.75rem; margin-bottom:1.125rem; display:flex; align-items:center; gap:1.5rem; }
        .bt-profile-photo { width:4.5rem; height:4.5rem; border-radius:14px; background:linear-gradient(135deg,#3B82F6,#1A3A5C); display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:700; color:#fff; overflow:hidden; flex-shrink:0; }
        .bt-profile-name { font-size:1.2rem; font-weight:700; color:#0F172A; margin-bottom:4px; }
        .bt-readonly-banner { display:flex; align-items:center; gap:8px; padding:10px 16px; background:#FFFBEB; border:1px solid #FDE68A; border-radius:10px; font-size:12px; color:#D97706; font-weight:600; margin-bottom:1rem; }
        .bt-editmode-banner { display:flex; align-items:center; gap:8px; padding:10px 16px; background:#EFF6FF; border:1px solid #BFDBFE; border-radius:10px; font-size:12px; color:#1D4ED8; font-weight:600; margin-bottom:1rem; }
        .bt-info-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(18rem,1fr)); gap:1rem; margin-bottom:1.5rem; }
        .bt-info-card { background:#fff; border-radius:14px; border:1px solid #F1F5F9; padding:1.25rem; }
        .bt-info-card-title { font-size:0.8125rem; font-weight:700; border-bottom:1px solid #F3F4F6; padding-bottom:0.5rem; margin-bottom:1rem; color:#1A3A5C; }
        .bt-info-row { display:flex; align-items:center; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid #F9FAFB; }
        .bt-info-row:last-child { border-bottom:none; }
        .bt-info-key { color:#6B7280; font-weight:600; font-size:13px; }
        .bt-info-val { font-weight:500; text-align:right; color:#374151; }
        .bt-form-input { padding:6px 10px; border:1.5px solid #E5E7EB; border-radius:6px; font-size:13px; width:65%; text-align:right; box-sizing:border-box; font-family:inherit; outline:none; transition:border-color .15s; }
        .bt-form-input:focus { border-color:#93C5FD; }
        .bt-form-select { padding:6px 10px; border:1.5px solid #E5E7EB; border-radius:6px; font-size:13px; width:65%; background:#fff; font-family:inherit; outline:none; transition:border-color .15s; }
        .bt-form-select:focus { border-color:#93C5FD; }
        .bt-submit-btn { background:#1A3A5C; color:#fff; border:none; padding:10px 24px; border-radius:8px; font-weight:700; cursor:pointer; font-size:13px; font-family:inherit; transition:background .15s; }
        .bt-submit-btn:hover { background:#15304e; }
        .bt-submit-btn:disabled { background:#94A3B8; cursor:not-allowed; }
        .bt-edit-btn { background:#3B82F6; color:#fff; border:none; padding:10px 24px; border-radius:8px; font-weight:700; cursor:pointer; font-size:13px; font-family:inherit; transition:background .15s; }
        .bt-edit-btn:hover { background:#2563EB; }
        .bt-cancel-btn { background:#F3F4F6; color:#374151; border:none; padding:10px 24px; border-radius:8px; font-weight:700; cursor:pointer; font-size:13px; font-family:inherit; transition:background .15s; margin-right:8px; }
        .bt-cancel-btn:hover { background:#E5E7EB; }
        .bt-chip { display:inline-block; padding:2px 9px; border-radius:6px; font-size:11px; font-weight:600; margin-right:5px; }
        .bt-chip-green { background:#ECFDF5; color:#059669; }
        .bt-chip-blue  { background:#EFF6FF; color:#1D4ED8; }
      `}</style>

      <div className="bt-topbar">
        <div style={{ display:'flex', alignItems:'center' }}>
          <button className="bt-back-btn" onClick={() => navigate(-1)}>
            <svg width="1rem" height="1rem" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="bt-crumb">
            학생 관리 › <strong>{isNewMode ? '신규 학생 등록' : `${student.korName} 정보`}</strong>
          </div>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          {isNewMode && !readOnly && (
            <button className="bt-submit-btn" onClick={handleRegisterSubmit}>등록 완료</button>
          )}
          {!isNewMode && !readOnly && !isEditMode && (
            <button className="bt-edit-btn" onClick={() => setIsEditMode(true)}>✏️ 정보 수정</button>
          )}
        </div>
      </div>

      {readOnly && (
        <div className="bt-readonly-banner">
          🔒 교수 권한으로 조회 중입니다. 학적 정보 수정은 관리자만 가능합니다.
        </div>
      )}
      {isEditMode && (
        <div className="bt-editmode-banner">
          ✏️ 수정 모드입니다. 변경 후 하단 [변경사항 저장하기] 버튼을 눌러주세요.
        </div>
      )}

      {/* 프로필 헤더 */}
      <div className="bt-profile-header">
        <div className="bt-profile-photo">{initials}</div>
        <div style={{ flex:1 }}>
          {isNewMode ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display:'flex', gap:8 }}>
                <input className="bt-form-input" style={{ width:140, textAlign:'left' }} placeholder="한글 이름 (필수)" value={student.korName} onChange={set('korName')} />
                <input className="bt-form-input" style={{ width:160, textAlign:'left' }} placeholder="영문 이름" value={student.engName} onChange={set('engName')} />
              </div>
              <div style={{ color:'#94A3B8', fontSize:12 }}>학번과 학과는 하단 학적 상세에서 입력해 주세요.</div>
            </div>
          ) : (
            <>
              <div className="bt-profile-name">
                {student.korName} <span style={{ fontSize:'0.9rem', color:'#9CA3AF', fontWeight:400 }}>{student.engName}</span>
              </div>
              <div style={{ color:'#6B7280', marginBottom:'0.5rem', fontSize:13 }}>{student.studentId} | {student.deptName}</div>
              <div>
                <span className="bt-chip bt-chip-green">{student.enrollStatus}</span>
                <span className="bt-chip bt-chip-blue">{student.visaType}</span>
                <span className="bt-chip" style={{ background:'#F3F4F6', color:'#374151' }}>{student.nationality}</span>
              </div>
            </>
          )}
        </div>
        {!isNewMode && (
          <div style={{ display:'flex', gap:'2rem', textAlign:'center' }}>
            <div>
              {/* totalCredits: 명세서 기준 필드 */}
              <div style={{ fontSize:'1.3rem', fontWeight:700, color:'#3B82F6' }}>
                {student.totalCredits ?? '-'}
              </div>
              <div style={{ fontSize:'0.7rem', color:'#9CA3AF' }}>총이수학점</div>
            </div>
            <div>
              {/* gpa: 명세서 기준 필드 */}
              <div style={{ fontSize:'1.3rem', fontWeight:700, color:'#0F172A' }}>
                {student.gpa?.toFixed(2) ?? '-'}
              </div>
              <div style={{ fontSize:'0.7rem', color:'#9CA3AF' }}>누적평점</div>
            </div>
          </div>
        )}
      </div>

      <div className="bt-info-grid">
        {/* 인적 사항 */}
        <div className="bt-info-card">
          <div className="bt-info-card-title">인적 사항</div>
          {[
            { key:'생년월일',      field:'birthDate',    type:'date' },
            { key:'연락처',        field:'phone',        type:'tel',  ph:'010-0000-0000' },
            { key:'주소',          field:'address',      type:'text', ph:'거주 주소 입력' },
            { key:'외국인등록번호',  field:'foreignRegNo', type:'text', ph:'비밀번호 초기화용' },
          ].map(({ key, field, type, ph }) => (
            <div key={field} className="bt-info-row">
              <span className="bt-info-key">{key}</span>
              {renderInput(field, type, ph)}
            </div>
          ))}
          {/* 성별: 백엔드 "남" / "여" 기준 */}
          <div className="bt-info-row">
            <span className="bt-info-key">성별</span>
            {isViewOnly
              ? <span className="bt-info-val">{student.gender}</span>
              : <select className="bt-form-select" value={student.gender} onChange={set('gender')}>
                  <option value="남">남성</option>
                  <option value="여">여성</option>
                </select>
            }
          </div>
        </div>

        {/* 학적 상세 */}
        <div className="bt-info-card">
          <div className="bt-info-card-title" style={{ display:'flex', justifyContent:'space-between' }}>
            학적 상세
            {readOnly && <span style={{ fontSize:11, color:'#D97706', fontWeight:600 }}>🔒 수정 불가</span>}
          </div>
          <div className="bt-info-row">
            <span className="bt-info-key">학번 (ID)</span>
            {isNewMode && !isViewOnly ? (
              <input className="bt-form-input" placeholder="학번 입력 (필수)" value={student.studentId} onChange={set('studentId')} />
            ) : (
              <span className="bt-info-val">{student.studentId || '–'}</span>
            )}
          </div>
          <div className="bt-info-row">
            <span className="bt-info-key">소속학과</span>
            {isViewOnly
              ? <span className="bt-info-val">{student.deptName}</span>
              : <select className="bt-form-select" value={student.deptId} onChange={set('deptId')}>
                  <option value="">학과 선택</option>
                  {departments.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
                </select>
            }
          </div>
          <div className="bt-info-row">
            <span className="bt-info-key">학년/반</span>
            {isViewOnly
              ? <span className="bt-info-val">{student.grade}학년 ({student.classSec}반)</span>
              : <div style={{ width:'65%', display:'flex', gap:5, justifyContent:'flex-end' }}>
                  <select className="bt-form-select" style={{ width:'45%' }} value={student.grade} onChange={set('grade')}>
                    {[1,2,3,4].map(g => <option key={g} value={String(g)}>{g}학년</option>)}
                  </select>
                  <input className="bt-form-input" style={{ width:'45%' }} placeholder="A반" value={student.classSec} onChange={set('classSec')} />
                </div>
            }
          </div>
          <div className="bt-info-row">
            <span className="bt-info-key">입학일</span>
            {renderInput('admissionDate', 'date')}
          </div>
          <div className="bt-info-row">
            <span className="bt-info-key">학적상태</span>
            {isViewOnly
              ? <span className="bt-info-val">{student.enrollStatus}</span>
              : <select className="bt-form-select" value={student.enrollStatus} onChange={set('enrollStatus')}>
                  {['재학','휴학','제적','졸업'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
            }
          </div>
        </div>

        {/* 비자 및 국적 */}
        <div className="bt-info-card">
          <div className="bt-info-card-title">비자 및 국적</div>
          <div className="bt-info-row">
            <span className="bt-info-key">국적</span>
            {isViewOnly
              ? <span className="bt-info-val">{student.nationality}</span>
              : <select className="bt-form-select" value={student.nationality} onChange={set('nationality')}>
                  <option value="">국적 선택</option>
                  {nationalities.map((n, i) => {
                    const val = n && typeof n === 'object' ? (n.name || n.nationalityName) : n;
                    return <option key={i} value={val}>{val}</option>;
                  })}
                </select>
            }
          </div>
          <div className="bt-info-row">
            <span className="bt-info-key">현재 비자</span>
            <span className="bt-info-val" style={{ color: isNewMode ? '#9CA3AF' : '#374151' }}>
              {isNewMode ? '등록 완료 후 지정 가능' : student.visaType}
            </span>
          </div>
          <div className="bt-info-row">
            <span className="bt-info-key">TOPIK 급수</span>
            <span className="bt-info-val" style={{ color: isNewMode ? '#9CA3AF' : '#374151' }}>
              {isNewMode ? '등록 완료 후 지정 가능' : student.topikLevel}
            </span>
          </div>
          <div className="bt-info-row">
            <span className="bt-info-key">최대 근로시간</span>
            <span className="bt-info-val">{student.maxWorkHours}</span>
          </div>
        </div>
      </div>

      {isNewMode && !readOnly && (
        <div style={{ textAlign:'center', marginTop:'1.5rem' }}>
          <button className="bt-submit-btn" style={{ padding:'12px 40px', fontSize:15 }} onClick={handleRegisterSubmit}>
            학생 정보 시스템 등록하기
          </button>
        </div>
      )}

      {isEditMode && (
        <div style={{ textAlign:'center', marginTop:'1.5rem' }}>
          <button className="bt-cancel-btn" onClick={handleEditCancel}>취소</button>
          <button className="bt-submit-btn" style={{ padding:'12px 40px', fontSize:15 }} onClick={handleEditSave} disabled={isSaving}>
            {isSaving ? '저장 중...' : '변경사항 저장하기'}
          </button>
        </div>
      )}
    </div>
  );
}