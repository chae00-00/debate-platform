import React from 'react';

const TopHeader = () => {
  const token = localStorage.getItem('accessToken');
  const isLoggedIn = !!token;

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    window.location.reload();
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

  return (
    <nav className="hidden md:flex absolute top-[34px] left-1/2 z-20 -translate-x-1/2 items-center gap-[74px] text-[20px] font-bold leading-[23px] text-black">
      <button className="transition-opacity hover:opacity-70">서비스 소개</button>
      <button className="transition-opacity hover:opacity-70">팀 소개</button>
      <button className="transition-opacity hover:opacity-70">업데이트 소식</button>
      {isLoggedIn ? (
        <button onClick={handleLogout} className="text-green-600 transition-opacity hover:opacity-70">
          로그인됨 (로그아웃)
        </button>
      ) : (
        <button onClick={handleLogin} className="text-blue-600 transition-opacity hover:opacity-70">
          로그인
        </button>
      )}
    </nav>
  );
};

export default TopHeader;
