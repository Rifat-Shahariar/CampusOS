import { describe, it, expect, beforeEach } from "vitest";
import { tokenStorage } from "@/lib/auth/token-storage";

describe("tokenStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and retrieves access and refresh tokens", () => {
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();

    tokenStorage.setTokens("access_token_123", "refresh_token_456");

    expect(tokenStorage.getAccessToken()).toBe("access_token_123");
    expect(tokenStorage.getRefreshToken()).toBe("refresh_token_456");
  });

  it("clears tokens cleanly", () => {
    tokenStorage.setTokens("access_token_123", "refresh_token_456");
    tokenStorage.clearTokens();

    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });
});
