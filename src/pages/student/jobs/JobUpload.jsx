import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TopBar from '../../../components/layout/TopBar.jsx';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      const backupToken = localStorage.getItem('token');
      if (backupToken) config.headers.Authorization = `Bearer ${backupToken}`;
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const GLOBAL_STYLE_CSS = `
  .sw-content { box-sizing: border-box; width: 100%; padding: 4px 22px 24px; animation: uploadFadeUp 0.28s ease; }
  
  @keyframes uploadFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .data-card { background: #fff; border-radius: 14px; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); overflow: hidden; margin-top: 1.25rem; }
  .card-hd { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem; border-bottom: 1px solid #F1F5F9; flex-wrap: wrap; gap: .75rem; }
  .card-hd-title { font-size: 1rem; font-weight: 700; color: #1E293B; }
  .card-badge { background: #EFF6FF; color: #1D4ED8; font-size: .75rem; font-weight: 600; padding: 4px 10px; border-radius: 6px; }
  .card-body { padding: 1.5rem; }
  .form-group { margin-bottom: 1.25rem; }
  .form-label { display: block; font-size: .8125rem; font-weight: 600; color: #475569; margin-bottom: .5rem; }
  .form-label .req { color: #EF4444; margin-left: 2px; }
  .form-input { width: 100%; padding: .625rem .875rem; border: 1px solid #CBD5E1; border-radius: 8px; font-size: .875rem; color: #334155; transition: all .15s; box-sizing: border-box; }
  .form-input:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .form-hint { font-size: .75rem; color: #64748B; margin-top: .375rem; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  @media(max-width: 640px) { .form-row { grid-template-columns: 1fr; } }
  .upload-zone { border: 2px dashed #CBD5E1; border-radius: .875rem; padding: 2.5rem 1.5rem; text-align: center; cursor: pointer; transition: all .2s; background: #FAFBFD; }
  .upload-zone:hover, .upload-zone.drag { border-color: #3B82F6; background: #EFF6FF; }
  .upload-zone.has-file { border-color: #10B981; background: #F0FDF4; }
  .btn-primary { background: #3B82F6; color: #fff; border: none; padding: .625rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background .15s ease; display: inline-flex; align-items: center; gap: .5rem; }
  .btn-primary:hover { background: #2563EB; }
  .btn-primary:disabled { background: #94A3B8; cursor: not-allowed; }
  .btn-outline { background: #fff; color: #64748B; border: 1px solid #E2E8F0; padding: .625rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all .15s; }
  .btn-outline:hover { background: #F8FAFC; color: #334155; border-color: #CBD5E1; }
`;

