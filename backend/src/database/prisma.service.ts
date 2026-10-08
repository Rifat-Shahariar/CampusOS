import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { toNodePostgresUrl } from "../common/utils/database-url.js";

/**
 * The single Prisma 7 client for the application, provided globally by
 * `DatabaseModule`. Feature services inject this instead of constructing their
 * own client.
 *
 * Prisma 7 requires a driver adapter at runtime, hence `PrismaPg`. The
 * connection is opened lazily (on the first query) rather than during
 * `onModuleInit`, so an unreachable database cannot block API startup — the
 * liveness endpoint has to stay independent of the database.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly hasConnectionString: boolean;

  constructor(config: ConfigService) {
    const rawConnectionString =
      config.get<string>("DATABASE_URL") ??
      config.get<string>("DIRECT_URL") ??
      "";
    const connectionString = toNodePostgresUrl(rawConnectionString);

    super({ adapter: new PrismaPg({ connectionString }) });

    this.hasConnectionString = connectionString !== "";
  }

  onModuleInit(): void {
    if (!this.hasConnectionString) {
      this.logger.warn(
        "DATABASE_URL is not configured — database-backed requests will fail until it is set. " +
          "GET /api/v1/health keeps working.",
      );
      return;
    }
    this.logger.log(
      "Prisma client ready; the connection opens on the first query.",
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Cheap connectivity probe used by the readiness endpoint (not by liveness).
   * Never throws — callers decide how to react.
   */
  async isHealthy(): Promise<boolean> {
    if (!this.hasConnectionString) {
      return false;
    }
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.warn(
        `Database health check failed: ${(error as Error).message}`,
      );
      return false;
    }
  }
}
