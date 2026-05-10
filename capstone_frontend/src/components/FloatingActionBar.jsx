const FloatingActionBar = ({ selectedSubTopics, stage, userStance, onEnter }) => {
  const showBar = selectedSubTopics.length > 0 && stage === 1 && !!userStance;

  return (
    <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
      showBar ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-24 opacity-0 scale-90'
    }`}>
      {showBar && (
        <button
          onClick={onEnter}
          className="flex items-center gap-4 px-12 py-5 bg-stone-900 text-white rounded-full font-bold text-xl hover:bg-black hover:scale-105 active:scale-95 transition-all shadow-2xl cursor-pointer"
        >
          설문 시작하기
        </button>
      )}
    </div>
  );
};

export default FloatingActionBar;
