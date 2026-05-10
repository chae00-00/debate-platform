import { ExternalLink, ChevronRight } from 'lucide-react';
import { getSurveyLink } from '../config/surveyLinks';

const PreSurvey = ({ visible, topicId, activeData, selectedSubTopics = [], onComplete }) => {
  const surveyUrl = getSurveyLink(topicId);
  const hasSurveyUrl = Boolean(surveyUrl);
  const selected = selectedSubTopics[0];
  const selectedTitle = selected?.title ?? selected;
  const selectedSubTopic = selected?.title
    ? selected
    : activeData?.subTopics?.find((subTopic) => subTopic.title === selectedTitle);
  const topicLabel = selectedSubTopic?.title ?? selectedTitle ?? activeData?.title ?? '주제 미선택';

  const handleOpenForm = () => {
    window.open('about:blank', '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`hide-scrollbar absolute inset-0 overflow-y-auto transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]
      ${!visible ? 'opacity-0 translate-x-32 pointer-events-none' : 'opacity-100 translate-x-0 delay-100'}`}
    >
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center px-6 pb-16 pt-4">
        <div className="mb-8 text-center">
          <span className="inline-block px-5 py-1.5 rounded-full bg-stone-800 text-white text-base font-extrabold mb-4">
            {topicLabel}
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-stone-800 tracking-tight">
            사전 설문
          </h2>
          <p className="mt-4 text-[17px] font-bold leading-7 text-stone-700 md:text-[18px]">
            하단 설명을 참고하여 진행해 주세요.
          </p>
        </div>

        <div className="mx-auto w-full max-w-3xl rounded-[40px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(245,245,244,0.94))] px-7 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.12)] md:px-10 md:py-10">
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="w-44 h-44 rounded-full border border-stone-200 bg-white shadow-sm flex items-center justify-center text-center px-4">
              <p className="font-extrabold text-stone-900 text-xl">설문 열기</p>
            </div>
            <ChevronRight size={28} className="shrink-0 text-stone-400" strokeWidth={2.5} />
            <div className="w-44 h-44 rounded-full border border-stone-200 bg-white shadow-sm flex items-center justify-center text-center px-4">
              <p className="font-extrabold text-stone-900 text-xl">응답 제출</p>
            </div>
            <ChevronRight size={28} className="shrink-0 text-stone-400" strokeWidth={2.5} />
            <div className="w-44 h-44 rounded-full border border-stone-200 bg-white shadow-sm flex items-center justify-center text-center px-4">
              <p className="font-extrabold text-stone-900 text-xl">돌아오기</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <button
              onClick={handleOpenForm}
              disabled={!hasSurveyUrl}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-bold transition-all duration-300 ${
                hasSurveyUrl
                  ? 'bg-stone-900 text-white shadow-lg hover:scale-105 hover:bg-black'
                  : 'cursor-not-allowed bg-stone-200 text-stone-400'
              }`}
            >
              설문조사 진행하기
              <ExternalLink size={18} />
            </button>

            <button
              onClick={onComplete}
              className="rounded-full px-8 py-4 text-base font-bold transition-all duration-300 border border-stone-300 bg-white text-stone-700 hover:scale-105 hover:border-stone-400"
            >
              다음 단계
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreSurvey;
