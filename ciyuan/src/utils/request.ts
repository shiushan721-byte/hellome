const API_BASE_URL: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || '';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | string;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { body, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((customHeaders as Record<string, string>) || {}),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...rest,
    headers,
    body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('auth-expired'));
  }

  const json: ApiResponse<T> = await response.json();
  return json;
}

function unwrap<T>(res: ApiResponse<T>): T {
  if (res.code !== 200) {
    throw new ApiError(res.code, res.message || '请求失败');
  }
  return res.data;
}

export async function post<T = unknown>(
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const res = await request<T>(path, { method: 'POST', body });
  return unwrap(res);
}

export async function get<T = unknown>(path: string): Promise<T> {
  const res = await request<T>(path, { method: 'GET' });
  return unwrap(res);
}

export async function patch<T = unknown>(
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const res = await request<T>(path, { method: 'PATCH', body });
  return unwrap(res);
}

export async function del<T = unknown>(path: string): Promise<T> {
  const res = await request<T>(path, { method: 'DELETE' });
  return unwrap(res);
}
