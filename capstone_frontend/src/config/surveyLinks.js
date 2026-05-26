const SURVEY_CONFIG = {
  general: {
    pre:  { url: 'https://docs.google.com/forms/d/e/1FAIpQLSfI47IkL6wkXBUq_j_Cgxhn8KYcUYtSBv59k2iVOWXRxSSgLA/viewform', nickname: 'entry.1478903810', topic: 'entry.128795485',  stance: 'entry.369707955'  },
    post: { url: 'https://docs.google.com/forms/d/e/1FAIpQLSfHH-S946Q2ym3TtjqQSEBDp_FvUX-gj2FdXs-0y2ePTi_byA/viewform',  nickname: 'entry.362248737',  topic: 'entry.1542203521', stance: 'entry.720666818'  },
  },
  constructive: {
    pre:  { url: 'https://docs.google.com/forms/d/e/1FAIpQLSdaNYLDjTi42VvJbyQjMFXkJbFIl0dZPnhION2DqYm9Qk_2Jg/viewform',  nickname: 'entry.1192873454', topic: 'entry.1013613500', stance: 'entry.347743783'  },
    post: { url: 'https://docs.google.com/forms/d/e/1FAIpQLSehQvYjDS3AqBA613tnUmSn0EboMJfVYGF7lAq61k06RKAj0g/viewform',  nickname: 'entry.1640189164', topic: 'entry.1608203634', stance: 'entry.1600936534' },
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
