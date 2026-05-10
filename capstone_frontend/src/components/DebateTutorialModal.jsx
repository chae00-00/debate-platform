function getLineup(agentCount, userStance) {
  const mySide = userStance === 'con' ? '반대' : '찬성';
  const opponentSide = userStance === 'con' ? '찬성' : '반대';

  if (agentCount === 1) {
    return {
      format: '1:1',
      userLabel: `사용자(${mySide})`,
      steps: [
        {
          badge: '1단계',
          title: '입론',
          summary: '총 2턴으로 시작합니다.',
          points: [
            `${opponentSide}측 AI가 먼저 입장을 펼친 뒤, 사용자가 마지막에 입론합니다.`,
            '입론 작성창은 자기소개/입장표명, 논거, 결론 탭으로 나뉘어 있습니다.',
            '핵심은 내 주장의 큰 방향을 선명하게 세우는 것입니다.',
          ],
        },
        {
          badge: '2단계',
          title: '연쇄논박',
          summary: '1쌍이 2번 주고받습니다.',
          points: [
            `${opponentSide}측 AI가 먼저 공격하고, 그 다음 사용자가 반박합니다.`,
            '상대 주장 요약 → 허점 지적 → 반박 순서로 가면 안정적입니다.',
            '수치, 사례, 인과관계의 약한 부분을 찌르는 단계입니다.',
          ],
        },
        {
          badge: '3단계',
          title: '자유논박',
          summary: '고정 4.5턴으로 짧고 강하게 진행됩니다.',
          points: [
            `${opponentSide}측 대표 AI와 사용자가 번갈아가며 핵심 쟁점을 깊게 파고듭니다.`,
            '사용자는 두 번 답변하면서 동시에 다시 공격합니다.',
            '반복보다 새로운 근거와 새로운 각도를 넣는 게 중요합니다.',
          ],
        },
        {
          badge: '4단계',
          title: '역할반전',
          summary: '서로의 입장을 바꿔 2턴만 진행합니다.',
          points: [
            `AI는 ${mySide} 측을, 사용자는 ${opponentSide} 측을 직접 옹호합니다.`,
            '내가 공격하던 논리를 가장 설득력 있게 다시 말해보는 단계입니다.',
            '상대 논리의 강점을 이해할수록 마지막 종합이 좋아집니다.',
          ],
        },
        {
          badge: '5단계',
          title: '종합 회의',
          summary: '총 6턴 동안 합의안을 정리합니다.',
          points: [
            'AI가 먼저 의견을 내고, 사용자는 두 번에 걸쳐 최종 입장을 정리합니다.',
            '마지막에는 사용자가 "우리의 최적해"를 확정합니다.',
            '누가 이겼는지보다 어떤 결론이 가장 현실적인지 정리하는 단계입니다.',
          ],
        },
      ],
    };
  }

  if (agentCount === 2) {
    return {
      format: '2:2',
      userLabel: `사용자(${mySide})`,
      steps: [
        {
          badge: '1단계',
          title: '입론',
          summary: '총 4턴으로 시작합니다.',
          points: [
            `세 명의 AI가 먼저 입론하고, ${mySide} 측 사용자 입론이 마지막에 들어갑니다.`,
            '입론 작성창은 자기소개/입장표명, 논거별 탭, 결론 탭으로 구조화되어 있습니다.',
            '에이전트의 입론을 보고 논점과 방향성을 잡는 게 중요합니다.',
          ],
        },
        {
          badge: '2단계',
          title: '연쇄논박',
          summary: '두 쌍이 각각 2번씩 맞붙습니다.',
          points: [
            '첫 번째 쌍은 AI끼리 먼저 주고받고, 두 번째 쌍에서 사용자가 참여합니다.',
            `사용자는 ${opponentSide}측 두 번째 에이전트의 공격을 받은 뒤 직접 반격합니다.`,
            '상대 주장의 허점을 짧고 강하게 찌르는 단계입니다.',
          ],
        },
        {
          badge: '3단계',
          title: '자유논박',
          summary: '사용자 vs 상대 에이전트 1명으로 4.5턴 고정입니다.',
          points: [
            `${opponentSide}측 대표 AI 한 명과만 집중적으로 주고받습니다.`,
            '사용자는 한번은 상대의 공격에 답하고, 한번은 공격을 진행합니다.',
          ],
        },
        {
          badge: '4단계',
          title: '역할반전',
          summary: '2턴만 진행되는 시점 전환 구간입니다.',
          points: [
            '상대팀 대표 AI가 먼저 사용자 편을 옹호합니다.',
            `그 다음 사용자는 ${opponentSide} 측 논리를 직접 방어합니다.`,
            '상대 입장을 생각하면서 인지 동결을 깨트리고, 사고를 재구성하는 단계입니다.',
          ],
        },
        {
          badge: '5단계',
          title: '종합 회의',
          summary: '총 12턴 동안 의견을 모읍니다.',
          points: [
            '각 AI가 서로 다른 관점에서 초기 의견을 내고, 사용자가 두 차례 개입합니다.',
            '중간 응답을 거친 뒤 마지막에는 사용자가 최종 해법을 확정합니다.',
            '현실적인 결론을 만드는 단계입니다.',
          ],
        },
      ],
    };
  }

  return {
    format: '3:3',
    userLabel: `사용자(${mySide})`,
    steps: [
      {
        badge: '1단계',
        title: '입론',
        summary: '총 6턴으로 시작합니다.',
        points: [
          `다섯 명의 AI가 먼저 입장을 펼치고, ${mySide} 측 사용자 입론이 마지막에 들어갑니다.`,
          '입론 작성창은 자기소개/입장표명, 논거별 탭, 결론 탭으로 구조화되어 있습니다.',
        ],
      },
      {
        badge: '2단계',
        title: '연쇄논박',
        summary: '세 쌍이 각각 2번씩 맞붙습니다.',
        points: [
          '앞의 두 쌍은 AI끼리 주고받고, 마지막 쌍에서 사용자가 직접 참여합니다.',
          `사용자는 ${opponentSide}측 마지막 에이전트의 공격을 받은 뒤 반격합니다.`,
          '연쇄논박은 전체 인원은 많아도 구조는 정해져 있어 흐름이 분명합니다.',
        ],
      },
      {
        badge: '3단계',
        title: '자유논박',
        summary: '사용자 vs 상대 에이전트 1명으로 4.5턴 고정입니다.',
        points: [
          `인원이 많아도 이 단계는 ${opponentSide}측 대표 AI 한 명과만 집중적으로 붙습니다.`,
          '사용자는 두 번 답변하면서 논점을 압축합니다.',
          '긴 설명보다 상대의 핵심 허점을 찌르는 게 더 중요합니다.',
        ],
      },
      {
        badge: '4단계',
        title: '역할반전',
        summary: '2턴만 진행되는 압축 구간입니다.',
        points: [
          '상대팀 대표 AI가 먼저 사용자 편을 옹호합니다.',
          `그 다음 사용자는 ${opponentSide} 측 논리를 방어합니다.`,
          '상대의 가장 강한 논리를 이해하고 재구성하는 단계입니다.',
        ],
      },
      {
        badge: '5단계',
        title: '종합 회의',
        summary: '총 18턴으로 가장 길게 진행됩니다.',
        points: [
          '여러 AI가 각자 다른 관점으로 초기 의견을 냅니다.',
          '사용자는 두 차례 개입해 흐름을 정리하고 마지막 결론을 확정합니다.',
          '관점이 많을수록 "무엇이 최적해인지" 정리하는 역할이 더 중요해집니다.',
        ],
      },
    ],
  };
}

