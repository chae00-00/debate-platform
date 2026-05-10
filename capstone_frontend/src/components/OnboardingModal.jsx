import { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    title: '사전 설문',
    desc: '토론 전 주제에 대한 현재 입장과 자신감을 기록해요.',
    color: 'bg-stone-800',
  },
  {
    number: '02',
    title: '사전 근거 작성',
    desc: '지금 알고 있는 내용만으로 찬반 논거를 자유롭게 작성해요.',
    color: 'bg-stone-700',
  },
  {
    number: '03',
    title: 'AI와 토론',
    desc: '설정한 AI 에이전트와 실제 토론을 진행해요.',
    color: 'bg-stone-600',
  },
  {
    number: '04',
    title: '사후 근거 작성',
    desc: '토론을 마친 후, 새롭게 알게 된 논거를 다시 작성해요.',
    color: 'bg-stone-500',
  },
  {
    number: '05',
    title: '결과 리포트',
    desc: '토론 전후 논증 역량 변화를 분석한 리포트를 확인해요.',
    color: 'bg-stone-400',
  },
];

export default function OnboardingModal({ onClose }) {
  const [neverShow, setNeverShow] = useState(false);

  const handleClose = () => {
    if (neverShow) {
      localStorage.setItem('onboarding_done', 'true');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 모달 카드 */}
      <div className="relative z-10 w-full max-w-2xl rounded-[40px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(245,245,244,0.96))] px-8 py-9 shadow-[0_32px_80px_rgba(0,0,0,0.18)]">
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition-all hover:bg-stone-200 hover:scale-110"
        >
          <X size={16} />
        </button>

        {/* 헤더 */}
        <div className="mb-8 text-center">
          <span className="mb-3 inline-block rounded-full bg-stone-800 px-5 py-1.5 text-sm font-extrabold text-white">
            서비스 안내
          </span>
          <h2 className="text-[30px] font-black tracking-tight text-stone-900">
            이렇게 진행돼요
          </h2>
          <p className="mt-2 text-[15px] font-medium text-stone-500">
            토론 전후 논증 역량 변화를 측정하는 5단계 과정이에요.
          </p>
        </div>

        {/* 스텝 목록 */}
        <div className="flex flex-col gap-3">
          {STEPS.map((step, i) => (
            <div key={step.number} className="flex items-center gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${step.color} text-sm font-black text-white shadow-sm`}>
                {step.number}
              </div>
              <div className="flex-1">
                <span className="text-[15px] font-extrabold text-stone-800">{step.title}</span>
                <span className="ml-2 text-[14px] font-medium text-stone-500">{step.desc}</span>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight size={16} className="shrink-0 text-stone-300" />
              )}
            </div>
          ))}
        </div>

        {/* 하단 */}
        <div className="mt-8 flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-stone-400">
            <input
              type="checkbox"
              checked={neverShow}
              onChange={(e) => setNeverShow(e.target.checked)}
              className="rounded"
            />
            다시 보지 않기
          </label>
          <button
            onClick={handleClose}
            className="rounded-full bg-stone-900 px-8 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-black"
          >
            주제 선택하기 →
          </button>
        </div>
      </div>
    </div>
  );
}
