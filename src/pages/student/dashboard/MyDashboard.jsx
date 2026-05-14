import React from 'react';
import TopBar from '../../../components/layout/TopBar.jsx';

export default function MyDashboard() {
  // 임시 더미 데이터 (추후 API 연동 시 상태로 관리)
  const visaInfo = { type: 'D-2', expireDate: '2026-08-31', dDay: 151 };
  const attendanceSummary = [
    { course: '컴퓨터개론 (CS101)', total: 13, absent: 1, late: 0, status: '정상' },
    { course: '자료구조 (CS201)', total: 13, absent: 3, late: 1, status: '주의' },
    { course: '실용영어 (GE201)', total: 13, absent: 0, late: 0, status: '정상' },
  ];
  const mileage = { total: 250, semester: 100 };
  const onlineCredit = { used: 3, limit: 6, ratio: 50 };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700&display=swap');

        /* 글로벌 변수 */
        :root {
          --bg-main: #F8FAFC;
          --bg-card: #FFFFFF;
          --sidebar-bg: #0F172A;
          --primary: #3B82F6;
          --text-dark: #0F172A;
          --text-gray: #64748B;
          --text-light: #94A3B8;
          --border: #E2E8F0;
        }

        .student-wrap { 
          display: flex; min-height: 100vh; background: var(--bg-main); 
          font-family: 'Pretendard', sans-serif; font-size: 14px; color: var(--text-dark); 
        }

        /* ---------------- 사이드바 ---------------- */
        .sidebar { 
          width: 250px; background: var(--sidebar-bg); display: flex; flex-direction: column; 
          flex-shrink: 0; position: sticky; top: 0; height: 100vh; overflow-y: auto; 
          border-right: 1px solid rgba(255,255,255,0.05);
        }
        .sb-logo { display: flex; align-items: center; gap: 12px; padding: 28px 24px 24px; }
        .logo-icon { 
          width: 36px; height: 36px; background: linear-gradient(135deg, var(--primary), #60A5FA); 
          border-radius: 10px; display: flex; align-items: center; justify-content: center; 
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        .logo-text { font-size: 15px; font-weight: 700; color: #fff; line-height: 1.2; letter-spacing: -0.3px; }
        .logo-text span { display: block; font-size: 11px; font-weight: 400; color: #94A3B8; margin-top: 2px;}
        
        .sb-sec { padding: 8px 16px 4px; margin-bottom: 8px; }
        .sb-lbl { font-size: 11px; font-weight: 600; color: #64748B; letter-spacing: 0.5px; padding: 0 12px; margin-bottom: 6px; }
        
        .ni { 
          display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; 
          color: #94A3B8; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; margin-bottom: 2px;
        }
        .ni:hover { background: rgba(255,255,255,0.05); color: #F8FAFC; }
        .ni.active { background: var(--primary); color: #fff; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25); }
        .ni-icon { width: 18px; height: 18px; flex-shrink: 0; }

        .sb-bot { margin-top: auto; padding: 20px 16px; background: rgba(0,0,0,0.15); border-top: 1px solid rgba(255,255,255,0.05); }
        .urow { display: flex; align-items: center; gap: 12px; }
        .uav { 
          width: 40px; height: 40px; border-radius: 12px; background: #1E293B; 
          display: flex; align-items: center; justify-content: center; font-size: 15px; 
          font-weight: 700; color: #fff; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1);
        }
        .un { font-size: 14px; font-weight: 600; color: #F8FAFC; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ur { font-size: 12px; color: #94A3B8; margin-top: 2px; }

        /* ---------------- 메인 콘텐츠 ---------------- */
        .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .content { flex: 1; padding: 32px; overflow-y: auto; max-width: 1200px; margin: 0 auto; width: 100%; }
        
        .card { 
          background: var(--bg-card); border-radius: 20px; border: 1px solid rgba(226, 232, 240, 0.8); 
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04); margin-bottom: 24px; overflow: hidden;
        }
        .card-header { padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); }
        .card-title { font-size: 16px; font-weight: 700; color: var(--text-dark); letter-spacing: -0.3px; }
        
        .badge { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
        .b-blue { background: #EFF6FF; color: #1D4ED8; }
        .b-green { background: #F0FDF4; color: #15803D; }
        .b-amber { background: #FFFBEB; color: #B45309; }
        .b-red { background: #FEF2F2; color: #B91C1C; }

        .top-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }

        .visa-card { 
          background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%); 
          border-radius: 20px; padding: 32px 28px; color: #fff; position: relative; overflow: hidden;
          box-shadow: 0 12px 30px rgba(37, 99, 235, 0.25); border: none;
        }
        .visa-bg-icon { position: absolute; right: -20px; bottom: -20px; opacity: 0.1; width: 150px; height: 150px; }
        .visa-label { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.8); margin-bottom: 12px; }
        .visa-dday { font-size: 56px; font-weight: 800; letter-spacing: -2px; line-height: 1; margin-bottom: 12px; text-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .visa-dday span { font-size: 24px; font-weight: 500; opacity: 0.9;}
        .visa-info { font-size: 14px; color: rgba(255,255,255,0.8); display: flex; align-items: center; gap: 10px; }
        .visa-type { background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; backdrop-filter: blur(4px); }

        .mileage-card { background: var(--bg-card); border-radius: 20px; border: 1px solid var(--border); padding: 32px 28px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04); display: flex; flex-direction: column; justify-content: center; }
        .mileage-label { font-size: 14px; color: var(--text-gray); margin-bottom: 12px; font-weight: 600; }
        .mileage-value { font-size: 56px; font-weight: 800; color: var(--text-dark); letter-spacing: -2px; line-height: 1; margin-bottom: 12px; }
        .mileage-value span { font-size: 20px; font-weight: 500; color: var(--text-light); }
        .mileage-sub { font-size: 14px; color: var(--text-gray); background: #F8FAFC; display: inline-block; padding: 6px 14px; border-radius: 12px; font-weight: 500; }
        .mileage-sub b { color: #8B5CF6; font-weight: 700; }

        .attend-row { display: flex; align-items: center; padding: 16px 24px; border-bottom: 1px solid #F1F5F9; gap: 16px; transition: background 0.2s; }
        .attend-row:hover { background: #F8FAFC; }
        .attend-row:last-child { border-bottom: none; }
        .attend-course { flex: 1; font-size: 15px; font-weight: 600; color: var(--text-dark); }
        .attend-counts { font-size: 14px; color: var(--text-gray); width: 140px; text-align: center; font-weight: 500; }
        .attend-status { width: 60px; text-align: right; }

        .online-body { padding: 24px; }
        .online-numbers { display: flex; align-items: baseline; gap: 8px; margin-bottom: 16px; }
        .online-used { font-size: 36px; font-weight: 800; color: var(--text-dark); letter-spacing: -1px; }
        .online-limit { font-size: 18px; font-weight: 500; color: var(--text-light); }
        .online-bar-bg { width: 100%; height: 12px; background: #F1F5F9; border-radius: 10px; overflow: hidden; margin-bottom: 12px; }
        .online-bar-fill { height: 100%; border-radius: 10px; transition: width 0.5s ease-out; }
        .online-desc { font-size: 14px; color: var(--text-gray); }
        .online-desc b { color: var(--primary); font-weight: 600;}
      `}</style>

      <div className="student-wrap">
        {/* 사이드바 */}
        <div className="sidebar">
          <div className="sb-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" width="18" height="18">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="logo-text">KMGC <span>경민대학교 국제교육원</span></div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">MAIN</div>
            <div className="ni active">
              <svg className="ni-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
              내 현황 홈
            </div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">ACADEMIC</div>
            <div className="ni">
              <svg className="ni-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
              수강 내역
            </div>
            <div className="ni">
              <svg className="ni-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
              출결 현황
            </div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">ACTIVITY</div>
            <div className="ni">
              <svg className="ni-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              알바 등록
            </div>
            <div className="ni">
              <svg className="ni-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              KM 마일리지
            </div>
          </div>

          {/* 사이드바 하단 (로그아웃 버튼 제거됨) */}
          <div className="sb-bot">
            <div className="urow">
              <div className="uav">S</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="un">Student</div>
                <div className="ur">STUDENT · 학부생</div>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="main">
          
          {/* 👇 AdminDashboard의 TopBar 적용 (하드코딩 된 Topbar 제거됨) */}
          <TopBar title="내 현황 홈" />

          <div className="content">
            <div className="top-grid">
              <div className="visa-card">
                <svg className="visa-bg-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-2-1h-6v-2h6v2z"/></svg>
                <div className="visa-label">체류 비자 만료까지</div>
                <div className="visa-dday">D-<span>{visaInfo.dDay}</span></div>
                <div className="visa-info">
                  <span className="visa-type">{visaInfo.type}</span>
                  만료 예정일 · {visaInfo.expireDate}
                </div>
              </div>
              
              <div className="mileage-card">
                <div className="mileage-label">보유 중인 KM 마일리지</div>
                <div className="mileage-value">{mileage.total} <span>점</span></div>
                <div>
                  <span className="mileage-sub">이번 학기 신규 획득 <b>+{mileage.semester}점</b></span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">이번 학기 출결 요약</div>
                <div className="badge b-blue">13주차 기준</div>
              </div>
              <div style={{ padding: '16px 24px 8px', display: 'flex', fontSize: 13, color: '#94A3B8', fontWeight: 600, borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ flex: 1 }}>수강 과목명</span>
                <span style={{ width: 140, textAlign: 'center' }}>출석 / 결석 / 지각</span>
                <span style={{ width: 60, textAlign: 'right' }}>현재 상태</span>
              </div>
              {attendanceSummary.map((a) => (
                <div key={a.course} className="attend-row">
                  <div className="attend-course">{a.course}</div>
                  <div className="attend-counts">{a.total - a.absent - a.late} / {a.absent} / {a.late}</div>
                  <div className="attend-status">
                    <span className={`badge ${a.status === '정상' ? 'b-green' : a.status === '주의' ? 'b-amber' : 'b-red'}`}>
                      {a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">순수 온라인 강의 수강 한도</div>
                <div className={`badge ${onlineCredit.ratio >= 30 ? 'b-amber' : 'b-green'}`}>
                  {onlineCredit.ratio}% 사용
                </div>
              </div>
              <div className="online-body">
                <div className="online-numbers">
                  <div className="online-used">{onlineCredit.used}</div>
                  <div className="online-limit">/ {onlineCredit.limit} 학점</div>
                </div>
                <div className="online-bar-bg">
                  <div className="online-bar-fill" style={{ width: `${onlineCredit.ratio}%`, background: onlineCredit.ratio >= 30 ? '#F59E0B' : '#3B82F6' }} />
                </div>
                <div className="online-desc">
                  졸업 전까지 수강 가능한 순수 온라인 강의 한도 <b>{onlineCredit.limit}학점</b> 중 현재 <b>{onlineCredit.used}학점</b>을 사용했습니다.
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}