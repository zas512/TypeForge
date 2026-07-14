import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const LIBSQL_REGEX = /^libsql:\/\//;

export const env = createEnv({
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  server: {
    DATABASE_URL: z
      .string()
      .url()
      .regex(LIBSQL_REGEX, "Must be a valid libsql URL"),
    DATABASE_AUTH_TOKEN: z.string().min(20),
  },
  client: {},
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL,
    DATABASE_AUTH_TOKEN:
      process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN,
  },
  emptyStringAsUndefined: true,
});
