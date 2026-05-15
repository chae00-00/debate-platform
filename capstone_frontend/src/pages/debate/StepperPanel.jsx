import { ChevronRight, Users, Mic } from 'lucide-react';
import { STAGES } from './mockData';

export default function StepperPanel({
  currentStage,
  viewStage,
  setViewStage,
  onScrollToStage,
  getTurnDesc,
  progress,
  isMyTurn,
  myTurnOverride,
  setMyTurnOverride,
}) {
  return (
    <section className="rounded-[32px] border border-white/80 bg-white/60 px-5 py-4 backdrop-blur-md shadow-[0_12px_32px_rgba(0,0,0,0.04)] flex flex-col gap-2">
      {/* 단계 스테퍼 */}
      <div className="flex items-center gap-0.5 overflow-x-auto hide-scrollbar">
        {STAGES.map((stage, i) => {
          const isDone    = currentStage > stage.id;   // 완료된 단계
          const isActive  = viewStage === stage.id;    // 현재 보고 있는 단계
          const isFuture  = stage.id > currentStage;   // 아직 미진행 단계
          return (
            <div key={stage.id} className="flex items-center shrink-0">
              <button
                onClick={() => { if (isFuture) return; setViewStage(stage.id); onScrollToStage?.(stage.id); }}
                disabled={isFuture}
                className={`flex h-7 items-center justify-center px-2.5 rounded-full border text-[10px] font-bold transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? 'border-stone-800 bg-stone-800 text-white shadow-[0_4px_10px_rgba(0,0,0,0.15)]'
                    : isDone
                      ? 'border-stone-200 bg-white/80 text-stone-500 hover:bg-white cursor-pointer'
                      : 'border-transparent bg-transparent text-stone-300 cursor-not-allowed'
                }`}
              >
                {stage.label}
              </button>
              {i < STAGES.length - 1 && (
                <div className="mx-1 flex items-center justify-center shrink-0">
                  <ChevronRight size={13} className="text-stone-500/70" strokeWidth={2.4} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 현재 턴 + 진행도 + 내 차례 뱃지 */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-stone-600 flex-1 min-w-0">
          <Users size={12} className="shrink-0" />
          <span className="truncate">{getTurnDesc()}</span>
        </div>
        {progress && (
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-14 h-1.5 bg-stone-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-stone-700 rounded-full transition-all duration-500"
                style={{ width: `${progress.pct * 100}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-stone-400">{progress.label}</span>
          </div>
        )}
        {isMyTurn ? (
          <span className="text-[11px] font-extrabold text-white bg-stone-800 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md shrink-0">
            <Mic size={11} /> 내 차례
          </span>
        ) : (
          <span className="text-[11px] font-bold text-stone-500 bg-stone-100/80 border border-stone-200/50 px-2.5 py-0.5 rounded-full shrink-0">
            대기 중
          </span>
        )}
        <button
          onClick={() => setMyTurnOverride((v) => !v)}
          className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/80 shadow-sm text-stone-500 hover:bg-white transition-colors border border-stone-100 shrink-0"
        >
          {myTurnOverride ? '내 턴' : '상대 턴'}
        </button>
      </div>
    </section>
  );
}
