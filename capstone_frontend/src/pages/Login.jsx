import React from 'react';
import BackgroundBubbles from '../components/BackgroundBubbles';

const SOCIAL_PROVIDERS = [
  {
    id: 'kakao',
    label: 'Login with Kakao',
    bg: '#FEE500',
    text: '#191919',
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M13 2.5C7.2 2.5 2.5 6.3 2.5 11c0 2.9 1.85 5.46 4.66 6.95L6.1 22.5l5.06-3.34c.6.09 1.21.14 1.84.14 5.8 0 10.5-3.8 10.5-8.5S18.8 2.5 13 2.5z"
          fill="#191919"
        />
      </svg>
    ),
  },
  {
    id: 'naver',
    label: 'Login with Naver',
    bg: '#03C75A',
    text: '#ffffff',
    icon: <img src="/naverloginlogo.png" alt="Naver" style={{ width: 40, height: 40, objectFit: 'contain' }} />,
  },
  {
    id: 'google',
    label: 'Login with Google',
    bg: '#ffffff',
    text: '#3c3c3c',
    border: '#dadce0',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M23.4 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h6.48a5.54 5.54 0 01-2.4 3.63v3.01h3.88C22.14 19.08 23.4 15.9 23.4 12.25z" fill="#4285F4" />
        <path d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3.01c-1.07.72-2.45 1.14-4.07 1.14-3.13 0-5.78-2.11-6.73-4.96H1.28v3.11A12 12 0 0012 24z" fill="#34A853" />
        <path d="M5.27 14.26A7.2 7.2 0 014.82 12c0-.78.13-1.53.45-2.23V6.66H1.28A12 12 0 000 12c0 1.93.46 3.75 1.28 5.34l3.99-3.08z" fill="#FBBC05" />
        <path d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0A12 12 0 001.28 6.66l3.99 3.11C6.22 6.88 8.87 4.77 12 4.77z" fill="#EA4335" />
      </svg>
    ),
  },
];

const BrandLogos = () => (
  <div className="mb-2 flex items-center gap-4">
    <img src="/kakaoLogo.png" alt="Kakao" className="h-4 object-contain" />
    <img src="/NaverLogo.png" alt="Naver" className="h-4 object-contain" />
    <img src="/googleLogo.png" alt="Google" className="h-16 w-16 object-contain -mx-2" />
  </div>
);

const Login = ({ onLogin, onSkip }) => {
  const handleSocialLogin = (providerId) => {
    const oauthUrls = {
      kakao: 'http://localhost:8080/oauth2/authorization/kakao',
      naver: 'http://localhost:8080/oauth2/authorization/naver',
      google: 'http://localhost:8080/oauth2/authorization/google',
    };
    window.location.href = oauthUrls[providerId];
  };

  return (
    <div
      className="relative isolate min-h-screen w-full overflow-hidden bg-[#F5F5F4]"
      style={{ fontFamily: 'var(--ui-font)' }}
    >
      {/* 배경 */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <BackgroundBubbles activeTopic={null} />
      </div>

      {/* 2컬럼 레이아웃 */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-8">
        <div className="flex w-full max-w-[1100px] items-center gap-20">

          {/* 왼쪽: 헤드카피 */}
          <div className="flex-1">
            <BrandLogos />
            <h2 className="text-[52px] font-extrabold leading-[1.2] tracking-[-0.04em] text-[#1a1a1a]">
              지금 로그인 하고,<br />
              당신만의 아레나를<br />
              펼쳐보세요
            </h2>
            <button
              onClick={onSkip}
              className="mt-10 text-[14px] text-stone-400 underline-offset-2 transition-colors hover:text-stone-600 hover:underline"
            >
              로그인 없이 둘러보기 →
            </button>
          </div>

          {/* 오른쪽: 로그인 버튼 */}
          <div className="flex w-full max-w-[480px] flex-col gap-4">
            {SOCIAL_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleSocialLogin(provider.id)}
                className="flex w-full items-center gap-4 rounded-full px-7 py-[18px] text-[17px] font-semibold shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                style={{
                  background: provider.bg,
                  color: provider.text,
                  border: provider.border ? `1.5px solid ${provider.border}` : 'none',
                }}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                  {provider.icon}
                </span>
                <span className="flex-1 text-center">{provider.label}</span>
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
