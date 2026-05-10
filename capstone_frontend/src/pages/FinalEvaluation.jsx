import { useEffect, useState } from 'react';
import { ArrowLeft, Star, User, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import BackgroundBubbles from '../components/BackgroundBubbles';

// Material Symbols 아이콘 컴포넌트
function MIcon({ name, size = 20, fill = 0, weight = 400, className = '' }) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`,
        lineHeight: 1,
      }}
    >
      {name}
    </span>
  );
}

// ─── Mock 데이터 ─────────────────────────────────────────────────────────────

const FINAL_PRO_PCT = 42;
const FINAL_CON_PCT = 58;
const FINAL_WINNER  = 'con';
const WINNER_COMMENT =
  '반대 측은 전 단계에 걸쳐 수치 기반 근거를 일관되게 유지했으며, 역할반전 구간에서도 논리적 유연성을 발휘해 우위를 점했습니다.';

const METRICS = [
  { key: 'argument', label: '논증력', icon: 'psychology',        pro: 62, con: 81, user: 82 },
  { key: 'evidence', label: '근거력',  icon: 'attach_file',       pro: 54, con: 78, user: 71 },
  { key: 'language', label: '언어력',  icon: 'record_voice_over', pro: 75, con: 57, user: 75 },
];

// delta: 양수 = 찬성 우세도 증가, 음수 = 반대 우세도 증가
const TIMELINE_TURNS_MOCK = [
  {
    id: 1, turn: 30, speaker: '나(찬성)', side: 'pro', stage: 5,
    label: '최고 기여 턴', labelColor: 'emerald', delta: +6,
    summary: '전략 물자·소비재 이중 관세 구조 제안',
    feedback: '근거·논리·대안을 동시에 담은 발언으로 찬성 우세도를 가장 크게 끌어올렸습니다.',
  },
  {
    id: 2, turn: 14, speaker: '반대 1', side: 'con', stage: 3,
    label: '강력 반박', labelColor: 'rose', delta: -5,
    summary: '보조금·관세 효과의 인과 분리 공격',
    feedback: '명확한 수치 비교로 찬성 측 논거의 인과 관계를 효과적으로 흔들었습니다.',
  },
  {
    id: 3, turn: 8, speaker: '나(찬성)', side: 'pro', stage: 3,
    label: '핵심 턴', labelColor: 'blue', delta: +3,
    summary: '관세 부담의 역진적 성격 지적',
    feedback: '분배적 공정성 문제를 선제 제시해 논의 프레임을 유리하게 가져왔습니다.',
  },
  {
    id: 4, turn: 26, speaker: '나(찬성)', side: 'pro', stage: 5,
    label: '역효과 턴', labelColor: 'amber', delta: -2,
    summary: '"동의합니다" 이후 짧은 합의 발언',
    feedback: '동의 표현이 너무 이르게 나와 찬성 우세도를 오히려 하락시켰습니다.',
  },
];

const SWING_TYPE_MAP = {
  biggest_swing: { label: '최고 기여 턴', labelColor: 'emerald' },
  best_rebuttal:  { label: '강력 반박',   labelColor: 'rose'    },
  worst_turn:     { label: '역효과 턴',   labelColor: 'amber'   },
  logical_error:  { label: '논리 오류',   labelColor: 'rose'    },
};

const SWING_PHASE_TO_STAGE = {
  opening: 1, rebuttal: 2, chained_rebuttal: 2,
  free_rebuttal: 3, role_reversal: 4, synthesis: 5,
};

function mapSwingTurns(swingTurns) {
  if (!swingTurns?.length) return TIMELINE_TURNS_MOCK;
  return swingTurns.map((t, i) => {
    const isPro    = (t.side ?? '').toUpperCase() === 'PRO';
    const typeInfo = SWING_TYPE_MAP[t.type] ?? { label: '주요 턴', labelColor: 'blue' };
    // weighted_score 범위 1~10, 기준선 5
    // pro_percent 공식: 50 + (pro_ema - con_ema) * 15 에서 EMA 변화량 근사
    const ws       = t.weighted_score ?? t.impact ?? 5;
    const strength = Math.round((ws - 5) * 1.5) || 1;
    // PRO 고득점 → 찬성 상승(+), CON 고득점 → 반대 상승(-)
    const delta    = isPro ? strength : -strength;
    return {
      id:         i + 1,
      turn:       t.turn_index ?? i + 1,
      speaker:    isPro ? '찬성' : '반대',
      side:       isPro ? 'pro' : 'con',
      stage:      SWING_PHASE_TO_STAGE[t.phase] ?? 1,
      label:      typeInfo.label,
      labelColor: typeInfo.labelColor,
      delta,
      summary:    t.speech_summary || t.narrative || '-',
      feedback:   t.narrative || t.speech_summary || '-',
    };
  });
}

const MVP = {
  speaker: '나',
  side: 'pro',
  score: 76,
  reason: '3개 지표 평균 76점 — 전체 참가자 최고, 최고 점수 턴(91점) 보유',
};

const USER_FEEDBACK_METRICS = [
  {
    key: 'argument', label: '논증력', icon: 'psychology', score: 82,
    best:  { turn: 30, summary: '이중 관세 구조 제안 (91점)',     praise:  '전제-근거-대안이 모두 갖춰진 발언으로, 논리 흐름이 가장 완결된 구간이었습니다.' },
    worst: { turn: 26, summary: '"동의합니다" 짧은 발언 (38점)',   critique: '논증 없이 상대 논리에 동의해버려 찬성 측 논거를 자기 손으로 약화시켰습니다.' },
    suggestion: '합의 표현 전에 "이 부분에는 동의하나, ~에서는 여전히 차이가 있다"는 유보 조건을 달면 논증 밀도를 유지할 수 있습니다.',
  },
  {
    key: 'evidence', label: '근거력', icon: 'attach_file', score: 71,
    best:  { turn: 22, summary: 'Peterson Institute 인용 (85점)',  praise:  '신뢰도 높은 외부 기관 수치를 정확히 인용해 주장의 검증 가능성을 높였습니다.' },
    worst: { turn: 13, summary: '리쇼어링 인과 반박 (44점)',       critique: 'CHIPS Act 효과를 주장했으나 구체적 수치나 출처 없이 주장만 제시해 설득력이 약했습니다.' },
    suggestion: '핵심 발언에는 기관명·연도·수치를 한 줄로 덧붙이는 습관을 들이세요.',
  },
  {
    key: 'language', label: '언어력', icon: 'record_voice_over', score: 75,
    best:  { turn: 30, summary: '"이중 구조" 구분 발언 (88점)',    praise:  '대조 구조(A에는 X, B에는 Y)를 사용해 복잡한 정책을 간결하게 전달했습니다.' },
    worst: { turn: 14, summary: '거시경제 변수 나열 (52점)',       critique: '여러 변수를 한 문장에 나열해 논점이 분산되고 핵심을 파악하기 어려웠습니다.' },
    suggestion: '한 발언에서는 하나의 핵심 논점만 전달하세요. 나열은 오히려 설득력을 희석시킵니다.',
  },
];

// ─── 공통 유틸 ────────────────────────────────────────────────────────────────
const SCORE_COLOR = (s) =>
  s >= 80 ? 'text-emerald-600' : s >= 60 ? 'text-blue-500' : s >= 50 ? 'text-amber-500' : 'text-rose-500';
// (피드백 섹션 점수 표시에만 사용)
const LABEL_COLORS = {
  emerald: 'bg-emerald-100 text-emerald-700',
  blue:    'bg-blue-100 text-blue-700',
  rose:    'bg-rose-100 text-rose-700',
  amber:   'bg-amber-100 text-amber-700',
};

// ─── 1. 대립 바 ───────────────────────────────────────────────────────────────
function ConflictBar({ proPct, conPct }) {
  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[15px] font-bold text-blue-500 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />찬성 측
        </span>
        <span className="text-[15px] font-bold text-red-400 flex items-center gap-1.5">
          반대 측<span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        </span>
      </div>
      <div className="relative h-8 w-full rounded-full overflow-hidden bg-stone-100">
        <div className="absolute left-0 top-0 h-full"
          style={{ width: `${proPct}%`, background: 'linear-gradient(90deg,#2563eb,#60a5fa)', borderRadius: '9999px 0 0 9999px' }} />
        <div className="absolute right-0 top-0 h-full"
          style={{ width: `${conPct}%`, background: 'linear-gradient(270deg,#dc2626,#f87171)', borderRadius: '0 9999px 9999px 0' }} />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[20px] font-extrabold text-blue-500">{proPct}%</span>
        <span className={`text-[14px] font-bold px-3 py-1 rounded-full ${
          proPct > conPct ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'
        }`}>
          {proPct > conPct ? '찬성 우세' : '반대 우세'}
        </span>
        <span className="text-[20px] font-extrabold text-red-400">{conPct}%</span>
      </div>
    </div>
  );
}

// ─── 2. 삼각형 레이더 ─────────────────────────────────────────────────────────
function TriangleRadar({ metrics, size = 220 }) {
  const cx = size / 2, cy = size / 2 + 8, r = size * 0.31, MAX = 100;
  const angle  = (i) => (Math.PI * 2 * i) / 3 - Math.PI / 2;
  const pt     = (i, s = 1) => ({ x: cx + Math.cos(angle(i)) * r * s, y: cy + Math.sin(angle(i)) * r * s });
  const toStr  = (pts) => pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const proPts  = metrics.map((m, i) => pt(i, m.pro  / MAX));
  const conPts  = metrics.map((m, i) => pt(i, m.con  / MAX));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {[25, 50, 75, 100].map(lvl => (
        <polygon key={lvl} points={toStr(metrics.map((_, i) => pt(i, lvl / MAX)))}
          fill="none" stroke={lvl === 100 ? '#D6D3D1' : '#ECEAE9'}
          strokeWidth={lvl === 100 ? 1.5 : 1} strokeDasharray={lvl === 100 ? undefined : '3,3'} />
      ))}
      {metrics.map((_, i) => { const e = pt(i); return <line key={i} x1={cx} y1={cy} x2={e.x.toFixed(1)} y2={e.y.toFixed(1)} stroke="#E7E5E4" strokeWidth={1} />; })}
      <polygon points={toStr(conPts)}  fill="rgba(239,68,68,0.10)"  stroke="#ef4444" strokeWidth={1.8} strokeLinejoin="round" />
      <polygon points={toStr(proPts)}  fill="rgba(59,130,246,0.12)" stroke="#3b82f6" strokeWidth={1.8} strokeLinejoin="round" />
      {proPts.map( (p, i) => <circle key={`p${i}`} cx={p.x} cy={p.y} r={3.5} fill="#3b82f6" stroke="white" strokeWidth={1.5} />)}
      {conPts.map( (p, i) => <circle key={`c${i}`} cx={p.x} cy={p.y} r={3.5} fill="#ef4444" stroke="white" strokeWidth={1.5} />)}
      {metrics.map((m, i) => {
        const lp = { x: cx + Math.cos(angle(i)) * r * 1.35, y: cy + Math.sin(angle(i)) * r * 1.35 };
        const cos = Math.cos(angle(i));
        return <text key={m.key} x={lp.x.toFixed(1)} y={lp.y.toFixed(1)}
          textAnchor={cos < -0.1 ? 'end' : cos > 0.1 ? 'start' : 'middle'} dominantBaseline="middle"
          fontSize={13} fontWeight="700" fill="#44403C" fontFamily="sans-serif">{m.label}</text>;
      })}
    </svg>
  );
}

// ─── 3. 능력치 행 ─────────────────────────────────────────────────────────────
function MetricRow({ label, icon, pro, con, user }) {
  const diff = pro - con;
  return (
    <div className="flex items-center justify-between rounded-[14px] bg-stone-50 px-4 py-4">
      <div className="flex items-center gap-3">
        <MIcon name={icon} size={24} fill={1} className="text-stone-400" />
        <div>
          <p className="text-[16px] font-extrabold text-stone-800">{label}</p>
          <p className="text-[14px] text-stone-400">나: <span className="font-extrabold text-emerald-600">{user}점</span></p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-blue-500 w-6 text-right">찬</span>
            <div className="relative h-4 w-24 rounded-full bg-stone-200 overflow-hidden">
              <div className="absolute left-0 top-0 h-full rounded-full"
                style={{ width: `${pro}%`, background: 'linear-gradient(90deg,#3b82f6,#93c5fd)' }} />
            </div>
            <span className="text-[15px] font-extrabold text-blue-600 w-8 text-right">{pro}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-red-400 w-6 text-right">반</span>
            <div className="relative h-4 w-24 rounded-full bg-stone-200 overflow-hidden">
              <div className="absolute left-0 top-0 h-full rounded-full"
                style={{ width: `${con}%`, background: 'linear-gradient(90deg,#ef4444,#fca5a5)' }} />
            </div>
            <span className="text-[14px] font-extrabold text-red-400 w-8 text-right">{con}</span>
          </div>
        </div>
        <span className={`flex items-center gap-0.5 text-[13px] font-bold w-12 justify-end ${
          diff > 0 ? 'text-blue-500' : diff < 0 ? 'text-red-400' : 'text-stone-400'
        }`}>
          {diff > 0 ? <TrendingUp size={13}/> : diff < 0 ? <TrendingDown size={13}/> : <Minus size={13}/>}
          {diff > 0 ? `+${diff}` : diff}
        </span>
      </div>
    </div>
  );
}

// ─── 4. 교차 타임라인 ─────────────────────────────────────────────────────────
function TurnCard({ turn, align }) {
  const right   = align === 'right';
  const gainPro = turn.delta > 0;
  const deltaLabel = gainPro
    ? `찬성 +${turn.delta}%`
    : `반대 +${Math.abs(turn.delta)}%`;
  const deltaColor = gainPro ? 'text-blue-500' : 'text-rose-500';
  const deltaBg    = gainPro ? 'bg-blue-50'   : 'bg-rose-50';
  return (
    <div className={`rounded-[16px] border border-stone-100 bg-white px-4 py-3.5 shadow-sm w-full ${right ? 'text-right' : 'text-left'}`}>
      <div className={`mb-2 flex items-center gap-2 flex-wrap ${right ? 'justify-end' : ''}`}>
        <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-extrabold ${LABEL_COLORS[turn.labelColor]}`}>
          {turn.label}
        </span>
        <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${
          turn.side === 'pro' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-500'
        }`}>
          {turn.speaker}
        </span>
      </div>
      <p className="text-[14px] font-semibold text-stone-700 leading-snug">{turn.summary}</p>
      <p className="mt-1.5 text-[12px] text-stone-400 leading-relaxed">{turn.feedback}</p>
      <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[13px] font-extrabold ${deltaBg} ${deltaColor}`}>
        {deltaLabel}
      </span>
    </div>
  );
}

