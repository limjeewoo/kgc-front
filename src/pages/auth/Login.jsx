import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

const ROLES = [
  { label: '관리자', value: 'ADMIN' },
  { label: '조교', value: 'STAFF' },
  { label: '교수', value: 'PROFESSOR' },
  { label: '유학생', value: 'STUDENT' },
];

export default function Login() {
  const [activeRole, setActiveRole] = useState('ADMIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const loginData = { userId: username, password: password };

    try {
      const response = await api.post('/api/v1/auth/login', loginData);
      const { success, data, message } = response.data;

      if (success) {
        // 로그인 성공 직후, 앞으로 보내는 모든 api 요청 헤더에 토큰을 자동으로 붙이도록 설정
        api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;

        // 백엔드가 넘겨준 data.name을 전역 스토어에 안전하게 저장 🚀
        setAuth({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          role: data.role,
          userId: data.userId || username,
          name: data.name, 
        });

        if (data.role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
        else if (data.role === 'STAFF') navigate('/staff/dashboard', { replace: true });
        else if (data.role === 'PROFESSOR') navigate('/professor/dashboard', { replace: true });
        else if (data.role === 'STUDENT') navigate('/student/dashboard', { replace: true });
      } else {
        alert(message || '로그인 실패');
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 500) {
          alert('서버 내부 오류(500)가 발생했습니다.');
        } else {
          alert(error.response.data.message || '로그인 중 오류가 발생했습니다.');
        }
      } else {
        alert('서버와 연결할 수 없습니다. 서버 상태를 확인하세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        :root {
          font-size: 16px;
        }

        .login-page {
          font-family: 'DM Sans', 'Noto Sans KR', sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-wrap {
          display: flex;
          width: 84.375rem;   
          min-height: 52.5rem; 
          border-radius: 1.875rem; 
          overflow: hidden;
          box-shadow: 0 1.875rem 5.625rem rgba(0,0,0,0.10);
        }

        /* 왼쪽 브랜드 패널 */
        .brand-panel {
          width: 25rem;
          background: #0056B9;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 4.875rem 4.125rem;
          position: relative;
          overflow: hidden;
        }
        
        .brand-panel::before { 
          content: '';
          position: absolute;
          top: -7.5rem; right: -7.5rem;
          width: 24.375rem; height: 24.375rem;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
        }

        .brand-panel::after {
          content: '';
          position: absolute;
          bottom: -5.625rem; 
          left: -5.625rem;   
          width: 18.75rem; 
          height: 18.75rem; 
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.04);
          z-index: 0;
        }

        .brand-logo {
          padding-left: 4rem;
          display: flex;
          align-items: center;
          gap: 1.125rem;
          margin-bottom: 4.5rem;
        }

        .brand-icon {
          width: 3.9375rem;
          height: 3.9375rem;
          background-image: url('/logo-fff.png'); 
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          flex-shrink: 0;
        }

        .brand-name {
          font-size: 1.40625rem;
          font-weight: 600;
          color: #fff;
          letter-spacing: 0.028125rem;
        }

        .brand-name span {
          display: block;
          font-size: 1.03125rem;
          font-weight: 400;
          color: rgba(255,255,255,0.55);
        }

        .brand-headline {
          font-size: 2.4375rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.4;
          margin-bottom: 1.5rem;
        }

        /* 오른쪽 폼 패널 */
        .form-panel {
          flex: 1;
          background: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 4.875rem 4.5rem;
        }

        .form-title {
          font-size: 2.0625rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4.5rem;
        }

        .field-group { 
          margin-bottom: 1.6875rem; 
        }

        .field-label {
          display: block;
          font-size: 1.1718rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.65625rem; 
        }

        .field-input {
          width: 100%;
          padding: 1.03125rem 1.3125rem;
          border: 0.1406rem solid #E5E7EB;
          border-radius: 0.84375rem;
          font-size: 1.3125rem;
          outline: none;
        }

        .field-input:focus { 
          border-color: #3B82F6; 
        }

        .field-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.25rem;
        }

        .remember-label {
          display: flex;
          align-items: center;
          gap: 0.5625rem;
          font-size: 1.1718rem;
          color: #6B7280;
          cursor: pointer;
        }

        .forgot-link {
          font-size: 1.1718rem;
          color: #3B82F6;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 500;
        }

        .btn-login {
          width: 100%;
          padding: 1.21875rem;
          background: #1A3A5C;
          color: #fff;
          border: none;
          border-radius: 0.9375rem;
          font-size: 1.359rem;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-login:hover { background: #15304d; }
        .btn-login:disabled { background: #9CA3AF; cursor: not-allowed; }

        .form-footer {
          margin-top: 2.25rem;
          text-align: center;
          font-size: 1.125rem;
          color: #9CA3AF;
        }
      `}</style>

      <div className="login-page">
        <div className="login-wrap">
          <div className="brand-panel">
            <div className="brand-logo">
              <div className="brand-icon"></div>
              <div className="brand-name">KGC<span>경민대학교 국제교육원</span></div>
            </div>
            <div className="brand-headline">외국인 유학생<br/>통합 관리 시스템</div>
          </div>

          <div className="form-panel">
            <div className="form-title">로그인</div>
            
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