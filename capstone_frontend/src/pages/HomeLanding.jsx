import React, { useState } from 'react';
import { ArrowUpRight, BarChart3, Trophy } from 'lucide-react';
import TopHeader from '../components/TopHeader';
import FixedStage from '../components/FixedStage';
import { TOPICS } from '../data/topics';

const RECENT_DEBATES = TOPICS.flatMap((topic) =>
  topic.subTopics.slice(0, 2).map((subTopic) => ({
    topicId: topic.id,
    category: topic.title,
    accent: topic.accent,
    ...subTopic,
  })),
).slice(0, 3);

const REPORT_METRICS = [
  { label: '수용 가능성', desc: '맥락에서 수용될 수 있는 주장인지', score: 4, color: '#4A8768' },
  { label: '관련성', desc: '근거가 주제와 직접 연결되는지', score: 3, color: '#31465D' },
  { label: '충분성', desc: '근거가 주장을 충분히 뒷받침하는지', score: 4, color: '#6F4141' },
  { label: '명확성', desc: '주장과 근거가 명확하게 전달되는지', score: 3, color: '#A8793D' },
];

const FINAL_METRICS = [
  '논증력',
  '근거력',
  '언어력',
];

const ACTION_BUBBLES = [
  {
    id: 'constructive',
    label: '구성적 논쟁',
    shellClassName: 'left-[636px] top-[144px] h-[330px] w-[330px]',
    buttonClassName: 'h-[330px] w-[330px] bg-[#4A8768] text-[30px]',
    onClickKey: 'constructive',
    duration: '6.1s',
    delay: '-0.7s',
    floatY: '-12px',
    floatX: '7px',
  },
  {
    id: 'general',
    label: '일반 토론',
    shellClassName: 'left-[996px] top-[164px] h-[290px] w-[290px]',
    buttonClassName: 'h-[290px] w-[290px] bg-[#31465D] text-[28px]',
    onClickKey: 'general',
    duration: '7.2s',
    delay: '-2.4s',
    floatY: '-14px',
    floatX: '8px',
  },
  {
    id: 'profile',
    label: '내 정보 수정',
    shellClassName: 'left-[1112px] top-[480px] h-[176px] w-[176px]',
    buttonClassName: 'h-[176px] w-[176px] bg-[#6F4141] text-[18px]',
    onClickKey: 'profile',
    duration: '6.8s',
    delay: '-1.8s',
    floatY: '-10px',
    floatX: '-6px',
  },
];

const HomeLanding = ({ onCreateDebate, onLogin, onLogout, onGuide, nickname }) => {
  const [hoveredBubble, setHoveredBubble] = useState(null);

  const handleBubbleClick = (key) => {
    if (key === 'constructive') onCreateDebate('constructive');
    if (key === 'general') onCreateDebate('general');
  };

  return (
    <div className="absolute inset-0 z-10 overflow-auto px-4">
      <div className="mx-auto flex min-h-screen w-full items-start justify-center pt-6 md:items-center md:pt-0">
        <FixedStage baseWidth={1440} baseHeight={860}>
          <div className="relative h-[860px] w-[1440px]">
            <TopHeader onGuide={onGuide} onLogin={onLogin} onLogout={onLogout} nickname={nickname} />

            <div className="relative mt-[58px] h-[760px] w-full">
              <section className="absolute left-[96px] top-[112px] h-[322px] w-[520px] rounded-[28px] bg-white/88 px-8 py-7 text-[#25231F] shadow-[0_16px_42px_rgba(38,32,25,0.12)] ring-1 ring-black/5 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-bold leading-none text-[#4A8768]">최근 선택 논제</p>
                    <h2 className="mt-2 text-[28px] font-extrabold leading-[32px] tracking-[-0.02em]">
                      서비스 주제 미리보기
                    </h2>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4A8768]/12 text-[#4A8768]">
                    <BarChart3 size={25} strokeWidth={2.5} />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {RECENT_DEBATES.map((debate, index) => (
                    <div key={`${debate.topicId}-${debate.title}`} className="grid grid-cols-[28px_1fr_64px] items-center gap-3">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-extrabold text-white"
                        style={{ backgroundColor: debate.accent }}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-[15px] font-extrabold leading-[18px]">{debate.title}</p>
                        <p className="mt-1 line-clamp-1 text-[12px] font-bold text-[#7A7169]">
                          찬성: {debate.pro}
                          <span className="mx-1.5 text-[#B0A8A0]">/</span>
                          반대: {debate.con}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#F2EEE8] px-2.5 py-1.5 text-center text-[11px] font-extrabold text-[#686159]">
                        {debate.category}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between rounded-[16px] bg-[#F2EEE8] px-5 py-4">
                  <span className="text-[13px] font-extrabold text-[#7A7169]">최종 평가 항목</span>
                  <div className="flex gap-2">
                    {FINAL_METRICS.map((metric) => (
                      <span key={metric} className="rounded-full bg-white px-3 py-1.5 text-[12px] font-extrabold text-[#25231F] shadow-sm">
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <section className="absolute left-[96px] top-[456px] h-[286px] w-[520px] rounded-[28px] bg-white/88 px-8 py-7 text-[#25231F] shadow-[0_16px_42px_rgba(38,32,25,0.12)] ring-1 ring-black/5 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-bold leading-none text-[#6F4141]">토론 전후 리포트</p>
                    <h2 className="mt-2 text-[27px] font-extrabold leading-[31px] tracking-[-0.02em]">
                      평가 지표
                    </h2>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6F4141]/12 text-[#6F4141]">
                    <Trophy size={25} strokeWidth={2.5} />
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  {REPORT_METRICS.map((metric) => (
                    <div key={metric.label} className="grid grid-cols-[92px_1fr_44px] items-center gap-3">
                      <p className="text-[15px] font-extrabold leading-[18px]">{metric.label}</p>
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-bold text-[#7A7169]">{metric.desc}</p>
                        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#E7E0D7]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${metric.score * 20}%`,
                              backgroundColor: metric.color,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-right text-[15px] font-extrabold text-[#25231F]">
                        {metric.score}/5
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-2 text-[13px] font-bold leading-[18px] text-[#7A7169]">
                  <ArrowUpRight size={18} strokeWidth={2.5} />
                  <span>토론 전후 변화는 위 지표를 기준으로 리포트에 정리됩니다.</span>
                </div>
              </section>

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
