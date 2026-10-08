import { ServiceUnavailableException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../database/prisma.service.js";
import { HealthController } from "./health.controller.js";

describe("HealthController", () => {
  let controller: HealthController;
  const prisma = { isHealthy: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it("reports liveness without touching the database", () => {
    expect(controller.live()).toEqual({
      status: "ok",
      service: "CampusOS API",
    });
    expect(prisma.isHealthy).not.toHaveBeenCalled();
  });

  it("reports readiness up when the database answers", async () => {
    prisma.isHealthy.mockResolvedValue(true);

    await expect(controller.ready()).resolves.toEqual({
      status: "ok",
      service: "CampusOS API",
      database: "up",
    });
  });

  it("reports readiness down when the database is unreachable", async () => {
    prisma.isHealthy.mockResolvedValue(false);

    await expect(controller.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
