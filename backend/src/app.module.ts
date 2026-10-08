import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "./config/env.validation.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthModule } from "./health/health.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { ClubsModule } from "./clubs/clubs.module.js";
import { EventsModule } from "./events/events.module.js";

/**
 * CampusOS API root module (modular monolith).
 *
 * The NestJS template's "Hello World!" controller was removed: the foundation
 * exposes no feature endpoints, and the only public route is the health probe.
 */
@Module({
  imports: [
    // Global, validated configuration. Validation only warns when DATABASE_URL
    // is absent so the app still builds and boots without a database.
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [".env"],
      validate: validateEnv,
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    ClubsModule,
    EventsModule,
  ],
})
export class AppModule {}
