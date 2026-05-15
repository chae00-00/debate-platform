import { useCallback, useEffect, useRef, useState } from 'react';
import { MOCK_SPEECH_LOGS, STAGE1_ORDER, STAGE3_MOCK_RESPONSES, STAGE3_MAX_CYCLES } from './mockData';
import { buildApiUrl } from '../../api';

// ── 글자 길이 기반 랜덤 딜레이 ────────────────────────────────────────────────
function getRenderDelay(text, isOneOnOne = false) {
  if (isOneOnOne) {
    const base = 400;
    const byLength = Math.min((text?.length ?? 0) * 5, 1000);
    const jitter = Math.floor(Math.random() * 300);
    return base + byLength + jitter;
  }
  const base = 900;
  const byLength = Math.min((text?.length ?? 0) * 12, 2200);
  const jitter = Math.floor(Math.random() * 700);
  return base + byLength + jitter;
}

// ── fetch 기반 SSE 읽기 (POST 지원) ─────────────────────────────────────────
// EventSource는 GET만 지원하므로 fetch + ReadableStream으로 구현
async function* readSSE(url, options, signal) {
  const res = await fetch(url, { ...options, signal });
  if (!res.ok) throw new Error(`SSE ${res.status}: ${url}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE는 빈 줄('\n\n')로 이벤트를 구분
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop(); // 마지막 미완성 블록은 다음 청크로 이월

      for (const block of blocks) {
        if (!block.trim()) continue;
        const lines = block.split('\n');
        let eventType = 'message';
        let data = '';
        for (const line of lines) {
          if (line.startsWith('event:')) eventType = line.slice(6).trim();
          else if (line.startsWith('data:')) data += line.slice(5).trim();
        }
        if (data) yield { type: eventType, data };
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ── SSE entry → log 객체 변환 ────────────────────────────────────────────────
const PHASE_TO_STAGE = {
  opening: 1,
  chained_rebuttal: 2,
  free_rebuttal: 3,
  role_reversal: 4,
  synthesis: 5,
};

const PHASE_TO_TYPE = {
  opening: '입론',
  chained_rebuttal: '논박',
  free_rebuttal: '논박',
  role_reversal: '역할반전',
  synthesis: '종합',
};


function makeAgentLabelResolver(savedState = null) {
  const map = savedState ? { ...savedState.map } : {};
  let proCount = savedState?.proCount ?? 0;
  let conCount = savedState?.conCount ?? 0;

  function resolve(speakerId, stance) {
    if (!speakerId) return 'AI';
    if (speakerId === 'user' || speakerId === '사용자') return '나';
    if (map[speakerId]) return map[speakerId];
    const isCon = (stance ?? '').toLowerCase() === 'con';
    const label = isCon ? `반대 ${++conCount}` : `찬성 ${++proCount}`;
    map[speakerId] = label;
    return label;
  }

  resolve.getState = () => ({ map: { ...map }, proCount, conCount });
  return resolve;
}

// ── sessionStorage 기반 세션 유지 ────────────────────────────────────────────
const STORAGE_KEY = 'capstone_debate_session';
const AGENT_BUBBLE_CHAR_DELAY = 28;

function saveDebateSession(data) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}
function loadDebateSession() {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; }
}
function clearDebateSession() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
}

function buildLogFromSSE(raw, resolveLabel) {
  // 백엔드가 snake_case로 보내므로 두 형식 모두 처리
  const stance = (raw.stance ?? '').toLowerCase();
  const phase = raw.phase ?? 'opening';
  const speakerId = raw.speaker_id ?? raw.speakerId;
  const targetId = raw.target_id ?? raw.targetId ?? null;
  return {
    id: raw.turn ?? `entry-${Date.now()}`,
    stage: PHASE_TO_STAGE[phase] ?? 1,
    side: stance,
    speakerId,                            // raw agent_id (예: "agent_1", "agent_2")
    speaker: resolveLabel(speakerId, stance),
    type: PHASE_TO_TYPE[phase] ?? '발언',
    turnNumber: raw.turn,
    phase,
    text: raw.content,
    targetId,
  };
}

/**
 * 토론 로그 훅
 *
 * @param {object|null} debateParams  - null이면 Mock 모드, object이면 SSE 모드
 *   SSE 모드 예시: { topicId, agentCount, userStance, ... }
 * @param {number} agentCount
 * @param {string} userStance  - 'pro' | 'con'
 *
 * 반환값:
 *   logs             — 화면에 표시할 로그 배열
 *   isTyping         — 타이핑 중인 발화자 이름 (null이면 미표시)
 *   awaitingUserTurn — 사용자 입력 받을 수 있는 상태
 *   openingComplete  — 입론 단계 완료
 *   debateComplete   — 전체 토론 완료
 *   sessionId        — SSE에서 수신한 세션 ID (mock은 null)
 *   error            — 오류 메시지
 *   submitOpening    — 사용자 입론 제출 함수
 */
export function useDebateLogs(debateParams, agentCount = 2, userStance = 'pro', preparedSessionId = null) {
  const [visibleLogs, setVisibleLogs] = useState([]);
  const [isTyping, setIsTyping] = useState(null);
  const [awaitingUserTurn, setAwaitingUserTurn] = useState(false);
  const [openingComplete, setOpeningComplete] = useState(false);
  const [debateComplete, setDebateComplete] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [waitingFor, setWaitingFor] = useState(null);
  const [synthesisDraft, setSynthesisDraft] = useState(null);
  const [freeRebuttalUserTurnCount, setFreeRebuttalUserTurnCount] = useState(0);
  const [liveAnalysis, setLiveAnalysis] = useState(null);
  const sessionIdRef = useRef(null);

  const queueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const pausedRef = useRef(false);
  const queueAwaitUserRef = useRef(false);
  const queueOnCompleteRef = useRef(null);
  const timerRef = useRef(null);
  const abortRef = useRef(null);
  const stage3CycleRef = useRef(0);
  const resolveLabelRef = useRef(makeAgentLabelResolver());
  const submitTurnRef = useRef(null); // 재귀 자동제출용 ref
  const firstEntryReceivedRef = useRef(false); // 첫 번째 entry 여부 (입론 첫 에이전트 딜레이 스킵용)
  const freeRebuttalUserTurnCountRef = useRef(0);
  // 자유논박 에이전트 타입 추적
  const freeRebuttalUserHasSpokenRef = useRef(false);   // 사용자가 자유논박에서 발언했는지
  const freeRebuttalAgentCountInTurnRef = useRef(0);    // 현재 에이전트 턴에서 몇 번째 엔트리인지
  const bubbleStreamingTimersRef = useRef(new Set());

  const clearBubbleStreamingTimers = useCallback(() => {
    bubbleStreamingTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    bubbleStreamingTimersRef.current.clear();
  }, []);

  const streamAgentLog = useCallback((log) => new Promise((resolve) => {
    const fullText = log.text ?? '';
    setVisibleLogs((prev) => [...prev, { ...log, text: '', isStreaming: true }]);

    let charIndex = 0;

    const step = () => {
      charIndex += 1;
      setVisibleLogs((prev) => prev.map((item) => (
        item.id === log.id
          ? { ...item, text: fullText.slice(0, charIndex), isStreaming: charIndex < fullText.length }
          : item
      )));

      if (charIndex >= fullText.length) {
        resolve();
        return;
      }

      const timerId = setTimeout(() => {
        bubbleStreamingTimersRef.current.delete(timerId);
        step();
      }, AGENT_BUBBLE_CHAR_DELAY);
      bubbleStreamingTimersRef.current.add(timerId);
    };

    step();
  }), []);

  const buildLiveAnalysisSnapshot = useCallback((raw) => {
    const argumentScore = (raw.argumentScore ?? raw.argument_score ?? 0) / 10;
    const evidenceScore = (raw.evidenceScore ?? raw.evidence_score ?? 0) / 10;
    const languageScore = (raw.languageScore ?? raw.language_score ?? 0) / 10;

    return {
      argumentScore,
      evidenceScore,
      languageScore,
      positionGap: argumentScore,
      evidenceClash: evidenceScore,
      counterStrike: languageScore,
      proPercent: raw.proPercent ?? raw.pro_percent ?? 50,
      conPercent: raw.conPercent ?? raw.con_percent ?? 50,
      speakerId: raw.speakerId ?? raw.speaker_id ?? null,
      turnIndex: raw.turnIndex ?? raw.turn_index ?? null,
    };
  }, []);

  // ── 타이머 정리 ─────────────────────────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  // ── 큐 재생 ─────────────────────────────────────────────────────────────────
  const playNextRef = useRef(null);
  playNextRef.current = () => {
    if (pausedRef.current) {
      isPlayingRef.current = false;
      return;
    }

    if (queueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsTyping(null);
      setAwaitingUserTurn(queueAwaitUserRef.current);
      const cb = queueOnCompleteRef.current;
      queueOnCompleteRef.current = null;
      cb?.();
      return;
    }

    isPlayingRef.current = true;
    const next = queueRef.current[0]; // shift는 setTimeout 안에서 수행

    if (next.moderator) {
      timerRef.current = setTimeout(() => {
        if (pausedRef.current) { isPlayingRef.current = false; return; }
        queueRef.current.shift();
        setVisibleLogs((prev) => [...prev, next]);
        timerRef.current = setTimeout(() => playNextRef.current?.(), 450);
      }, 300);
      return;
    }

    setIsTyping(next.speaker ?? '...');
    const delay = next.skipDelay ? 500 : getRenderDelay(next.text ?? '', agentCount === 1);
    timerRef.current = setTimeout(() => {
      if (pausedRef.current) {
        setIsTyping(null);
        isPlayingRef.current = false;
        return;
      }
      queueRef.current.shift();
      if (!next.moderator && next._analysis) {
        setLiveAnalysis({ ...next._analysis, resolvedSpeaker: next.speaker ?? null });
      }
      streamAgentLog(next).then(() => {
        setIsTyping(null);
        timerRef.current = setTimeout(() => playNextRef.current?.(), 350);
      });
    }, delay);
  };

  const startQueue = useCallback((logs, options = {}) => {
    queueRef.current = [...logs];
    queueAwaitUserRef.current = options.awaitUser ?? false;
    queueOnCompleteRef.current = options.onComplete ?? null;
    setAwaitingUserTurn(false);
    if (!isPlayingRef.current) playNextRef.current?.();
  }, []);

  // ── 상태 초기화 ─────────────────────────────────────────────────────────────
  const resetState = useCallback(() => {
    clearTimer();
    clearBubbleStreamingTimers();
    abortRef.current?.abort();
    queueRef.current = [];
    isPlayingRef.current = false;
    pausedRef.current = false;
    queueAwaitUserRef.current = false;
    queueOnCompleteRef.current = null;
    setVisibleLogs([]);
    setIsTyping(null);
    setAwaitingUserTurn(false);
    setOpeningComplete(false);
    setDebateComplete(false);
    setError(null);
    setSessionId(null);
    setWaitingFor(null);
    setSynthesisDraft(null);
    setFreeRebuttalUserTurnCount(0);
    setLiveAnalysis(null);
    sessionIdRef.current = null;
    stage3CycleRef.current = 0;
    firstEntryReceivedRef.current = false;
    freeRebuttalUserTurnCountRef.current = 0;
    freeRebuttalUserHasSpokenRef.current = false;
    freeRebuttalAgentCountInTurnRef.current = 0;
    resolveLabelRef.current = makeAgentLabelResolver();
    clearDebateSession();
  }, [clearTimer, clearBubbleStreamingTimers]);

  // ── Mock 모드 ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (debateParams) return;

    resetState();

    const userTurnIdx = STAGE1_ORDER.findIndex((e) => e.isUser);
    const moderatorLogs = MOCK_SPEECH_LOGS.filter((l) => l.moderator && l.stage === 1);
    const agentLogs = MOCK_SPEECH_LOGS.filter(
      (l) => l.stage === 1 && !l.moderator && l.turnNumber !== userTurnIdx,
    );

    setVisibleLogs(moderatorLogs);
    timerRef.current = setTimeout(() => {
      startQueue(agentLogs, { awaitUser: true });
    }, 800);

    return () => clearTimer();
  }, [debateParams, resetState, startQueue, clearTimer]);

  // ── sessionStorage 저장: 로그·세션 상태가 바뀔 때마다 갱신 ──────────────────
  useEffect(() => {
    if (!debateParams || visibleLogs.length === 0) return;
    saveDebateSession({
      debateParams,
      logs: visibleLogs,
      sessionId: sessionIdRef.current,
      openingComplete,
      waitingFor,
      debateComplete,
      resolverState: resolveLabelRef.current.getState?.() ?? null,
    });
  }, [visibleLogs, openingComplete, waitingFor, debateComplete, debateParams]);

  // ── SSE 모드: POST /api/debates ──────────────────────────────────────────────
  // debateParams가 있으면 fetch+ReadableStream으로 SSE 수신
  useEffect(() => {
    if (!debateParams) return;

    // 저장된 세션이 있으면 SSE 재연결 없이 복원
    const saved = loadDebateSession();
    if (
      saved &&
      saved.sessionId &&
      JSON.stringify(saved.debateParams) === JSON.stringify(debateParams)
    ) {
      resolveLabelRef.current = makeAgentLabelResolver(saved.resolverState ?? null);
      sessionIdRef.current = saved.sessionId;
      setSessionId(saved.sessionId);
      setVisibleLogs(saved.logs ?? []);
      setOpeningComplete(saved.openingComplete ?? false);
      setWaitingFor(saved.waitingFor ?? null);
      if (saved.debateComplete) {
        setDebateComplete(true);
      } else if (saved.waitingFor) {
        setAwaitingUserTurn(true);
      }
      return;
    }

    resetState();

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    (async () => {
      // preparedSessionId: prop → sessionStorage → 최대 10초 폴링 순으로 확인
      // prepare 응답이 debate 진입보다 늦게 오는 경우를 커버
      let effectivePreparedId = preparedSessionId;

      if (!effectivePreparedId) {
        const deadline = Date.now() + 20000;
        while (Date.now() < deadline) {
          if (ctrl.signal.aborted) return;
          try {
            const stored = JSON.parse(sessionStorage.getItem('capstone_prepared_session'));
            if (stored?.sessionId && JSON.stringify(stored.debateParams) === JSON.stringify(debateParams)) {
              effectivePreparedId = stored.sessionId;
              break;
            }
          } catch {}
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      if (ctrl.signal.aborted) return;

      // preparedSessionId 가 있으면 버퍼 replay 스트림 사용, 없으면 직접 init
      const sseUrl = effectivePreparedId
        ? buildApiUrl(`/api/debates/${effectivePreparedId}/stream`)
        : buildApiUrl('/api/debates');
      const sseOptions = effectivePreparedId
        ? { method: 'GET', headers: { Accept: 'text/event-stream' } }
        : { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: JSON.stringify(debateParams) };

      try {
        for await (const { type, data } of readSSE(
          sseUrl,
          sseOptions,
          ctrl.signal,
        )) {
          const raw = JSON.parse(data);

          if (type === 'session') {
            const sid = raw.session_id ?? raw.sessionId;
            sessionIdRef.current = sid;
            setSessionId(sid);
          } else if (type === 'turn') {
            const log = buildLogFromSSE(raw.entry, resolveLabelRef.current);
            console.log(`[SSE stream] turn 수신: speaker=${log.speaker} speakerId=${raw.entry?.speaker_id ?? raw.entry?.speakerId} stance=${raw.entry?.stance} turn=${log.turnNumber}`);
            if (!firstEntryReceivedRef.current) {
              log.skipDelay = true;
              firstEntryReceivedRef.current = true;
            }
            if (log.phase === 'free_rebuttal' && log.speaker !== '나') {
              if (!freeRebuttalUserHasSpokenRef.current) {
                log.type = '공격';
              } else if (freeRebuttalAgentCountInTurnRef.current === 0) {
                log.type = '답변';
                freeRebuttalAgentCountInTurnRef.current++;
              } else {
                log.type = '공격';
                freeRebuttalAgentCountInTurnRef.current++;
              }
            }
            if (raw.analysis) log._analysis = buildLiveAnalysisSnapshot(raw.analysis);
            queueRef.current.push(log);
            if (!isPlayingRef.current) playNextRef.current?.();
          } else if (type === 'waiting') {
            const wf = raw.waiting_for ?? raw.waitingFor ?? null;
            const finished = raw.is_finished ?? raw.isFinished ?? false;
            const draft = raw.synthesis_draft ?? raw.synthesisDraft ?? null;
            setWaitingFor(wf);
            if (finished) {
              if (draft) setSynthesisDraft(draft);
              setDebateComplete(true);
            } else {
              if (wf === 'chained_rebuttal_node') setOpeningComplete(true);
              queueAwaitUserRef.current = true;
              if (!isPlayingRef.current) setAwaitingUserTurn(true);
            }
          }
        }
      } catch (e) {
        if (e.name !== 'AbortError') setError(e?.message ?? 'SSE 연결 오류');
      }
    })();

    return () => ctrl.abort();
  }, [debateParams, agentCount, preparedSessionId, resetState]);

  // ── 사용자 발언 제출 (전 단계 공통): POST /api/debates/{sessionId}/submit ────
  const submitTurn = useCallback(
    async (content, phase = 'opening', pendingAttack = null, isChained = false, opponentId = null) => {
      const stage = PHASE_TO_STAGE[phase] ?? 1;
      const sid = sessionIdRef.current;
      const normalizedContent = (content ?? '').trim();
      const normalizedPendingAttack = (pendingAttack ?? '').trim() || null;

      if (!normalizedContent) return;

      const userBubbleType = phase === 'free_rebuttal'
        ? (isChained ? '공격' : '답변')
        : (PHASE_TO_TYPE[phase] ?? '발언');

      if (phase === 'free_rebuttal' && !isChained) {
        freeRebuttalUserTurnCountRef.current += 1;
        setFreeRebuttalUserTurnCount(freeRebuttalUserTurnCountRef.current);
        freeRebuttalUserHasSpokenRef.current = true;
        freeRebuttalAgentCountInTurnRef.current = 0;
      }

      // 사용자 로그 즉시 표시
      // - isChained=false: 답변(또는 단일 발언) 말풍선
      //   자유논박에서 pendingAttack이 있으면 공격 버블도 동시에 추가
      // - isChained=true : API 제출만 진행 (버블은 이미 동시 추가됨)
      if (!isChained) {
        const userLog = debateParams
          ? {
              id: `user-${phase}-${Date.now()}`,
              stage,
              side: userStance,
              speaker: '나',
              type: userBubbleType,
              phase,
              text: normalizedContent,
              isUser: true,
            }
          : (() => {
              const userEntry = STAGE1_ORDER.find((e) => e.isUser);
              return {
                id: `user-opening-${Date.now()}`,
                stage: 1,
                side: userEntry?.side ?? userStance,
                speaker: userEntry?.label ?? '나',
                type: '입론',
                turnNumber: STAGE1_ORDER.findIndex((e) => e.isUser),
                text: normalizedContent,
                isUser: true,
              };
            })();

        // 자유논박: 답변+공격 버블을 동시에 화면에 표시 (SSE/mock 공통)
        if (normalizedPendingAttack && phase === 'free_rebuttal') {
          const attackLog = {
            id: `user-attack-${phase}-${Date.now()}`,
            stage,
            side: userStance,
            speaker: '나',
            type: '공격',
            phase,
            text: normalizedPendingAttack,
            isUser: true,
          };
          setVisibleLogs((prev) => [...prev, userLog, attackLog]);
        } else {
          setVisibleLogs((prev) => [...prev, userLog]);
        }
      }
      // isChained=true: 버블은 위에서 이미 동시 추가됨. API 제출만 진행.
      setAwaitingUserTurn(false);
      if (stage === 1) setOpeningComplete(true);

      // Mock 모드
      if (!debateParams) {
        if (stage === 1) {
          // stage 2만 자동재생 후 stage 3 사용자 대기
          const stage2Logs = MOCK_SPEECH_LOGS.filter((l) => l.stage === 2);
          timerRef.current = setTimeout(() => {
            startQueue(stage2Logs, { awaitUser: false, onComplete: () => setAwaitingUserTurn(true) });
          }, 700);
        } else if (stage === 3) {
          // mock 응답 표시 후 다시 대기 (최대 사이클 도달 시 stage 4-5 자동재생 후 완료)
          const cycle = stage3CycleRef.current;
          stage3CycleRef.current += 1;
          const resp = STAGE3_MOCK_RESPONSES[cycle % STAGE3_MOCK_RESPONSES.length];
          setIsTyping('반대 1');
          const delay = 2000 + Math.random() * 1000;
          timerRef.current = setTimeout(() => {
            setIsTyping(null);
            setVisibleLogs((prev) => [
              ...prev,
              {
                id: `s3-mock-${Date.now()}`,
                stage: 3,
                side: 'con',
                speaker: '반대 1',
                type: resp.type,
                text: resp.text,
              },
            ]);
            if (stage3CycleRef.current >= STAGE3_MAX_CYCLES) {
              // 최대 사이클 → stage 4-5 자동재생 후 완료
              const laterLogs = MOCK_SPEECH_LOGS.filter((l) => l.stage >= 4);
              timerRef.current = setTimeout(() => {
                startQueue(laterLogs, { awaitUser: false, onComplete: () => setDebateComplete(true) });
              }, 700);
            } else {
              setAwaitingUserTurn(true);
            }
          }, delay);
        }
        return;
      }

      // SSE 모드
      if (!sid) { setError('세션 ID가 없습니다.'); return; }

      // 제출 직후 즉시 타이핑 인디케이터 표시 (백엔드 응답 대기 중)
      if (!isChained) setIsTyping('...');

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        for await (const { type, data } of readSSE(
          buildApiUrl(`/api/debates/${sid}/submit`),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
            body: JSON.stringify({
            content: normalizedContent,
            ...(opponentId && !isChained ? { target_id: opponentId } : {}),
          }),
          },
          ctrl.signal,
        )) {
          const raw = JSON.parse(data);
          if (type === 'turn') {
            const log = buildLogFromSSE(raw.entry, resolveLabelRef.current);
            console.log(`[SSE submit] turn 수신: speaker=${log.speaker} speakerId=${raw.entry?.speaker_id ?? raw.entry?.speakerId} stance=${raw.entry?.stance} turn=${log.turnNumber}`);
            if (log.speaker === '나') continue;
            if (raw.analysis) {
              const snapshot = buildLiveAnalysisSnapshot(raw.analysis);
              const isUser = snapshot.speakerId === 'user' || snapshot.speakerId === '사용자';
              if (isUser) {
                setLiveAnalysis({ ...snapshot, resolvedSpeaker: '나' });
              } else {
                log._analysis = snapshot;
              }
            }
            queueRef.current.push(log);
            if (!isPlayingRef.current) playNextRef.current?.();
          } else if (type === 'waiting') {
            const wf = raw.waiting_for ?? raw.waitingFor ?? null;
            const finished = raw.is_finished ?? raw.isFinished ?? false;
            const draft = raw.synthesis_draft ?? raw.synthesisDraft ?? null;
            setWaitingFor(wf);
            if (finished) {
              if (draft) setSynthesisDraft(draft);
              setDebateComplete(true);
            } else if (
              normalizedPendingAttack &&
              wf === 'user_free_rebuttal' &&
              phase === 'free_rebuttal' &&
              !isChained &&
              freeRebuttalUserTurnCountRef.current <= 1
            ) {
              // 답변 제출 후 같은 단계가 유지될 때만 공격을 자동으로 별도 제출
              await submitTurnRef.current(normalizedPendingAttack, 'free_rebuttal', null, true);
            } else {
              // 백엔드가 다른 단계로 넘어갔다면 pendingAttack은 자동 폐기
              queueAwaitUserRef.current = true;
              if (!isPlayingRef.current) {
                // 큐가 이미 비어 있으면 '...' 인디케이터가 남아있을 수 있으므로 클리어
                setIsTyping(null);
                setAwaitingUserTurn(true);
              }
            }
          }
        }
      } catch (e) {
        if (e.name !== 'AbortError') setError(e?.message ?? '제출 중 오류가 발생했습니다.');
      }
    },
    [debateParams, userStance, agentCount, startQueue],
  );

  submitTurnRef.current = submitTurn;

  // 하위 호환: submitOpening = stage 1 제출
  const submitOpening = useCallback(
    (content) => submitTurn(content, 'opening'),
    [submitTurn],
  );

  const pauseQueue = useCallback(() => {
    pausedRef.current = true;
    clearTimer();
    setIsTyping(null);
    isPlayingRef.current = false;
  }, [clearTimer]);

  const resumeQueue = useCallback(() => {
    pausedRef.current = false;
    if (!isPlayingRef.current && queueRef.current.length > 0) {
      playNextRef.current?.();
    }
  }, []);

  return {
    logs: visibleLogs,
    isTyping,
    awaitingUserTurn,
    openingComplete,
    debateComplete,
    openingSubmitted: openingComplete,
    loading: isTyping !== null,
    error,
    sessionId,
    waitingFor,
    stage3CanAttack: freeRebuttalUserTurnCount === 0,
    synthesisDraft,
    liveAnalysis,
    submitOpening,
    submitTurn,
    pauseQueue,
    resumeQueue,
  };
}
