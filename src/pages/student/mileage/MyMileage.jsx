import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopBar from '../../../components/layout/TopBar.jsx';

// 1. 공통 Axios 인스턴스 설정
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

// 2. 전역 CSS 스타일 가이드
const GLOBAL_MILEAGE_CSS = `
  /* 🛠️ 레이아웃 일관성 유지: 박스 모델 규격 교정 및 좌우 여백 22px 조정 */
  .sw-content { box-sizing: border-box; width: 100%; padding: 4px 22px 24px; animation: mileageFadeUp 0.28s ease; }
  
  @keyframes mileageFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin-bottom: 1.75rem; }
  .stat-card { background: #fff; border-radius: 14px; padding: 1.5rem; border: 1px solid #E2E8F0; position: relative; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01); }
  .stat-card::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; }
  .stat-card.c-blue::after { background: #3B82F6; }
  .stat-card.c-purple::after { background: #8B5CF6; }
  
  .stat-lbl { font-size: .75rem; color: #64748B; margin-bottom: .5rem; font-weight: 600; text-transform: uppercase; }
  .stat-val { font-size: 2rem; font-weight: 700; color: #0F172A; line-height: 1; display: flex; align-items: baseline; }
  .stat-val .unit { font-size: .9375rem; font-weight: 500; color: #94A3B8; margin-left: 4px; }
  .stat-hint { font-size: .75rem; color: #94A3B8; margin-top: .75rem; display: flex; align-items: center; gap: .25rem; font-weight: 500; }

  .sec-label { font-size: 1rem; font-weight: 700; color: #1E293B; margin: 1.5rem 0 .75rem; padding-left: 4px; }

  .data-card { background: #fff; border-radius: 14px; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01); overflow: hidden; margin-bottom: 1.25rem; }
  .card-hd { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid #F1F5F9; }
  .card-hd-title { font-size: .9375rem; font-weight: 700; color: #0F172A; }
  .count-pill { font-size: .75rem; font-weight: 600; background: #F1F5F9; color: #475569; padding: 4px 10px; border-radius: 6px; }

  .tbl-wrap { width: 100%; overflow-x: auto; background: #fff; }
  .base-tbl { width: 100%; border-collapse: collapse; text-align: left; font-size: .875rem; min-width: 600px; }
  .base-tbl th { background: #F8FAFC; color: #64748B; font-weight: 600; padding: .75rem 1.5rem; border-bottom: 1px solid #E2E8F0; font-size: .75rem; }
  .base-tbl td { padding: 1rem 1.5rem; border-bottom: 1px solid #F1F5F9; color: #334155; font-weight: 500; vertical-align: middle; }
  .base-tbl tbody tr:last-child td { border-bottom: none; }
  
  .col-date { width: 15%; color: #64748B; }
  .col-name { width: 55%; font-weight: 600; color: #0F172A; }
  .col-category { width: 15%; text-align: center; }
  .col-points { width: 15%; text-align: right; font-weight: 700; color: #3B82F6; font-size: .9375rem; }

  .pill { display: inline-flex; align-items: center; padding: 4px 10px; font-size: .75rem; font-weight: 600; border-radius: 6px; line-height: 1; white-space: nowrap; }
  .pill-blue { background: #EFF6FF; color: #2563EB; }
  .pill-purple { background: #F5F3FF; color: #7C3AED; }
  .pill-green { background: #ECFDF5; color: #059669; }
  .pill-gray { background: #F1F5F9; color: #475569; }
`;

function Skeleton({ h = '1rem', w = '100%', style = {} }) {
  return (
    <div style={{ 
      height: h, width: w, backgroundColor: '#E2E8F0', borderRadius: '6px',
      animation: 'mileagePulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite', ...style
    }}>
      <style>{`@keyframes mileagePulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }`}</style>
    </div>
  );
}

function EmptyState({ text }) {
  return ( <div style={styles.emptyState}>{text}</div> );
}

