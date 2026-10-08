import { INestApplication, Logger, ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

/** Every REST route is served under this prefix. */
export const API_PREFIX = "api/v1";
/** Swagger UI/JSON mount point (intentionally outside the versioned prefix). */
export const SWAGGER_PATH = "api/docs";
/** JSON / urlencoded request body limit. */
export const BODY_LIMIT = "1mb";
/** Fallback browser origin when neither FRONTEND_URL nor CORS_ORIGINS is set. */
export const DEFAULT_FRONTEND_URL = "http://localhost:3000";

/**
 * Resolves the allowed browser origins from configuration. Never returns a
 * wildcard: an explicit list is required so a misconfigured deployment cannot
 * silently expose the API to every origin.
 */
export function resolveCorsOrigins(config: ConfigService): string[] {
  const origins = new Set<string>();
  const addOrigin = (origin: string): void => {
    // "*" is dropped on purpose — an explicit origin list is required.
    if (origin !== "" && origin !== "*") {
      origins.add(origin);
    }
  };

  addOrigin((config.get<string>("FRONTEND_URL") ?? "").trim());

  const corsOrigins = (config.get<string>("CORS_ORIGINS") ?? "").trim();
  for (const origin of corsOrigins.split(",").map((item) => item.trim())) {
    addOrigin(origin);
  }

  if (origins.size === 0) {
    origins.add(DEFAULT_FRONTEND_URL);
  }

  return [...origins];
}

/**
 * Applies the shared API configuration. Kept as a function so `main.ts` and the
 * end-to-end tests configure the application identically.
 */
export function applyAppSettings(app: INestApplication): INestApplication {
  const logger = new Logger("Bootstrap");
  const config = app.get(ConfigService);

  app.setGlobalPrefix(API_PREFIX);

  const origins = resolveCorsOrigins(config);
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
  logger.log(`CORS origins: ${origins.join(", ")}`);

  // Global request validation: unknown properties are rejected and payloads
  // are transformed into DTO instances (validated by class-validator).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Explicit body limits instead of relying on the framework default.
  const expressApp = app as NestExpressApplication;
  expressApp.useBodyParser("json", { limit: BODY_LIMIT });
  expressApp.useBodyParser("urlencoded", { limit: BODY_LIMIT, extended: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("CampusOS API")
    .setDescription(
      "Smart Digital Campus Hub — REST API with Authentication & JWT.",
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter JWT access token",
      },
      "bearer",
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    jsonDocumentUrl: `${SWAGGER_PATH}/json`,
    swaggerOptions: { persistAuthorization: true },
  });

  logger.log(`Global prefix: /${API_PREFIX}`);
  logger.log(`Swagger UI: /${SWAGGER_PATH}`);

  return app;
}
