import React from 'react';

const TopHeader = () => {
  return (
    <nav className="hidden md:flex absolute top-[34px] left-1/2 z-20 -translate-x-1/2 items-center gap-[74px] text-[20px] font-bold leading-[23px] text-black">
      <button className="transition-opacity hover:opacity-70">서비스 소개</button>
      <button className="transition-opacity hover:opacity-70">팀 소개</button>
      <button className="transition-opacity hover:opacity-70">업데이트 소식</button>
    </nav>
  );
};

export default TopHeader;