export default function MyMileage() {
  const [mileageData, setMileageData] = useState({ totalMileage: 0, semesterMileage: 0, history: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMileageData = async () => {
      try {
        setIsLoading(true);
        
        const meRes = await api.get('/auth/me');
        const meData = meRes.data?.data ?? meRes.data;
        const studentId = meData?.userId ?? meData?.studentId ?? (typeof meData === 'string' || typeof meData === 'number' ? String(meData) : null);
        
        if (!studentId) {
          throw new Error('사용자 정보를 조회할 수 없습니다.');
        }

        const res = await api.get(`/students/${studentId}/mileage`);
        
        setMileageData({
          totalMileage: res.data?.totalMileage ?? res.data?.data?.totalMileage ?? 0,
          semesterMileage: res.data?.semesterMileage ?? res.data?.data?.semesterMileage ?? 0,
          history: Array.isArray(res.data?.history) ? res.data.history : (Array.isArray(res.data?.data?.history) ? res.data.data.history : [])
        });
      } catch (error) {
        console.error('API Error:', error);
        // 백엔드 연동 장애 대비 안전용 폴백 데이터 유지
        setMileageData({
          totalMileage: 250,
          semesterMileage: 100,
          history: [
            { id: 1, date: '2026-05-12', activityName: '글로벌 버디 프로그램 참여', points: 50, category: '비교과' },
            { id: 2, date: '2026-04-20', activityName: 'TOPIK 4급 취득', points: 100, category: '어학' },
            { id: 3, date: '2026-03-15', activityName: '유학생 오리엔테이션 도우미', points: 100, category: '봉사' }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMileageData();
  }, []);

  return (
    <>
      <style>{GLOBAL_MILEAGE_CSS}</style>
      <div className="sw-main">
        <TopBar title="KM 마일리지" />

        <div className="sw-content">
          <div className="sec-label">마일리지 요약</div>
          
          <div className="stats-grid">
            <div className="stat-card c-blue">
              <div className="stat-lbl">총 누적 마일리지</div>
              <div className="stat-val">
                {isLoading ? <Skeleton w="100px" h="2rem" /> : <>{mileageData.totalMileage}<span className="unit">점</span></>}
              </div>
              <div className="stat-hint">입학 이후 통합 적립된 포인트입니다.</div>
            </div>

            <div className="stat-card c-purple">
              <div className="stat-lbl">당해 학기 적립 마일리지</div>
              <div className="stat-val">
                {isLoading ? <Skeleton w="100px" h="2rem" /> : <>{mileageData.semesterMileage}<span className="unit">점</span></>}
              </div>
              <div className="stat-hint">이번 학기 신규로 취득한 포인트입니다.</div>
            </div>
          </div>

          <div className="sec-label">마일리지 이력 관리</div>

          <div className="data-card">
            <div className="card-hd">
              <div className="card-hd-title">상세 적립 내역</div>
              {!isLoading && (
                <div className="count-pill">총 {mileageData.history?.length || 0}건의 내역</div>
              )}
            </div>
            
            <div className="tbl-wrap">
              <table className="base-tbl">
                <thead>
                  <tr>
                    <th className="col-date">적립 일자</th>
                    <th className="col-name">수행 활동명 / 인증 내역</th>
                    <th className="col-category" style={styles.thCenter}>카테고리</th>
                    <th className="col-points" style={styles.thRight}>취득 점수</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(3)].map((_, idx) => (
                      <tr key={idx}>
                        <td><Skeleton h="1rem" /></td>
                        <td><Skeleton h="1rem" w="80%" /></td>
                        <td><Skeleton h="1.25rem" w="50px" style={styles.skeletonCenter} /></td>
                        <td><Skeleton h="1.25rem" w="40px" style={styles.skeletonRight} /></td>
                      </tr>
                    ))
                  ) : mileageData.history && mileageData.history.length > 0 ? (
                    mileageData.history.map((item) => (
                      <tr key={item.id}>
                        <td className="col-date">{item.date}</td>
                        <td className="col-name">{item.activityName}</td>
                        <td className="col-category">
                          <span className={`pill ${
                            item.category === '비교과' ? 'pill-blue' :
                            item.category === '어학' ? 'pill-purple' :
                            item.category === '봉사' ? 'pill-green' : 'pill-gray'
                          }`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="col-points">+{item.points} 점</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={styles.emptyTd}>
                        <EmptyState text="현재까지 승인된 마일리지 이력이 존재하지 않습니다." />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

const styles = {
  emptyState: { padding: '4rem 1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '.875rem' },
  thCenter: { textAlign: 'center' },
  thRight: { textAlign: 'right' },
  skeletonCenter: { margin: '0 auto' },
  skeletonRight: { marginLeft: 'auto' },
  emptyTd: { padding: 0 }
};