/**
 * Static site-wide configuration shared across the app.
 * Environment-specific values come from `.env` (see `.env.example`).
 */
export const siteConfig = {
  name: "CampusOS",
  description: "Smart Digital Campus Hub",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1",
} as const;
