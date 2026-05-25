const FORM_BASE = 'https://docs.google.com/forms/d/1luwzbqHTfWLXWSCIb4CFE4AHdXOxsKWtng1q4dbGano/viewform';

export const buildSurveyPrefillUrl = ({ nickname = '', topicTitle = '', stance = '' } = {}) => {
  const params = new URLSearchParams();
  if (nickname) params.set('entry.458874043', nickname);
  if (topicTitle) params.set('entry.797411540', topicTitle);
  if (stance) params.set('entry.62340958', stance);
  const qs = params.toString();
  return qs ? `${FORM_BASE}?${qs}` : FORM_BASE;
};
