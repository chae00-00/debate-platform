import { useEffect, useRef } from 'react';
import SpeechBubble from './SpeechBubble';
import InputComposer from './InputComposer';

// 타이핑 인디케이터 — 다음 발화자가 준비 중임을 보여준다
function TypingIndicator({ speaker, currentStage }) {
  const normalized = speaker ?? 'AI';
  const isRoleReversal = currentStage === 4;
  // agent ID(mock) 또는 "반대 1" 같은 라벨(SSE) 모두 처리
  const compressLabel = (s) => {
    const compressed = s.replace('찬성', '찬').replace('반대', '반').replace(/\s+/g, '');
    const m = compressed.match(/^(찬|반)(\d+)/);
    return m ? `${m[1]}${m[2]}` : compressed.slice(0, 3);
  };
  const shortLabel = normalized === '사용자' || normalized === '나'
    ? '나'
    : normalized === 'agent_3' ? '찬1'
    : normalized === 'agent_2' ? '반2'
    : normalized === 'agent_1' ? '반1'
    : compressLabel(normalized);
  const isPro = normalized.includes('찬') || normalized === 'agent_3';
  const displayIsPro = isRoleReversal ? !isPro : isPro;
  const tone = displayIsPro
    ? 'bg-blue-100 text-blue-700 border border-blue-200'
    : 'bg-rose-100 text-rose-700 border border-rose-200';
  // agent ID → 표시명 변환 (mock 모드 대응); SSE 모드는 이미 "반대 1" 같은 라벨이 온다
  const displayName = normalized === '사용자' || normalized === '나' ? '사용자'
    : normalized === 'agent_3' ? '찬성 1'
    : normalized === 'agent_2' ? '반대 2'
    : normalized === 'agent_1' ? '반대 1'
    : normalized;
  const label = `${displayName} 입력 중입니다.`;

  return (
    <div className="flex items-end gap-2">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${tone}`}>
        {shortLabel}
      </div>
      <div className="flex items-center gap-2 rounded-[18px] rounded-bl-sm border border-stone-100 bg-white/90 px-4 py-3 shadow-sm">
        <span className="text-[12px] font-semibold text-stone-400">{label}</span>
        {isRoleReversal && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">
            역할반전 중
          </span>
        )}
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-stone-300 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-stone-300 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-stone-300 animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
      </div>
    </div>
  );
}

export default function ChatPanel({
  logs,
  currentStage,
  isFinalize,
  isMyTurn,
  isProSide,
  stage3CanAttack = true,
  isTyping,
  debateComplete = false,
  onSubmitOpening,
  openingLoading,
  openingError,
  openingSubmitted,
  openingComplete,
  onSubmitTurn,
  stage3Opponent,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, currentStage, isTyping]);

  return (
    <section className="rounded-[32px] border border-white/80 bg-white/60 backdrop-blur-md shadow-[0_12px_32px_rgba(0,0,0,0.04)] flex flex-col h-full overflow-hidden">
      {/* 스크롤 영역 */}
      <div
        ref={scrollRef}
        className="hide-scrollbar flex-1 overflow-y-auto p-4 space-y-4"
      >
        {(() => {
          const STAGE_LABELS = {
            1: '1단계 — 입론',
            2: '2단계 — 연쇄 논박',
            3: '3단계 — 자유 논박',
            4: '4단계 — 역할 반전',
            5: '5단계 — 종합 및 판정',
          };
          const seenStages = new Set();
          return logs.map((log) => {
            const isFirstOfStage = typeof log.stage === 'number' && !seenStages.has(log.stage);
            if (isFirstOfStage) seenStages.add(log.stage);
            return (
              <div key={log.id} id={isFirstOfStage ? `stage-anchor-${log.stage}` : undefined}>
                {isFirstOfStage && log.stage > 1 && (
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-[2px] bg-stone-300" />
                    <span className="shrink-0 rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-[12px] font-extrabold text-stone-500 tracking-wide">
                      {STAGE_LABELS[log.stage] ?? `${log.stage}단계`}
                    </span>
                    <div className="flex-1 h-[2px] bg-stone-300" />
                  </div>
                )}
                <SpeechBubble log={log} />
              </div>
            );
          });
        })()}
        {/* 타이핑 인디케이터: 토론 종료 후 / 최적해 모달 중 / 5단계 이후 유저 제출 뒤엔 숨김 */}
        {isTyping && !debateComplete && !isFinalize && !(currentStage >= 5 && !isMyTurn) && <TypingIndicator speaker={isTyping} currentStage={currentStage} />}
      </div>

      {/* 입력 영역: 토론 종료 후 숨김 */}
      {currentStage <= 5 && !debateComplete && (
        <div className="px-3 pb-3 pt-0 bg-transparent">
          <div className={`rounded-[28px] p-2 transition-all duration-300 border shadow-sm ${
            isMyTurn
              ? isProSide
                ? 'border-blue-200 bg-blue-50/40 shadow-[0_4px_20px_rgba(59,130,246,0.08)]'
                : 'border-rose-200 bg-rose-50/40 shadow-[0_4px_20px_rgba(225,29,72,0.08)]'
              : 'border-transparent bg-white/90'
          }`}>
            <InputComposer
              isMyTurn={isMyTurn}
              isProSide={isProSide}
              isFinalize={isFinalize}
              currentStage={currentStage}
              stage3CanAttack={stage3CanAttack}
              onSubmitOpening={onSubmitOpening}
              openingLoading={openingLoading}
              openingError={openingError}
              openingSubmitted={openingSubmitted}
              openingComplete={openingComplete}
              onSubmitTurn={onSubmitTurn}
              stage3Opponent={stage3Opponent}
            />
          </div>
        </div>
      )}
    </section>
  );
}
