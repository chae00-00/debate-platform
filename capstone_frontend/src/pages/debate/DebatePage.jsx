import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, X, Search } from 'lucide-react';

const DEBATE_STORAGE_KEY = 'capstone_debate_session';
function clearDebateStorage() {
  try { sessionStorage.removeItem(DEBATE_STORAGE_KEY); } catch {}
}

import ChatPanel from './ChatPanel';
import StepperPanel from './StepperPanel';
import AnalysisPanel from './AnalysisPanel';
import ConflictBarPanel from './ConflictBarPanel';
import Stage3OpponentModal from './Stage3OpponentModal';
import { useDebateLogs } from './useDebateLogs';
import {
  STAGE1_ORDER,
  STAGE2_ROUNDS,
  STAGE3_MAX_CYCLES,
  STAGE3_PAIRED_AGENT_LABEL,
  ANALYSIS_BY_STAGE,
  ANALYSIS_BY_SPEAKER,
} from './mockData';

const STAGE_TO_PHASE = {
  1: 'opening',
  2: 'chained_rebuttal',
  3: 'free_rebuttal',
  4: 'role_reversal',
  5: 'synthesis',
};

/**
 * @param {function} onBack       - 뒤로가기 콜백
 * @param {function} onExit       - 토론 종료 후 다음 단계 이동 콜백
 * @param {object|null} debateParams - POST /api/debates 요청 바디 (null이면 Mock 사용)
 *   예: { topic, userStance, userIntensity, debateFormat, agentIntensities, maxCycle }
 */
