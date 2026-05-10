import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { TOPICS } from './data/topics';
import { fetchTodayTopics } from './api/topicsApi';
import { STAGE3_MAX_CYCLES } from './pages/debate/mockData';
import TopicGrid from './components/TopicGrid';
import BackgroundBubbles from './components/BackgroundBubbles';
import FixedStage from './components/FixedStage';
import TopHeader from './components/TopHeader';
import HomeLanding from './pages/HomeLanding';
import OnboardingModal from './components/OnboardingModal';
import SubTopicView from './pages/SubTopicView';
import ParamsView from './pages/ParamsView';
import PreSurvey from './pages/PreSurvey';
import PreQuiz from './pages/PreQuiz';  
import FloatingActionBar from './components/FloatingActionBar';
import DebatePage from './pages/debate/DebatePage';
import PostQuiz from './pages/PostQuiz';
import PostDebateStats from './pages/PostDebateStats';
import FinalEvaluation from './pages/FinalEvaluation';
import DebateTutorialModal from './components/DebateTutorialModal';
import Login from './pages/Login';
import { prepareDebate } from './api/debatesApi';

const App = () => {
  const getInitialRoute = () => {
    if (window.location.pathname === '/login') return '/login';
    if (window.location.pathname === '/topics') return '/topics';
    if (window.location.pathname === '/debate') return '/debate';
    if (window.location.pathname === '/post-quiz') return '/post-quiz';
    if (window.location.pathname === '/stats') return '/stats';
    if (window.location.pathname === '/evaluation') return '/evaluation';
    return '/';
  };
  const [routePath, setRoutePath] = useState(getInitialRoute);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTopic, setActiveTopic] = useState(null);
  const [selectedSubTopics, setSelectedSubTopics] = useState([]);
  const [stage, setStage] = useState(0); // 0: 세부주제, 1: 참여설정, 2: 사전설문, 3: 사전퀴즈, 4: 토론
  const [userStance, setUserStance] = useState(null);
  const [agentCount, setAgentCount] = useState(1);
  const [aiStances, setAiStances] = useState({ pro: [5, 3, 1], con: [5, 3, 1] });
  const [topics, setTopics] = useState(TOPICS); // 기본값: 하드코딩 데이터 (API 실패 시 fallback)
  const [debateParams, setDebateParams] = useState(null);
  const [preparedSessionId, setPreparedSessionId] = useState(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const debateEnterTimeoutRef = useRef(null);

  // 오늘의 주제 fetch
  useEffect(() => {
    fetchTodayTopics()
      .then(setTopics)
      .catch(() => {}); // 실패 시 하드코딩 TOPICS 유지
  }, []);

  const activeData = topics.find(t => t.id === activeTopic);
  const activeProAiCount = userStance === 'pro' ? agentCount - 1 : agentCount;
  const activeConAiCount = userStance === 'con' ? agentCount - 1 : agentCount;
  const isLoginRoute = routePath === '/login';
  const isTopicSelectionRoute = routePath === '/topics';
  const isDebateRoute = routePath === '/debate';
  const isPostQuizRoute = routePath === '/post-quiz';
  const isStatsRoute = routePath === '/stats';
  const isEvaluationRoute = routePath === '/evaluation';

  const preDebateBackground = userStance === 'pro'
    ? 'linear-gradient(to bottom right, rgba(147,197,253,0.38), rgba(219,234,254,0.22), rgba(245,245,244,0.08))'
    : userStance === 'con'
    ? 'linear-gradient(to bottom right, rgba(252,165,165,0.38), rgba(254,226,226,0.22), rgba(245,245,244,0.08))'
    : activeData
    ? `linear-gradient(to bottom right, ${activeData.accent}22, rgba(245,245,244,0.1), rgba(245,245,244,0.02))`
    : 'transparent';

  // stage 3(사전 근거 작성) 진입 시 AI 입론 백그라운드 생성 시작
  useEffect(() => {
    if (stage !== 3 || !debateParams) return;
    let cancelled = false;
    prepareDebate(debateParams)
      .then(({ sessionId }) => {
        if (cancelled) return;
        setPreparedSessionId(sessionId);
        // 토론 진입 전에 prepare가 완료되지 않아도 sessionStorage로 전달
        try {
          sessionStorage.setItem('capstone_prepared_session', JSON.stringify({ sessionId, debateParams }));
        } catch {}
      })
      .catch((err) => console.warn('[prepare] 실패:', err));
    return () => { cancelled = true; };
  }, [stage, debateParams]);

  const resetParams = () => {
    if (debateEnterTimeoutRef.current) {
      window.clearTimeout(debateEnterTimeoutRef.current);
      debateEnterTimeoutRef.current = null;
    }
    setStage(0);
    setUserStance(null);
    setAgentCount(1);
    setAiStances({ pro: [5, 3, 1], con: [5, 3, 1] });
    setDebateParams(null);
    setPreparedSessionId(null);
    try { sessionStorage.removeItem('capstone_prepared_session'); } catch {}
    setTutorialOpen(false);
    setTutorialStep(0);
  };

  const handleTopicClick = (id) => {
    setActiveTopic(id);
    setSelectedSubTopics([]);
    resetParams();
  };

  const handleClose = () => {
    setActiveTopic(null);
    setSelectedSubTopics([]);
    resetParams();
  };

  const handleEndDebate = () => {
    handleClose();
    navigate('/topics');
  };

  const toggleSubTopic = (sub) => {
    setSelectedSubTopics([sub]);
    setStage(1);
  };

  const getSelectedSubTopic = () => selectedSubTopics[0] ?? null;
  const getSelectedTopicLabel = () => {
    const selected = getSelectedSubTopic();
    return selected?.title ?? selected ?? '토론 최종 평가';
  };
  const getSelectedTopicId = () => {
    const selected = getSelectedSubTopic();
    return selected?.id ?? selected?.title ?? selected ?? debateParams?.topic ?? activeTopic;
  };

  const handleSliderChange = (side, index, value) => {
    let numVal = parseInt(value, 10);
    if (numVal < 1) numVal = 1;
    if (numVal > 5) numVal = 5;
    setAiStances(prev => {
      const newStances = [...prev[side]];
      newStances[index] = numVal;
      return { ...prev, [side]: newStances };
    });
  };

  const handleStanceSelect = (stance) => {
    setUserStance(stance);
  };

  const handleEnter = () => {
    // POST /api/debates 요청 바디 조립
    // 상대 AI 강도: 사용자가 PRO면 CON AI들, CON이면 PRO AI들
    const sameSide = userStance === 'pro' ? 'pro' : 'con';
    const opponentSide = userStance === 'pro' ? 'con' : 'pro';
    const agentIntensities = [
      ...aiStances[sameSide].slice(0, agentCount - 1),
      ...aiStances[opponentSide].slice(0, agentCount),
    ];
    const topicId = getSelectedTopicId();

    setDebateParams({
      topic: topicId,
      userStance: userStance?.toUpperCase() ?? 'PRO',
      userIntensity: 3,
      debateFormat: `${agentCount}:${agentCount}`,
      agentIntensities,
      maxCycle: 3,
    });
    setStage(2); // 참여설정 → 사전설문
  };

  useEffect(() => {
    const handlePopState = () => {
      setRoutePath(getInitialRoute());
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (debateEnterTimeoutRef.current) {
        window.clearTimeout(debateEnterTimeoutRef.current);
        debateEnterTimeoutRef.current = null;
      }
    };
  }, []);

  const navigate = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setRoutePath(path);
    if (path === '/topics' && !localStorage.getItem('onboarding_done')) {
      setShowOnboarding(true);
    }
  };

  const startDebate = () => {
    setStage(4);
    if (debateEnterTimeoutRef.current) {
      window.clearTimeout(debateEnterTimeoutRef.current);
    }
    debateEnterTimeoutRef.current = window.setTimeout(() => {
      debateEnterTimeoutRef.current = null;
      navigate('/debate');
    }, 420);
  };

  const handleEnterDebate = () => {
    setTutorialStep(0);
    setTutorialOpen(true);
  };

  const handleTutorialClose = () => {
    setTutorialOpen(false);
    startDebate();
  };

  const handleTutorialNext = () => {
    if (tutorialStep >= 4) {
      handleTutorialClose();
      return;
    }
    setTutorialStep((prev) => prev + 1);
  };

  const handleTutorialPrev = () => {
    setTutorialStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="relative isolate min-h-screen w-full overflow-hidden bg-[#F5F5F4] text-gray-800" style={{ fontFamily: 'var(--ui-font)' }}>
      <div className="pointer-events-none fixed inset-0 z-0">
        <BackgroundBubbles activeTopic={activeTopic} />
        <div
          className="absolute inset-x-0 top-0 h-[84px] md:h-[100px]"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.42), rgba(0,0,0,0.12), transparent)',
          }}
        />
        <div className="absolute inset-0 bg-[#F5F5F4]/0" />
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {isLoginRoute && (
        <Login
          onLogin={() => navigate('/')}
          onSkip={() => navigate('/')}
        />
      )}

      {!isLoginRoute && !isTopicSelectionRoute && !isDebateRoute && !isPostQuizRoute && !isStatsRoute && !isEvaluationRoute && !activeTopic && (
        <HomeLanding onCreateDebate={() => navigate('/topics')} />
      )}

      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}

      {/* [1] 메인 화면 */}
      <div className={`absolute inset-0 px-4 transition-all duration-700 z-10 overflow-auto
        ${!isLoginRoute && isTopicSelectionRoute && !activeTopic ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
      >
        <div className="mx-auto flex min-h-screen w-full items-start justify-center pt-6 md:items-center md:pt-0">
          <FixedStage baseWidth={1440} baseHeight={900}>
            <div className="relative h-[900px] w-[1440px]">
              <TopHeader />

              <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center pt-[96px] text-center">
                <h1 className="text-[48px] font-extrabold leading-[55px] tracking-[-0.03em] text-[#38332E]">
                  어떤 주제에 대해 토론할까요?
                </h1>
                <p className="mt-4 text-[18px] font-medium leading-[21px] text-[#393634]">
                  원하는 카테고리를 선택하여 세부 논제를 확인해보세요.
                </p>
              </div>

              <div className="mt-6 w-full xl:-mt-1">
                <TopicGrid topics={topics} onTopicClick={handleTopicClick} />
              </div>
            </div>
          </FixedStage>
        </div>
      </div>

      {isDebateRoute && (
        <DebatePage
          debateParams={debateParams}
          preparedSessionId={preparedSessionId}
          userStance={userStance}
          agentCount={agentCount}
          topicLabel={getSelectedTopicLabel()}
          onBack={() => navigate('/topics')}
          onExit={() => navigate('/post-quiz')}
        />
      )}

      {isPostQuizRoute && (
        <PostQuiz
          visible
          activeData={activeData}
          selectedSubTopics={selectedSubTopics}
          onComplete={(data) => {
            try {
              sessionStorage.setItem('capstone_post_quiz', JSON.stringify(data));
            } catch {}
            navigate('/stats');
          }}
        />
      )}

      {isStatsRoute && (
        <PostDebateStats onBack={handleEndDebate} onNext={() => navigate('/evaluation')} />
      )}

      {isEvaluationRoute && (
          <FinalEvaluation
          onBack={() => navigate('/stats')}
          onExit={handleEndDebate}
          topicLabel={getSelectedTopicLabel()}
        />
      )}

      {/* [3] 풀스크린 오버레이 */}
      <div
        className={`fixed inset-0 z-30 flex flex-col transition-all duration-700 delay-300
        ${activeTopic && !isDebateRoute && !isPostQuizRoute && !isStatsRoute && !isEvaluationRoute ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={stage < 4 ? { background: preDebateBackground } : undefined}
      >
        {/* 토론 페이지가 아닐 때만 네비 버튼 표시 */}
        {stage < 4 && (
          <div className="absolute top-8 left-8 right-8 md:top-12 md:left-12 md:right-12 flex justify-between z-50">
            <button
              onClick={() => setStage(prev => Math.max(0, prev - 1))}
              className={`p-4 bg-white/70 hover:bg-white text-stone-600 rounded-full backdrop-blur-md border border-stone-200 shadow-sm transition-all duration-300 hover:scale-110 ${stage > 0 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}
            >
              <ChevronLeft size={28} />
            </button>
            <button
              onClick={handleClose}
              className="p-4 bg-white/70 hover:bg-white text-stone-600 rounded-full backdrop-blur-md border border-stone-200 shadow-sm transition-all duration-300 hover:scale-110 ml-auto"
            >
              <X size={28} />
            </button>
          </div>
        )}

        <div className={`relative flex-1 flex justify-center w-full ${stage === 1 ? 'overflow-visible' : 'overflow-hidden'} ${stage < 4 ? 'mt-24 md:mt-10' : ''}`}>
          <SubTopicView
            activeData={activeData}
            selectedSubTopics={selectedSubTopics}
            onToggle={toggleSubTopic}
            visible={stage === 0}
          />
          <ParamsView
            activeData={activeData}
            selectedSubTopics={selectedSubTopics}
            userStance={userStance}
            onStanceSelect={handleStanceSelect}
            agentCount={agentCount}
            setAgentCount={setAgentCount}
            aiStances={aiStances}
            activeProAiCount={activeProAiCount}
            activeConAiCount={activeConAiCount}
            onSliderChange={handleSliderChange}
            visible={stage === 1}
          />
          <PreSurvey
            topicId={activeTopic}
            activeData={activeData}
            selectedSubTopics={selectedSubTopics}
            userStance={userStance}
            visible={stage === 2}
            onComplete={() => setStage(3)}
          />
          <PreQuiz
            topicId={activeTopic}
            activeData={activeData}
            selectedSubTopics={selectedSubTopics}
            visible={stage === 3}
            onComplete={(data) => {
              try {
                sessionStorage.setItem('capstone_pre_quiz', JSON.stringify({ topicId: getSelectedTopicId(), data }));
              } catch {}
              handleEnterDebate();
            }}
          />
          {stage === 4 && !isDebateRoute && (
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <p className="text-center text-[44px] font-extrabold tracking-tight text-stone-800">
                토론 방 생성 중 ...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* [4] 하단 플로팅 액션 바 - 참여설정(stage 1)에서만 표시 */}
      {!isDebateRoute && !isPostQuizRoute && !isStatsRoute && !isEvaluationRoute && stage < 4 && <FloatingActionBar
        selectedSubTopics={selectedSubTopics}
        stage={stage}
        userStance={userStance}
        onEnter={handleEnter}
      />}

      <DebateTutorialModal
        open={tutorialOpen}
        stepIndex={tutorialStep}
        agentCount={agentCount}
        userStance={userStance}
        onPrev={handleTutorialPrev}
        onNext={handleTutorialNext}
        onClose={handleTutorialClose}
      />
    </div>
  );
};

export default App;
