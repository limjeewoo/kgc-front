import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// const BASE_URL = 'https://api.kmgc.world'; // 배포용
const BASE_URL = 'http://localhost:8080'; // 개발용

export default function VisaTab() {
  const { studentId } = useParams();
  const id = studentId;
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [visaData, setVisaData] = useState({ currentVisa: null, history: [] });
  const [isLoading, setIsLoading] = useState(true);

  const api = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
  });

  useEffect(() => {
    const fetchVisaData = async () => {
      try {
        setIsLoading(true);
        // 비자 정보 목록 조회 API 호출
        const response = await api.get(`/api/v1/students/${id}/visas`);

        if (response.data?.success) {
          const visas = response.data.data || [];
          
          if (visas.length > 0) {
            // 최신(현재) 비자와 과거 이력 분리
            const current = visas.find(v => v.isCurrent) || visas[0];
            const history = visas.filter(v => v.visaId !== current.visaId);

            // D-Day 계산 (API 응답에 dDay가 없을 경우 대비)
            let dDay = current.dDay;
            const expireDate = current.expiryDate || current.expireDate;
            if (dDay === undefined && expireDate) {
              const today = new Date();
              today.setHours(0, 0, 0, 0); // 시간 제외, 자정 기준
              const expDate = new Date(expireDate);
              const diffTime = expDate.getTime() - today.getTime();
              dDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            setVisaData({
              currentVisa: {
                ...current,
                dDay: dDay || 0,
                expireDate: expireDate // 통일된 필드명 사용
              },
              history: history
            });
          }
        }
      } catch (error) {
        console.error("비자 정보 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchVisaData();
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: '#9CA3AF', fontSize: '14px' }}>
        데이터 로딩 중...
      </div>
    );
  }

  const { currentVisa, history } = visaData;

  const getStatus = (dDay) => {
    if (dDay < 0) return { chipClass: 'vt-chip-red', barColor: '#DC2626', label: '체류 기간 만료', textColor: '#991B1B' };
    if (dDay <= 30) return { chipClass: 'vt-chip-red', barColor: '#EF4444', label: '긴급 연장 필요', textColor: '#DC2626' };
    if (dDay <= 90) return { chipClass: 'vt-chip-amber', barColor: '#F59E0B', label: '갱신 준비 기간', textColor: '#D97706' };
    return { chipClass: 'vt-chip-green', barColor: '#22C55E', label: '체류 기간 넉넉함', textColor: '#16A34A' };
  };

  const status = currentVisa 
    ? getStatus(currentVisa.dDay) 
    : { chipClass: 'vt-chip-blue', barColor: '#E5E7EB', label: '정보 없음', textColor: '#6B7280' };
    
  const progress = currentVisa ? Math.max(0, Math.min(100, (currentVisa.dDay / 365) * 100)) : 0;

  return (
    <div style={{ fontFamily: "'DM Sans', 'Noto Sans KR', sans-serif", fontSize: '14px', color: '#111827', padding: '0 22px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        .vt-topbar { background: #fff; padding: 0 28px; height: 58px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E5E7EB; margin-bottom: 24px; }
        .vt-topbar-left { display: flex; align-items: center; gap: 10px; }
        .vt-topbar-right { display: flex; align-items: center; gap: 8px; }
        .vt-back-btn { width: 30px; height: 30px; border-radius: 7px; background: #F3F4F6; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s; color: #374151; }
        .vt-back-btn:hover { background: #E5E7EB; }
        .vt-breadcrumb { font-size: 13px; color: #9CA3AF; }
        .vt-breadcrumb span { color: #111827; font-weight: 600; }
        .vt-btn { padding: 7px 14px; border-radius: 8px; font-size: 12.5px; font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: inherit; display: flex; align-items: center; gap: 5px; }
        .vt-btn-secondary { background: #F9FAFB; border: 1px solid #E5E7EB; color: #374151; }
        .vt-btn-secondary:hover { background: #F3F4F6; }
        .vt-btn-primary { background: #1A3A5C; border: 1px solid #1A3A5C; color: #fff; }
        .vt-btn-primary:hover { background: #153150; }

        .vt-chip { font-size: 11.5px; font-weight: 500; padding: 4px 10px; border-radius: 20px; }
        .vt-chip-blue   { background: #EFF6FF; color: #1D4ED8; }
        .vt-chip-green { background: #F0FDF4; color: #16A34A; }
        .vt-chip-amber { background: #FFFBEB; color: #D97706; }
        .vt-chip-red    { background: #FEF2F2; color: #DC2626; }

        .vt-card { background: #fff; border-radius: 14px; border: 1px solid #F3F4F6; padding: 20px 22px; }
        .vt-card-title { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid #F3F4F6; display: flex; align-items: center; justify-content: space-between; }
        
        .vt-dday-banner { background: #fff; border-radius: 14px; border: 1px solid #F3F4F6; padding: 24px 28px; margin-bottom: 18px; display: flex; align-items: center; gap: 32px; }
        .vt-dday-left { display: flex; flex-direction: column; align-items: center; min-width: 130px; padding-right: 32px; border-right: 1px solid #F3F4F6; }
        .vt-dday-label { font-size: 11px; color: #9CA3AF; margin-bottom: 6px; }
        .vt-dday-value { font-size: 36px; font-weight: 700; letter-spacing: -1px; line-height: 1; margin-bottom: 10px; }
        .vt-progress-track { width: 100%; height: 6px; background: #F3F4F6; border-radius: 99px; overflow: hidden; margin-bottom: 8px; }
        .vt-progress-fill { height: 100%; border-radius: 99px; transition: width 0.8s ease; }
        .vt-dday-status { font-size: 11.5px; font-weight: 600; }

        .vt-dday-right { flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .vt-dday-field-label { font-size: 11px; color: #9CA3AF; margin-bottom: 4px; }
        .vt-dday-field-val { font-size: 14px; font-weight: 600; color: #111827; }

        .vt-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; }

        .vt-timeline { padding-left: 4px; }
        .vt-tl-item { position: relative; padding: 0 0 20px 20px; border-left: 2px solid #E5E7EB; }
        .vt-tl-item:last-child { border-left: 2px solid transparent; padding-bottom: 0; }
        .vt-tl-item::before { content: ''; position: absolute; left: -7px; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; border: 2px solid #CBD5E1; }
        .vt-tl-item.active::before { background: #1A3A5C; border-color: #1A3A5C; }
        .vt-tl-main { font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 2px; }
        .vt-tl-main.active { color: #1D4ED8; }
        .vt-tl-sub { font-size: 12px; color: #9CA3AF; }

        .vt-file-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .vt-file-box { border: 1.5px dashed #E5E7EB; padding: 20px 12px; border-radius: 10px; text-align: center; cursor: pointer; transition: all 0.15s; background: #FAFAFA; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .vt-file-box:hover { border-color: #3B82F6; background: #EFF6FF; }
        .vt-file-name { font-size: 12.5px; font-weight: 500; color: #374151; }

        @media (max-width: 768px) {
          .vt-dday-banner { flex-direction: column; }
          .vt-dday-left { border-right: none; border-bottom: 1px solid #F3F4F6; padding-right: 0; padding-bottom: 16px; width: 100%; }
          .vt-dday-right { grid-template-columns: 1fr 1fr; }
          .vt-grid { grid-template-columns: 1fr; }
          .vt-file-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      {/* 숨겨진 파일 인풋 */}
      <input type="file" ref={fileInputRef} style={{ display: 'none' }}
        onChange={(e) => console.log('파일 업로드 준비:', e.target.files[0])} />

      {/* 탑바 */}
      <div className="vt-topbar">
        <div className="vt-topbar-left">
          <button className="vt-back-btn" onClick={() => navigate(-1)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="vt-breadcrumb">
            학생 관리 › 학생 목록 › <span>비자 및 체류 정보</span>
          </div>
        </div>
        <div className="vt-topbar-right">
          <button className="vt-btn vt-btn-secondary">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            갱신 이력
          </button>
          <button className="vt-btn vt-btn-primary">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            비자 등록
          </button>
        </div>
      </div>

      {currentVisa ? (
        <>
          {/* D-Day 배너 */}
          <div className="vt-dday-banner">
            <div className="vt-dday-left">
              <div className="vt-dday-label">체류 만료 D-Day</div>
              <div className="vt-dday-value" style={{ color: status.textColor }}>
                {currentVisa.dDay < 0 ? `D+${Math.abs(currentVisa.dDay)}` : `D-${currentVisa.dDay}`}
              </div>
              <div className="vt-progress-track" style={{ width: '100px' }}>
                <div className="vt-progress-fill"
                  style={{ width: `${progress}%`, background: status.barColor }} />
              </div>
              <span className="vt-dday-status" style={{ color: status.textColor }}>
                {status.label}
              </span>
            </div>

            <div className="vt-dday-right">
              <div className="vt-dday-field">
                <div className="vt-dday-field-label">비자 종류</div>
                <div className="vt-dday-field-val" style={{ color: '#1D4ED8' }}>
                  {currentVisa.visaType}
                </div>
              </div>
              <div className="vt-dday-field">
                <div className="vt-dday-field-label">외국인 등록번호</div>
                <div className="vt-dday-field-val">{currentVisa.foreignerRegNo || '미등록'}</div>
              </div>
              <div className="vt-dday-field">
                <div className="vt-dday-field-label">발급 일자</div>
                <div className="vt-dday-field-val">{currentVisa.issueDate || '-'}</div>
              </div>
              <div className="vt-dday-field">
                <div className="vt-dday-field-label">만료 일자</div>
                <div className="vt-dday-field-val" style={{ color: status.textColor }}>
                  {currentVisa.expireDate || '-'}
                </div>
              </div>
            </div>
          </div>

          {/* 하단 2열 */}
          <div className="vt-grid">
            {/* 갱신 이력 타임라인 */}
            <div className="vt-card">
              <div className="vt-card-title">갱신 이력</div>
              <div className="vt-timeline">
                <div className="vt-tl-item active">
                  <div className="vt-tl-main active">현재 · {currentVisa.visaType} 등록 완료</div>
                  <div className="vt-tl-sub">승인일 {currentVisa.issueDate || '-'}</div>
                </div>
                {history.map((h, i) => (
                  <div key={h.visaId || i} className="vt-tl-item">
                    <div className="vt-tl-main">
                      이전 · {h.visaType}
                      <span className="vt-chip vt-chip-red" style={{ fontSize: '11px', marginLeft: 6 }}>만료</span>
                    </div>
                    <div className="vt-tl-sub">만료일 {h.expiryDate || h.expireDate}</div>
                  </div>
                ))}
                {history.length === 0 && (
                   <div style={{ fontSize: '12.5px', color: '#9CA3AF', marginTop: '10px' }}>이전 갱신 이력이 없습니다.</div>
                )}
              </div>
            </div>

            {/* 서류 업로드 */}
            <div className="vt-card">
              <div className="vt-card-title">
                증명 서류 업로드
                <span className="vt-chip vt-chip-blue" style={{ fontSize: '11px' }}>3개 항목</span>
              </div>
              <div className="vt-file-grid">
                {['등록증 (앞면)', '등록증 (뒷면)', '여권 사본'].map((label) => (
                  <div key={label} className="vt-file-box" onClick={() => fileInputRef.current.click()}>
                    <svg width="22" height="22" fill="none" stroke="#3B82F6" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="vt-file-name">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF', background: '#fff', borderRadius: '14px', border: '1px solid #F3F4F6' }}>
          등록된 비자 정보가 없습니다. 상단의 '비자 등록' 버튼을 눌러 정보를 추가해주세요.
        </div>
      )}
    </div>
  );
}