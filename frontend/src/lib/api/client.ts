import { tokenStorage } from "@/lib/auth/token-storage";
import type { ApiErrorResponse, AuthResponse } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export class ApiError extends Error {
  statusCode: number;
  data?: unknown;

  constructor(message: string, statusCode: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * Reusable HTTP API client.
 * Automatically injects Bearer JWT, handles refresh token rotation on 401,
 * and formats standardized error responses.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { requiresAuth = true, headers = {}, ...rest } = options;

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  const accessToken = tokenStorage.getAccessToken();
  if (requiresAuth && accessToken) {
    requestHeaders["Authorization"] = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
    });
  } catch (err) {
    throw new ApiError(
      (err as Error).message || "Network error. Please check your connection.",
      0,
    );
  }

  // Handle 401 Unauthorized for authenticated endpoints (Token refresh flow)
  if (response.status === 401 && requiresAuth) {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(
            `${API_BASE_URL.replace(/\/$/, "")}/auth/refresh`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            },
          );

          if (refreshRes.ok) {
            const data = (await refreshRes.json()) as AuthResponse;
            tokenStorage.setTokens(data.accessToken, data.refreshToken);
            isRefreshing = false;
            onRefreshed(data.accessToken);

            // Retry original request with newly issued access token
            requestHeaders["Authorization"] = `Bearer ${data.accessToken}`;
            const retryRes = await fetch(url, { ...rest, headers: requestHeaders });
            return handleResponse<T>(retryRes);
          } else {
            tokenStorage.clearTokens();
            isRefreshing = false;
          }
        } catch {
          tokenStorage.clearTokens();
          isRefreshing = false;
        }
      } else {
        // Wait for token refresh to resolve
        return new Promise<T>((resolve, reject) => {
          refreshSubscribers.push(async (newToken: string) => {
            try {
              requestHeaders["Authorization"] = `Bearer ${newToken}`;
              const retryRes = await fetch(url, { ...rest, headers: requestHeaders });
              resolve(await handleResponse<T>(retryRes));
            } catch (error) {
              reject(error);
            }
          });
        });
      }
    }
  }

  return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    let errorMessage = "An error occurred";
    if (typeof data === "object" && data !== null) {
      const err = data as ApiErrorResponse;
      if (Array.isArray(err.message)) {
        errorMessage = err.message.join(", ");
      } else if (typeof err.message === "string") {
        errorMessage = err.message;
      }
    } else if (typeof data === "string" && data.length > 0) {
      errorMessage = data;
    }

    throw new ApiError(errorMessage, response.status, data);
  }

  return data as T;
}

export const api = {
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return apiClient<T>(endpoint, { ...options, method: "GET" });
  },

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return apiClient<T>(endpoint, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return apiClient<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return apiClient<T>(endpoint, { ...options, method: "DELETE" });
  },
};
