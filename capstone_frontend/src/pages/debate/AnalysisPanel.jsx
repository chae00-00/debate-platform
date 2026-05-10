import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { ANALYSIS_BY_STAGE, ANALYSIS_LAYER_CONFIG } from './mockData';

const RADAR_CENTER = { x: 110, y: 102 };
const RADAR_RADIUS = 70;
const RADAR_ANGLES = [-90, 30, 150];
const RADAR_LEVELS = [0.25, 0.5, 0.75, 1];

function polarToCartesian(angle, radius) {
  const rad = (angle * Math.PI) / 180;
  return {
    x: RADAR_CENTER.x + Math.cos(rad) * radius,
    y: RADAR_CENTER.y + Math.sin(rad) * radius,
  };
}

export default function AnalysisPanel({ showLiveAnalysis, analysis, speakerLabel }) {
  const [showMetricGuide, setShowMetricGuide] = useState(false);

  const radarAxes = ANALYSIS_LAYER_CONFIG.map((layer, index) => ({
    ...layer,
    angle: RADAR_ANGLES[index],
    value: analysis?.[layer.key] ?? 0,
  }));

  const radarPath =
    radarAxes
      .map((axis, index) => {
        const point = polarToCartesian(axis.angle, RADAR_RADIUS * axis.value);
        return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
      })
      .join(' ') + ' Z';

  return (
    <section className="relative rounded-[32px] border border-white/80 bg-white/60 p-5 backdrop-blur-md shadow-[0_12px_32px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-[14px] font-extrabold text-stone-800">실시간 대립 분석기</h3>
        <button
          type="button"
          onClick={() => setShowMetricGuide((prev) => !prev)}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-700"
          aria-label="지표 설명 보기"
          title="지표 설명"
        >
          <HelpCircle size={14} />
        </button>
      </div>

      {showMetricGuide && (
        <div className="absolute right-5 top-12 z-20 w-[280px] rounded-2xl border border-stone-200 bg-white/95 p-3 shadow-[0_14px_32px_rgba(0,0,0,0.12)] backdrop-blur-sm">
          <p className="text-[12px] font-extrabold text-stone-700">지표 설명</p>
          <div className="mt-2 space-y-2 text-[12px] leading-relaxed text-stone-600">
            <p><span className="font-bold text-stone-800">충돌 강도:</span> 두 입장이 계속 영향을 주고받는다고 가정하고, 이를 반복 시뮬레이션해 수렴한 최종 충돌 강도입니다.</p>
            <p><span className="font-bold text-stone-800">입장 거리:</span> 양측 입장이 서로 얼마나 반대 방향에 있는지를 나타냅니다.</p>
            <p><span className="font-bold text-stone-800">공격성:</span> 상대 입장을 얼마나 강하게 밀어붙이고 압박하는 발화의 강도입니다.</p>
          </div>
          <div className="mt-3 rounded-xl bg-stone-50 p-2.5">
            <p className="text-[11px] font-bold text-stone-600">삼각형 공략 가이드</p>
            <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
              세 지표 모두 높게 유지할수록 삼각형이 꽉 채워집니다. 삼각형이 꽉 찰수록 강력한 토론 퍼포먼스입니다.
            </p>
          </div>
        </div>
      )}

      {showLiveAnalysis ? (
        <div className="bg-white/80 rounded-[20px] p-4 shadow-inner">
          {/* 발언자 뱃지 */}
          {speakerLabel && (
            <div className="mb-2 flex justify-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-[11px] font-bold text-stone-600 border border-stone-200">
                <span className="h-1.5 w-1.5 rounded-full bg-stone-400 inline-block" />
                {speakerLabel}
              </span>
            </div>
          )}

          <svg viewBox="0 0 220 180" className="h-[200px] w-full">
            {/* 그리드 레벨 */}
            {RADAR_LEVELS.map((level) => {
              const points = radarAxes
                .map((axis) => {
                  const p = polarToCartesian(axis.angle, RADAR_RADIUS * level);
                  return `${p.x},${p.y}`;
                })
                .join(' ');
              return (
                <polygon
                  key={level}
                  points={points}
                  fill="none"
                  stroke={level === 1 ? '#a8a29e' : '#e7e5e4'}
                  strokeWidth={level === 1 ? '1.2' : '1'}
                  strokeDasharray={level === 1 ? '4 3' : undefined}
                />
              );
            })}
            {/* 축 선 */}
            {radarAxes.map((axis) => {
              const point = polarToCartesian(axis.angle, RADAR_RADIUS);
              return (
                <line
                  key={axis.key}
                  x1={RADAR_CENTER.x} y1={RADAR_CENTER.y}
                  x2={point.x} y2={point.y}
                  stroke="#d6d3d1" strokeWidth="1"
                />
              );
            })}
            {/* 데이터 폴리곤 */}
            <path
              d={radarPath}
              fill="rgba(28,25,23,0.08)"
              stroke="#1c1917"
              strokeWidth="2.5"
            />
            {/* 라벨 + 점 */}
            {radarAxes.map((axis) => {
              const dot = polarToCartesian(axis.angle, RADAR_RADIUS * axis.value);
              const label = polarToCartesian(axis.angle, RADAR_RADIUS + 22);
              return (
                <g key={axis.key}>
                  <circle cx={dot.x} cy={dot.y} r="3.5" fill="#1c1917" />
                  <text x={label.x} y={label.y} textAnchor="middle" fontSize="11" fontWeight="700" fill="#57534e">
                    {axis.label}
                  </text>
                  <text x={label.x} y={label.y + 14} textAnchor="middle" fontSize="11" fontWeight="800" fill="#1c1917">
                    {Math.round(axis.value * 100)}%
                  </text>
                </g>
              );
            })}
          </svg>

          {/* 삼각형 꽉 채우기 안내 */}
          <p className="mt-2 text-center text-[11px] font-bold leading-relaxed text-stone-400">
            삼각형의 세 지표가 꽉차는 방향으로 토론을 진행해주세요
          </p>
        </div>
      ) : (
        <div className="h-[220px] bg-white/80 rounded-[20px] shadow-inner flex items-center justify-center px-6 text-center">
          <p className="text-[13px] font-bold text-stone-400 leading-relaxed">
            논박 시간에 활성화됩니다
          </p>
        </div>
      )}
    </section>
  );
}
