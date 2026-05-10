import React, { useState } from 'react';
import TopHeader from '../components/TopHeader';
import FixedStage from '../components/FixedStage';

const INFO_CARDS = [
  {
    id: 'summary-1',
    text: '최근 5개 토론\n이해도 그래프/\n나의 입장변화 /승률 등\n수치화 가능 데이터',
    className: 'left-[96px] top-[166px] h-[246px] w-[494px]',
  },
  {
    id: 'summary-2',
    text: '최근 5개 토론\n이해도 그래프/\n나의 입장변화 /승률 등',
    className: 'left-[96px] top-[446px] h-[246px] w-[494px]',
  },
];

const ACTION_BUBBLES = [
  {
    id: 'create',
    label: '새 토론 생성하기',
    shellClassName: 'left-[736px] top-[144px] h-[330px] w-[330px]',
    buttonClassName: 'h-[330px] w-[330px] bg-[#4A8768] text-[30px]',
    onClickKey: 'create',
    duration: '6.1s',
    delay: '-0.7s',
    floatY: '-12px',
    floatX: '7px',
  },
  {
    id: 'profile',
    label: '내 정보 수정',
    shellClassName: 'left-[1112px] top-[224px] h-[176px] w-[176px]',
    buttonClassName: 'h-[176px] w-[176px] bg-[#6F4141] text-[18px]',
    onClickKey: 'profile',
    duration: '6.8s',
    delay: '-1.8s',
    floatY: '-10px',
    floatX: '-6px',
  },
  {
    id: 'history',
    label: '토론 내역 보기',
    shellClassName: 'left-[978px] top-[430px] h-[292px] w-[292px]',
    buttonClassName: 'h-[292px] w-[292px] bg-[#31465D] text-[28px]',
    onClickKey: 'history',
    duration: '7.2s',
    delay: '-2.4s',
    floatY: '-14px',
    floatX: '8px',
  },
];

const HomeLanding = ({ onCreateDebate }) => {
  const [hoveredBubble, setHoveredBubble] = useState(null);

  const handleBubbleClick = (key) => {
    if (key === 'create') {
      onCreateDebate();
    }
  };

  return (
    <div className="absolute inset-0 z-10 overflow-auto px-4">
      <div className="mx-auto flex min-h-screen w-full items-start justify-center pt-6 md:items-center md:pt-0">
        <FixedStage baseWidth={1440} baseHeight={860}>
          <div className="relative h-[860px] w-[1440px]">
            <TopHeader />

            <div className="relative mt-[58px] h-[760px] w-full">
              {INFO_CARDS.map((card) => (
                <div
                  key={card.id}
                  className={`absolute rounded-[36px] bg-[#D9D9D9]/92 px-10 py-8 text-center text-[28px] font-medium leading-[1.35] tracking-[-0.03em] text-black shadow-[0_10px_24px_rgba(0,0,0,0.06)] ${card.className}`}
                >
                  {card.text.split('\n').map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              ))}

              {ACTION_BUBBLES.map((bubble) => (
                <div
                  key={bubble.id}
                  className={`topic-card-float absolute ${bubble.shellClassName}`}
                  style={{
                    '--float-duration': bubble.duration,
                    '--float-delay': bubble.delay,
                    '--float-y': bubble.floatY,
                    '--float-x': bubble.floatX,
                  }}
                >
                  <button
                    onClick={() => handleBubbleClick(bubble.onClickKey)}
                    onMouseEnter={() => setHoveredBubble(bubble.id)}
                    onMouseLeave={() => setHoveredBubble(null)}
                    className={`flex h-full w-full items-center justify-center rounded-full font-extrabold tracking-[-0.04em] text-white shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition-all duration-300 ${bubble.buttonClassName} ${
                      hoveredBubble === bubble.id
                        ? 'scale-[1.18] shadow-[0_18px_40px_rgba(0,0,0,0.28)]'
                        : hoveredBubble && hoveredBubble !== bubble.id
                        ? 'scale-[0.86] opacity-70 shadow-[0_3px_10px_rgba(0,0,0,0.14)]'
                        : 'scale-100 hover:shadow-[0_16px_32px_rgba(0,0,0,0.24)]'
                    }`}
                  >
                    <span>{bubble.label}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </FixedStage>
      </div>
    </div>
  );
};

export default HomeLanding;
