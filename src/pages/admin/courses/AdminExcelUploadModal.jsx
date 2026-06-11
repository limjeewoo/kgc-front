import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';

const EXCEL_TYPES = [
  {
    key: 'course',
    icon: '📚',
    title: '개설교과목 일괄 등록',
    sub: '개설교과목정보.xlsx',
    color: '#F0FDF4',
    notices: [
      '1행은 헤더로 건너뛰고 2행부터 데이터를 읽습니다.',
      '학과/학기가 먼저 등록된 상태여야 합니다.',
      '이수구분이 교양필수이면 교양필수 목록에 자동 등록됩니다.',
      '온라인강의 컬럼값이 Y이면 ONLINE, N이면 OFFLINE으로 저장됩니다.',
      '같은 과목코드가 이미 있으면 스킵됩니다.',
      '컬럼 순서를 변경하지 마세요.',
    ],
    columns: '5열: 과목코드 / 6열: 과목명 / 7열: 분반 / 9열: 이수구분 / 10열: 학점 / 29열: 온라인강의 여부(Y/N)',
    needsSemester: true, needsDept: false,
    api: '/api/v1/courses/bulk-upload',
  },
  {
    key: 'student',
    icon: '🎓',
    title: '학생 기본정보 일괄 등록',
    sub: '학생정보_2학년_.xlsx',
    color: '#EFF6FF',
    notices: [
      '1행은 헤더로 건너뛰고 2행부터 데이터를 읽습니다.',
      '학과명은 DB에 등록된 학과명과 정확히 일치해야 합니다.',
      '이미 등록된 학번은 스킵됩니다 (덮어쓰기 안 함).',
      '컬럼 순서를 변경하지 마세요.',
    ],
    columns: '4열: 학번 / 5열: 이름 / 6열: 성별 / 7열: 연락처 / 8열: 학적상태 / 9열: 소속학과 / 11열: 학년 / 12열: 분반',
    needsSemester: false, needsDept: false,
    api: '/api/v1/students/bulk-upload',
  },
  {
    key: 'foreign',
    icon: '🛂',
    title: '외국인유학생 현황 업데이트',
    sub: '(★최종)외국인유학생_현황_2026학년도_1학기.xlsx',
    color: '#F0FDF4',
    notices: [
      '1행은 헤더로 건너뛰고 2행부터 데이터를 읽습니다.',
      '학생정보 엑셀로 학생이 먼저 등록된 상태여야 합니다 (없는 학번은 스킵).',
      '체류자격만료일자는 YYYYMMDD 형식이어야 합니다 (예: 20260930).',
      '주민등록번호/외국인등록번호는 저장되지 않고 비밀번호 설정에만 사용됩니다.',
      '컬럼 순서를 변경하지 마세요.',
    ],
    columns: '4열: 학번 / 6열: 주민등록번호(비번설정용) / 8열: 국적 / 18열: 연락처 / 20열: 체류자격만료일 / 21열: TOPIK급수',
    needsSemester: false, needsDept: false,
    api: '/api/v1/students/bulk-update-foreign',
  },
  {
    key: 'advisor',
    icon: '👨‍🏫',
    title: '지도교수 배정',
    sub: '유학생_지도교수명단.xlsx',
    color: '#FDF4FF',
    notices: [
      '1행은 헤더로 건너뛰고 2행부터 데이터를 읽습니다.',
      '학생이 먼저 등록된 상태여야 합니다.',
      '직번(사번)으로 교수가 없으면 자동 등록됩니다.',
      '같은 학생에게 지도교수가 이미 배정돼있으면 스킵됩니다.',
      '컬럼 순서를 변경하지 마세요.',
    ],
    columns: '1열: 학년 / 2열: 분반 / 3열: 학번 / 4열: 지도교수 이름 / 5열: 직번(사번)',
    needsSemester: true, needsDept: true,
    api: '/api/v1/professors/bulk-upload-advisors',
  },
  {
    key: 'enroll',
    icon: '📋',
    title: '수강 일괄 등록',
    sub: '교과목별_수강정보.xlsx',
    color: '#F5F3FF',
    notices: [
      '1행은 헤더로 건너뛰고 2행부터 데이터를 읽습니다.',
      '과목이 먼저 등록된 상태여야 합니다.',
      '컬럼 순서를 변경하지 마세요.',
    ],
    columns: '8열: 학번 / 13열: 교과목명 / 14열: 분반 / 18열: 재수강 여부',
    needsSemester: true, needsDept: false,
    api: '/api/v1/enrollments/bulk-upload',
  },
  {
    key: 'attend',
    icon: '📅',
    title: '출결 정보 등록',
    sub: 'Java기초 (컴퓨터소프트웨어(3년제)과-2-D)_attendance.xlsx',
    color: '#FFFBEB',
    notices: [
      '파일명 형식 필수: 과목명 (학과명(N년제)과-학년-반)_attendance.xlsx',
      '예: Java기초 (컴퓨터소프트웨어(3년제)과-2-D)_attendance.xlsx',
      '파일명의 과목명/학과명이 DB에 등록된 것과 정확히 일치해야 합니다.',
      '출석: O / 결석: X / 지각: ▲ / 공결: 빈칸',
      '수강정보가 먼저 등록된 상태여야 합니다.',
      '같은 파일 재업로드 시 기존 출결 데이터를 삭제 후 덮어씁니다.',
    ],
    columns: '2열: 학번 / 5~19열: 1~15주차 출결 상태',
    needsSemester: true, needsDept: false,
    api: '/api/v1/attend/upload',
  },
  {
    key: 'grade',
    icon: '📝',
    title: '성적 일괄 입력',
    sub: '교과목별_수강정보.xlsx (수강정보와 동일 파일)',
    color: '#FFF7ED',
    notices: [
      '1행은 헤더로 건너뛰고 2행부터 데이터를 읽습니다.',
      '수강정보가 먼저 등록된 상태여야 합니다.',
      '등급은 A+, A0, B+, B0, C+, C0, D+, D0, F 형식이어야 합니다.',
      '컬럼 순서를 변경하지 마세요.',
    ],
    columns: '8열: 학번 / 13열: 교과목명 / 14열: 분반 / 35열: 합계점수 / 36열: 등급',
    needsSemester: true, needsDept: false,
    api: '/api/v1/enrollments/grade-bulk-upload',
  },
];

