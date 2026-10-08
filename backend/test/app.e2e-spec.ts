import { INestApplication } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types.js";
import { AppModule } from "./../src/app.module.js";
import {
  API_PREFIX,
  SWAGGER_PATH,
  applyAppSettings,
} from "./../src/app.setup.js";

describe("CampusOS API foundation (e2e)", () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Explicit adapter mirrors `main.ts` (see the note there).
    app = moduleFixture.createNestApplication(new ExpressAdapter());
    applyAppSettings(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it(`GET /${API_PREFIX}/health`, async () => {
    const response = await request(app.getHttpServer())
      .get(`/${API_PREFIX}/health`)
      .expect(200);

    expect(response.body).toEqual({
      status: "ok",
      service: "CampusOS API",
    });
  });

  it(`serves the OpenAPI document at /${SWAGGER_PATH}`, async () => {
    await request(app.getHttpServer()).get(`/${SWAGGER_PATH}`).expect(200);
  });

  it("does not expose routes outside the versioned prefix", async () => {
    await request(app.getHttpServer()).get("/health").expect(404);
  });
});
