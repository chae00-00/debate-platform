import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import BackgroundBubbles from '../components/BackgroundBubbles';
import { fetchEvaluation } from '../api/evaluationApi';

const METRICS = [
  { key: 'depth',       label: '근거 확장성',   desc: '각 근거가 얼마나 구체적이고 정보량이 풍부한지',   apiKey: 'evidence_expansion' },
  { key: 'specificity', label: '지식의 구체성', desc: '주장 뒤에 데이터, 구체적인 사례, 고유명사, 수치 등이 포함되었는지', apiKey: 'knowledge_specificity' },
  { key: 'support',     label: '근거 타당성',   desc: '제시된 근거가 최종 결론을 얼마나 잘 뒷받침하는지', apiKey: 'evidence_validity' },
  { key: 'inference',   label: '논리 추론 밀도', desc: '근거와 결론 사이의 논리 연결이 얼마나 자연스럽고 탄탄한지', apiKey: 'reasoning_density' },
  { key: 'diversity',   label: '관점 다각성',   desc: '제시된 근거의 관점이 얼마나 다양한지',             apiKey: 'perspective_diversity' },
];

const MOCK_SCORES = {
  before: { depth: 2, specificity: 1, support: 2, inference: 2, diversity: 1 },
  after:  { depth: 4, specificity: 3, support: 4, inference: 3, diversity: 5 },
};

function phaseToScores(phase) {
  if (!phase) return null;
  const result = {};
  for (const m of METRICS) {
    result[m.key] = phase.scores?.[m.apiKey]?.score ?? 0;
  }
  return result;
}


// ─── 오각형 레이더 차트 ───────────────────────────────────────────────────────
function PentagonRadar({ before, after, size = 300 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r  = size * 0.34;
  const MAX = 5;
  const N   = METRICS.length;

  const angle = (i) => (Math.PI * 2 * i) / N - Math.PI / 2;

  const pt = (i, scale = 1) => ({
    x: cx + Math.cos(angle(i)) * r * scale,
    y: cy + Math.sin(angle(i)) * r * scale,
  });

  const polygon = (scores) =>
    METRICS.map((m, i) => pt(i, (scores[m.key] ?? 0) / MAX));

  const toPoints = (pts) =>
    pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const labelPt = (i) => pt(i, 1.30);

  const beforePts = polygon(before);
  const afterPts  = polygon(after);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible' }}
    >
      {[1, 2, 3, 4, 5].map((lvl) => (
        <polygon
          key={lvl}
          points={toPoints(METRICS.map((_, i) => pt(i, lvl / MAX)))}
          fill="none"
          stroke={lvl === 5 ? '#D6D3D1' : '#E7E5E4'}
          strokeWidth={lvl === 5 ? 1.5 : 1}
          strokeDasharray={lvl === 5 ? undefined : '3,3'}
        />
      ))}
      {METRICS.map((_, i) => {
        const end = pt(i);
        return (
          <line key={i} x1={cx} y1={cy}
            x2={end.x.toFixed(1)} y2={end.y.toFixed(1)}
            stroke="#E7E5E4" strokeWidth={1}
          />
        );
      })}
      <polygon points={toPoints(beforePts)} fill="rgba(148,163,184,0.15)" stroke="#94A3B8" strokeWidth={2} strokeLinejoin="round" />
      <polygon points={toPoints(afterPts)}  fill="rgba(129,140,248,0.18)" stroke="#818CF8" strokeWidth={2} strokeLinejoin="round" />
      {beforePts.map((p, i) => (
        <circle key={`b${i}`} cx={p.x} cy={p.y} r={4} fill="#94A3B8" stroke="white" strokeWidth={1.5} />
      ))}
      {afterPts.map((p, i) => (
        <circle key={`a${i}`} cx={p.x} cy={p.y} r={4} fill="#818CF8" stroke="white" strokeWidth={1.5} />
      ))}
      {[1, 3, 5].map((lvl) => {
        const p = pt(0, lvl / MAX);
        return (
          <text key={lvl} x={p.x + 5} y={p.y + 4} fontSize={9} fill="#A8A29E" fontFamily="sans-serif">{lvl}</text>
        );
      })}
      {METRICS.map((m, i) => {
        const lp = labelPt(i);
        const cos = Math.cos(angle(i));
        const anchor = cos < -0.1 ? 'end' : cos > 0.1 ? 'start' : 'middle';
        return (
          <text key={m.key} x={lp.x.toFixed(1)} y={lp.y.toFixed(1)}
            textAnchor={anchor} dominantBaseline="middle"
            fontSize={14} fontWeight="700" fill="#57534E" fontFamily="sans-serif">
            {m.label}
          </text>
        );
      })}
    </svg>
  );
}

