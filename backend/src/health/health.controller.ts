import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../database/prisma.service.js";

/** Shape returned by the liveness probe. */
export class HealthResponseDto {
  /**
   * Always "ok" when the process is able to serve requests.
   * @example "ok"
   */
  status!: string;

  /**
   * Human-readable service identifier.
   * @example "CampusOS API"
   */
  service!: string;
}

/** Shape returned by the readiness probe. */
export class ReadinessResponseDto extends HealthResponseDto {
  /**
   * Database connectivity as observed by the probe.
   * @example "up"
   */
  database!: string;
}

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liveness probe — deliberately does not touch the database so it stays
   * cheap and always answers while the process is up.
   */
  @Get()
  @ApiOperation({ summary: "Liveness probe" })
  @ApiOkResponse({ type: HealthResponseDto })
  live(): HealthResponseDto {
    return { status: "ok", service: "CampusOS API" };
  }

  /**
   * Readiness probe — separate from liveness and the only health endpoint that
   * depends on the database.
   */
  @Get("ready")
  @ApiOperation({ summary: "Readiness probe (includes database connectivity)" })
  @ApiOkResponse({ type: ReadinessResponseDto })
  async ready(): Promise<ReadinessResponseDto> {
    const databaseUp = await this.prisma.isHealthy();
    if (!databaseUp) {
      throw new ServiceUnavailableException({
        status: "error",
        service: "CampusOS API",
        database: "down",
      });
    }
    return { status: "ok", service: "CampusOS API", database: "up" };
  }
}
