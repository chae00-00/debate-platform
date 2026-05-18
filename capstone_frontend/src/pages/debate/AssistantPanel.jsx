import { useEffect, useRef, useState } from 'react';
import { getAssistantGuide } from '../../api/debatesApi';

const PHASE_LABEL = {
  opening: '입론',
  chained_rebuttal: '연쇄 논박',
  free_rebuttal: '자유 논박',
  role_reversal: '역할 반전',
  synthesis: '종합',
};

const STAGE_TO_PHASE = {
  1: 'opening',
  2: 'chained_rebuttal',
  3: 'free_rebuttal',
  4: 'role_reversal',
  5: 'synthesis',
};

export default function AssistantPanel({ sessionId, currentStage, stage3Opponent }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const prevKey = useRef('');

  const phase = STAGE_TO_PHASE[currentStage];
  const opponentId = currentStage === 3 ? (stage3Opponent?.id ?? null) : null;
  const fetchKey = `${sessionId}-${phase}-${opponentId ?? ''}`;

  useEffect(() => {
    console.log('[AssistantPanel] sessionId:', sessionId, 'phase:', phase);
    if (!sessionId || !phase) return;
    if (prevKey.current === fetchKey) return;
    prevKey.current = fetchKey;

    setLoading(true);
    setText('');
    getAssistantGuide(sessionId, phase, opponentId)
      .then((res) => setText(res.text ?? ''))
      .catch((err) => {
        console.error('[AssistantPanel] 안내문 요청 실패:', err);
        setText('');
      })
      .finally(() => setLoading(false));
  }, [fetchKey, sessionId, phase, opponentId]);

  const phaseLabel = PHASE_LABEL[phase] ?? '';

  return (
    <section className="rounded-[32px] border border-white/80 bg-white/60 p-5 backdrop-blur-md shadow-[0_12px_32px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-900 text-white text-[13px] font-black select-none">
          V
        </div>
        <div>
          <p className="text-[13px] font-extrabold text-stone-800 leading-tight">비비드</p>
          {phaseLabel && (
            <p className="text-[10px] font-semibold text-stone-400">{phaseLabel} 안내</p>
          )}
        </div>
      </div>

      <div className="rounded-[20px] bg-white/80 px-4 py-3 shadow-inner min-h-[72px] flex items-start">
        {loading ? (
          <div className="flex flex-col gap-2 w-full pt-1">
            <div className="h-2.5 w-full rounded-full bg-stone-200 animate-pulse" />
            <div className="h-2.5 w-4/5 rounded-full bg-stone-200 animate-pulse" />
            <div className="h-2.5 w-3/5 rounded-full bg-stone-200 animate-pulse" />
          </div>
        ) : text ? (
          <p className="text-[12px] leading-relaxed text-stone-600 whitespace-pre-wrap">{text}</p>
        ) : (
          <p className="text-[12px] font-medium text-stone-300 leading-relaxed">
            {sessionId ? '안내문을 불러오는 중...' : '토론이 시작되면 활성화됩니다'}
          </p>
        )}
      </div>
    </section>
  );
}
