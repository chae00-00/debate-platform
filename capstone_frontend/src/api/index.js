export const BASE_URL = 'http://localhost:8080';

export const buildApiUrl = (path) => `${BASE_URL}${path}`;

export const apiFetch = async (path, options = {}) => {
  const res = await fetch(buildApiUrl(path), {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
};
