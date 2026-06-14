import React, { useState, useEffect } from 'react';
import api from '../../../../api/axios';

export default function StaffBasicTab({ studentId, onBack }) {
  const [isLoading, setIsLoading] = useState(true);
  const [student, setStudent]     = useState(null);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/api/v1/students/${studentId}`);

        if (res.data?.success) {
          const s = res.data.data;
          const mapped = {
            studentId:    s.studentId || studentId,
            korName:      s.korName   || '',
            engName:      s.engName   || '',
            deptId:       s.deptId    || '',
            deptName:     s.deptName  || '-',
            gender:       s.gender    || '',
            nationality:  s.nationality || '-',
            birthDate:    s.birthDate   || '',
            phone:        s.phone       || '',
            address:      s.address     || '',
            classSec:     s.classSec    || '',
            grade:        s.grade ? String(s.grade) : '',
            admissionDate:s.admissionDate || '',
            enrollStatus: s.enrollStatus  || '',
            foreignRegNo: s.foreignRegNo  || '',
            visaType:     s.visaType || s.currentVisa?.visaType || '정보없음',
            topikLevel:   s.topikLevel || '정보없음',
            maxWorkHours: s.maxWorkHoursPerWeek ? `주 ${s.maxWorkHoursPerWeek}시간` : '정보없음',
            gpa:          s.totalGpa || s.gpa || '0.0',
            photoUrl:     s.photoUrl || null,
            totalCredits:            s.totalCredits            || 0,
            requiredCourseTotal:     s.requiredCourseTotal     || 0,
            requiredCourseCompleted: s.requiredCourseCompleted || 0,
          };
          setStudent(mapped);
        }
      } catch (e) {
        console.error('학생 데이터 로드 실패:', e);
      } finally {
        setIsLoading(false);
      }
    };
    if (studentId) init();
  }, [studentId]);

  if (isLoading) return (
    <div style={{padding:'5rem',textAlign:'center',color:'#9CA3AF',fontFamily:"'DM Sans','Noto Sans KR',sans-serif"}}>
      데이터 로드 중...
    </div>
  );
  if (!student) return (
    <div style={{padding:'5rem',textAlign:'center',color:'#EF4444',fontFamily:"'DM Sans','Noto Sans KR',sans-serif"}}>
      학생 정보를 찾을 수 없습니다.
    </div>
  );

  const initials = student.korName ? student.korName.slice(0,2) : '?';
  const reqPct   = student.requiredCourseTotal > 0
    ? (student.requiredCourseCompleted / student.requiredCourseTotal) * 100 : 0;

  return (
    <div style={{fontFamily:"'DM Sans','Noto Sans KR',sans-serif",fontSize:'0.875rem',color:'#111827',padding:'1.25rem',backgroundColor:'#F0F2F7',minHeight:'100vh'}}>
      <style>{`
        .sbt-topbar { background:#fff; padding:0 1.75rem; height:3.625rem; display:flex; align-items:center; justify-content:space-between; border-radius:0.875rem; margin-bottom:1.25rem; border:1px solid #E5E7EB; }
        .sbt-back-btn { width:1.875rem; height:1.875rem; border-radius:0.4375rem; background:#F3F4F6; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; margin-right:1rem; flex-shrink:0; }
        .sbt-back-btn:hover { background:#E5E7EB; }
        .sbt-breadcrumb { font-size:0.8125rem; color:#9CA3AF; }
        .sbt-breadcrumb span { color:#111827; font-weight:600; }

        .sbt-profile { background:#fff; border-radius:0.875rem; border:1px solid #F3F4F6; padding:1.5rem 1.75rem; margin-bottom:1rem; display:flex; align-items:center; gap:1.5rem; flex-wrap:wrap; }
        .sbt-photo { width:4.5rem; height:4.5rem; border-radius:0.875rem; background:linear-gradient(135deg,#3B82F6,#1A3A5C); display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:700; color:#fff; overflow:hidden; flex-shrink:0; }
        .sbt-name  { font-size:1.125rem; font-weight:700; color:#111827; margin-bottom:0.25rem; }
        .sbt-id    { color:#6B7280; margin-bottom:0.5rem; font-size:0.8125rem; }
        .sbt-chip  { display:inline-flex; padding:3px 10px; border-radius:20px; font-size:0.6875rem; font-weight:600; margin-right:6px; }
        .sbt-chip-green { background:#F0FDF4; color:#16A34A; }
        .sbt-chip-blue  { background:#EFF6FF; color:#1D4ED8; }
        .sbt-chip-gray  { background:#F3F4F6; color:#374151; }
        .sbt-stats { display:flex; gap:2rem; text-align:center; margin-left:auto; }
        .sbt-stat-val { font-size:1.25rem; font-weight:700; color:#3B82F6; }
        .sbt-stat-lbl { font-size:0.6875rem; color:#9CA3AF; margin-top:2px; }

        .sbt-req-wrap { background:#fff; border-radius:0.875rem; border:1px solid #F3F4F6; padding:1rem 1.75rem; margin-bottom:1rem; display:flex; align-items:center; gap:1.5rem; }
        .sbt-req-bar  { flex:1; height:6px; background:#E5E7EB; border-radius:99px; overflow:hidden; }
        .sbt-req-fill { height:100%; background:#3B82F6; border-radius:99px; transition:width 0.4s; }

        .sbt-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(18rem,1fr)); gap:1rem; }
        .sbt-card { background:#fff; border-radius:0.875rem; border:1px solid #F3F4F6; padding:1.25rem; }
        .sbt-card-title { font-size:0.8125rem; font-weight:700; color:#1A3A5C; border-bottom:1px solid #F3F4F6; padding-bottom:0.5rem; margin-bottom:1rem; }
        .sbt-row { display:flex; align-items:center; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid #F9FAFB; }
        .sbt-row:last-child { border-bottom:none; }
        .sbt-key { color:#6B7280; font-weight:600; font-size:0.8125rem; flex-shrink:0; }
        .sbt-val { font-weight:500; font-size:0.8125rem; text-align:right; }
        .sbt-note { margin-top:0.75rem; padding:0.75rem; background:#F9FAFB; border-radius:0.5rem; font-size:0.75rem; color:#9CA3AF; }
      `}</style>

      <div className="sbt-topbar">
        <div style={{display:'flex',alignItems:'center'}}>
          <button className="sbt-back-btn" onClick={onBack}>
            <svg width="1rem" height="1rem" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="sbt-breadcrumb">
            학생 목록 › <span>{student.korName} 기본 정보</span>
          </div>
        </div>
      </div>

      <div className="sbt-profile">
        <div className="sbt-photo">
          {student.photoUrl
            ? <img src={student.photoUrl} alt="프로필" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            : initials}
        </div>
        
        <div style={{flex:1}}>
          <div className="sbt-name">
            {student.korName} <span style={{fontSize:'0.875rem',color:'#9CA3AF',fontWeight:400}}>{student.engName}</span>
          </div>
          <div className="sbt-id">{student.studentId} | {student.deptName}</div>
          <div>
            <span className="sbt-chip sbt-chip-green">{student.enrollStatus || '상태 없음'}</span>
            <span className="sbt-chip sbt-chip-blue">{student.visaType}</span>
            <span className="sbt-chip sbt-chip-gray">{student.nationality}</span>
          </div>
        </div>
        <div className="sbt-stats">
          <div><div className="sbt-stat-val">{student.totalCredits}</div><div className="sbt-stat-lbl">취득학점</div></div>
          <div><div className="sbt-stat-val">{Number(student.gpa).toFixed(2)}</div><div className="sbt-stat-lbl">누적평점</div></div>
          <div><div className="sbt-stat-val">{student.topikLevel !== '정보없음' ? `${student.topikLevel}급` : '-'}</div><div className="sbt-stat-lbl">TOPIK</div></div>
          <div><div className="sbt-stat-val" style={{fontSize:'0.875rem'}}>{student.maxWorkHours}</div><div className="sbt-stat-lbl">주간근로</div></div>
        </div>
      </div>

      {student.requiredCourseTotal > 0 && (
        <div className="sbt-req-wrap">
          <div style={{fontSize:'0.8125rem',fontWeight:700,color:'#1A3A5C',flexShrink:0}}>교양필수 이수현황</div>
          <div className="sbt-req-bar">
            <div className="sbt-req-fill" style={{width:`${reqPct}%`}}/>
          </div>
          <div style={{fontSize:'0.8125rem',fontWeight:700,color:'#374151',flexShrink:0}}>
            {student.requiredCourseCompleted} / {student.requiredCourseTotal}
          </div>
        </div>
      )}

      <div className="sbt-grid">
        <div className="sbt-card">
          <div className="sbt-card-title">인적 사항</div>
          {[
            {key:'생년월일',   field:'birthDate'},
            {key:'연락처',     field:'phone'},
            {key:'성별',       field:'gender'},
            {key:'외국인등록번호', field:'foreignRegNo'},
            {key:'주소',       field:'address'},
          ].map(({key,field})=>(
            <div className="sbt-row" key={field}>
              <span className="sbt-key">{key}</span>
              <span className="sbt-val">
                {field === 'gender' 
                  ? (student.gender === 'MALE' || student.gender === '남' ? '남성' : student.gender === 'FEMALE' || student.gender === '여' ? '여성' : (student.gender || '-')) 
                  : (student[field] || '-')}
              </span>
            </div>
          ))}
        </div>

        <div className="sbt-card">
          <div className="sbt-card-title">학적 상세</div>
          <div className="sbt-row"><span className="sbt-key">학번</span><span className="sbt-val">{student.studentId}</span></div>
          <div className="sbt-row"><span className="sbt-key">소속학과</span><span className="sbt-val">{student.deptName}</span></div>
          <div className="sbt-row"><span className="sbt-key">학년</span><span className="sbt-val">{student.grade ? `${student.grade}학년` : '-'}</span></div>
          <div className="sbt-row"><span className="sbt-key">분반</span><span className="sbt-val">{student.classSec || '-'}</span></div>
          <div className="sbt-row"><span className="sbt-key">입학일</span><span className="sbt-val">{student.admissionDate || '-'}</span></div>
          <div className="sbt-row"><span className="sbt-key">학적상태</span><span className="sbt-val">{student.enrollStatus || '-'}</span></div>
        </div>

        <div className="sbt-card">
          <div className="sbt-card-title">비자 및 역량</div>
          <div className="sbt-row"><span className="sbt-key">국적</span><span className="sbt-val">{student.nationality}</span></div>
          <div className="sbt-row"><span className="sbt-key">현재 비자</span><span className="sbt-val" style={{color:'#1D4ED8',fontWeight:600}}>{student.visaType}</span></div>
          <div className="sbt-row"><span className="sbt-key">TOPIK 급수</span><span className="sbt-val">{student.topikLevel}</span></div>
          <div className="sbt-row"><span className="sbt-key">주간 근로한도</span><span className="sbt-val">{student.maxWorkHours}</span></div>
          <div className="sbt-note">해당 학생의 정보 수정은 별도의 관리 탭을 이용해 주세요.</div>
        </div>
      </div>
    </div>
  );
}