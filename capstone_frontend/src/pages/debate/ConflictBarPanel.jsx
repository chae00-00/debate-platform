const JUDGING_FROM_STAGE = 5;

// 바 안에서 좌우로 튀는 스파크 (수평 방향만)
const SPARKS = [
  { dx: -18, dy: -3,  dur: 0.85, delay: 0.0,  size: 2.5 },
  { dx:  16, dy:  2,  dur: 0.90, delay: 0.2,  size: 2   },
  { dx: -12, dy:  4,  dur: 0.75, delay: 0.4,  size: 2   },
  { dx:  20, dy: -2,  dur: 1.0,  delay: 0.6,  size: 1.5 },
  { dx: -22, dy:  1,  dur: 0.8,  delay: 0.75, size: 1.5 },
  { dx:  14, dy:  3,  dur: 0.95, delay: 0.9,  size: 2   },
];

export default function ConflictBarPanel({ currentStage, isDebateComplete = false, liveProPercent = null, liveConPercent = null }) {
  // live 분석 데이터 우선, 없으면 50/50으로 시작
  const proPct = liveProPercent !== null ? Math.round(liveProPercent) : 50;
  const conPct = 100 - proPct;

  const isJudging = currentStage >= 4 || isDebateComplete;
  const overlayText = isDebateComplete || currentStage >= 5 ? '결과 산정 중' : '판정 준비 중';

  const sparkKeyframes = SPARKS.map((s, i) => `
    @keyframes sp${i} {
      0%   { transform: translate(-50%,-50%) translate(0,0) scale(1); opacity:1; }
      80%  { opacity: 0.4; }
      100% { transform: translate(-50%,-50%) translate(${s.dx}px,${s.dy}px) scale(0); opacity:0; }
    }
  `).join('');

  return (
    <section className="relative rounded-[32px] border border-white/80 bg-white/60 p-5 backdrop-blur-md shadow-[0_12px_32px_rgba(0,0,0,0.04)]">
      <style>{`
        ${sparkKeyframes}
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes breathe-blue {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.82; }
        }
        @keyframes breathe-red {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.82; }
        }
        @keyframes core-pulse {
          0%, 100% { transform: translate(-50%,-50%) scale(0.85); opacity: 0.85; }
          50%       { transform: translate(-50%,-50%) scale(1.2);  opacity: 1; }
        }
        .shimmer-bar::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.28) 40%, rgba(255,255,255,0.38) 50%, rgba(255,255,255,0.28) 60%, rgba(255,255,255,0) 100%);
          width: 40%;
          animation: shimmer 3.2s ease-in-out infinite;
          pointer-events: none;
        }
        .breathe-blue { animation: breathe-blue 3s ease-in-out infinite; }
        .breathe-red  { animation: breathe-red  3s ease-in-out infinite 1.5s; }
        .core-pulse   { animation: core-pulse 1.1s ease-in-out infinite; }
      `}</style>

      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-extrabold text-stone-800">대립 현황</h3>
        <span className="text-[11px] font-semibold text-stone-400">단계 {currentStage}</span>
      </div>

      <div className="relative rounded-[20px] bg-white/80 p-4 shadow-inner overflow-hidden">

        {/* 판정 중 오버레이 */}
        {isJudging && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[20px] bg-white/85 backdrop-blur-[3px]">
            <span className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-[13px] font-extrabold text-white shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              {overlayText}
            </span>
            <p className="mt-2 text-[11px] font-semibold text-stone-400">
              판정단이 전체 발언을 분석하고 있습니다
            </p>
          </div>
        )}

        {/* 찬성 vs 반대 레이블 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />
            <span className="text-[12px] font-bold text-blue-500">찬성 측</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-bold text-red-400">반대 측</span>
            <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />
          </div>
        </div>

        {/* 메인 대립 바 — overflow-hidden 으로 이펙트가 바 밖으로 안 나감 */}
        <div className="relative h-9 w-full rounded-full overflow-hidden bg-stone-100 mb-3">
          {/* 찬성 바 */}
          <div
            className="breathe-blue shimmer-bar absolute left-0 top-0 h-full overflow-hidden transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              width: `${proPct}%`,
              background: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
              borderRadius: '9999px 0 0 9999px',
            }}
          />
          {/* 반대 바 */}
          <div
            className="breathe-red shimmer-bar absolute right-0 top-0 h-full overflow-hidden transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              width: `${conPct}%`,
              background: 'linear-gradient(270deg, #dc2626 0%, #f87171 100%)',
              borderRadius: '0 9999px 9999px 0',
            }}
          />

          {/* 충돌 이펙트 — 바 안에 완전히 갇힘 */}
          <div
            className="pointer-events-none absolute top-0 h-full transition-all duration-1000"
            style={{ left: `${proPct}%` }}
          >
            {/* 경계 블러 페이드 */}
            <div
              className="absolute top-0 h-full w-8 -translate-x-1/2"
              style={{
                background: 'linear-gradient(90deg, rgba(96,165,250,0.2), rgba(255,255,255,0.85), rgba(248,113,113,0.2))',
                filter: 'blur(2px)',
              }}
            />
            {/* 코어 글로우 */}
            <div
              className="core-pulse absolute"
              style={{
                top: '50%',
                left: 0,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #fff 0%, #fde68a 45%, #f97316 80%, transparent 100%)',
                boxShadow: '0 0 8px 3px rgba(251,191,36,0.6), 0 0 14px 5px rgba(249,115,22,0.3)',
              }}
            />
            {/* 스파크 파티클 — 좌우로만 이동 */}
            {SPARKS.map((s, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  width: s.size,
                  height: s.size,
                  borderRadius: '50%',
                  background: i % 3 === 0 ? '#fff' : i % 3 === 1 ? '#fde68a' : '#fb923c',
                  animation: `sp${i} ${s.dur}s ease-out ${s.delay}s infinite`,
                  boxShadow: `0 0 ${s.size + 1}px rgba(255,200,80,0.9)`,
                }}
              />
            ))}
          </div>
        </div>

        {/* 수치 + 우세 표시 */}
        <div className="flex items-center justify-between">
          <span className="text-[16px] font-extrabold text-blue-500">{proPct}%</span>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-colors ${
            proPct > conPct
              ? 'bg-blue-50 text-blue-400'
              : proPct < conPct
              ? 'bg-red-50 text-red-400'
              : 'bg-stone-100 text-stone-400'
          }`}>
            {proPct > conPct ? '찬성 우세' : proPct < conPct ? '반대 우세' : '팽팽'}
          </span>
          <span className="text-[16px] font-extrabold text-red-400">{conPct}%</span>
        </div>
      </div>
    </section>
  );
}
