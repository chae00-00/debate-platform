import { useState, useEffect, useRef } from 'react';
import { Check, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const PER_PAGE = 4;

const SubTopicView = ({ activeData, selectedSubTopics, onToggle, visible }) => {
  const [page, setPage] = useState(0);
  const [sliding, setSliding] = useState(null); // 'left' | 'right' | null
  const [openTip, setOpenTip] = useState(null);
  const tipRef = useRef(null);

  // 토픽 바뀌면 페이지 초기화
  useEffect(() => { setPage(0); setOpenTip(null); }, [activeData]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tipRef.current && !tipRef.current.contains(e.target)) {
        setOpenTip(null);
      }
    };
    if (openTip !== null) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openTip]);

  if (!activeData) return null;

  const subTopics = activeData.subTopics ?? [];
  const totalPages = Math.ceil(subTopics.length / PER_PAGE);
  const pageItems = subTopics.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const goTo = (dir) => {
    const next = page + dir;
    if (next < 0 || next >= totalPages) return;
    setSliding(dir === 1 ? 'left' : 'right');
    setTimeout(() => {
      setPage(next);
      setSliding(null);
    }, 260);
  };

  const slideClass =
    sliding === 'left'  ? 'opacity-0 -translate-x-8' :
    sliding === 'right' ? 'opacity-0 translate-x-8'  : 'opacity-100 translate-x-0';

  return (
    <div className={`absolute w-full px-4 flex flex-col items-center justify-center h-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]
      ${!visible ? 'opacity-0 -translate-x-32 pointer-events-none' : 'opacity-100 translate-x-0 delay-100'}
    `}>
      {/* 고정 높이 wrapper — justify-center 기준점을 고정해 헤더가 밀리지 않음 */}
      <div className="flex flex-col items-center w-full" style={{ height: '560px' }}>
        {/* 헤더 */}
        <div className="shrink-0 flex flex-col items-center mb-8">
          <activeData.icon size={56} strokeWidth={1.5} className="mb-4" style={{ color: activeData.accent }} />
          <h1 className="text-4xl md:text-5xl font-extrabold text-stone-800 mb-3 tracking-tight text-center">
            {activeData.title}
          </h1>
          <p className="text-lg text-stone-400 text-center">
            원하는 세부 토론 논제를 선택해주세요.
          </p>
        </div>

        {/* 카로셀 */}
        <div className="shrink-0 w-full flex flex-col items-center">
        <div className="flex items-center gap-4 w-full max-w-2xl">
          {/* 이전 화살표 */}
          <button
            onClick={() => goTo(-1)}
            disabled={page === 0}
            className={`shrink-0 p-3 rounded-full border border-stone-200 bg-white shadow-sm transition-all duration-200
              ${page === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-stone-50 hover:shadow-md hover:scale-110'}`}
          >
            <ChevronLeft size={22} className="text-stone-600" />
          </button>

          {/* 슬라이드 영역 — min-h 고정으로 헤더 위치 불변 */}
          <div ref={tipRef} className="flex-1 flex flex-col gap-3 overflow-visible">
            <div className={`flex flex-col gap-3 min-h-[340px] transition-all duration-[260ms] ease-in-out ${slideClass}`}>
              {pageItems.map((sub) => {
                const isSelected = selectedSubTopics.some((selected) => (
                  (selected?.id && sub.id && selected.id === sub.id)
                  || (selected?.title ?? selected) === sub.title
                ));
                const isOpen = openTip === sub.title;

                return (
                  <div key={sub.title} className="relative">
                    <div
                      onClick={() => onToggle(sub)}
                      className={`flex items-center gap-3 px-6 py-4 rounded-full border-2 cursor-pointer transition-all duration-300
                        ${isSelected
                          ? 'bg-stone-900 border-stone-900 text-white shadow-xl scale-[1.02]'
                          : 'bg-white border-stone-200 hover:border-stone-300 hover:shadow-md'
                        }`}
                    >
                      <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                        ${isSelected ? 'bg-emerald-400 border-emerald-400' : 'border-stone-300'}`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} className="text-white" />}
                      </div>
                      <p className={`font-semibold text-base leading-snug flex-1 ${isSelected ? 'text-white' : 'text-stone-800'}`}>
                        {sub.title}
                      </p>
                      {sub.description && (
                        <span
                          onClick={(e) => { e.stopPropagation(); setOpenTip(isOpen ? null : sub.title); }}
                          className={`shrink-0 transition-colors ${
                            isOpen ? 'text-stone-400' : isSelected ? 'text-stone-400 hover:text-stone-200' : 'text-stone-300 hover:text-stone-500'
                          }`}
                        >
                          <HelpCircle size={16} />
                        </span>
                      )}
                    </div>

                    {isOpen && sub.description && (
                      <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-xl border border-stone-100 px-5 py-4 text-sm text-stone-500 leading-relaxed">
                        {sub.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 다음 화살표 */}
          <button
            onClick={() => goTo(1)}
            disabled={page === totalPages - 1}
            className={`shrink-0 p-3 rounded-full border border-stone-200 bg-white shadow-sm transition-all duration-200
              ${page === totalPages - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-stone-50 hover:shadow-md hover:scale-110'}`}
          >
            <ChevronRight size={22} className="text-stone-600" />
          </button>
        </div>

        {/* 페이지 인디케이터 */}
        {totalPages > 1 && (
          <div className="flex gap-2 mt-6">
            {Array.from({ length: totalPages }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === page ? 'w-6 bg-stone-700' : 'w-1.5 bg-stone-300'
                }`}
              />
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default SubTopicView;
