export interface ApiErrorShape {
  error?: {
    message?: string;
    details?: unknown;
  };
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {})
    },
    credentials: "include"
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const body = isJson ? ((await response.json()) as ApiErrorShape & { data?: T }) : null;

  if (!response.ok) {
    throw new Error(body?.error?.message || `Request failed (${response.status})`);
  }

  return body?.data as T;
}
