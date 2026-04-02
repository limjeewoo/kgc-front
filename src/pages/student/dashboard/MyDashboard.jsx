// src/pages/student/dashboard/MyDashboard.jsx
export default function MyDashboard() {
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
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        .student-wrap { display: flex; min-height: 100vh; background: #F0F2F7; font-family: 'DM Sans','Noto Sans KR',sans-serif; font-size: 14px; color: #111827; }

        /* 사이드바 */
        .sidebar { width: 220px; min-height: 100vh; background: #1A3A5C; display: flex; flex-direction: column; flex-shrink: 0; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
        .sb-logo { display: flex; align-items: center; gap: 10px; padding: 22px 18px 18px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 8px; }
        .logo-icon { width: 32px; height: 32px; background: #3B82F6; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .logo-text { font-size: 12.5px; font-weight: 700; color: #fff; line-height: 1.3; }
        .logo-text span { display: block; font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.45); }
        .sb-sec { padding: 6px 10px 2px; }
        .sb-lbl { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.3); letter-spacing: 1px; text-transform: uppercase; padding: 0 8px; margin-bottom: 3px; }
        .ni { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px; color: rgba(255,255,255,0.6); font-size: 12.5px; cursor: pointer; transition: all 0.15s; margin-bottom: 1px; }
        .ni:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .ni.active { background: #3B82F6; color: #fff; font-weight: 500; }
        .ni-icon { width: 15px; height: 15px; flex-shrink: 0; }
        .sb-bot { margin-top: auto; padding: 10px; border-top: 1px solid rgba(255,255,255,0.08); }
        .urow { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px; cursor: pointer; }
        .urow:hover { background: rgba(255,255,255,0.07); }
        .uav { width: 30px; height: 30px; border-radius: 50%; background: #3B82F6; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .un { font-size: 12px; font-weight: 500; color: #fff; }
        .ur { font-size: 10.5px; color: rgba(255,255,255,0.4); margin-top: 1px; }

        /* 메인 */
        .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .topbar { background: #fff; padding: 0 24px; height: 56px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E5E7EB; }
        .tb-title { font-size: 15px; font-weight: 700; color: #111827; }
        .tb-right { display: flex; align-items: center; gap: 10px; }
        .sem-badge { background: #EFF6FF; color: #1D4ED8; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; }
        .notif-btn { width: 32px; height: 32px; border-radius: 8px; background: #F3F4F6; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; position: relative; }
        .nd { width: 7px; height: 7px; background: #EF4444; border-radius: 50%; position: absolute; top: 6px; right: 6px; border: 1.5px solid #fff; }

        .content { flex: 1; padding: 22px 24px; overflow-y: auto; }

        /* 카드 공통 */
        .card { background: #fff; border-radius: 14px; border: 1px solid #F3F4F6; overflow: hidden; margin-bottom: 16px; }
        .card-header { padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F3F4F6; }
        .card-title { font-size: 13.5px; font-weight: 700; color: #111827; }
        .card-badge { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px; }
        .b-blue { background: #EFF6FF; color: #1D4ED8; }
        .b-green { background: #F0FDF4; color: #16A34A; }
        .b-amber { background: #FFFBEB; color: #D97706; }
        .b-red { background: #FEF2F2; color: #DC2626; }
        .b-purple { background: #F5F3FF; color: #7C3AED; }

        /* 상단 2열 그리드 */
        .top-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }

        /* 비자 D-Day 카드 */
        .visa-card { background: linear-gradient(135deg, #1A3A5C, #2563EB); border-radius: 14px; padding: 24px; color: #fff; }
        .visa-label { font-size: 11.5px; color: rgba(255,255,255,0.6); margin-bottom: 8px; }
        .visa-dday { font-size: 48px; font-weight: 700; letter-spacing: -2px; line-height: 1; margin-bottom: 8px; }
        .visa-dday span { font-size: 20px; font-weight: 400; }
        .visa-info { font-size: 12px; color: rgba(255,255,255,0.65); }
        .visa-type { display: inline-block; background: rgba(255,255,255,0.15); padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-bottom: 8px; }

        /* 마일리지 카드 */
        .mileage-card { background: #fff; border-radius: 14px; border: 1px solid #F3F4F6; padding: 24px; }
        .mileage-label { font-size: 11.5px; color: #9CA3AF; margin-bottom: 8px; font-weight: 500; }
        .mileage-value { font-size: 48px; font-weight: 700; color: #111827; letter-spacing: -2px; line-height: 1; margin-bottom: 8px; }
        .mileage-value span { font-size: 18px; font-weight: 400; color: #9CA3AF; }
        .mileage-sub { font-size: 12px; color: #9CA3AF; }
        .mileage-sub b { color: #7C3AED; font-weight: 600; }

        /* 출결 테이블 */
        .attend-row { display: flex; align-items: center; padding: 12px 20px; border-bottom: 1px solid #F9FAFB; gap: 12px; }
        .attend-row:last-child { border-bottom: none; }
        .attend-course { flex: 1; font-size: 13px; font-weight: 500; color: #111827; }
        .attend-counts { font-size: 12px; color: #9CA3AF; width: 110px; text-align: center; }
        .attend-status { width: 50px; text-align: right; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }

        /* 온라인 학점 */
        .online-body { padding: 20px; }
        .online-numbers { display: flex; align-items: baseline; gap: 6px; margin-bottom: 12px; }
        .online-used { font-size: 32px; font-weight: 700; color: #111827; letter-spacing: -1px; }
        .online-limit { font-size: 16px; color: #9CA3AF; }
        .online-bar-bg { width: 100%; height: 10px; background: #F3F4F6; border-radius: 6px; overflow: hidden; margin-bottom: 8px; }
        .online-bar-fill { height: 100%; border-radius: 6px; background: #3B82F6; transition: width 0.3s; }
        .online-desc { font-size: 12px; color: #9CA3AF; }
        .online-desc b { color: #1D4ED8; }
      `}</style>

      <div className="student-wrap">
        {/* 사이드바 */}
        <div className="sidebar">
          <div className="sb-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" width="16" height="16">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="logo-text">KMGC <span>경민대학교 국제교육원</span></div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">메인</div>
            <div className="ni active">
              <svg className="ni-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
              내 현황 홈
            </div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">학업</div>
            <div className="ni">
              <svg className="ni-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>
              수강 내역
            </div>
            <div className="ni">
              <svg className="ni-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/></svg>
              출결 현황
            </div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">활동</div>
            <div className="ni">
              <svg className="ni-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/></svg>
              알바 등록
            </div>
            <div className="ni">
              <svg className="ni-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
              KM 마일리지
            </div>
          </div>

          <div className="sb-sec">
            <div className="sb-lbl">내 정보</div>
            <div className="ni">
              <svg className="ni-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
              내 프로필
            </div>
          </div>

          <div className="sb-bot">
            <div className="urow">
              <div className="uav">김</div>
              <div>
                <div className="un">Kim Minji</div>
                <div className="ur">유학생 · 컴퓨터공학과</div>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 */}
        <div className="main">
          <div className="topbar">
            <div className="tb-title">내 현황 홈</div>
            <div className="tb-right">
              <div className="sem-badge">2025학년도 1학기</div>
              <button className="notif-btn">
                <svg width="15" height="15" viewBox="0 0 20 20" fill="#6B7280"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
                <div className="nd" />
              </button>
            </div>
          </div>

          <div className="content">

            {/* 비자 D-Day + 마일리지 */}
            <div className="top-grid">

              {/* 비자 D-Day 카드 */}
              <div className="visa-card">
                <div className="visa-label">비자 만료까지</div>
                <div className="visa-dday">D-<span>{visaInfo.dDay}</span></div>
                <div className="visa-type">{visaInfo.type}</div>
                <div className="visa-info">만료일 · {visaInfo.expireDate}</div>
              </div>

              {/* KM 마일리지 */}
              <div className="mileage-card">
                <div className="mileage-label">KM 마일리지 총점</div>
                <div className="mileage-value">{mileage.total} <span>점</span></div>
                <div className="mileage-sub">이번 학기 획득 <b>{mileage.semester}점</b></div>
              </div>
            </div>

            {/* 이번 학기 출결 요약 */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">이번 학기 출결 요약</div>
                <div className="card-badge b-blue">2025-1학기 · 13주차</div>
              </div>
              <div style={{ padding: '8px 20px 4px', display: 'flex', fontSize: 11, color: '#9CA3AF', gap: 12 }}>
                <span style={{ flex: 1 }}>과목명</span>
                <span style={{ width: 110, textAlign: 'center' }}>출석 / 결석 / 지각</span>
                <span style={{ width: 50, textAlign: 'right' }}>상태</span>
              </div>
              {attendanceSummary.map((a) => (
                <div key={a.course} className="attend-row">
                  <div className="attend-course">{a.course}</div>
                  <div className="attend-counts">{a.total - a.absent - a.late} / {a.absent} / {a.late}</div>
                  <div className={`attend-status ${a.status === '정상' ? 'b-green' : a.status === '주의' ? 'b-amber' : 'b-red'}`}>
                    {a.status}
                  </div>
                </div>
              ))}
            </div>

            {/* 온라인 학점 사용 현황 */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">온라인 학점 사용 현황</div>
                <div className={`card-badge ${onlineCredit.ratio >= 30 ? 'b-amber' : 'b-green'}`}>
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
                  순수 온라인 수강 한도 <b>{onlineCredit.limit}학점</b> 중 <b>{onlineCredit.used}학점</b> 사용 중
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}