export default function AdminExcelUploadModal({ isOpen, onClose, onSuccess }) {
  const [selected, setSelected]     = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading]   = useState(false);
  const [semesters, setSemesters]   = useState([]);
  const [depts, setDepts]           = useState([]);
  const [semesterId, setSemesterId] = useState('');
  const [deptId, setDeptId]         = useState('');
  const [currentSemesterId, setCurrentSemesterId] = useState('');

  useEffect(() => {
    if (!isOpen) { setSelected(null); setUploadFile(null); setSemesterId(''); setDeptId(''); return; }
    api.get('/api/v1/semesters').then(res => {
      if (res.data?.success) setSemesters(res.data.data || []);
    }).catch(() => {});
    api.get('/api/v1/semesters/current').then(res => {
      if (res.data?.success) {
        const sid = res.data.data?.semesterId || '';
        setCurrentSemesterId(sid);
        setSemesterId(sid);
      }
    }).catch(() => {});
    api.get('/api/v1/depts').then(res => {
      if (res.data?.success) setDepts(res.data.data || []);
    }).catch(() => {});
  }, [isOpen]);

  const handleUpload = async () => {
    if (!uploadFile) { alert('파일을 선택해주세요.'); return; }
    if (selected.needsSemester && !semesterId) { alert('학기를 선택해주세요.'); return; }
    if (selected.needsDept && !deptId) { alert('학과를 선택해주세요.'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      let url = selected.api;
      const params = [];
      if (selected.needsSemester) params.push(`semesterId=${encodeURIComponent(semesterId)}`);
      if (selected.needsDept) params.push(`deptId=${encodeURIComponent(deptId)}`);
      if (params.length > 0) url += '?' + params.join('&');
      const res = await api.post(url, fd, { headers:{'Content-Type':'multipart/form-data'}, timeout:30000 });
      if (res.data?.success) {
        alert(`${selected.title} 완료되었습니다.`);
        setSelected(null); setUploadFile(null);
        if (onSuccess) onSuccess(selected.key);
      } else { alert(res.data?.message || '업로드 실패'); }
    } catch(e) { alert(e.response?.data?.message || '업로드 중 오류가 발생했습니다.'); }
    finally { setUploading(false); }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(2px)', fontFamily:"'DM Sans','Noto Sans KR',sans-serif" }}
      onClick={() => { if (!selected) onClose(); }}>
      <style>{`
        .aeu-list { display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:1.25rem 1.5rem; }
        .aeu-item { display:flex; align-items:center; gap:12px; padding:14px 16px; border-radius:12px; border:1.5px solid #F1F5F9; background:#fff; cursor:pointer; transition:0.15s; text-align:left; font-family:inherit; }
        .aeu-item:hover { border-color:#CBD5E1; box-shadow:0 4px 12px rgba(0,0,0,0.06); }
        .aeu-order { font-size:0.625rem; font-weight:700; color:#9CA3AF; margin-top:2px; }
      `}</style>

      <div style={{ background:'#fff', borderRadius:16, width: selected ? '36rem' : '52rem', maxWidth:'95vw', boxShadow:'0 20px 40px rgba(0,0,0,0.15)', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontWeight:700, fontSize:'1rem', color:'#0F172A' }}>
              {selected ? selected.title : '엑셀 일괄 업로드'}
            </div>
            {!selected && (
              <div style={{ marginTop:6, background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:8, padding:'8px 12px', fontSize:'0.75rem' }}>
                <span style={{ fontWeight:700, color:'#C2410C' }}>⚠️ 필수 등록 순서: </span>
                <span style={{ color:'#9A3412' }}>과목 → 학생 → 외국인현황 → 지도교수 → 수강 → 출결 → 성적</span>
                <span style={{ color:'#D97706', fontWeight:600, marginLeft:6 }}>순서를 지키지 않으면 업로드가 실패합니다.</span>
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {selected && (
              <button onClick={() => { setSelected(null); setUploadFile(null); }}
                style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #E2E8F0', background:'#F8FAFC', color:'#475569', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                ← 목록으로
              </button>
            )}
            <button onClick={onClose}
              style={{ width:28, height:28, borderRadius:'50%', border:'1px solid #E2E8F0', background:'#F8FAFC', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748B', fontSize:14 }}>✕</button>
          </div>
        </div>

        {/* 목록 화면 */}
        {!selected && (
          <div className="aeu-list">
            {EXCEL_TYPES.map((t, i) => (
            <button key={t.key} className="aeu-item" onClick={() => { setSelected(t); setUploadFile(null); }}>
                <div style={{ width:40, height:40, borderRadius:10, background:t.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', flexShrink:0 }}>{t.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:'0.875rem', color:'#111827' }}>
                    <span style={{ color:'#9CA3AF', marginRight:6 }}>{i + 1}.</span>{t.title}
                </div>
                <div style={{ fontSize:'0.6875rem', color:'#9CA3AF', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.sub}</div>
                </div>
                <div style={{ fontSize:'0.625rem', fontWeight:700, color:'#CBD5E1', flexShrink:0 }}>→</div>
            </button>
            ))}
          </div>
        )}

        {/* 상세 업로드 화면 */}
        {selected && (
          <>
            <div style={{ padding:'1.25rem 1.5rem 0' }}>
              {/* 유의사항 */}
              <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:10, padding:'12px 14px', marginBottom:'1rem' }}>
                <div style={{ fontWeight:700, fontSize:'0.75rem', color:'#C2410C', marginBottom:8 }}>⚠️ 업로드 전 반드시 확인하세요</div>
                <ul style={{ paddingLeft:16, margin:0 }}>
                  {selected.notices.map((n, i) => (
                    <li key={i} style={{ fontSize:'0.75rem', color:'#9A3412', marginBottom:4, lineHeight:1.5 }}>{n}</li>
                  ))}
                </ul>
              </div>
              {/* 컬럼 위치 */}
              <div style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:8, padding:'8px 12px', marginBottom:'1rem' }}>
                <div style={{ fontSize:'0.6875rem', fontWeight:600, color:'#64748B', marginBottom:4 }}>📋 필수 컬럼 위치</div>
                <div style={{ fontSize:'0.6875rem', color:'#475569', lineHeight:1.6 }}>{selected.columns}</div>
              </div>
              {/* 학기 선택 (필요한 경우) */}
              {selected.needsSemester && (
                <div style={{ marginBottom:'1rem' }}>
                  <div style={{ fontSize:'0.75rem', fontWeight:600, color:'#374151', marginBottom:6 }}>📌 대상 학기 선택</div>
                  <select value={semesterId} onChange={e => setSemesterId(e.target.value)}
                    style={{ width:'100%', padding:'8px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:'0.8125rem', fontFamily:'inherit', outline:'none', color:'#374151' }}>
                    <option value="">-- 학기를 선택하세요 --</option>
                    {semesters.map(s => {
                      const val = s.semesterId || s.id;
                      const label = s.semesterName || s.name || `${s.year}년 ${s.term}학기` || val;
                      return <option key={val} value={val}>{label}</option>;
                    })}
                  </select>
                </div>
              )}
              {/* 학과 선택 (필요한 경우) */}
              {selected.needsDept && (
                <div style={{ marginBottom:'1rem' }}>
                  <div style={{ fontSize:'0.75rem', fontWeight:600, color:'#374151', marginBottom:6 }}>🏫 대상 학과 선택</div>
                  <select value={deptId} onChange={e => setDeptId(e.target.value)}
                    style={{ width:'100%', padding:'8px 12px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:'0.8125rem', fontFamily:'inherit', outline:'none', color:'#374151' }}>
                    <option value="">-- 학과를 선택하세요 --</option>
                    {depts.map(d => (
                      <option key={d.deptId} value={d.deptId}>{d.deptName}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 드롭존 */}
            <div style={{ padding:'0 1.5rem 1.25rem' }}>
              <div
                style={{ border:`2px dashed ${uploadFile ? '#10B981' : '#CBD5E1'}`, borderRadius:12, padding:'2rem', textAlign:'center', cursor:'pointer', background: uploadFile ? '#F0FDF4' : '#F8FAFC', transition:'0.2s' }}
                onClick={() => document.getElementById('admin-upload-file').click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setUploadFile(f); }}
              >
                {uploadFile ? (
                  <>
                    <div style={{ fontSize:'2rem', marginBottom:8 }}>📄</div>
                    <div style={{ fontWeight:600, color:'#065F46', fontSize:'0.875rem' }}>{uploadFile.name}</div>
                    <div style={{ fontSize:'0.75rem', color:'#6EE7B7', marginTop:4 }}>파일을 변경하려면 클릭하거나 다시 드래그하세요</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize:'2.5rem', marginBottom:8 }}>📂</div>
                    <div style={{ fontWeight:600, color:'#374151', fontSize:'0.875rem' }}>파일을 드래그하거나 클릭하여 선택하세요</div>
                    <div style={{ fontSize:'0.75rem', color:'#9CA3AF', marginTop:4 }}>.xlsx 또는 .xls 파일 · 최대 10MB</div>
                  </>
                )}
                <input id="admin-upload-file" type="file" hidden accept=".xlsx,.xls"
                  onChange={e => { if (e.target.files[0]) setUploadFile(e.target.files[0]); }} />
              </div>
            </div>

            {/* 푸터 */}
            <div style={{ padding:'1rem 1.5rem', background:'#F8FAFC', borderTop:'1px solid #F1F5F9', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button onClick={onClose} disabled={uploading}
                style={{ padding:'8px 18px', borderRadius:8, border:'1px solid #E2E8F0', background:'#fff', color:'#475569', fontSize:'0.8125rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                취소
              </button>
              <button onClick={handleUpload} disabled={uploading || !uploadFile || (selected.needsSemester && !semesterId) || (selected.needsDept && !deptId)}
                style={{ padding:'8px 18px', borderRadius:8, border:'none', background:(uploading || !uploadFile || (selected.needsSemester && !semesterId) || (selected.needsDept && !deptId)) ? '#94A3B8' : '#10B981', color:'#fff', fontSize:'0.8125rem', fontWeight:600, cursor:(uploading || !uploadFile) ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                {uploading ? '업로드 중...' : '업로드 시작'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
