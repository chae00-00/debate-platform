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
];

const BrandLogos = () => (
  <div className="mb-2 flex items-center gap-4">
    <img src="/kakaoLogo.png" alt="Kakao" className="h-4 object-contain" />
    <img src="/NaverLogo.png" alt="Naver" className="h-4 object-contain" />
  </div>
);

const Login = ({ onLogin, onSkip }) => {
  const handleSocialLogin = (providerId) => {
    const baseUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:8080'
      : 'http://debate-mate.ai.kr';
    window.location.href = `${baseUrl}/oauth2/authorization/${providerId}`;
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
