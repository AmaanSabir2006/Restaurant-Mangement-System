import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";
import os from "os";

function setupDatabaseUrl(): string {
  // If an external database URL is provided (e.g. Postgres / Turso / remote), use it
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")) {
    return process.env.DATABASE_URL;
  }

  // Detect serverless environment (Vercel / AWS Lambda) or production
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NODE_ENV === "production"
  );

  if (isServerless) {
    const tmpDir = os.tmpdir();
    const targetDbPath = path.join(tmpDir, "dev.db");

    // Copy source dev.db to /tmp if it doesn't exist yet or is empty
    if (!fs.existsSync(targetDbPath) || fs.statSync(targetDbPath).size === 0) {
      const srcDbPath = path.join(process.cwd(), "prisma", "dev.db");
      if (fs.existsSync(srcDbPath)) {
        try {
          fs.copyFileSync(srcDbPath, targetDbPath);
          console.log(`[Prisma] Copied database from ${srcDbPath} to ${targetDbPath}`);
        } catch (err) {
          console.error(`[Prisma] Failed to copy database from ${srcDbPath}:`, err);
        }
      }
    }

    const resolvedUrl = `file:${targetDbPath}`;
    process.env.DATABASE_URL = resolvedUrl;
    return resolvedUrl;
  }

  // Local development
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:./dev.db";
  }
  return process.env.DATABASE_URL;
}

const resolvedUrl = setupDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
