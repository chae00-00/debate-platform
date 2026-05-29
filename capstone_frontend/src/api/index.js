// 배포: 빈 문자열 → nginx 프록시 사용
// 로컬: VITE_API_URL=http://localhost:8080
export const BASE_URL = import.meta.env.VITE_API_URL || '';

export const buildApiUrl = (path) => `${BASE_URL}${path}`;

export const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('debate_token');
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(buildApiUrl(path), {
    headers: { 'Content-Type': 'application/json', ...authHeader, ...options.headers },
    ...options,
  });
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.message ? ` - ${body.message}` : '';
    } catch {
      try {
        const text = await res.text();
        detail = text ? ` - ${text}` : '';
      } catch {}
    }
    throw new Error(`API error ${res.status}: ${path}${detail}`);
  }
  return res.json();
};

export const logout = async () => {
  try {
    await fetch(buildApiUrl('/api/auth/logout'), { method: 'POST' });
  } catch {}
  localStorage.removeItem('debate_token');
  localStorage.removeItem('debate_user_nickname');
};
