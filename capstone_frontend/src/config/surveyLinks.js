const DEFAULT_SURVEY_URL = import.meta.env.VITE_GOOGLE_FORM_URL ?? '';

export const SURVEY_LINKS = {
  default: DEFAULT_SURVEY_URL,
  tech: import.meta.env.VITE_GOOGLE_FORM_TECH_URL ?? DEFAULT_SURVEY_URL,
  economy: import.meta.env.VITE_GOOGLE_FORM_ECONOMY_URL ?? DEFAULT_SURVEY_URL,
  society: import.meta.env.VITE_GOOGLE_FORM_SOCIETY_URL ?? DEFAULT_SURVEY_URL,
  science: import.meta.env.VITE_GOOGLE_FORM_SCIENCE_URL ?? DEFAULT_SURVEY_URL,
};

export const getSurveyLink = (topicId) => SURVEY_LINKS[topicId] ?? SURVEY_LINKS.default;