// 단일 진영 레이더 카드 (찬성 또는 반대)
function SideRadarCard({ before, after, label, color, delta, avgBefore, avgAfter }) {
  const bestKey = METRICS.reduce((best, m) => {
    const d = (after[m.key] ?? 0) - (before[m.key] ?? 0);
    const bestDelta = (after[best] ?? 0) - (before[best] ?? 0);
    return d > bestDelta ? m.key : best;
  }, METRICS[0].key);

  const colorClass = color === 'blue'
    ? { text: 'text-blue-500', border: 'border-blue-200' }
    : { text: 'text-red-400', border: 'border-red-200' };

  return (
    <div className={`flex-1 rounded-[28px] border ${colorClass.border} bg-white/90 px-5 py-5 shadow-[0_16px_40px_rgba(0,0,0,0.06)]`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <span className={`text-[18px] font-black ${colorClass.text}`}>{label} 이해도</span>
        {delta !== null && (
          <span className={`text-[14px] font-bold px-2 py-0.5 rounded-full ${delta > 0 ? 'bg-emerald-100 text-emerald-600' : delta < 0 ? 'bg-rose-100 text-rose-500' : 'bg-stone-100 text-stone-400'}`}>
            {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}점
          </span>
        )}
      </div>
      {/* 원형 게이지 */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <SmallGauge score={avgBefore} label="사전" isGray color={color} />
        <span className="text-[22px] font-bold text-stone-300 mb-4">→</span>
        <SmallGauge score={avgAfter} label="사후" color={color} />
      </div>
      {/* 범례 */}
      <div className="mb-2 flex items-center justify-center gap-4 text-[13px] font-bold text-stone-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-slate-400" />사전
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-indigo-400" />사후
        </span>
      </div>
      {/* 레이더 */}
      <div className="flex justify-center">
        <PentagonRadar before={before} after={after} size={340} />
      </div>
      {/* 지표 리스트 */}
      <div className="mt-3 border-t border-stone-100 pt-3 space-y-2">
        {METRICS.map((m) => {
          const isBest = m.key === bestKey && ((after[m.key] ?? 0) - (before[m.key] ?? 0)) > 0;
          return (
            <div key={m.key} className={`flex items-center justify-between rounded-[10px] px-3 py-2 ${isBest ? 'bg-emerald-500' : 'bg-stone-50'}`}>
              <span className={`text-[14px] font-bold ${isBest ? 'text-white' : 'text-stone-700'}`}>{m.label}</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[13px] font-bold ${isBest ? 'text-emerald-100' : 'text-stone-400'}`}>{before[m.key]}</span>
                <span className={`text-[12px] ${isBest ? 'text-white/60' : 'text-stone-300'}`}>→</span>
                <span className={`text-[16px] font-black ${isBest ? 'text-white' : 'text-indigo-500'}`}>{after[m.key]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 좌우 분리 레이더 카드 (찬성 | 반대)
function DualRadarCard({ proBefore, proAfter, conBefore, conAfter, proDelta, conDelta, proAvgBefore, proAvgAfter, conAvgBefore, conAvgAfter }) {
  return (
    <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-5">
      <SideRadarCard before={proBefore} after={proAfter} label="찬성" color="blue" delta={proDelta} avgBefore={proAvgBefore} avgAfter={proAvgAfter} />
      <SideRadarCard before={conBefore} after={conAfter} label="반대" color="red" delta={conDelta} avgBefore={conAvgBefore} avgAfter={conAvgAfter} />
    </div>
  );
}

function SingleGauge({ score, label, isGray = false }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = 98;
  const sw = 14;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-[18px] font-extrabold tracking-[0.14em] text-stone-700">{label}</p>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E7E5E4" strokeWidth={sw} />
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke={isGray ? '#A8A29E' : '#34D399'}
            strokeWidth={sw}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[52px] font-black leading-none tracking-tight text-stone-800">{score}</p>
        </div>
      </div>
    </div>
  );
}

function SmallGauge({ score, label, isGray = false, color }) {
  const size = 190;
  const cx = size / 2;
  const cy = size / 2;
  const r = 72;
  const sw = 13;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const strokeColor = isGray ? '#D6D3D1' : (color === 'blue' ? '#3b82f6' : '#ef4444');
  const trackColor = isGray ? '#E7E5E4' : (color === 'blue' ? '#bfdbfe' : '#fecaca');

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={sw} />
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke={strokeColor}
            strokeWidth={sw}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[42px] font-black leading-none text-stone-800">{score}</p>
        </div>
      </div>
      <p className="text-[12px] font-bold text-stone-500">{label}</p>
    </div>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────
export default function PostDebateStats({ onBack = () => {}, onNext = () => {} }) {
  const [evalData, setEvalData]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    // 캐시된 평가 결과 먼저 사용
    try {
      const cached = JSON.parse(sessionStorage.getItem('capstone_evaluation'));
      if (cached) {
        setEvalData(cached);
        setLoading(false);
        return;
      }
    } catch {}

    let topicId;
    try {
      topicId = JSON.parse(sessionStorage.getItem('capstone_pre_quiz'))?.topicId;
    } catch {}

    if (!topicId) {
      setLoading(false);
      return;
    }

    fetchEvaluation(topicId)
      .then((res) => {
        sessionStorage.setItem('capstone_evaluation', JSON.stringify(res));
        setEvalData(res);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // 찬성 이해도 (전/후)
  const proBefore = evalData ? phaseToScores(evalData.pro?.pre) ?? MOCK_SCORES.before : MOCK_SCORES.before;
  const proAfter  = evalData ? phaseToScores(evalData.pro?.post) ?? MOCK_SCORES.after : MOCK_SCORES.after;
  const proDelta  = evalData?.pro?.delta_100 ?? null;
  const proAvgBefore = evalData ? Math.round(evalData.pro?.pre?.average_100 ?? 0) : 32;
  const proAvgAfter  = evalData ? Math.round(evalData.pro?.post?.average_100 ?? 0) : 72;

  // 반대 이해도 (전/후)
  const conBefore = evalData ? phaseToScores(evalData.con?.pre) ?? MOCK_SCORES.before : MOCK_SCORES.before;
  const conAfter  = evalData ? phaseToScores(evalData.con?.post) ?? MOCK_SCORES.after : MOCK_SCORES.after;
  const conDelta  = evalData?.con?.delta_100 ?? null;
  const conAvgBefore = evalData ? Math.round(evalData.con?.pre?.average_100 ?? 0) : 28;
  const conAvgAfter  = evalData ? Math.round(evalData.con?.post?.average_100 ?? 0) : 64;

  // 전체 변화량 (verdict용)
  const totalDelta = (proDelta ?? 0) + (conDelta ?? 0);

  const verdict =
    totalDelta >= 30 ? '양측 입장 이해도가 크게 성장했어요!' :
    totalDelta >= 15 ? '토론을 통해 이해도가 향상됐어요.' :
    totalDelta > 0   ? '조금씩 성장하고 있어요.' :
    totalDelta === 0 ? '점수 변화는 없었지만, 토론 경험이 쌓였어요.' :
                       '이번 결과를 발판 삼아 다시 도전해보세요.';

  return (
    <div className="absolute inset-0 overflow-y-auto hide-scrollbar bg-[#F5F5F4]">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="pointer-events-none fixed inset-0 z-0">
        <BackgroundBubbles />
        <div
          className="absolute inset-x-0 top-0 h-[84px]"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.28), rgba(0,0,0,0.08), transparent)' }}
        />
      </div>

      <button
        onClick={onBack}
        className="fixed top-6 left-6 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-stone-200 shadow-sm text-stone-500 hover:scale-110 transition-all duration-200"
      >
        <ArrowLeft size={18} />
      </button>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 pb-20 pt-16">

        <div className="mb-8 text-center">
          <span className="mb-4 inline-block rounded-full bg-stone-800 px-5 py-1.5 text-base font-extrabold text-white">
            토론 결과
          </span>
          <h2 className="text-[40px] font-black tracking-tight text-stone-800 md:text-[52px]">
            토론 전후 리포트
          </h2>
          {loading && (
            <p className="mt-3 text-[16px] font-bold text-stone-400 animate-pulse">AI가 분석 중입니다...</p>
          )}
          {error && (
            <p className="mt-3 text-[14px] font-bold text-rose-400">분석 오류: {error} (임시 데이터로 표시)</p>
          )}
        </div>

        {/* 한줄 verdict */}
        {!loading && evalData && (
          <div className="mb-5 rounded-[20px] bg-stone-800 px-6 py-4 text-center shadow-lg">
            <p className="text-[18px] font-bold text-white">{verdict}</p>
          </div>
        )}

        {/* 찬반 분리 카드 */}
        {loading || !evalData ? (
          <div className="mb-5 rounded-[36px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(245,245,244,0.94))] px-7 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.10)]">
            <p className="py-10 text-center text-[15px] font-bold text-stone-400 animate-pulse">계산중입니다...</p>
          </div>
        ) : (
          <DualRadarCard
            proBefore={proBefore} proAfter={proAfter} proDelta={proDelta}
            conBefore={conBefore} conAfter={conAfter} conDelta={conDelta}
            proAvgBefore={proAvgBefore} proAvgAfter={proAvgAfter}
            conAvgBefore={conAvgBefore} conAvgAfter={conAvgAfter}
          />
        )}

        <div className="mt-6 flex w-full justify-end rounded-[28px] border border-white/80 bg-white/80 px-5 py-3.5 backdrop-blur-md shadow-[0_16px_32px_rgba(0,0,0,0.08)]">
          <button
            type="button"
            onClick={onNext}
            disabled={loading}
            className="w-full rounded-full bg-stone-900 px-10 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
          >
            최종 평가 보기 →
          </button>
        </div>

      </div>
    </div>
  );
}
