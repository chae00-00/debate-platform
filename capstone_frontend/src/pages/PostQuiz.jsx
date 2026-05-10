import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';

const EMPTY_STANCE_FORM = { arguments: [''] };

const createInitialResponses = () => ({
  pro: { ...EMPTY_STANCE_FORM, arguments: [''] },
  con: { ...EMPTY_STANCE_FORM, arguments: [''] },
});

const STANCE_META = {
  pro: {
    tone: 'text-blue-600',
    ring: 'border-blue-100',
    panel: 'from-blue-50/85 via-white to-white',
  },
  con: {
    tone: 'text-rose-600',
    ring: 'border-rose-100',
    panel: 'from-rose-50/85 via-white to-white',
  },
};

function StanceSection({ stanceKey, title, prompt, form, autoConclusion, onArgumentChange, onAddArgument, onRemoveArgument }) {
  const meta = STANCE_META[stanceKey];

  return (
    <section className={`rounded-[28px] border border-white/90 bg-gradient-to-br ${meta.panel} px-4 py-4 backdrop-blur-md shadow-[0_18px_40px_rgba(0,0,0,0.08)] sm:rounded-[32px] sm:px-5 sm:py-5 lg:rounded-[36px] lg:px-6 lg:py-6`}>
      <div className="mb-5">
        <h3 className={`text-[24px] font-extrabold tracking-tight sm:text-[26px] lg:text-[30px] ${meta.tone}`}>
          {title}
        </h3>
        <p className="mt-2 text-[14px] font-medium leading-relaxed text-stone-500 sm:text-[15px]">
          {prompt}
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-3.5">
          {form.arguments.map((argument, index) => (
            <div
              key={`${stanceKey}-argument-${index}`}
              className={`rounded-[20px] border bg-white/95 px-4 py-3.5 shadow-[0_10px_24px_rgba(0,0,0,0.05)] sm:rounded-[24px] sm:px-5 sm:py-4 ${meta.ring}`}
            >
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <label className="text-[14px] font-bold text-stone-600">논거 {index + 1}</label>
                {form.arguments.length > 1 && index > 0 && (
                  <button
                    type="button"
                    onClick={() => onRemoveArgument(index)}
                    className="rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <textarea
                value={argument}
                onChange={(e) => onArgumentChange(index, e.target.value)}
                placeholder=""
                className="hide-scrollbar min-h-[96px] w-full resize-none bg-transparent text-[15px] font-medium leading-relaxed text-stone-800 placeholder:text-stone-400 focus:outline-none sm:min-h-[108px] sm:text-[16px]"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={onAddArgument}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-[13px] font-bold text-stone-600 shadow-sm transition-all hover:scale-105 hover:border-stone-300 hover:bg-stone-50"
          >
            <Plus size={14} />
            논거 추가
          </button>
        </div>

        <p className="border-t border-stone-200/80 pt-4 text-[16px] font-semibold leading-relaxed text-stone-700 sm:text-[17px]">
          <span className="mr-2 font-extrabold text-stone-800">따라서</span>
          {autoConclusion}
        </p>
      </div>
    </section>
  );
}

const PostQuiz = ({ visible, activeData, selectedSubTopics = [], onComplete }) => {
  const [responses, setResponses] = useState(createInitialResponses);

  const selected = selectedSubTopics[0];
  const selectedTitle = selected?.title ?? selected;
  const selectedSubTopic = selected?.title
    ? selected
    : activeData?.subTopics?.find(
      (s) => s.title === selectedTitle,
    );

  const stanceTitles = useMemo(
    () => ({
      pro: selectedSubTopic?.pro ?? '찬성측 입장',
      con: selectedSubTopic?.con ?? '반대측 입장',
    }),
    [selectedSubTopic],
  );

  const topicLabel = selectedSubTopic?.title ?? selectedTitle ?? activeData?.title ?? '주제 미선택';

  const updateStance = (stanceKey, updater) => {
    setResponses((prev) => ({ ...prev, [stanceKey]: updater(prev[stanceKey]) }));
  };

  const handleArgumentChange = (stanceKey, index, value) => {
    updateStance(stanceKey, (prev) => ({
      ...prev,
      arguments: prev.arguments.map((item, i) => (i === index ? value : item)),
    }));
  };

  const handleAddArgument = (stanceKey) => {
    updateStance(stanceKey, (prev) => ({ ...prev, arguments: [...prev.arguments, ''] }));
  };

  const handleRemoveArgument = (stanceKey, indexToRemove) => {
    updateStance(stanceKey, (prev) => ({
      ...prev,
      arguments: prev.arguments.length === 1
        ? prev.arguments
        : prev.arguments.filter((_, i) => i !== indexToRemove),
    }));
  };

  const normalizedResponses = useMemo(() => ({
    pro: {
      arguments: responses.pro.arguments.map((a) => a.trim()).filter(Boolean),
      conclusion: stanceTitles.pro,
    },
    con: {
      arguments: responses.con.arguments.map((a) => a.trim()).filter(Boolean),
      conclusion: stanceTitles.con,
    },
  }), [responses, stanceTitles]);

  return (
    <div
      className={`hide-scrollbar absolute inset-0 overflow-y-auto transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]
      ${!visible ? 'opacity-0 translate-x-32 pointer-events-none' : 'opacity-100 translate-x-0 delay-100'}`}
    >
      <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        <div className="mb-5 text-center">
          <span className="mb-2 inline-block rounded-full bg-stone-800 px-5 py-1.5 text-base font-extrabold text-white">
            {topicLabel}
          </span>
          <h2 className="text-[30px] font-extrabold tracking-tight text-stone-800 sm:text-[34px] lg:text-[38px]">
            사후 근거 작성
          </h2>
          <p className="mx-auto mt-3 max-w-4xl text-[17px] font-bold leading-relaxed text-stone-700 sm:text-[18px]">
            토론을 마치고 나서, 지금 생각하는 근거를 다시 작성해주세요.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:gap-6 xl:grid-cols-2">
          <StanceSection
            stanceKey="pro"
            title="찬성측"
            prompt='"찬성측" 근거를 지금 알고 있는 내용으로 작성해주세요.'
            form={responses.pro}
            autoConclusion={stanceTitles.pro}
            onArgumentChange={(index, value) => handleArgumentChange('pro', index, value)}
            onAddArgument={() => handleAddArgument('pro')}
            onRemoveArgument={(index) => handleRemoveArgument('pro', index)}
          />
          <StanceSection
            stanceKey="con"
            title="반대측"
            prompt='"반대측" 근거를 지금 알고 있는 내용으로 작성해주세요.'
            form={responses.con}
            autoConclusion={stanceTitles.con}
            onArgumentChange={(index, value) => handleArgumentChange('con', index, value)}
            onAddArgument={() => handleAddArgument('con')}
            onRemoveArgument={(index) => handleRemoveArgument('con', index)}
          />
        </div>

        <div className="mt-6 flex w-full justify-center rounded-[24px] border border-white/80 bg-white/82 px-4 py-3 backdrop-blur-md shadow-[0_16px_32px_rgba(0,0,0,0.08)] sm:justify-end sm:rounded-[32px] sm:px-5">
          <button
            type="button"
            onClick={() => onComplete(normalizedResponses)}
            className="w-full rounded-full bg-stone-900 px-8 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-black sm:w-auto sm:px-10 sm:py-3.5 sm:text-base"
          >
            작성 완료 →
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostQuiz;
