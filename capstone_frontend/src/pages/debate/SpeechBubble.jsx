import { TYPE_STYLES } from './mockData';
import { renderMarkdown } from './markdownRenderer';

export default function SpeechBubble({ log }) {
  if (log.moderator) {
    return (
      <div className="flex flex-col items-center gap-1 py-0.5">
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-stone-200/60" />
          <span className="text-[12px] font-bold text-stone-500 shrink-0">사회자</span>
          <div className="flex-1 h-px bg-stone-200/60" />
        </div>
        <p className="text-[14px] font-medium text-stone-600 leading-relaxed text-center max-w-[92%] px-2 py-1">
          {log.text}
        </p>
      </div>
    );
  }

  const speakerLabel = log.speaker ?? '';
  const isMine = speakerLabel.includes('나') || speakerLabel === '사용자';
  const phaseText = String(log.phase ?? '').toLowerCase();
  const typeText = String(log.type ?? '');
  const normalizedPhase = phaseText.replace(/[\s-]+/g, '_');
  const roleByStage = Number(log.stage) === 4;
  const roleByPhase = normalizedPhase.includes('role_reversal') || normalizedPhase.includes('reversal');
  const roleByType = /역할\s*반전/.test(typeText);
  const isRoleReversal = roleByStage || roleByPhase || roleByType;

  const normalizedSide = String(log.side ?? '').toLowerCase();
  const getDisplaySide = (side) => {
    if (!isRoleReversal) return side;

    // 역할반전 단계에서는 상대 화자 라벨 기준으로 진영색을 강제 반전한다.
    // 예: "반대 1" -> 파란색(찬성 톤), "찬성 1" -> 빨간색(반대 톤)
    if (!isMine) {
      if (speakerLabel.includes('반')) return 'pro';
      if (speakerLabel.includes('찬')) return 'con';
    }

    if (side === 'pro') return 'con';
    if (side === 'con') return 'pro';
    return side;
  };
  const displaySide = getDisplaySide(normalizedSide);
  const sideLabel = displaySide === 'pro' ? '찬성' : displaySide === 'con' ? '반대' : '중립';
  const compressSpeakerLabel = (label) => {
    const normalized = label ?? '';
    if (normalized === '사용자' || normalized.includes('나')) return '나';

    const compact = normalized
      .replace('찬성', '찬')
      .replace('반대', '반')
      .replace('agent_', '');

    const match = compact.match(/^(찬|반)?\s*(\d+)/);
    if (match) return `${match[1] ?? ''}${match[2]}`;

    if (compact === '페어 에이전트') return '반1';
    return compact.length > 3 ? compact.slice(0, 3) : compact;
  };
  const getSpeakerDisplay = () => {
    if (speakerLabel === 'agent_1') return '반 1';
    if (speakerLabel === 'agent_2') return '반 2';
    if (speakerLabel === 'agent_3') return '찬 1';
    if (speakerLabel === '사용자') return `나(${sideLabel})`;
    if (speakerLabel.includes('나')) return speakerLabel;
    return speakerLabel;
  };
  const displaySpeaker = isMine ? `나(${sideLabel})` : getSpeakerDisplay();
  const speakerShortLabel = isMine
    ? '나'
    : compressSpeakerLabel(getSpeakerDisplay());
  const getTargetLabel = () => {
    if (log.stage === 3) {
      if (log.targetId === 'user') return '사용자';
      if (log.targetId === 'agent_1') return '페어 에이전트';
      return '논박 상대';
    }
    if (log.stage === 2) return '상대 토론자';
    return '전체 토론자';
  };
  const avatarTone = isMine
    ? displaySide === 'pro'
      ? 'bg-blue-500 text-white'
      : 'bg-rose-500 text-white'
    : displaySide === 'pro'
      ? 'bg-blue-100 text-blue-700 border border-blue-200'
      : 'bg-rose-100 text-rose-700 border border-rose-200';
  const bubbleTone = isMine
    ? displaySide === 'pro'
      ? 'bg-blue-500 text-white rounded-[20px] rounded-tr-[6px]'
      : 'bg-rose-500 text-white rounded-[20px] rounded-tr-[6px]'
    : displaySide === 'pro'
      ? 'bg-white/94 border border-blue-300/90 text-stone-800 rounded-[20px] rounded-tl-[6px] backdrop-blur-sm'
      : 'bg-white/94 border border-rose-300/90 text-stone-800 rounded-[20px] rounded-tl-[6px] backdrop-blur-sm';
  const bubbleMetaTone = isMine ? 'text-white/60' : 'text-stone-500';
  const typeBadgeTone = isMine ? 'bg-white/20 text-white' : TYPE_STYLES[log.type] || 'bg-stone-100 text-stone-600';

  return (
    <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-2 max-w-[88%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[14px] font-extrabold ${avatarTone}`}>
          {speakerShortLabel}
        </div>
        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
          {/* 말풍선 */}
          <div className={`relative px-4 py-3 text-[15px] leading-relaxed shadow-[0_8px_20px_rgba(0,0,0,0.03)] ${bubbleTone}`}>
            {/* 상단 배지 행: 유형 + 논증 구조 */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {log.side && (
                <span className={`text-[12px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                  displaySide === 'pro'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {displaySide === 'pro' ? '찬성' : '반대'}
                </span>
              )}
              {!isRoleReversal && (
                <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full shrink-0 ${typeBadgeTone}`}>
                  {log.type}
                </span>
              )}
              {isRoleReversal && (
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full shrink-0 bg-amber-100 text-amber-700">
                  {isMine ? '역할반전 중(나)' : '역할반전 중(상대)'}
                </span>
              )}
              <span className={`text-[12px] font-semibold ${bubbleMetaTone}`}>
                {displaySpeaker} → {getTargetLabel()}
              </span>
            </div>

            {/* 본문 */}
            <div className={`font-medium text-[15px] ${isMine ? 'text-white' : 'text-stone-800'}`}>
              {renderMarkdown(log.text, isMine)}
              {log.isStreaming && (
                <span className={`ml-0.5 inline-block h-4 w-1 translate-y-0.5 animate-pulse rounded-full ${isMine ? 'bg-white/80' : 'bg-stone-500/70'}`} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
