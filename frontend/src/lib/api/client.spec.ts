import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient, ApiError } from "./client";
import { tokenStorage } from "@/lib/auth/token-storage";

describe("apiClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    tokenStorage.clearTokens();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("adds Authorization header when access token is present", async () => {
    tokenStorage.setAccessToken("test-access-token");

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ status: "ok" }),
    });

    const res = await apiClient<{ status: string }>("/test");
    expect(res).toEqual({ status: "ok" });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/test"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-access-token",
        }),
      }),
    );
  });

  it("throws ApiError with status and message on error response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ statusCode: 400, message: "Invalid payload input" }),
    });

    await expect(apiClient("/bad-request")).rejects.toThrow(ApiError);
  });
});
