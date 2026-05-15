import { useState, useEffect } from 'react';
import { SendHorizonal, Mic, Plus, X } from 'lucide-react';
import { MAX_ARGUMENT_TABS } from './mockData';

const MIN_CHARS = {
  intro: 45,
  argument: 100,
  conclusion: 75,
  stage2Turn: 130,
  stage3: 130,
  roleReversalArgument: 60,
  roleReversalConclusion: 60,
};

export default function InputComposer({
  isMyTurn,
  isProSide,
  isFinalize,
  currentStage,
  stage3CanAttack = true,
  onSubmitOpening,
  openingLoading,
  openingError,
  openingSubmitted,
  openingComplete,
  onSubmitTurn,
  stage3Opponent,
}) {
  const [composerTab, setComposerTab] = useState('intro');
  const [composerIntro, setComposerIntro] = useState('');
  const [composerConclusion, setComposerConclusion] = useState('');
  const [composerArguments, setComposerArguments] = useState(['']);
  const [validationError, setValidationError] = useState('');

  // stage 3 전용 상태
  const [stage3Answer, setStage3Answer] = useState('');
  const [stage3Attack, setStage3Attack] = useState('');

  const isOpeningStage = currentStage === 1;
  const isFreeDebateStage = currentStage === 3;
  const isRoleReversalStage = currentStage === 4;

  // stage 4 진입 시 탭을 argument-0으로 초기화
  useEffect(() => {
    if (currentStage === 4) setComposerTab('argument-0');
    else if (currentStage === 1) setComposerTab('intro');
  }, [currentStage]);

  // ── Stage 1 / Stage 4 composer helpers ───────────────────────────────────
  // Stage 4(역할반전)는 자기소개 탭 없이 논거/결론만
  const composerTabs = isRoleReversalStage
    ? [
        ...composerArguments.map((_, index) => ({ id: `argument-${index}`, label: `논거 ${index + 1}` })),
        { id: 'conclusion', label: '결론' },
      ]
    : [
        { id: 'intro', label: '자기소개/입장표명' },
        ...composerArguments.map((_, index) => ({ id: `argument-${index}`, label: `논거 ${index + 1}` })),
        { id: 'conclusion', label: '결론' },
      ];

  const getPlaceholder = (tabId) => {
    const currentTab = composerTabs.find((tab) => tab.id === tabId);
    const placeholderLabel = tabId === 'intro' ? '자기소개와 입장 표명' : currentTab?.label ?? '내용';
    return `${placeholderLabel}에 대해 작성해주세요.`;
  };

  const getMinLength = (tabId) => {
    if (isRoleReversalStage) {
      return tabId === 'conclusion' ? MIN_CHARS.roleReversalConclusion : MIN_CHARS.roleReversalArgument;
    }
    if (tabId === 'intro') return MIN_CHARS.intro;
    if (tabId === 'conclusion') return MIN_CHARS.conclusion;
    return MIN_CHARS.argument;
  };

  const getValue = (tabId) => {
    if (tabId === 'intro') return composerIntro;
    if (tabId === 'conclusion') return composerConclusion;
    if (tabId.startsWith('argument-')) return composerArguments[Number(tabId.split('-')[1])] ?? '';
    return '';
  };

  const setValue = (tabId, value) => {
    setValidationError('');
    if (tabId === 'intro') { setComposerIntro(value); return; }
    if (tabId === 'conclusion') { setComposerConclusion(value); return; }
    if (tabId.startsWith('argument-')) {
      const index = Number(tabId.split('-')[1]);
      setComposerArguments((prev) => prev.map((item, i) => i === index ? value : item));
    }
  };

  const handleAddArgument = () => {
    if (composerArguments.length >= MAX_ARGUMENT_TABS) return;
    setComposerArguments((prev) => [...prev, '']);
    setComposerTab(`argument-${composerArguments.length}`);
  };

  const handleRemoveArgument = (indexToRemove) => {
    if (composerArguments.length === 1) return;
    setComposerArguments((prev) => prev.filter((_, i) => i !== indexToRemove));
    if (composerTab === `argument-${indexToRemove}`) {
      setComposerTab(indexToRemove > 0 ? `argument-${indexToRemove - 1}` : 'intro');
      return;
    }
    if (composerTab.startsWith('argument-')) {
      const current = Number(composerTab.split('-')[1]);
      if (current > indexToRemove) setComposerTab(`argument-${current - 1}`);
    }
  };

  const buildOpeningContent = () => {
    const sections = [
      ['자기소개와 입장 표명', composerIntro],
      ...composerArguments.map((value, index) => [`논거 ${index + 1}`, value]),
      ['결론', composerConclusion],
    ]
      .map(([title, text]) => [title, (text ?? '').trim()])
      .filter(([, text]) => text.length > 0);
    return sections.map(([title, text]) => `## ${title}\n${text}`).join('\n\n');
  };

  const buildRoleReversalContent = () => {
    const sections = [
      ...composerArguments.map((value, index) => [`논거 ${index + 1}`, value]),
      ['결론', composerConclusion],
    ]
      .map(([title, text]) => [title, (text ?? '').trim()])
      .filter(([, text]) => text.length > 0);
    return sections.map(([title, text]) => `## ${title}\n${text}`).join('\n\n');
  };

  const clearComposer = () => {
    setComposerIntro('');
    setComposerConclusion('');
    setComposerArguments(['']);
    setComposerTab('intro');
    setValidationError('');
  };

  // ── Validation helpers ────────────────────────────────────────────────────
  const validateOpening = () => {
    const intro = composerIntro.trim();
    if (intro && intro.length < MIN_CHARS.intro) return '자기소개와 입장은 최소 45자 이상 작성해주세요.';
    for (const arg of composerArguments) {
      const t = arg.trim();
      if (t && t.length < MIN_CHARS.argument) return '논거는 최소 100자 이상 작성해주세요.';
    }
    const conclusion = composerConclusion.trim();
    if (conclusion && conclusion.length < MIN_CHARS.conclusion) return '결론은 최소 75자 이상 작성해주세요.';
    return '';
  };

  const validateRoleReversal = () => {
    for (const arg of composerArguments) {
      const t = arg.trim();
      if (t && t.length < MIN_CHARS.roleReversalArgument) return `논거는 최소 ${MIN_CHARS.roleReversalArgument}자 이상 작성해주세요.`;
    }
    const conclusion = composerConclusion.trim();
    if (conclusion && conclusion.length < MIN_CHARS.roleReversalConclusion) return `결론은 최소 ${MIN_CHARS.roleReversalConclusion}자 이상 작성해주세요.`;
    return '';
  };

  // ── Stage 1 전송 ──────────────────────────────────────────────────────────
  const handleSendOpening = async () => {
    if (!onSubmitOpening || openingLoading || openingSubmitted) return;
    const content = buildOpeningContent();
    if (!content) return;
    const err = validateOpening();
    if (err) { setValidationError(err); return; }
    setValidationError('');
    try {
      await onSubmitOpening(content);
      clearComposer();
    } catch { /* error state는 상위에서 관리 */ }
  };

  // ── Stage 4(역할반전) 전송 ────────────────────────────────────────────────
  const handleSendRoleReversal = () => {
    if (!onSubmitTurn) return;
    const content = buildRoleReversalContent();
    if (!content) return;
    const err = validateRoleReversal();
    if (err) { setValidationError(err); return; }
    setValidationError('');
    onSubmitTurn(content);
    clearComposer();
  };

  // ── Stage 3 전송 ──────────────────────────────────────────────────────────
  const handleSendStage3 = () => {
    if (!onSubmitTurn) return;
    const answer = stage3Answer.trim();
    const attack = stage3Attack.trim();
    if (!answer && !attack) return;

    if (!stage3CanAttack) {
      if (!answer) return;
      if (answer.length < MIN_CHARS.stage3) {
        setValidationError(`답변은 최소 ${MIN_CHARS.stage3}자 이상 작성해주세요.`);
        return;
      }
      setValidationError('');
      onSubmitTurn(answer);
      setStage3Answer('');
      setStage3Attack('');
      return;
    }

    if (answer && answer.length < MIN_CHARS.stage3) {
      setValidationError(`답변은 최소 ${MIN_CHARS.stage3}자 이상 작성해주세요.`);
      return;
    }
    if (attack && attack.length < MIN_CHARS.stage3) {
      setValidationError(`공격은 최소 ${MIN_CHARS.stage3}자 이상 작성해주세요.`);
      return;
    }
    setValidationError('');

    if (answer && attack) {
      onSubmitTurn(answer, attack);
    } else {
      onSubmitTurn(answer || attack);
    }
    setStage3Answer('');
    setStage3Attack('');
  };

  // ── Stage 2/5 전송 ───────────────────────────────────────────────────────
  const handleSendTurn = () => {
    if (!onSubmitTurn) return;
    const content = composerIntro.trim();
    if (!content) return;
    if (currentStage === 2 && content.length < MIN_CHARS.stage2Turn) {
      setValidationError(`발언은 최소 ${MIN_CHARS.stage2Turn}자 이상 작성해주세요.`);
      return;
    }
    setValidationError('');
    onSubmitTurn(content);
    setComposerIntro('');
  };

  // ── 최적해 확정 모달 (화면 중앙 오버레이) ────────────────────────────────
  if (isFinalize) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-[32px] bg-white shadow-2xl overflow-hidden">
            <div className={`px-6 pt-6 pb-4 ${isProSide ? 'bg-blue-50' : 'bg-rose-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isProSide ? 'bg-blue-100' : 'bg-rose-100'}`}>
                  ✦
                </div>
                <div>
                  <p className={`text-[15px] font-extrabold ${isProSide ? 'text-blue-700' : 'text-rose-700'}`}>
                    우리의 최적해
                  </p>
                  <p className="text-[12px] font-medium text-stone-500 mt-0.5">
                    이 토론을 통해 도달한 최선의 합의안을 제시해주세요.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 pt-4">
              <textarea
                value={composerIntro}
                onChange={(e) => setComposerIntro(e.target.value)}
                placeholder="토론을 통해 발견한 최선의 답을 자유롭게 작성해주세요."
                className="w-full min-h-[140px] resize-none rounded-[18px] bg-stone-50 border border-stone-200 px-4 py-3 text-[14px] font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 hide-scrollbar"
              />
              <button
                onClick={handleSendTurn}
                className={`mt-3 w-full rounded-full py-3 text-[14px] font-extrabold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  isProSide ? 'bg-blue-500 hover:bg-blue-600' : 'bg-rose-500 hover:bg-rose-600'
                }`}
              >
                최적해 확정
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── 대기 중 화면 ──────────────────────────────────────────────────────────
  if (!isMyTurn) {
    return (
      <div className="flex items-center justify-center h-[56px] text-[13px] font-bold text-stone-400 gap-2">
        <span className="flex gap-1.5">
          <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
        상대방 발언 대기 중
      </div>
    );
  }

  // ── Stage 3: 자유 논박 동시 입력 UI ──────────────────────────────────────
  if (isFreeDebateStage) {
    return (
      <div className="flex flex-col gap-2">
        {/* 헤더 */}
        <div className="flex items-center gap-1.5 px-4 pt-2 text-[12px] font-bold ${isProSide ? 'text-blue-700' : 'text-rose-700'}">
          <Mic size={14} className={`animate-subtle-pulse ${isProSide ? 'text-blue-700' : 'text-rose-700'}`} />
          <span className={isProSide ? 'text-blue-700' : 'text-rose-700'}>자유 논박 중</span>
          {stage3Opponent && (
            <span className="ml-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-500">
              vs {stage3Opponent.label}
            </span>
          )}
        </div>

        {/* 답변 + 공격 동시 입력 */}
        <div className="flex items-start gap-2 pl-2 pr-1 pb-1">
          <div className="flex-1 rounded-[22px] bg-white/75 shadow-inner divide-y divide-stone-100">
            {/* 답변 입력 */}
            <div>
              <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-stone-100 text-stone-600">답변</span>
                <span className="text-[11px] font-medium text-stone-400">상대 주장에 직접 반박하거나 내 입장을 명확히 합니다.</span>
              </div>
              <textarea
                value={stage3Answer}
                onChange={(e) => { setStage3Answer(e.target.value); setValidationError(''); }}
                placeholder="상대 주장에 대한 답변을 입력하세요."
                className="w-full min-h-[64px] max-h-[100px] resize-none bg-transparent px-4 py-2 text-[14px] font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none hide-scrollbar"
              />
              {stage3Answer.trim().length > 0 && (
                <div className={`px-4 pb-1 text-right text-[11px] font-medium ${stage3Answer.trim().length < MIN_CHARS.stage3 ? 'text-rose-400' : 'text-stone-400'}`}>
                  {stage3Answer.trim().length} / {MIN_CHARS.stage3}자
                </div>
              )}
            </div>
            {/* 공격 입력 — 활성화된 턴에만 표시 */}
            {stage3CanAttack && (
              <div>
                <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                  <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-stone-100 text-stone-600">공격</span>
                  <span className="text-[11px] font-medium text-stone-400">
                    상대 논리의 허점을 지적해 입장 자체를 약화시킵니다.
                  </span>
                </div>
                <textarea
                  value={stage3Attack}
                  onChange={(e) => { setStage3Attack(e.target.value); setValidationError(''); }}
                  placeholder="상대 입장의 허점을 공략하세요."
                  className="w-full min-h-[64px] max-h-[100px] resize-none bg-transparent px-4 py-2 text-[14px] font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none hide-scrollbar"
                />
                {stage3Attack.trim().length > 0 && (
                  <div className={`px-4 pb-1 text-right text-[11px] font-medium ${stage3Attack.trim().length < MIN_CHARS.stage3 ? 'text-rose-400' : 'text-stone-400'}`}>
                    {stage3Attack.trim().length} / {MIN_CHARS.stage3}자
                  </div>
                )}
              </div>
            )}
            {validationError && (
              <div className="px-4 py-2 text-[11px] font-bold text-rose-500">{validationError}</div>
            )}
          </div>
          <button
            className={`mt-auto flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full text-white transition-all shadow-md hover:scale-105 ${
              isProSide ? 'bg-blue-500 hover:bg-blue-600' : 'bg-rose-500 hover:bg-rose-600'
            }`}
            onClick={handleSendStage3}
          >
            <SendHorizonal size={16} className="ml-0.5" />
          </button>
        </div>
      </div>
    );
  }

  // ── Stage 1 / Stage 4(역할반전) / 기타 단계 ──────────────────────────────
  const useStructuredForm = isOpeningStage || isRoleReversalStage;
  const currentValue = getValue(composerTab);
  const currentMin = getMinLength(composerTab);
  const currentLen = currentValue.trim().length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3 px-4 pt-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className={`shrink-0 flex items-center gap-1.5 text-[12px] font-bold ${isProSide ? 'text-blue-700' : 'text-rose-700'}`}>
              <Mic size={14} className="animate-subtle-pulse" />
              {isOpeningStage ? '입론 작성 중' : isRoleReversalStage ? '역할반전 작성 중' : '발언 작성 중'}
            </div>
            {useStructuredForm && (
              <div className="min-w-0 flex-1 overflow-x-auto hide-scrollbar">
                <div className="flex items-center gap-1">
                  {composerTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setComposerTab(tab.id)}
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all ${
                        composerTab === tab.id
                          ? isProSide ? 'bg-blue-500 text-white shadow-sm' : 'bg-rose-500 text-white shadow-sm'
                          : 'bg-white/75 text-stone-500 hover:text-stone-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                  <button
                    onClick={handleAddArgument}
                    disabled={composerArguments.length >= MAX_ARGUMENT_TABS}
                    className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all ${
                      composerArguments.length >= MAX_ARGUMENT_TABS
                        ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                        : 'bg-white/75 text-stone-500 hover:bg-stone-100'
                    }`}
                  >
                    <Plus size={11} />
                    논거 추가
                  </button>
                </div>
              </div>
            )}
          </div>
          {isRoleReversalStage && (
            <div className="mt-1 text-[11px] font-medium text-stone-400">
              역할 반전: 상대 입장의 논거와 결론을 작성해주세요
            </div>
          )}
          {currentStage === 5 && (
            <div className="mt-1 text-[11px] font-medium text-stone-400">
              종합: 판정단 분석 진행 중
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 pl-2 pr-1 pb-1">
        <div className="flex-1 rounded-[22px] bg-white/75 shadow-inner">
          {useStructuredForm ? (
            <>
              <div className="flex items-center justify-between gap-2 px-4 pt-3">
                <span className="text-[15px] font-extrabold text-stone-700">
                  {composerTabs.find((tab) => tab.id === composerTab)?.label}
                </span>
                {composerTab.startsWith('argument-') && composerArguments.length > 1 && (
                  <button
                    onClick={() => handleRemoveArgument(Number(composerTab.split('-')[1]))}
                    className="shrink-0 flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                  >
                    <X size={11} />
                    삭제
                  </button>
                )}
              </div>
              <textarea
                value={currentValue}
                onChange={(e) => setValue(composerTab, e.target.value)}
                placeholder={getPlaceholder(composerTab)}
                className="w-full max-h-[100px] min-h-[68px] resize-none bg-transparent px-4 py-3 text-[14px] font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none hide-scrollbar"
              />
              {currentLen > 0 && (
                <div className={`px-4 pb-2 text-right text-[11px] font-medium ${currentLen < currentMin ? 'text-rose-400' : 'text-stone-400'}`}>
                  {currentLen} / {currentMin}자
                </div>
              )}
            </>
          ) : (
            <>
              <textarea
                value={composerIntro}
                onChange={(e) => { setComposerIntro(e.target.value); setValidationError(''); }}
                placeholder={isProSide ? '발언을 입력해주세요.' : '반박을 입력해주세요.'}
                className="w-full min-h-[96px] resize-none bg-transparent px-4 py-3 text-[14px] font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none hide-scrollbar"
              />
              {currentStage === 2 && composerIntro.trim().length > 0 && (
                <div className={`px-4 pb-2 text-right text-[11px] font-medium ${composerIntro.trim().length < MIN_CHARS.stage2Turn ? 'text-rose-400' : 'text-stone-400'}`}>
                  {composerIntro.trim().length} / {MIN_CHARS.stage2Turn}자
                </div>
              )}
            </>
          )}
        </div>

        <button
          className={`mt-auto flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full text-white transition-all shadow-md hover:scale-105 ${
            (isOpeningStage && (openingLoading || openingSubmitted))
              ? 'bg-stone-300 cursor-not-allowed'
              : isProSide ? 'bg-blue-500 hover:bg-blue-600' : 'bg-rose-500 hover:bg-rose-600'
          }`}
          onClick={isOpeningStage ? handleSendOpening : isRoleReversalStage ? handleSendRoleReversal : handleSendTurn}
          disabled={isOpeningStage && (openingLoading || openingSubmitted)}
        >
          <SendHorizonal size={16} className="ml-0.5" />
        </button>
      </div>

      <div className="px-4 pb-2 text-[11px] font-medium">
        {validationError ? (
          <span className="font-bold text-rose-500">{validationError}</span>
        ) : isOpeningStage ? (
          <span className="text-stone-400">
            {openingError
              ? `오류: ${openingError}`
              : openingComplete
                ? '입론 완료'
                : openingLoading
                  ? 'AI 입론 생성 중'
                  : openingSubmitted
                    ? '입론 제출 완료'
                    : `논거 ${composerArguments.length}/${MAX_ARGUMENT_TABS}`}
          </span>
        ) : null}
      </div>
    </div>
  );
}
