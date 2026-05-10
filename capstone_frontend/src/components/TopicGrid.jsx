import React, { useState } from 'react';

const DESKTOP_LAYOUT = {
  tech:    { size: 280, left: 198, top: 60,  icon: 52, duration: '6.2s', delay: '-0.8s', floatY: '-10px', floatX: '7px' },
  society: { size: 284, left: 574, top: 60,  icon: 56, duration: '6.8s', delay: '-2.2s', floatY: '-14px', floatX: '-6px' },
  economy: { size: 286, left: 328, top: 328, icon: 54, duration: '7.1s', delay: '-1.4s', floatY: '-12px', floatX: '8px' },
  science: { size: 282, left: 720, top: 328, icon: 56, duration: '5.9s', delay: '-2.8s', floatY: '-9px', floatX: '-5px' },
};

const TopicGrid = ({ topics, onTopicClick }) => {
  const [hoveredTopic, setHoveredTopic] = useState(null);

  return (
    <div className="relative mx-auto h-[660px] w-full max-w-[1200px]">
      {topics.map((topic) => {
          const Icon = topic.icon;
          const layout = DESKTOP_LAYOUT[topic.id];
          const isHovered = hoveredTopic === topic.id;
          const isDimmed = hoveredTopic && hoveredTopic !== topic.id;
          return (
            <div
              key={topic.id}
              className="topic-card-float absolute"
              style={{
                width: layout.size,
                height: layout.size,
                left: layout.left,
                top: layout.top,
                '--float-duration': layout.duration,
                '--float-delay': layout.delay,
                '--float-y': layout.floatY,
                '--float-x': layout.floatX,
              }}
            >
              <div
                onClick={() => onTopicClick(topic.id)}
                onMouseEnter={() => setHoveredTopic(topic.id)}
                onMouseLeave={() => setHoveredTopic(null)}
                className={`relative flex h-full w-full cursor-pointer overflow-hidden flex-col items-center justify-center rounded-full text-white shadow-[0_5px_16px_rgba(0,0,0,0.22)] transition-all duration-300 ${topic.color} ${
                  isHovered
                    ? 'scale-[1.22] shadow-[0_18px_42px_rgba(0,0,0,0.32)]'
                    : isDimmed
                    ? 'scale-[0.82] opacity-72 shadow-[0_2px_8px_rgba(0,0,0,0.1)]'
                    : 'scale-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.24)]'
                }`}
              >
                <img
                  src={topic.cardImage}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ opacity: 0.2, mixBlendMode: 'screen' }}
                />
                <div className="absolute inset-0 bg-black/8" />
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <Icon size={layout.icon} className="mb-4 opacity-90" strokeWidth={1.5} />
                  <h2 className="mb-1 text-[22px] font-bold tracking-tight">{topic.title}</h2>
                  <p className="text-center text-[14px] font-medium text-white/80">{topic.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default TopicGrid;
