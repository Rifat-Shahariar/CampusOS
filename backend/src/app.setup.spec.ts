import { ConfigService } from "@nestjs/config";
import { DEFAULT_FRONTEND_URL, resolveCorsOrigins } from "./app.setup.js";

describe("resolveCorsOrigins", () => {
  it("merges FRONTEND_URL and CORS_ORIGINS without duplicates", () => {
    const config = new ConfigService({
      FRONTEND_URL: "http://localhost:3000",
      CORS_ORIGINS: "http://localhost:3000, https://app.example.com",
    });

    expect(resolveCorsOrigins(config)).toEqual([
      "http://localhost:3000",
      "https://app.example.com",
    ]);
  });

  it("falls back to the local frontend origin when nothing is configured", () => {
    expect(resolveCorsOrigins(new ConfigService({}))).toEqual([
      DEFAULT_FRONTEND_URL,
    ]);
  });

  it("never allows a wildcard origin", () => {
    const config = new ConfigService({ CORS_ORIGINS: "*" });

    expect(resolveCorsOrigins(config)).not.toContain("*");
  });
});
