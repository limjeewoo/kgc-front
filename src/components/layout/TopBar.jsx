// src/components/layout/TopBar.jsx
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';

export default function TopBar({ title }) {
  const navigate = useNavigate();
  const { userId, role, clearAuth } = useAuthStore();
  const [semester, setSemester] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  // 현재 학기 조회
  useEffect(() => {
    api.get('/api/v1/semesters/current')
      .then(res => { if (res.data.success) setSemester(res.data.data); })
      .catch(() => setSemester(null));
  }, []);

  // // 알림 조회
  // useEffect(() => {
  //   api.get('/api/v1/notifications')
  //     .then(res => { if (res.data.success) setNotifications(res.data.data); })
  //     .catch(() => setNotifications([]));
  // }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // 알림 읽음 처리
  const handleReadNotif = async (notiId) => {
    try {
      await api.patch(`/api/v1/notifications/${notiId}/read`);
      setNotifications(prev =>
        prev.map(n => n.notiId === notiId ? { ...n, isRead: true } : n)
      );
    } catch (e) {}
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch (e) {}
    clearAuth();
    navigate('/login', { replace: true });
  };

  const roleLabel = role === 'ADMIN' ? '관리자' : role === 'PROFESSOR' ? '교수' : '유학생';

  const notiTypeLabel = (type) => {
    if (type === 'VISA_EXPIRE') return '비자 만료';
    if (type === 'ATTEND_WARNING') return '출결 경고';
    if (type === 'ONLINE_LIMIT') return '온라인 초과';
    if (type === 'CRISIS_ALERT') return '위기 징후';
    return '알림';
  };

  const notiTypeColor = (type) => {
    if (type === 'VISA_EXPIRE') return '#DC2626';
    if (type === 'ATTEND_WARNING') return '#D97706';
    if (type === 'ONLINE_LIMIT') return '#2563EB';
    if (type === 'CRISIS_ALERT') return '#DC2626';
    return '#6B7280';
  };

  return (
    <>
      <style>{`
        .topbar {
          background: #fff;
          padding: 0 1.75rem; /* 28px */
          height: 3.625rem; /* 58px */
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #E5E7EB;
          flex-shrink: 0;
          position: relative;
        }
        .topbar-title {
          font-size: 1rem; /* 16px */
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.0125rem;
        }
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 0.75rem; /* 12px */
        }
        .semester-badge {
          background: #EFF6FF;
          color: #1D4ED8;
          font-size: 0.75rem; /* 12px */
          font-weight: 600;
          padding: 0.3125rem 0.75rem; /* 5px 12px */
          border-radius: 1.25rem; /* 20px */
        }
        .user-greeting {
          font-size: 0.8125rem; /* 13px */
          color: #374151;
          font-weight: 500;
        }
        .user-greeting span {
          color: #1A3A5C;
          font-weight: 700;
        }

        /* 알림 버튼 */
        .notif-wrap { position: relative; }
        .notif-btn {
          width: 2.125rem; /* 34px */
          height: 2.125rem;
          border-radius: 0.5rem; /* 8px */
          background: #F3F4F6;
          border: none;
          cursor: pointer;
          display: flex; 
          align-items: center; 
          justify-content: center;
          position: relative;
          transition: background 0.15s;
        }
        .notif-btn:hover { background: #E5E7EB; }
        .notif-btn svg {
          width: 1rem;
          height: 1rem;
        }
        .notif-dot {
          width: 0.5rem; /* 8px */
          height: 0.5rem;
          background: #EF4444;
          border-radius: 50%;
          position: absolute;
          top: 0.375rem; /* 6px */
          right: 0.375rem;
          border: 1.5px solid #fff;
        }
        .notif-count {
          position: absolute;
          top: -0.25rem; /* -4px */
          right: -0.25rem;
          background: #EF4444;
          color: #fff;
          font-size: 0.625rem; /* 10px */
          font-weight: 700;
          width: 1rem; /* 16px */
          height: 1rem;
          border-radius: 50%;
          display: flex; 
          align-items: center; 
          justify-content: center;
          border: 1.5px solid #fff;
        }

        /* 알림 드롭다운 */
        .notif-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem); /* + 8px */
          right: 0;
          width: 20rem; /* 320px */
          background: #fff;
          border-radius: 0.875rem; /* 14px */
          box-shadow: 0 0.5rem 2rem rgba(0,0,0,0.13);
          border: 1px solid #F3F4F6;
          z-index: 999;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .notif-dropdown-header {
          padding: 0.875rem 1.125rem; /* 14px 18px */
          border-bottom: 1px solid #F3F4F6;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .notif-dropdown-title {
          font-size: 0.8125rem; /* 13px */
          font-weight: 700;
          color: #111827;
        }
        .notif-unread-badge {
          font-size: 0.6875rem; /* 11px */
          font-weight: 600;
          background: #FEF2F2;
          color: #EF4444;
          padding: 0.125rem 0.5rem; /* 2px 8px */
          border-radius: 1.25rem;
        }
        .notif-list {
          display: flex;
          flex-direction: column;
          max-height: 25rem;
          overflow-y: auto;
        }
        .notif-item {
          padding: 0.75rem 1.125rem; /* 12px 18px */
          border-bottom: 1px solid #F9FAFB;
          cursor: pointer;
          transition: background 0.1s;
          display: flex;
          gap: 0.625rem; /* 10px */
          align-items: flex-start;
        }
        .notif-item:last-child { border-bottom: none; }
        .notif-item:hover { background: #FAFAFA; }
        .notif-item.unread { background: #F0F6FF; }
        .notif-item.unread:hover { background: #E8F0FE; }
        .notif-type-dot {
          width: 0.5rem; /* 8px */
          height: 0.5rem;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 0.25rem; /* 4px */
        }
        .notif-item-content { 
          flex: 1; 
          display: flex;
          flex-direction: column;
        }
        .notif-type-label {
          font-size: 0.65rem; /* ~10.5px */
          font-weight: 600;
          margin-bottom: 0.125rem; /* 2px */
        }
        .notif-message {
          font-size: 0.78rem; /* ~12.5px */
          color: #374151;
          line-height: 1.5;
        }
        .notif-time {
          font-size: 0.6875rem; /* 11px */
          color: #9CA3AF;
          margin-top: 0.1875rem; /* 3px */
        }
        .notif-empty {
          padding: 1.75rem; /* 28px */
          text-align: center;
          font-size: 0.8125rem; /* 13px */
          color: #9CA3AF;
        }

        /* 로그아웃 버튼 */
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem; /* 6px */
          padding: 0.4375rem 0.875rem; /* 7px 14px */
          background: #F3F4F6;
          border: none;
          border-radius: 0.5rem; /* 8px */
          font-size: 0.78rem; /* ~12.5px */
          font-weight: 500;
          color: #6B7280;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .logout-btn svg {
          width: 0.8125rem; /* 13px */
          height: 0.8125rem;
        }
        .logout-btn:hover {
          background: #FEF2F2;
          color: #DC2626;
        }
      `}</style>

      <div className="topbar">
        <div className="topbar-title">{title}</div>

        <div className="topbar-right">
          {/* 학기 배지 */}
          <div className="semester-badge">
            {semester
              ? `${semester.year}학년도 ${semester.term}학기`
              : '학기 정보 로딩중'}
          </div>

          {/* 사용자 인사말 */}
          <div className="user-greeting">
            <span>{userId}</span> {roleLabel}님
          </div>

          {/* 알림 벨 */}
          <div className="notif-wrap">
            <button
              className="notif-btn"
              onClick={() => setShowNotif(prev => !prev)}
            >
              <svg viewBox="0 0 20 20" fill="#6B7280">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
              </svg>
              {unreadCount > 0 && (
                <span className="notif-count">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* 알림 드롭다운 */}
            {showNotif && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">
                  <div className="notif-dropdown-title">알림</div>
                  {unreadCount > 0 && (
                    <div className="notif-unread-badge">읽지 않음 {unreadCount}개</div>
                  )}
                </div>

                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">새로운 알림이 없습니다.</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.notiId}
                        className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                        onClick={() => handleReadNotif(n.notiId)}
                      >
                        <div
                          className="notif-type-dot"
                          style={{ background: notiTypeColor(n.notiType) }}
                        />
                        <div className="notif-item-content">
                          <div className="notif-type-label" style={{ color: notiTypeColor(n.notiType) }}>
                            {notiTypeLabel(n.notiType)}
                          </div>
                          <div className="notif-message">{n.message}</div>
                          <div className="notif-time">
                            {new Date(n.createdAt).toLocaleString('ko-KR', {
                              month: 'numeric', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 로그아웃 */}
          <button className="logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
            </svg>
            로그아웃
          </button>
        </div>
      </div>
    </>
  );
}