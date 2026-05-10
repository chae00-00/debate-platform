import { apiFetch } from './index';

export const createSession = ({ topic, userStance, agentCount, aiStances }) => {
  return apiFetch('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ topic, userStance, agentCount, aiStances }),
  });
};
