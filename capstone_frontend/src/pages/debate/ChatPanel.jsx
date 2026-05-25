import { Fragment, useEffect, useRef, useState } from 'react';
import SpeechBubble from './SpeechBubble';
import InputComposer from './InputComposer';
import { getAssistantGuide } from '../../api/debatesApi';
import { renderMarkdown } from './markdownRenderer';
import vividImg from '../../assets/vivid.png';

const STAGE_TO_PHASE = {
  1: 'opening',
  2: 'chained_rebuttal',
  3: 'free_rebuttal',
  4: 'role_reversal',
  5: 'synthesis',
};

// [텍스트](url) 또는 plain https?:// URL 구간의 끝 인덱스를 반환. 해당 없으면 -1.
function skipLinkAt(text, startIdx) {
  const char = text[startIdx];
  if (char === '[') {
    const closeSquare = text.indexOf(']', startIdx + 1);
    if (closeSquare !== -1 && text[closeSquare + 1] === '(') {
      const closeParen = text.indexOf(')', closeSquare + 2);
      if (closeParen !== -1) return closeParen + 1;
    }
  }
  if (char === 'h') {
    const sub = text.slice(startIdx);
    const m = sub.match(/^https?:\/\/[^\s,)>\]]+/);
    if (m) return startIdx + m[0].length;
  }
  return -1;
}

