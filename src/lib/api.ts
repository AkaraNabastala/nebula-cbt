const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE = (configuredBase || "/api").replace(/\/+$/, "");

type ApiOptions = Omit<RequestInit, "headers"> & {
  token?: string;
  headers?: HeadersInit;
};

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { token, headers: suppliedHeaders, ...init } = options;
  const headers = new Headers(suppliedHeaders);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const record =
      typeof payload === "object" && payload !== null
        ? (payload as { message?: unknown })
        : undefined;

    const message = Array.isArray(record?.message)
      ? record.message.join(", ")
      : typeof record?.message === "string"
        ? record.message
        : `Permintaan gagal (${response.status}).`;

    throw new Error(message);
  }

  return payload as T;
}
