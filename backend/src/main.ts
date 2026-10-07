import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

// Node's built-in .env loader — keeps `backend/.env` working without a dotenv
// dependency. In deployment the variables come from the platform environment.
try {
  process.loadEnvFile();
} catch {
  // No .env file present — rely on the process environment.
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Falls back to the documented local port when PORT is unset or empty.
  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
}

await bootstrap();
