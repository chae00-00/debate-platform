export default function Stage3OpponentModal({ opponents = [], onSelect }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm">
      <div className="w-[380px] rounded-[32px] border border-white/80 bg-white/95 p-7 shadow-2xl backdrop-blur-md">

        <h2 className="text-[20px] font-extrabold text-stone-900 leading-snug">
          이번 라운드 상대를<br />선택하세요
        </h2>
        <p className="mt-2 text-[13px] font-medium text-stone-500 leading-relaxed">
          해당 상대와 자유 논박을 진행합니다.
        </p>

        {/* 상대 선택 카드 */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {opponents.map((opp) => (
            <button
              key={opp.id}
              onClick={() => onSelect(opp)}
              className="group flex flex-col gap-2.5 rounded-[20px] border border-stone-200 bg-white p-4 text-left shadow-sm transition-all hover:border-stone-400 hover:shadow-md active:scale-95"
            >
              <span className="text-[15px] font-extrabold text-stone-800">{opp.label}</span>
              <span className="mt-1 self-end text-[11px] font-bold text-stone-400 group-hover:text-stone-700 transition-colors">
                선택 →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
