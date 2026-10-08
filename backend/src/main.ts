import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import {
  ExpressAdapter,
  type NestExpressApplication,
} from "@nestjs/platform-express";
import { AppModule } from "./app.module.js";
import { applyAppSettings, API_PREFIX } from "./app.setup.js";

// Node's built-in .env loader — keeps `backend/.env` working without a dotenv
// dependency. In deployment the variables come from the platform environment.
try {
  process.loadEnvFile();
} catch {
  // No .env file present — rely on the process environment.
}

/**
 * Defensive port resolution: an unset, empty or `0` PORT (some environments
 * export `PORT=0` to mean "unset") falls back to the documented local port.
 */
function resolvePort(value: unknown): number {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : 3001;
}

async function bootstrap(): Promise<void> {
  const logger = new Logger("Bootstrap");
  // Pass the HTTP adapter explicitly: Nest can then instantiate it directly
  // instead of resolving `@nestjs/platform-express` dynamically from its own
  // (possibly hoisted) location, which keeps the workspace self-contained.
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
  );

  // Runs provider lifecycle hooks (PrismaService.$disconnect) on SIGINT/SIGTERM.
  app.enableShutdownHooks();

  applyAppSettings(app);

  const port = resolvePort(app.get(ConfigService).get("PORT"));
  await app.listen(port);

  logger.log(`CampusOS API listening at ${await app.getUrl()}/${API_PREFIX}`);
}

await bootstrap();
