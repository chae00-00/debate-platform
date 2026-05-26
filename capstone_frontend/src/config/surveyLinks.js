const SURVEY_URLS = {
  general: {
    pre:  'https://forms.gle/KMW5m2gd7X7iFtDc7',
    post: 'https://forms.gle/ti45LeKCUFZCuJnZ7',
  },
  constructive: {
    pre:  'https://forms.gle/sZBYZyEWGq4PSYMP9',
    post: 'https://forms.gle/xw6C7oeUhf5J6z9b9',
  },
};

export const getSurveyUrl = ({ debateMode = 'constructive', timing = 'pre' } = {}) => {
  return SURVEY_URLS[debateMode]?.[timing] ?? SURVEY_URLS.constructive[timing];
};
