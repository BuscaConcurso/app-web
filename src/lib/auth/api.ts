export interface ApiValidationDetail {
  field: string | null;
  message: string;
}

export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
    readonly details: ApiValidationDetail[] = [],
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface SessionResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  hasPassword: boolean;
}

export interface OAuthIdentity {
  provider: "google" | "linkedin";
  email: string;
  linkedAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BC_API_URL;
if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_BC_API_URL não está definida.");
}

export const AUTH_API_BASE_URL = API_BASE_URL;
export const AUTH_CLIENT_ID = "app-web";

interface RequestOptions {
  method?: string;
  body?: unknown;
  accessToken?: string | null;
  signal?: AbortSignal;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "X-Client-Id": AUTH_CLIENT_ID,
  };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

  const timeout = AbortSignal.timeout(15_000);
  const signal = options.signal
    ? AbortSignal.any([timeout, options.signal])
    : timeout;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      credentials: "include",
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("A API demorou demais para responder. Tente novamente.");
    }
    throw error;
  }

  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

  const text = await response.text();
  let payload: {
    error?: {
      code?: string;
      message?: string;
      details?: ApiValidationDetail[];
    };
  } = {};
  if (text) {
    try {
      payload = JSON.parse(text) as typeof payload;
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const retryAfter = response.headers.get("Retry-After");
    throw new ApiError(
      payload.error?.code ?? "INTERNAL_ERROR",
      response.status,
      payload.error?.message ?? "Não foi possível concluir a solicitação.",
      payload.error?.details ?? [],
      retryAfter ? Number(retryAfter) : undefined,
    );
  }

  return (text ? JSON.parse(text) : undefined) as T;
}

export const authApi = {
  register: (body: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => apiRequest<{ message: string }>("/v1/auth/register", { method: "POST", body }),
  verifyEmail: (token: string) =>
    apiRequest<{ message: string }>("/v1/auth/verify-email", {
      method: "POST",
      body: { token },
    }),
  resendVerification: (email: string) =>
    apiRequest<{ message: string }>("/v1/auth/verify-email/resend", {
      method: "POST",
      body: { email },
    }),
  login: (email: string, password: string) =>
    apiRequest<SessionResponse>("/v1/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  refresh: (signal?: AbortSignal) =>
    apiRequest<SessionResponse>("/v1/auth/refresh", {
      method: "POST",
      signal,
    }),
  logout: () => apiRequest<void>("/v1/auth/logout", { method: "POST" }),
  logoutAll: (accessToken: string) =>
    apiRequest<void>("/v1/auth/logout-all", {
      method: "POST",
      accessToken,
    }),
  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>("/v1/auth/forgot-password", {
      method: "POST",
      body: { email },
    }),
  resetPassword: (token: string, newPassword: string) =>
    apiRequest<{ message: string }>("/v1/auth/reset-password", {
      method: "POST",
      body: { token, newPassword },
    }),
  exchangeOAuth: (code: string) =>
    apiRequest<SessionResponse>("/v1/auth/oauth/exchange", {
      method: "POST",
      body: { code },
    }),
};

export const meApi = {
  get: (accessToken: string) =>
    apiRequest<Profile>("/v1/me", { accessToken }),
  update: (
    body: { name?: string; phone?: string | null },
    accessToken: string,
  ) => apiRequest<Profile>("/v1/me", { method: "PATCH", body, accessToken }),
  changePassword: (
    body: { currentPassword: string; newPassword: string },
    accessToken: string,
  ) => apiRequest<{ message: string }>("/v1/me/password", {
    method: "POST",
    body,
    accessToken,
  }),
  requestEmailChange: (
    body: { newEmail: string; currentPassword: string },
    accessToken: string,
  ) => apiRequest<{ message: string }>("/v1/me/email/change-request", {
    method: "POST",
    body,
    accessToken,
  }),
  confirmEmailChange: (token: string) =>
    apiRequest<{ message: string }>("/v1/me/email/change-confirm", {
      method: "POST",
      body: { token },
    }),
  oauth: {
    list: (accessToken: string) =>
      apiRequest<OAuthIdentity[]>("/v1/me/oauth", { accessToken }),
    linkStart: (provider: string, accessToken: string) =>
      apiRequest<{ authorizationUrl: string }>(
        `/v1/me/oauth/${provider}/link-start`,
        { method: "POST", accessToken },
      ),
    confirmLink: (code: string, accessToken: string) =>
      apiRequest<{ message: string }>("/v1/me/oauth/confirm-link", {
        method: "POST",
        body: { code },
        accessToken,
      }),
    unlink: (provider: string, accessToken: string) =>
      apiRequest<void>(`/v1/me/oauth/${provider}`, {
        method: "DELETE",
        accessToken,
      }),
  },
};