export default function DebatePage({
  onBack = () => console.log('back'),
  onExit = () => console.log('exit'),
  debateParams = null,
  preparedSessionId = null,
  agentCount = 2,
  userStance = 'pro',
  topicLabel = '',
}) {
  const [showSearchPopup, setShowSearchPopup] = useState(!!debateParams);
  const [currentStage, setCurrentStage] = useState(1);
  const [viewStage, setViewStage] = useState(1); // 스테퍼에서 선택한 단계 (보기용)
  const [stage3Opponent, setStage3Opponent] = useState(null);
  const expectedOpponentCount = Math.max(
    1,
    Number(String(debateParams?.debateFormat ?? '').split(':')[0]) || agentCount || 1,
  );

  const {
    logs,
    loading,
    error,
    isTyping,
    awaitingUserTurn,
    submitOpening,
    openingSubmitted,
    openingComplete,
    debateComplete,
    waitingFor,
    stage3CanAttack,
    liveAnalysis,
    submitTurn,
    pauseQueue,
    resumeQueue,
  } = useDebateLogs(debateParams, agentCount, userStance, preparedSessionId);

  // logs에서 실시간으로 진행 상황 파악 (useDebateLogs 이후에 선언)
  const stage1SpeakerIdx = useMemo(
    () => Math.min(logs.filter(l => l.stage === 1 && !l.moderator).length, STAGE1_ORDER.length - 1),
    [logs],
  );
  const stage2RoundIdx = useMemo(
    () => Math.min(logs.filter(l => l.stage === 2 && !l.moderator).length, STAGE2_ROUNDS.length - 1),
    [logs],
  );
  const stage3CycleCount = useMemo(
    () => Math.max(1, logs.filter(l => l.stage === 3 && l.isUser).length),
    [logs],
  );

  const summarizeOpening = (text) => {
    if (!text) return '입론 요약 정보가 없습니다.';
    const stripped = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/#+\s*/g, ' ')
      .replace(/\*\*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const firstSentence = stripped.split(/[.!?]\s/)[0]?.trim();
    const summary = firstSentence && firstSentence.length > 10 ? firstSentence : stripped;
    return summary.length > 110 ? `${summary.slice(0, 110)}...` : summary;
  };

  const stage3Opponents = useMemo(() => {
    const opponentSide = userStance === 'pro' ? 'con' : 'pro';
    const openingLogs = logs.filter((log) => log.stage === 1 && !log.moderator && !log.isUser);
    const deduped = openingLogs
      .filter((log) => log.side === opponentSide)
      .filter((log, index, arr) => {
        const key = String(log.speaker ?? log.id);
        return arr.findIndex((x) => String(x.speaker ?? x.id) === key) === index;
      })
      .map((log) => ({
        id: String(log.speakerId ?? log.speaker ?? log.id), // raw agent_id 우선
        label: String(log.speaker ?? '상대'),
        stance: summarizeOpening(log.text),
      }));

    return deduped.slice(0, expectedOpponentCount);
  }, [logs, userStance, expectedOpponentCount]);

  useEffect(() => {
    if (currentStage !== 3 || stage3Opponent) return;
    if (expectedOpponentCount === 1 && stage3Opponents.length >= 1) {
      setStage3Opponent(stage3Opponents[0]);
      return;
    }
    if (stage3Opponents.length === 1) {
      setStage3Opponent(stage3Opponents[0]);
    }
  }, [currentStage, stage3Opponents, stage3Opponent, expectedOpponentCount]);

  // 상대 선택 모달이 필요한 동안 AI 발언 큐 일시정지
  // useLayoutEffect: paint 전에 동기 실행되어 타이머 취소 타이밍이 빠름
  const pauseQueueRef = useRef(pauseQueue);
  const resumeQueueRef = useRef(resumeQueue);
  pauseQueueRef.current = pauseQueue;
  resumeQueueRef.current = resumeQueue;

  useLayoutEffect(() => {
    if (currentStage === 3 && !stage3Opponent && expectedOpponentCount > 1) {
      pauseQueueRef.current();
    }
  }, [currentStage, stage3Opponent, expectedOpponentCount]);

  // 상대가 선택되면 큐 재개
  useLayoutEffect(() => {
    if (stage3Opponent) {
      resumeQueueRef.current();
    }
  }, [stage3Opponent]);

  useEffect(() => {
    if (openingComplete) {
      setCurrentStage((prev) => (prev < 2 ? 2 : prev));
    }
  }, [openingComplete]);

  useEffect(() => {
    const maxVisibleStage = logs.reduce((max, log) => {
      if (typeof log.stage !== 'number') return max;
      return Math.max(max, log.stage);
    }, 1);

    setCurrentStage((prev) => (maxVisibleStage > prev ? maxVisibleStage : prev));
  }, [logs]);

  // waitingFor → 자동 단계 전환 및 사용자 턴 활성화
  useEffect(() => {
    if (!waitingFor) return;
    const WAITING_TO_STAGE = {
      user_opening: 1,
      user_rebuttal: 2,
      user_free_rebuttal: 3,
      user_role_reversal: 4,
      user_synthesis: 5,
      user_finalize: 5,
      chained_rebuttal_node: 2,
      free_rebuttal_node: 3,
      role_reversal_node: 4,
      synthesis_discuss_node: 5,
    };
    const stage = WAITING_TO_STAGE[waitingFor];
    if (stage) setCurrentStage((prev) => Math.max(prev, stage));
  }, [waitingFor]);

  // 첫 AI 발언 도착 시 검색 팝업 자동 닫기
  useEffect(() => {
    if (logs.length > 0) setShowSearchPopup(false);
  }, [logs.length]);

  // currentStage가 올라가면 viewStage도 자동으로 따라옴
  useEffect(() => {
    setViewStage((prev) => (currentStage > prev ? currentStage : prev));
  }, [currentStage]);

  const isMyTurn = awaitingUserTurn;
  const isProSide = userStance === 'pro';
  const isRoleReversalStage = currentStage === 4;
  const effectiveIsProSide = isRoleReversalStage ? !isProSide : isProSide;
  const canUseStage3Attack = !debateParams || (waitingFor === 'user_free_rebuttal' && stage3CanAttack);

  const getTurnDesc = () => {
    const stageNames = { 1: '입론', 2: '연쇄 논박', 3: '자유 논박', 4: '역할 반전', 5: '종합' };
    const stageName = stageNames[currentStage] ?? '진행 중';

    // AI 큐가 아직 재생 중이면 waitingFor보다 isTyping을 우선
    if (isTyping) return `${stageName} — 상대방 발언 중`;

    switch (waitingFor) {
      case 'user_opening':          return '입론 — 내 차례';
      case 'chained_rebuttal_node': return '연쇄 논박 — 상대방 발언 중';
      case 'user_rebuttal':         return '연쇄 논박 — 내 차례';
      case 'free_rebuttal_node':    return '자유 논박 — 상대방 발언 중';
      case 'user_free_rebuttal':    return '자유 논박 — 내 차례';
      case 'role_reversal_node':    return '역할 반전 — 상대방 발언 중';
      case 'user_role_reversal':    return '역할 반전 — 내 차례';
      case 'synthesis_discuss_node':return '종합 — 상대방 발언 중';
      case 'user_synthesis':        return '종합 — 내 차례';
      case 'user_finalize':         return '최적해 제시 차례';
      default:                      return `${stageName} — 상대방 발언 중`;
    }
  };

  const getProgressInfo = () => {
    if (currentStage === 1) {
      const done = stage1SpeakerIdx + 1;
      return { label: `입론 ${done}/${STAGE1_ORDER.length}`, pct: done / STAGE1_ORDER.length };
    }
    if (currentStage === 2) {
      const round = stage2RoundIdx + 1;
      return { label: `논박 ${round}/${STAGE2_ROUNDS.length}`, pct: round / STAGE2_ROUNDS.length };
    }
    if (currentStage === 3) {
      return { label: `사이클 ${stage3CycleCount}/${STAGE3_MAX_CYCLES}`, pct: Math.min(stage3CycleCount / STAGE3_MAX_CYCLES, 1) };
    }
    return null;
  };

  const progress         = getProgressInfo();
  const showLiveAnalysis = currentStage < 4 && !debateComplete && (debateParams ? liveAnalysis !== null : true);

  const getSpeakerAnalysis = () => {
    if (currentStage === 1) {
      const speaker = STAGE1_ORDER[stage1SpeakerIdx];
      return ANALYSIS_BY_SPEAKER[speaker?.id] ?? ANALYSIS_BY_STAGE[1];
    }
    if (currentStage === 2) {
      return ANALYSIS_BY_SPEAKER[`round${stage2RoundIdx + 1}`] ?? ANALYSIS_BY_STAGE[2];
    }
    return ANALYSIS_BY_STAGE[currentStage];
  };
  // SSE 모드: liveAnalysis 우선, 없으면 mock fallback
  const analysis = (debateParams && liveAnalysis) ? liveAnalysis : getSpeakerAnalysis();

  const getSpeakerLabel = () => {
    if (currentStage === 1) {
      const speaker = STAGE1_ORDER[stage1SpeakerIdx];
      return speaker ? `입론 · ${speaker.label}` : null;
    }
    if (currentStage === 2) {
      const round = STAGE2_ROUNDS[stage2RoundIdx];
      return round ? `연쇄 논박 · ${round.attackerLabel}` : null;
    }
    if (currentStage === 3) return `자유 논박 · 사이클 ${stage3CycleCount}`;
    if (currentStage === 4) return '역할 반전 발언 중';
    return null;
  };
  const speakerLabel = (debateParams && liveAnalysis?.resolvedSpeaker)
    ? liveAnalysis.resolvedSpeaker
    : getSpeakerLabel();

  // 단계별 사용자 발언 제출 (stages 2~5)
  const handleSubmitTurn = (content, pendingAttack = null) => {
    const phase = STAGE_TO_PHASE[currentStage] ?? 'opening';
    const opponentId = currentStage === 3 ? (stage3Opponent?.id ?? null) : null;
    submitTurn(content, phase, pendingAttack, false, opponentId);
  };

  const mergedLogs = logs;
  const showStage3Modal =
    currentStage === 3 &&
    !stage3Opponent &&
    expectedOpponentCount > 1 &&
    stage3Opponents.length > 1;

  return (
    <div className="h-screen overflow-hidden bg-[linear-gradient(135deg,#F5F5F4,#E7E5E4)] text-stone-800 font-sans selection:bg-stone-200 selection:text-stone-900">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes subtle-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.98); }
        }
        .animate-subtle-pulse { animation: subtle-pulse 2s ease-in-out infinite; }
      `}</style>

      {/* 입론 로딩 중 자료 검색 팝업 */}
      {showSearchPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowSearchPopup(false)}
          />
          <div className="relative z-10 w-[70vw] max-w-[900px] rounded-[40px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(245,245,244,0.96))] px-14 py-12 shadow-[0_32px_80px_rgba(0,0,0,0.18)]">

            {/* 닫기 버튼 */}
            <button
              onClick={() => setShowSearchPopup(false)}
              className="absolute right-7 top-7 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition-all hover:bg-stone-200 hover:scale-110"
            >
              <X size={18} />
            </button>

            {/* 헤더 */}
            <div className="mb-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900">
                <Search size={26} className="text-white" />
              </div>
              <h2 className="text-[32px] font-extrabold leading-snug text-stone-900">
                입론을 위한<br />자료를 검색하세요
              </h2>
            </div>

            {topicLabel && (
              <div className="mb-8 rounded-2xl bg-stone-50 px-6 py-4 text-[16px] font-medium leading-snug text-stone-600">
                "{topicLabel}"
              </div>
            )}

            <div className="flex flex-col gap-4">
              {/* 네이버 */}
              <a
                href={`https://search.naver.com/search.naver?query=${encodeURIComponent(topicLabel || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-2xl bg-[#03C75A] px-7 py-5 text-[17px] font-bold text-white transition-all hover:brightness-95 active:scale-[0.98]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[17px] font-black text-[#03C75A]">N</span>
                <span>네이버에서 찾아보기</span>
              </a>

              {/* 구글 */}
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(topicLabel || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white px-7 py-5 text-[17px] font-bold text-stone-800 transition-all hover:bg-stone-50 active:scale-[0.98]"
              >
                <svg className="h-9 w-9 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>구글에서 찾아보기</span>
              </a>
            </div>

            <button
              onClick={() => setShowSearchPopup(false)}
              className="mt-8 w-full rounded-full bg-stone-900 py-4 text-[15px] font-bold text-white transition-all hover:bg-black active:scale-[0.98]"
            >
              토론 시작하기
            </button>
          </div>
        </div>
      )}

      {showStage3Modal && (
        <Stage3OpponentModal
          opponents={stage3Opponents}
          onSelect={(opp) => setStage3Opponent(opp)}
        />
      )}

      <main className="relative mx-auto h-full max-w-[1920px] p-3 sm:p-4 lg:p-5">

        {/* 뒤로가기 버튼 */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-white/80 shadow-sm text-stone-600 hover:scale-105 transition-transform"
        >
          <ArrowLeft size={16} />
        </button>

        {/* 메인 레이아웃 */}
        <div className="grid h-full grid-cols-1 gap-4 pl-10 lg:grid-cols-[2.5fr_1fr]">

          {/* 왼쪽: 채팅 패널 */}
          <div className="flex flex-col h-full min-h-0">
            <ChatPanel
              logs={mergedLogs}
              currentStage={currentStage}
              waitingFor={waitingFor}
              isFinalize={waitingFor === 'user_finalize'}
              isMyTurn={isMyTurn}
              isProSide={effectiveIsProSide}
              stage3CanAttack={canUseStage3Attack}
              isTyping={isTyping}
              debateComplete={debateComplete}
              onSubmitOpening={submitOpening}
              openingLoading={loading}
              openingError={error}
              openingSubmitted={openingSubmitted}
              openingComplete={openingComplete}
              onSubmitTurn={handleSubmitTurn}
              stage3Opponent={stage3Opponent}
            />
          </div>

          {/* 오른쪽: 사이드바 */}
          <aside className="hidden lg:flex lg:min-h-0 lg:flex-col lg:gap-4 lg:overflow-y-auto hide-scrollbar">
            <StepperPanel
              currentStage={currentStage}
              viewStage={viewStage}
              setViewStage={setViewStage}
              onScrollToStage={(stageId) => {
                const el = document.getElementById(`stage-anchor-${stageId}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              getTurnDesc={getTurnDesc}
              progress={progress}
              isTyping={isTyping}
              isMyTurn={isMyTurn}
            />
            <AnalysisPanel
              showLiveAnalysis={showLiveAnalysis}
              analysis={analysis}
              speakerLabel={speakerLabel}
            />
            <ConflictBarPanel
              currentStage={currentStage}
              isDebateComplete={debateComplete}
              liveProPercent={liveAnalysis?.proPercent ?? null}
              liveConPercent={liveAnalysis?.conPercent ?? null}
            />
          </aside>

        </div>

        <div className={`fixed bottom-6 left-1/2 z-40 -translate-x-1/2 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] sm:bottom-10 ${
          debateComplete ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-24 opacity-0 scale-90 pointer-events-none'
        }`}>
          {debateComplete && (
            <button
              type="button"
              onClick={() => {
                try {
                  const s = JSON.parse(sessionStorage.getItem(DEBATE_STORAGE_KEY));
                  if (s?.sessionId) sessionStorage.setItem('capstone_debate_session_id', s.sessionId);
                } catch {}
                clearDebateStorage();
                onExit();
              }}
              className="flex items-center gap-4 rounded-full bg-stone-900 px-7 py-3.5 text-base font-bold text-white shadow-2xl transition-all hover:scale-105 hover:bg-black active:scale-95 sm:px-12 sm:py-5 sm:text-xl"
            >
              토론 종료
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
