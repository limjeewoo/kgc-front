import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const ROLES = [
  { label: '관리자', value: 'ADMIN' },
  { label: '교수', value: 'PROFESSOR' },
  { label: '유학생', value: 'STUDENT' },
];

export default function Login() {
  const [activeRole, setActiveRole] = useState('ADMIN'); // UI 탭용 상태
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    // [수정] 백엔드 DTO 규격에 맞춰 userId, password만 전송 (role 제외)
    const loginData = {
      userId: username,
      password: password,
    };

    console.group('🔍 로그인 요청 디버깅');
    console.log('1. 요청 URL:', api.defaults.baseURL + '/api/v1/auth/login');
    console.log('2. 보낼 데이터(Payload):', loginData);
    console.groupEnd();

    try {
      // API 호출
      const response = await api.post('/api/v1/auth/login', loginData);

      console.log('✅ 서버 응답 성공:', response.data);

      const { success, data, message } = response.data;

      if (success) {
        // 토큰 및 정보 로컬 스토리지 저장
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userRole', data.role); // 서버가 리턴해준 실제 권한 저장

        // [이동 로직] 서버가 준 role 값에 따라 App.jsx에 설정된 경로로 이동
        if (data.role === 'ADMIN') {
          navigate('/admin/dashboard', { replace: true });
        } else if (data.role === 'PROFESSOR') {
          navigate('/professor/dashboard', { replace: true });
        } else if (data.role === 'STUDENT') {
          navigate('/student/dashboard', { replace: true });
        }
      } else {
        alert(message || '로그인 실패');
      }
    } catch (error) {
      console.group('❌ 에러 발생 상세 분석');
      if (error.response) {
        console.error('에러 상태 코드:', error.response.status);
        console.error('서버 응답 데이터:', error.response.data);
        
        // 500 에러 처리
        if (error.response.status === 500) {
          alert('서버 내부 오류(500)가 발생했습니다. 아이디/비밀번호 필드명을 확인하세요.');
        } else {
          alert(error.response.data.message || '로그인 중 오류가 발생했습니다.');
        }
      } else {
        console.error('네트워크 에러:', error.message);
        alert('서버와 연결할 수 없습니다. 서버 상태를 확인하세요.');
      }
      console.groupEnd();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .login-page {
          font-family: 'DM Sans', 'Noto Sans KR', sans-serif;
          background: #F5F6FA;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-wrap {
          display: flex;
          width: 900px;
          min-height: 560px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.10);
        }
        .brand-panel {
          width: 380px;
          background: #0056B9;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 52px 44px;
          position: relative;
          overflow: hidden;
        }
        .brand-panel::before {
          content: '';
          position: absolute;
          top: -80px; right: -80px;
          width: 260px; height: 260px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 48px;
        }
        .brand-icon {
          width: 42px; height: 42px;
          background: #3B82F6;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .brand-name {
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          letter-spacing: 0.3px;
        }
        .brand-name span {
          display: block;
          font-size: 11px;
          font-weight: 400;
          color: rgba(255,255,255,0.55);
        }
        .brand-headline {
          font-size: 26px;
          font-weight: 700;
          color: #fff;
          line-height: 1.4;
          margin-bottom: 16px;
        }
        .form-panel {
          flex: 1;
          background: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 52px 48px;
        }
        .form-title {
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 6px;
        }
        .form-subtitle {
          font-size: 13.5px;
          color: #9CA3AF;
          margin-bottom: 28px;
        }
        .role-tabs {
          display: flex;
          background: #F3F4F6;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 28px;
          gap: 2px;
        }
        .role-tab {
          flex: 1;
          padding: 8px 0;
          border: none;
          background: transparent;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 500;
          color: #9CA3AF;
          cursor: pointer;
          transition: all 0.18s;
        }
        .role-tab.active {
          background: #fff;
          color: #1A3A5C;
          box-shadow: 0 1px 4px rgba(0,0,0,0.10);
        }
        .field-group { margin-bottom: 18px; }
        .field-label {
          display: block;
          font-size: 12.5px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 7px;
        }
        .field-input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #E5E7EB;
          border-radius: 9px;
          font-size: 14px;
          outline: none;
        }
        .field-input:focus { border-color: #3B82F6; }
        .field-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .remember-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: #6B7280;
          cursor: pointer;
        }
        .forgot-link {
          font-size: 12.5px;
          color: #3B82F6;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 500;
        }
        .btn-login {
          width: 100%;
          padding: 13px;
          background: #1A3A5C;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 14.5px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-login:hover { background: #15304d; }
        .btn-login:disabled { background: #9CA3AF; cursor: not-allowed; }
        .form-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 12px;
          color: #9CA3AF;
        }
      `}</style>

      <div className="login-page">
        <div className="login-wrap">
          <div className="brand-panel">
            <div className="brand-logo">
              <div className="brand-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" width="22" height="22">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div className="brand-name">KMGC<span>경민대학교 국제교육원</span></div>
            </div>
            <div className="brand-headline">외국인 유학생<br/>통합 관리 시스템</div>
          </div>

          <div className="form-panel">
            <div className="form-title">로그인</div>
            <div className="form-subtitle">계정 유형을 선택하고 로그인하세요.</div>
            
            <div className="role-tabs">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  className={`role-tab${activeRole === role.value ? ' active' : ''}`}
                  onClick={() => setActiveRole(role.value)}
                  type="button"
                >{role.label}</button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label className="field-label">아이디 (학번/사번)</label>
                <input 
                  className="field-input" 
                  type="text" 
                  placeholder="아이디를 입력하세요" 
                  required 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                />
              </div>
              <div className="field-group">
                <label className="field-label">비밀번호</label>
                <input 
                  className="field-input" 
                  type="password" 
                  placeholder="비밀번호를 입력하세요" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
              <div className="field-row">
                <label className="remember-label">
                  <input 
                    type="checkbox" 
                    checked={remember} 
                    onChange={(e) => setRemember(e.target.checked)} 
                  /> 로그인 상태 유지
                </label>
                <button type="button" className="forgot-link">비밀번호 찾기</button>
              </div>
              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>
            <div className="form-footer">문의사항은 국제교육원으로 연락해 주세요.</div>
          </div>
        </div>
      </div>
    </>
  );
}