import React from 'react';

const TopHeader = ({ onGuide, onLogin, nickname }) => {
  return (
    <div className="hidden md:flex absolute top-[24px] left-0 right-0 z-20 items-center justify-center px-12">
      <nav className="flex items-center gap-[74px] text-[20px] font-bold leading-[23px] text-black">
        <button className="transition-opacity hover:opacity-70" onClick={onGuide}>서비스 소개</button>
        <button className="transition-opacity hover:opacity-70">팀 소개</button>
        <button className="transition-opacity hover:opacity-70">업데이트 소식</button>
      </nav>
      <button
        onClick={nickname ? undefined : onLogin}
        className={`absolute right-12 rounded-full bg-stone-900 px-5 py-2 text-[15px] font-bold text-white transition-all ${nickname ? 'cursor-default' : 'hover:bg-black hover:scale-105'}`}
      >
        {nickname ? `${nickname}님 반갑습니다` : '로그인하기'}
      </button>
    </div>
  );
};

export default TopHeader;
