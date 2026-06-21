import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL (port 5432) is used by prisma migrate (bypasses pgbouncer)
    // DATABASE_URL (port 6543, pgbouncer) is used at runtime via PrismaClient
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      (() => {
        throw new Error(
          "ต้องตั้งค่า DIRECT_URL หรือ DATABASE_URL ใน .env ก่อนรัน prisma migrate"
        );
      })(),
  },
});