export default function DebateTutorialModal({
  open,
  stepIndex,
  agentCount = 3,
  userStance = 'pro',
  onPrev,
  onNext,
  onClose,
}) {
  if (!open) return null;

  const lineup = getLineup(agentCount, userStance);
  const steps = lineup.steps;
  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[36px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(245,245,244,0.95))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.18)] sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-stone-900 px-4 py-1.5 text-[12px] font-extrabold tracking-[0.18em] text-white">
                토론 튜토리얼
              </span>
              <span className="inline-flex rounded-full bg-stone-100 px-3 py-1.5 text-[12px] font-bold text-stone-600">
                {lineup.format} | {lineup.userLabel}
              </span>
            </div>
            <h2 className="mt-4 text-[34px] font-black tracking-tight text-stone-900 sm:text-[40px]">
              {step.badge} {step.title}
            </h2>
            <p className="mt-3 text-[17px] font-medium leading-relaxed text-stone-600">
              {step.summary}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-[13px] font-bold text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-700"
          >
            건너뛰기
          </button>
        </div>

        <div className="space-y-3 rounded-[28px] bg-white/75 px-5 py-5 shadow-inner">
          {step.points.map((point) => (
            <div key={point} className="rounded-[18px] border border-stone-100 bg-white/90 px-4 py-3 text-[15px] font-semibold leading-relaxed text-stone-700">
              {point}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="text-[13px] font-bold text-stone-400">
            {stepIndex + 1} / {steps.length}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onPrev}
              disabled={isFirst}
              className={`rounded-full px-5 py-3 text-[14px] font-bold transition-all ${
                isFirst
                  ? 'cursor-not-allowed bg-stone-100 text-stone-300'
                  : 'bg-white text-stone-600 shadow-sm ring-1 ring-stone-200 hover:bg-stone-50'
              }`}
            >
              이전
            </button>
            <button
              type="button"
              onClick={onNext}
              className="rounded-full bg-stone-900 px-6 py-3 text-[14px] font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-black"
            >
              {isLast ? '토론 시작' : '다음'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