function AlternatingTimeline({ turns }) {
  return (
    <div>
      {/* 범례 */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[13px] font-extrabold text-blue-400">← 찬성 (나)</span>
        <span className="text-[13px] font-extrabold text-rose-400">반대 (상대) →</span>
      </div>

      {/* 스크롤 영역 */}
      <div className="relative max-h-[480px] overflow-y-auto hide-scrollbar">
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-stone-200 -translate-x-1/2 pointer-events-none" />
        <div className="flex flex-col gap-5 py-1">
          {turns.map((turn) => {
            const isPro = turn.side === 'pro';
            return (
              <div key={turn.id} className="relative flex items-center">
                <div className="w-[calc(50%-32px)] pr-3 flex justify-end">
                  {isPro && <TurnCard turn={turn} align="right" />}
                </div>
                {/* 중앙 마커 — flat */}
                <div className={`z-10 flex h-[56px] w-[56px] shrink-0 flex-col items-center justify-center rounded-full ${
                  isPro ? 'bg-blue-400' : 'bg-rose-400'
                }`}>
                  <span className="text-[9px] font-semibold text-white/80">T{turn.turn}</span>
                  <span className="text-[14px] font-black text-white leading-none">
                    {turn.delta > 0 ? `+${turn.delta}%` : `${turn.delta}%`}
                  </span>
                  <span className="text-[8px] font-semibold text-white/80">{turn.stage}단계</span>
                </div>
                <div className="w-[calc(50%-32px)] pl-3 flex justify-start">
                  {!isPro && <TurnCard turn={turn} align="left" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── 5. 피드백 카드 (지표 1개) ────────────────────────────────────────────────
function FeedbackCard({ metric }) {
  return (
    <div className="rounded-[28px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(245,245,244,0.94))] px-6 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.10)] flex flex-col gap-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2.5 text-[18px] font-extrabold text-stone-800">
          <MIcon name={metric.icon} size={24} fill={1} className="text-stone-400" />
          {metric.label}
        </span>
        <span className={`text-[28px] font-black ${SCORE_COLOR(metric.score)}`}>
          {metric.score}<span className="text-[13px] font-bold text-stone-400">점</span>
        </span>
      </div>

      {/* 칭찬 */}
      <div className="rounded-[16px] bg-emerald-50 px-4 py-4">
        <p className="mb-2 flex items-center gap-2 text-[13px] font-extrabold text-emerald-700">
          <MIcon name="thumb_up" size={15} fill={1} className="text-emerald-500" />
          칭찬 · T{metric.best.turn}
          <span className="font-semibold text-emerald-600">{metric.best.summary}</span>
        </p>
        <p className="text-[13px] font-medium leading-relaxed text-emerald-900">{metric.best.praise}</p>
      </div>

      {/* 지적 */}
      <div className="rounded-[16px] bg-rose-50 px-4 py-4">
        <p className="mb-2 flex items-center gap-2 text-[13px] font-extrabold text-rose-600">
          <MIcon name="push_pin" size={15} fill={1} className="text-rose-400" />
          지적 · T{metric.worst.turn}
          <span className="font-semibold text-rose-500">{metric.worst.summary}</span>
        </p>
        <p className="text-[13px] font-medium leading-relaxed text-rose-900">{metric.worst.critique}</p>
      </div>

      {/* 제안 */}
      <div className="rounded-[16px] bg-amber-50 px-4 py-4">
        <p className="mb-2 flex items-center gap-2 text-[13px] font-extrabold text-amber-700">
          <MIcon name="lightbulb" size={15} fill={1} className="text-amber-500" />
          제안
        </p>
        <p className="text-[13px] font-medium leading-relaxed text-amber-900">{metric.suggestion}</p>
      </div>
    </div>
  );
}

// ─── 평가 데이터 → 3지표 매핑 ─────────────────────────────────────────────────
function mapToTriMetrics(phase) {
  if (!phase) return { argument: 0, evidence: 0, language: 0 };
  const rd  = (phase.reasoning_density?.score ?? 0) * 20;
  const ks  = (phase.knowledge_specificity?.score ?? 0) * 20;
  const ee  = (phase.evidence_expansion?.score ?? 0) * 20;
  const ev  = (phase.evidence_validity?.score ?? 0) * 20;
  const pd  = (phase.perspective_diversity?.score ?? 0) * 20;
  return {
    argument: Math.round((rd + ks) / 2),
    evidence: Math.round((ee + ev) / 2),
    language: Math.round(pd),
  };
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────
export default function FinalEvaluation({ onBack = () => {}, onExit = () => {}, topicLabel = '토론 최종 평가' }) {
  const [evalData, setEvalData]     = useState(null);
  const [swingTurns, setSwingTurns] = useState(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('capstone_evaluation'));
      if (stored) setEvalData(stored);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      // 토론 종료 버튼이 capstone_debate_session을 클리어하기 전에 저장한 ID 우선 사용
      let sessionId = sessionStorage.getItem('capstone_debate_session_id');
      if (!sessionId) {
        const session = JSON.parse(sessionStorage.getItem('capstone_debate_session'));
        sessionId = session?.sessionId;
      }
      if (!sessionId) return;
      fetch(`http://localhost:8080/api/debates/${sessionId}/final-report`)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(data => setSwingTurns(data.swing_turns ?? []))
        .catch(() => {});
    } catch {}
  }, []);

  // 평가 데이터 → 표시 값 도출
  const proPost  = evalData?.pro?.post  ?? null;
  const conPost  = evalData?.con?.post  ?? null;
  const proMetrics = mapToTriMetrics(proPost);
  const conMetrics = mapToTriMetrics(conPost);

  const proAvg = evalData ? Math.round(evalData.pro?.post?.average_100 ?? 0) : null;
  const conAvg = evalData ? Math.round(evalData.con?.post?.average_100 ?? 0) : null;

  // 승자 결정 (평가 있으면 평균으로, 없으면 mock)
  const finalProPct = evalData && proAvg !== null && conAvg !== null && (proAvg + conAvg) > 0
    ? Math.round((proAvg / (proAvg + conAvg)) * 100)
    : FINAL_PRO_PCT;
  const finalConPct = 100 - finalProPct;
  const finalIsPro  = finalProPct >= 50;
  const winnerComment = evalData
    ? (finalIsPro
        ? `찬성 측이 ${proAvg}점으로 반대 측(${conAvg}점)보다 높은 논증력을 보였습니다.`
        : `반대 측이 ${conAvg}점으로 찬성 측(${proAvg}점)보다 높은 논증력을 보였습니다.`)
    : WINNER_COMMENT;

  // 3지표 배열 (평가 있으면 API, 없으면 mock)
  const metricsData = [
    { key: 'argument', label: '논증력', icon: 'psychology',
      pro: evalData ? proMetrics.argument : 62,
      con: evalData ? conMetrics.argument : 81,
      user: evalData ? Math.round((proMetrics.argument + conMetrics.argument) / 2) : 82 },
    { key: 'evidence', label: '근거력', icon: 'attach_file',
      pro: evalData ? proMetrics.evidence : 54,
      con: evalData ? conMetrics.evidence : 78,
      user: evalData ? Math.round((proMetrics.evidence + conMetrics.evidence) / 2) : 71 },
    { key: 'language', label: '언어력', icon: 'record_voice_over',
      pro: evalData ? proMetrics.language : 75,
      con: evalData ? conMetrics.language : 57,
      user: evalData ? Math.round((proMetrics.language + conMetrics.language) / 2) : 75 },
  ];

  // AI 코치 피드백
  const feedbackMetrics = [
    {
      key: 'argument', label: '논증력', icon: 'psychology',
      score: metricsData[0].user,
      best:     { turn: '-', summary: proPost?.reasoning_density?.label ?? '논리 추론',    praise:  proPost?.reasoning_density?.reason ?? USER_FEEDBACK_METRICS[0].best.praise },
      worst:    { turn: '-', summary: conPost?.knowledge_specificity?.label ?? '지식 구체성', critique: conPost?.knowledge_specificity?.reason ?? USER_FEEDBACK_METRICS[0].worst.critique },
      suggestion: evalData ? (proPost?.overall_summary ?? USER_FEEDBACK_METRICS[0].suggestion) : USER_FEEDBACK_METRICS[0].suggestion,
    },
    {
      key: 'evidence', label: '근거력', icon: 'attach_file',
      score: metricsData[1].user,
      best:     { turn: '-', summary: proPost?.evidence_expansion?.label ?? '근거 확장',    praise:  proPost?.evidence_expansion?.reason ?? USER_FEEDBACK_METRICS[1].best.praise },
      worst:    { turn: '-', summary: conPost?.evidence_validity?.label ?? '근거 타당성',    critique: conPost?.evidence_validity?.reason ?? USER_FEEDBACK_METRICS[1].worst.critique },
      suggestion: evalData ? (conPost?.overall_summary ?? USER_FEEDBACK_METRICS[1].suggestion) : USER_FEEDBACK_METRICS[1].suggestion,
    },
    {
      key: 'language', label: '언어력', icon: 'record_voice_over',
      score: metricsData[2].user,
      best:     { turn: '-', summary: proPost?.perspective_diversity?.label ?? '관점 다각성', praise:  proPost?.perspective_diversity?.reason ?? USER_FEEDBACK_METRICS[2].best.praise },
      worst:    { turn: '-', summary: conPost?.perspective_diversity?.label ?? '관점 다각성', critique: conPost?.perspective_diversity?.reason ?? USER_FEEDBACK_METRICS[2].worst.critique },
      suggestion: evalData ? (proPost?.overall_summary ?? USER_FEEDBACK_METRICS[2].suggestion) : USER_FEEDBACK_METRICS[2].suggestion,
    },
  ];

  const mvpScore = evalData ? Math.max(...metricsData.map(m => m.user)) : MVP.score;
  const mvpSide  = finalIsPro ? 'pro' : 'con';

  return (
    <div className="absolute inset-0 overflow-y-auto hide-scrollbar bg-[#F5F5F4]">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="pointer-events-none fixed inset-0 z-0">
        <BackgroundBubbles />
        <div className="absolute inset-x-0 top-0 h-[84px]"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.28), rgba(0,0,0,0.08), transparent)' }} />
      </div>

      <button onClick={onBack}
        className="fixed top-6 left-6 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-stone-200 shadow-sm text-stone-500 hover:scale-110 transition-all duration-200">
        <ArrowLeft size={18} />
      </button>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-6 pb-20 pt-16 gap-6">

        {/* 헤더 */}
        <div className="text-center">
          <span className="mb-4 inline-block rounded-full bg-stone-800 px-5 py-1.5 text-base font-extrabold text-white max-w-2xl truncate">
            {topicLabel}
          </span>
          <h2 className="text-[42px] font-black tracking-tight text-stone-800">최종 결과</h2>
        </div>

        {/* ── Row 1: 최종 승자 (full width) ── */}
        <div className={`rounded-[36px] border border-white/80 px-8 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.10)] ${
          finalIsPro
            ? 'bg-[linear-gradient(145deg,rgba(219,234,254,0.9),rgba(255,255,255,0.96))]'
            : 'bg-[linear-gradient(145deg,rgba(254,226,226,0.9),rgba(255,255,255,0.96))]'
        }`}>
          <div className="flex flex-col items-center gap-3">
            <p className="text-[42px] font-black tracking-tight text-stone-900">
              {finalIsPro ? '찬성 측 승리' : '반대 측 승리'}
            </p>
            <p className="text-[15px] font-semibold text-stone-500 text-center max-w-2xl leading-relaxed">
              {winnerComment}
            </p>
          </div>
          <ConflictBar proPct={finalProPct} conPct={finalConPct} />
        </div>

        {/* ── Row 2: 능력치 분석(2fr) + 타임라인(3fr) ── */}
        <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">

          {/* 능력치 및 데이터 분석 */}
          <div className="rounded-[36px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(245,245,244,0.94))] px-7 py-7 shadow-[0_24px_60px_rgba(0,0,0,0.10)]">
            <h3 className="mb-1 text-[20px] font-extrabold text-stone-800">능력치 및 데이터 분석</h3>
            <p className="mb-5 text-[14px] text-stone-400">전체 턴 평균 · 3개 지표 진영 비교</p>
            <div className="flex flex-col items-center mb-5">
              <TriangleRadar metrics={metricsData} size={220} />
              <div className="mt-3 flex items-center gap-5 text-[13px] font-bold text-stone-600">
                <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-blue-400"/>찬성</span>
                <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-400"/>반대</span>
              </div>
            </div>
            <div className="border-t border-stone-100 pt-4 space-y-2.5">
              {metricsData.map(m => <MetricRow key={m.key} {...m} />)}
            </div>
          </div>

          {/* 핵심 전환 턴 타임라인 */}
          <div className="rounded-[36px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(245,245,244,0.94))] px-7 py-7 shadow-[0_24px_60px_rgba(0,0,0,0.10)]">
            <h3 className="mb-1 text-[20px] font-extrabold text-stone-800">핵심 전환 턴 타임라인</h3>
            <p className="mb-6 text-[14px] text-stone-400">주요 발언 5개 · PRO ↔ CON 교차 시각화</p>
            <AlternatingTimeline turns={mapSwingTurns(swingTurns)} />
          </div>
        </div>

        {/* ── Row 3: MVP (full width, 가로 바) ── */}
        <div className={`rounded-[36px] border border-white/80 px-8 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.10)] ${
          mvpSide === 'pro'
            ? 'bg-[linear-gradient(145deg,rgba(219,234,254,0.7),rgba(255,255,255,0.96))]'
            : 'bg-[linear-gradient(145deg,rgba(254,226,226,0.7),rgba(255,255,255,0.96))]'
        }`}>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 shrink-0">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
                mvpSide === 'pro' ? 'bg-blue-500' : 'bg-rose-500'
              }`}>
                <User size={30} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[22px] font-black text-stone-900">{MVP.speaker}</span>
                  <span className="flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[12px] font-extrabold text-white">
                    <Star size={11} className="fill-white" /> MVP
                  </span>
                </div>
                <p className="text-[13px] font-semibold text-stone-500">
                  {evalData ? `3개 지표 평균 ${mvpScore}점` : MVP.reason}
                </p>
              </div>
            </div>
            <div className="mx-2 h-12 w-px bg-stone-200 shrink-0" />
            <div className="flex flex-1 items-center justify-around gap-4">
              {feedbackMetrics.map(m => (
                <div key={m.key} className="flex flex-col items-center gap-1">
                  <MIcon name={m.icon} size={20} fill={1} className="text-stone-400" />
                  <span className="text-[13px] font-bold text-stone-600">{m.label}</span>
                  <span className={`text-[28px] font-black ${SCORE_COLOR(m.score)}`}>{m.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 4: AI 코치 피드백 (3열) ── */}
        <div>
          <h3 className="mb-4 text-[20px] font-extrabold text-stone-800 px-1">AI 코치 피드백</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {feedbackMetrics.map(m => <FeedbackCard key={m.key} metric={m} />)}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex w-full justify-end rounded-[28px] border border-white/80 bg-white/80 px-5 py-3.5 backdrop-blur-md shadow-[0_16px_32px_rgba(0,0,0,0.08)]">
          <button type="button" onClick={onExit}
            className="w-full rounded-full bg-stone-900 px-10 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-black sm:w-auto">
            토론 종료
          </button>
        </div>

      </div>
    </div>
  );
}
