import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  // step: 'login' | 'mfa-setup' | 'mfa-code'
  const [step, setStep] = useState('login');
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [confirmCode, setConfirmCode] = useState(''); // setup 단계 confirm용
  const [otpAuthUrl, setOtpAuthUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleLoginSuccess = (data) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
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
  };

  // 1단계: 아이디/비밀번호
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const response = await api.post('/api/v1/auth/login', { userId: username, password });
      const { success, data, message } = response.data;

      if (success) {
        if (data.mfaRequired) {
          setMfaToken(data.mfaToken);
          if (data.mfaRegistered) {
            // 이미 등록됨 → 바로 코드 입력
            setStep('mfa-code');
          } else {
            // 처음 등록 → setup 호출해서 QR 보여주기
            await handleMfaSetup(data.mfaToken);
          }
        } else {
          handleLoginSuccess(data);
        }
      } else {
        alert(message || '로그인 실패');
      }
    } catch (error) {
      if (error.response?.status === 500) {
        alert('서버 내부 오류(500)가 발생했습니다.');
      } else {
        alert(error.response?.data?.message || '로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // setup 호출
  const handleMfaSetup = async (token) => {
    try {
      const response = await api.post('/api/v1/auth/mfa/setup', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { success, data } = response.data;
      if (success) {
        setOtpAuthUrl(data.otpAuthUrl);
        setBackupCodes(data.backupCodes);
        setStep('mfa-setup');
      } else {
        alert('MFA 설정 중 오류가 발생했습니다.');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'MFA 설정 중 오류가 발생했습니다.');
    }
  };

  // setup 단계: QR 스캔 후 confirm (mfa_enabled=true로 확정)
  const handleMfaConfirm = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await api.post('/api/v1/auth/mfa/confirm',
        { code: confirmCode },
        { headers: { Authorization: `Bearer ${mfaToken}` } }
      );
      // confirm 성공 → 코드 입력 단계로 (loginMfa 호출용)
      setConfirmCode('');
      setStep('mfa-code');
    } catch (error) {
      alert(error.response?.data?.message || '코드가 올바르지 않습니다. 앱의 코드를 다시 확인하세요.');
    } finally {
      setLoading(false);
    }
  };

  // 최종 로그인: loginMfa 호출
  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const response = await api.post('/api/v1/auth/login/mfa', {
        mfaToken,
        code: mfaCode,
      });
      const { success, data, message } = response.data;
      if (success) {
        handleLoginSuccess(data);
      } else {
        alert(message || '인증 코드가 올바르지 않습니다.');
      }
    } catch (error) {
      alert(error.response?.data?.message || '인증 코드 확인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        :root { font-size: 16px; }
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
          bottom: -5.625rem; left: -5.625rem;
          width: 18.75rem; height: 18.75rem;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
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
          width: 3.9375rem; height: 3.9375rem;
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
        .form-panel {
          flex: 1;
          background: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 4.875rem 4.5rem;
          overflow-y: auto;
        }
        .form-title {
          font-size: 2.0625rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 2rem;
        }
        .field-group { margin-bottom: 1.6875rem; }
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
        .field-input:focus { border-color: #3B82F6; }
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
        .mfa-desc {
          font-size: 1rem;
          color: #6B7280;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }
        .mfa-back {
          background: none;
          border: none;
          color: #3B82F6;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 1rem;
          display: block;
          width: 100%;
          text-align: center;
        }
        .qr-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 1rem 0 1.5rem;
        }
        .qr-img {
          width: 180px;
          height: 180px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
        }
        .backup-codes {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }
        .backup-codes-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }
        .backup-codes-warning {
          font-size: 0.8rem;
          color: #EF4444;
          margin-bottom: 0.75rem;
        }
        .backup-codes-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.25rem;
        }
        .backup-code-item {
          font-family: monospace;
          font-size: 0.9rem;
          color: #1F2937;
          padding: 0.2rem 0.5rem;
          background: #fff;
          border-radius: 4px;
          border: 1px solid #E5E7EB;
          text-align: center;
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

            {/* 1단계: 로그인 */}
            {step === 'login' && (
              <>
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
              </>
            )}

            {/* 2-A단계: 최초 MFA 등록 - QR + 백업코드 + confirm 코드 입력 */}
            {step === 'mfa-setup' && (
              <>
                <div className="form-title">보안 인증 설정</div>
                <p className="mfa-desc">
                  Google Authenticator 앱으로 아래 QR을 스캔하세요.<br/>
                  스캔 후 앱에 뜨는 6자리 코드를 입력해 등록을 완료하세요.
                </p>
                <div className="qr-wrap">
                  <img
                    className="qr-img"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpAuthUrl)}`}
                    alt="QR 코드"
                  />
                </div>

                <div className="backup-codes">
                  <div className="backup-codes-title">백업 코드 (안전한 곳에 보관하세요)</div>
                  <div className="backup-codes-warning">⚠ 이 화면을 닫으면 다시 볼 수 없습니다.</div>
                  <div className="backup-codes-grid">
                    {backupCodes.map((code, i) => (
                      <div key={i} className="backup-code-item">{code}</div>
                    ))}
                  </div>
                  <button
                    type="button"
                    style={{
                      marginTop: '0.75rem', width: '100%', padding: '0.5rem',
                      background: '#F3F4F6', border: '1px solid #E5E7EB',
                      borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer', color: '#374151',
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText(backupCodes.join('\n'))
                        .then(() => alert('백업코드가 클립보드에 복사되었습니다.'))
                        .catch(() => alert('복사 실패. 직접 메모해주세요.'));
                    }}
                  >
                    📋 전체 복사
                  </button>
                </div>

                {/* QR 스캔 확인용 코드 입력 → confirm 호출 */}
                <form onSubmit={handleMfaConfirm}>
                  <div className="field-group">
                    <label className="field-label">앱에 표시된 6자리 코드 입력 (등록 확인)</label>
                    <input
                      className="field-input"
                      type="text"
                      placeholder="앱의 6자리 코드"
                      required
                      maxLength={6}
                      value={confirmCode}
                      onChange={(e) => setConfirmCode(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <button type="submit" className="btn-login" disabled={loading}>
                    {loading ? '등록 중...' : '등록 완료 및 로그인 →'}
                  </button>
                </form>
                <button className="mfa-back" onClick={() => setStep('login')}>
                  ← 로그인으로 돌아가기
                </button>
              </>
            )}

            {/* 2-B단계: 이미 등록된 경우 - 코드 입력 */}
            {step === 'mfa-code' && (
              <>
                <div className="form-title">2단계 인증</div>
                <p className="mfa-desc">
                  Google Authenticator 앱의 <strong>6자리 코드</strong>를 입력하세요.<br/>
                  앱에 접근할 수 없다면 등록 시 발급받은 <strong>8자리 백업코드</strong>를 입력하세요.<br/>
                  백업코드는 일회용이며 사용 후 소멸됩니다.
                </p>
                <form onSubmit={handleMfaSubmit}>
                  <div className="field-group">
                    <label className="field-label">인증 코드</label>
                    <input
                      className="field-input"
                      type="text"
                      placeholder="6자리 인증코드 또는 8자리 백업코드"
                      required
                      maxLength={8}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <button type="submit" className="btn-login" disabled={loading}>
                    {loading ? '확인 중...' : '인증 확인'}
                  </button>
                </form>
                <button className="mfa-back" onClick={() => setStep('login')}>
                  ← 로그인으로 돌아가기
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
