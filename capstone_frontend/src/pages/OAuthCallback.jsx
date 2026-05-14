import { useEffect, useState } from 'react';

const OAuthCallback = ({ onSuccess }) => {
  const [status, setStatus] = useState('처리 중...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('accessToken', token);
      setStatus('로그인 성공!');
      setTimeout(() => {
        onSuccess?.();
        window.location.href = '/';
      }, 1000);
    } else {
      setStatus('로그인 실패: 토큰이 없습니다');
    }
  }, [onSuccess]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F4]">
      <div className="text-center">
        <p className="text-2xl font-bold text-stone-800">{status}</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
