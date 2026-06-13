import "dotenv/config";
import { defineConfig } from "prisma/config";

try { (process as NodeJS.Process & { loadEnvFile(path: string): void }).loadEnvFile(".env"); } catch { /* .env optional in CI/production */ }

export default defineConfig({
  schema: "prisma/schema.prisma",
  // migrations: {
  //   path: "prisma/migrations",
  // },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