function ErrBanner({ msg }) {
  return (
    <div style={{ padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', color: '#DC2626', marginBottom: '1rem', fontSize: '.875rem' }}>
      <span>⚠️ {msg}</span>
    </div>
  );
}

export default function JobUpload() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState(null);
  const [maxHours, setMaxHours] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    industry: '',          
    wage: '',              
    workHoursPerWeek: '',  
    startDate: '',
    endDate: '',
    companyName: '',        
    workAddress: '',      
    file: null,
  });

  const init = useCallback(async () => {
    try {
      const meRes = await api.get('/auth/me');
      const meData = meRes.data?.data ?? meRes.data;
      
      const sid = meData?.userId ?? meData?.studentId ?? (typeof meData === 'string' || typeof meData === 'number' ? String(meData) : null);
      
      if (sid) {
        setStudentId(sid);
        
        const hoursRes = await api.get(`/topik/work-hours/${sid}`)
          .then(res => res.data?.data ?? res.data)
          .catch(() => null);

        // 🟢 NaN 방지: 값이 정상적으로 존재하고 유효한 숫자로 변환될 때만 세팅
        if (hoursRes !== null && hoursRes !== undefined && hoursRes !== '') {
          const parsedHours = Number(hoursRes);
          if (!isNaN(parsedHours)) {
            setMaxHours(parsedHours);
          }
        }
      }
    } catch (err) {
      /* silent */
    }
  }, []);

  useEffect(() => { 
    init(); 
  }, [init]);

  function set(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'startDate' && next.endDate && next.endDate < value) {
        next.endDate = '';
      }
      return next;
    });
  }

  function handleFile(f) {
    if (!f) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(f.type)) {
      setError('PDF, JPG, PNG 파일만 업로드 가능합니다.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.');
      return;
    }
    setError(null);
    set('file', f);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    const hoursNum = Number(form.workHoursPerWeek);
    const wageNum = Number(form.wage);
    
    if (!form.industry?.trim() || !form.startDate || isNaN(hoursNum) || hoursNum <= 0 || isNaN(wageNum) || wageNum <= 0) {
      setError('필수 항목(업종, 시급, 시작일, 근무시간)을 모두 정확하게 입력해주세요.');
      return;
    }
    if (form.endDate && form.endDate < form.startDate) {
      setError('근로 계약 종료일은 시작일 이후여야 합니다.');
      return;
    }
    if (maxHours !== null && hoursNum > maxHours) {
      setError(`TOPIK 등급 기준 주당 최대 ${maxHours}시간까지 허용됩니다.`);
      return;
    }

    setSubmitting(true); 
    setError(null);

    try {
      const requestBody = {
        industry: form.industry.trim(),       
        wage: wageNum,                        
        workHoursPerWeek: hoursNum,           
        startDate: form.startDate,            
        endDate: form.endDate || null,        
        companyName: form.companyName?.trim() || "정보없음",
        workAddress: form.workAddress?.trim() || "정보없음", 
      };

      const jobResponse = await api.post(`/students/${studentId}/jobs`, requestBody);

      const resBody = jobResponse.data;
      const resData = resBody?.data ?? resBody;
      const success = resBody?.success ?? (!!resData);

      if (!success) {
        throw new Error(resBody?.message ?? '등록 실패');
      }

      const targetJobId = resData?.jobId;
      if (form.file && targetJobId) {
        const fd = new FormData();
        fd.append('file', form.file);
        
        await api.patch(`/jobs/${targetJobId}/contract`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setDone(true);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || '제출 중 오류가 발생했습니다.';
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) return (
    <>
      <style>{GLOBAL_STYLE_CSS}</style>
      <div className="sw-main">
        <TopBar title="시간제 근로 등록 완료" />
        <div className="sw-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center', maxWidth: '360px', background: '#fff', padding: '2.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <div style={{
              width: '4.5rem', height: '4.5rem', borderRadius: '50%',
              background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem', fontSize: '1.75rem', color: '#059669'
            }}>✓</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1E293B', marginBottom: '.5rem' }}>
              신청서 제출 완료
            </div>
            <div style={{ fontSize: '.875rem', color: '#64748B', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              시간제근로 서류가 정상 접수되었습니다.<br />담당자 검토 후 결과가 반영됩니다.
            </div>
            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center' }}>
              <button className="btn-outline" onClick={() => navigate('/student/jobs')}>
                근로 이력 보기
              </button>
              <button className="btn-primary" onClick={() => { 
                setDone(false); 
                setForm({ companyName: '', industry: '', wage: '', workAddress: '', workHoursPerWeek: '', startDate: '', endDate: '', file: null }); 
              }}>
                추가 등록하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const weeklyNum = Number(form.workHoursPerWeek);
  const hoursOver = maxHours !== null && weeklyNum > maxHours && weeklyNum > 0;
  const endDateInvalid = !!form.endDate && !!form.startDate && form.endDate < form.startDate;

  return (
    <>
      <style>{GLOBAL_STYLE_CSS}</style>
      <div className="sw-main">
        <TopBar title="시간제 근로 신청" />
        <div className="sw-content">
          {error && <ErrBanner msg={error} />}

          {maxHours !== null && (
            <div style={{
              marginBottom: '1.25rem', padding: '.875rem 1.25rem',
              background: '#EFF6FF', borderRadius: '.75rem', border: '1px solid #BFDBFE',
              display: 'flex', alignItems: 'center', gap: '.75rem',
              fontSize: '.875rem', color: '#1E40AF',
            }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" strokeLinecap="round" />
              </svg>
              <span>현재 보유하신 TOPIK 자격 기준 <strong>주당 최대 {maxHours}시간</strong>까지 근무 가능합니다.</span>
            </div>
          )}

          <div className="data-card">
            <div className="card-hd">
              <div className="card-hd-title">시간제 근로 신청서 작성</div>
              <div className="card-badge">내부 서류 심사</div>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">사업체명</label>
                  <input className="form-input" placeholder="예: (주)경민상사" value={form.companyName}
                    onChange={e => set('companyName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">업종 · 직종 <span className="req">*</span></label>
                  <input className="form-input" placeholder="예: 일반음식점 서빙, 편의점" value={form.industry}
                    onChange={e => set('industry', e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">근무지 주소</label>
                  <input className="form-input" placeholder="정확한 근무지 소재지 주소를 입력하세요" value={form.workAddress}
                    onChange={e => set('workAddress', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">시급 <span className="req">*</span></label>
                  <input type="number" className="form-input" placeholder="예: 10320" value={form.wage}
                    onChange={e => set('wage', e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">근로 계약 시작일 <span className="req">*</span></label>
                  <input type="date" className="form-input" value={form.startDate}
                    onChange={e => set('startDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">근로 계약 종료일</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.endDate}
                    min={form.startDate || undefined}
                    style={{ borderColor: endDateInvalid ? '#EF4444' : undefined }}
                    onChange={e => set('endDate', e.target.value)}
                  />
                  {endDateInvalid && (
                    <div className="form-hint" style={{ color: '#DC2626', fontWeight: 600 }}>
                      ⚠️ 종료일은 시작일 이후여야 합니다.
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">주당 허용 근무시간 <span className="req">*</span></label>
                <input type="number" className="form-input" min="1" max="40" placeholder="숫자만 입력 (예: 20)"
                  value={form.workHoursPerWeek}
                  onChange={e => set('workHoursPerWeek', e.target.value)}
                  style={{ borderColor: hoursOver ? '#EF4444' : undefined }}
                />
                {hoursOver && (
                  <div className="form-hint" style={{ color: '#DC2626', fontWeight: 600 }}>
                    ⚠️ 허용 가능한 최대 근무시간({maxHours}시간)을 초과했습니다.
                  </div>
                )}
                {maxHours !== null && !hoursOver && weeklyNum > 0 && (
                  <div className="form-hint" style={{ color: '#059669' }}>✓ 주당 허용 범위 안에 포함됩니다. ({weeklyNum} / {maxHours}시간)</div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">표준 근로계약서 / 시간제 근로 허가서 첨부</label>
                <div
                  className={`upload-zone ${dragOver ? 'drag' : ''} ${form.file ? 'has-file' : ''}`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={ev => { ev.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={ev => { ev.preventDefault(); setDragOver(false); handleFile(ev.dataTransfer.files[0]); }}
                >
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                    onChange={e => handleFile(e.target.files[0])} />
                  {form.file ? (
                    <>
                      <div style={{ fontSize: '1.75rem', marginBottom: '.5rem' }}>📄</div>
                      <div style={{ fontWeight: 700, color: '#059669', fontSize: '.875rem' }}>{form.file.name}</div>
                      <div style={{ fontSize: '.75rem', color: '#64748B', marginTop: '.25rem' }}>
                        {(form.file.size / 1024).toFixed(0)} KB
                      </div>
                      <button
                        onClick={ev => { ev.stopPropagation(); set('file', null); }}
                        style={{ marginTop: '.75rem', padding: '4px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#fff', color: '#64748B', fontSize: '.75rem', cursor: 'pointer' }}
                      >
                        파일 삭제하기
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '1.75rem', marginBottom: '.5rem', opacity: .4 }}>📎</div>
                      <div style={{ fontWeight: 600, color: '#475569', fontSize: '.875rem' }}>
                        마우스로 서류 파일을 이곳에 드래그하거나 클릭하세요.
                      </div>
                      <div style={{ fontSize: '.75rem', color: '#94A3B8', marginTop: '.375rem' }}>
                        PDF, JPG, PNG 파일 제공 (최대 제한 용량 10MB)
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: '.75rem', background: '#F8FAFC' }}>
              <button className="btn-outline" type="button" onClick={() => navigate('/student/jobs')}>취소</button>
              <button className="btn-primary" type="button" onClick={handleSubmit} disabled={submitting || hoursOver || endDateInvalid}>
                {submitting && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                )}
                {submitting ? '서류 전송 중...' : '신청 원서 제출'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </>
  );
}