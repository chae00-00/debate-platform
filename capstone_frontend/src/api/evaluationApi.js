import { apiFetch } from './index';

// quiz 응답 { arguments: string[], conclusion: string } → 단일 문자열로 변환
const formatQuizText = (quizSide) => {
  if (!quizSide) return '';
  const args = (quizSide.arguments ?? []).join('\n');
  const conclusion = quizSide.conclusion ? `\n결론: ${quizSide.conclusion}` : '';
  return args + conclusion;
};

export const fetchEvaluation = (topicId) => {
  let preQuiz, postQuiz;
  try {
    preQuiz  = JSON.parse(sessionStorage.getItem('capstone_pre_quiz'))?.data;
    postQuiz = JSON.parse(sessionStorage.getItem('capstone_post_quiz'));
  } catch {
    return Promise.reject(new Error('퀴즈 데이터를 찾을 수 없습니다.'));
  }

  if (!preQuiz || !postQuiz) {
    return Promise.reject(new Error('퀴즈 데이터를 찾을 수 없습니다.'));
  }

  return apiFetch(`/api/evaluation?topicId=${topicId}`, {
    method: 'POST',
    body: JSON.stringify({
      pre_pro:  formatQuizText(preQuiz.pro),
      pre_con:  formatQuizText(preQuiz.con),
      post_pro: formatQuizText(postQuiz.pro),
      post_con: formatQuizText(postQuiz.con),
    }),
  });
};