function AssistantCard({ text, onStreamingChange, instant }) {
  const [displayed, setDisplayed] = useState(instant ? (text ?? '') : '');
  const indexRef = useRef(instant ? (text?.length ?? 0) : 0);

  useEffect(() => {
    if (!text) return;
    if (instant) {
      setDisplayed(text);
      return;
    }
    setDisplayed('');
    indexRef.current = 0;
    onStreamingChange?.(true);
    const tick = () => {
      indexRef.current += 1;
      const skipEnd = skipLinkAt(text, indexRef.current - 1);
      if (skipEnd !== -1) indexRef.current = skipEnd;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current < text.length) {
        timerId = setTimeout(tick, 18);
      } else {
        onStreamingChange?.(false);
      }
    };
    let timerId = setTimeout(tick, 18);
    return () => { clearTimeout(timerId); onStreamingChange?.(false); };
  }, [text, instant]);

  if (!text) return null;
  return (
    <div className="flex w-full justify-start">
      <div className="flex items-start gap-2 max-w-[88%]">
        <div className="mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-full select-none">
          <img src={vividImg} alt="비비드" className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col items-start gap-1">
          <span className="text-[11px] font-extrabold text-stone-400 tracking-wide px-1">비비드</span>
          <div className="rounded-[20px] rounded-tl-[6px] border border-stone-600 bg-stone-900 px-4 py-3 shadow-md text-[14px] leading-relaxed">
            {renderMarkdown(displayed, true)}
          </div>
        </div>
      </div>
    </div>
  );
}

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
  sessionId,
  topicLabel = '',
}) {
  const scrollRef = useRef(null);
  const [assistantTexts, setAssistantTexts] = useState({});
  const [revealedStages, setRevealedStages] = useState(new Set());
  const [isBividStreaming, setIsBividStreaming] = useState(false);
  const prevFetchKey = useRef('');

  const isAgentStreaming = logs.some(l => l.isStreaming);

  const phase = STAGE_TO_PHASE[currentStage];
  const opponentId = currentStage === 3 ? (stage3Opponent?.id ?? null) : null;
  const fetchKey = `${sessionId ?? ''}-${phase ?? ''}-${opponentId ?? ''}`;

  useEffect(() => {
    console.log('[ChatPanel] fetchKey:', fetchKey, 'sessionId:', sessionId, 'stage:', currentStage);
    if (!sessionId || !phase) return;
    if (prevFetchKey.current === fetchKey) return;
    prevFetchKey.current = fetchKey;

    getAssistantGuide(sessionId, phase, opponentId)
      .then((res) => {
        console.log('[ChatPanel] assistant response:', res);
        setAssistantTexts((prev) => ({ ...prev, [currentStage]: res.text ?? '' }));
      })
      .catch((err) => console.error('[ChatPanel] assistant error:', err));
  }, [fetchKey, sessionId, phase, opponentId, currentStage]);

  // isMyTurn이 되고 에이전트 스트리밍이 완전히 끝난 순간 한 번만 reveal
  useEffect(() => {
    if (isMyTurn && !isTyping && !isAgentStreaming && assistantTexts[currentStage]) {
      setRevealedStages((prev) => {
        if (prev.has(currentStage)) return prev;
        const next = new Set(prev);
        next.add(currentStage);
        return next;
      });
    }
  }, [isMyTurn, isTyping, assistantTexts, currentStage]);

  const userScrolledUpRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      userScrolledUpRef.current = !atBottom;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (userScrolledUpRef.current) return;
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
        {topicLabel && (
          <div className="flex justify-center pt-2 pb-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-4 py-2 shadow-sm">
              <span className="text-[11px] font-extrabold tracking-widest text-stone-400">주제</span>
              <span className="h-3 w-px bg-stone-200" />
              <span className="text-[13px] font-bold text-stone-700">{topicLabel}</span>
            </div>
          </div>
        )}
        {(() => {
          const STAGE_LABELS = {
            1: '1단계 — 입론',
            2: '2단계 — 연쇄 논박',
            3: '3단계 — 자유 논박',
            4: '4단계 — 역할 반전',
            5: '5단계 — 종합 및 판정',
          };
          const seenStages = new Set();
          const insertedBividStages = new Set();

          return logs.map((log) => {
            const isFirstOfStage = typeof log.stage === 'number' && !seenStages.has(log.stage);
            if (isFirstOfStage) seenStages.add(log.stage);

            // 유저 첫 메시지 직전에 해당 스테이지 비비드 삽입 (1회)
            let bividBefore = null;
            if (log.isUser && !insertedBividStages.has(log.stage)
                && revealedStages.has(log.stage) && assistantTexts[log.stage]) {
              bividBefore = <AssistantCard key={`bivid-${log.stage}`} text={assistantTexts[log.stage]} instant />;
              insertedBividStages.add(log.stage);
            }

            return (
              <Fragment key={log.id}>
                {isFirstOfStage && log.stage > 1 && (
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-[2px] bg-stone-300" />
                    <span className="shrink-0 rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-[12px] font-extrabold text-stone-500 tracking-wide">
                      {STAGE_LABELS[log.stage] ?? `${log.stage}단계`}
                    </span>
                    <div className="flex-1 h-[2px] bg-stone-300" />
                  </div>
                )}
                {bividBefore}
                <div id={isFirstOfStage ? `stage-anchor-${log.stage}` : undefined}>
                  <SpeechBubble log={log} />
                </div>
              </Fragment>
            );
          });
        })()}
        {/* 타이핑 인디케이터: 토론 종료 후 / 최적해 모달 중 / 5단계 이후 유저 제출 뒤엔 숨김 */}
        {isTyping && !debateComplete && !isFinalize && !(currentStage >= 5 && !isMyTurn) && <TypingIndicator speaker={isTyping} currentStage={currentStage} />}
        {/* 비비드: 에이전트 스트리밍 완료 후, 유저가 아직 해당 스테이지 메시지를 안 보냈을 때만 표시 */}
        {revealedStages.size > 0 && !isTyping && !isAgentStreaming && (() => {
          const latestStage = Math.max(...revealedStages);
          const userAlreadySent = logs.some(l => l.isUser && l.stage === latestStage);
          return !userAlreadySent && assistantTexts[latestStage]
            ? <AssistantCard text={assistantTexts[latestStage]} onStreamingChange={setIsBividStreaming} />
            : null;
        })()}
      </div>

      {/* 입력 영역: 토론 종료 후 숨김 */}
      {currentStage <= 5 && !debateComplete && (
        <div className="px-3 pb-3 pt-0">
          <div className={`rounded-[28px] p-2 transition-all duration-300 border shadow-sm ${
            isMyTurn
              ? isProSide
                ? 'border-blue-200 bg-blue-50/40 shadow-[0_4px_20px_rgba(59,130,246,0.08)]'
                : 'border-rose-200 bg-rose-50/40 shadow-[0_4px_20px_rgba(225,29,72,0.08)]'
              : 'border-transparent bg-white/90'
          }`}>
            <InputComposer
              isMyTurn={isMyTurn && !isBividStreaming}
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
