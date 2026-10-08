import { INestApplication } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types.js";
import { AppModule } from "../src/app.module.js";
import { API_PREFIX, applyAppSettings } from "../src/app.setup.js";

describe("Departments API (e2e)", () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication(new ExpressAdapter());
    applyAppSettings(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it(`GET /${API_PREFIX}/departments returns all 11 active departments`, async () => {
    const res = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/departments`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(11);

    const first = res.body[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("name");
    expect(first).toHaveProperty("code");

    // Verify presence of all 11 official department codes
    const codes = res.body.map((d: { code: string }) => d.code);
    const expectedCodes = [
      "CSE",
      "EEE",
      "ME",
      "CE",
      "TE",
      "PHARM",
      "SH",
      "BBA",
      "ENG",
      "LAW",
      "AGRI",
    ];

    for (const code of expectedCodes) {
      expect(codes).toContain(code);
    }

    // Verify sorted by name
    const names = res.body.map((d: { name: string }) => d.name);
    const sortedNames = [...names].sort();
    expect(names).toEqual(sortedNames);
  });
});
