// 토론 API는 SSE 스트리밍 방식으로 useDebateLogs 훅 내부에서 직접 처리합니다.
// POST /api/debates/prepare    → 토론 사전 준비 (백그라운드 AI 입론 생성 시작, sessionId 반환)
// GET  /api/debates/:id/stream → 버퍼 replay + 실시간 스트리밍 (prepare 이후 사용)
// POST /api/debates            → 토론 생성 + AI 입론 스트리밍 (폴백)
// POST /api/debates/:id/submit → 사용자 입력 제출 + 이후 AI 응답 스트리밍
// GET  /api/debates/:id/state  → 상태 조회 (필요 시 사용)

import { apiFetch } from './index';

export const prepareDebate = (debateParams) =>
  apiFetch('/api/debates/prepare', {
    method: 'POST',
    body: JSON.stringify(debateParams),
  });

export const getDebateState = (sessionId) =>
  apiFetch(`/api/debates/${sessionId}/state`);
