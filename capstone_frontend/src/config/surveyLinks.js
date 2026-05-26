const SURVEY_CONFIG = {
  general: {
    pre:  { url: 'https://forms.gle/KMW5m2gd7X7iFtDc7', nickname: 'entry.1478903810', topic: 'entry.128795485',  stance: 'entry.369707955'  },
    post: { url: 'https://forms.gle/ti45LeKCUFZCuJnZ7', nickname: 'entry.362248737',  topic: 'entry.1542203521', stance: 'entry.720666818'  },
  },
  constructive: {
    pre:  { url: 'https://forms.gle/sZBYZyEWGq4PSYMP9', nickname: 'entry.1192873454', topic: 'entry.1013613500', stance: 'entry.347743783'  },
    post: { url: 'https://forms.gle/xw6C7oeUhf5J6z9b9', nickname: 'entry.1640189164', topic: 'entry.1608203634', stance: 'entry.1600936534' },
  },
};

export const getSurveyUrl = ({ debateMode = 'constructive', timing = 'pre', nickname = '', topic = '', stance = '' } = {}) => {
  const config = SURVEY_CONFIG[debateMode]?.[timing] ?? SURVEY_CONFIG.constructive.pre;
  const params = new URLSearchParams();
  if (nickname) params.set(config.nickname, nickname);
  if (topic)    params.set(config.topic,    topic);
  if (stance)   params.set(config.stance,   stance);
  const qs = params.toString();
  return qs ? `${config.url}?${qs}` : config.url;
};
