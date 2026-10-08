import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

/**
 * Global database module. Marked `@Global` so feature modules can inject the
 * shared `PrismaService` without importing this module themselves. This mirrors
 * the modular-monolith approach: one client instance for the whole app.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
