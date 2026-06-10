#!/usr/bin/env node
/**
 * Ensure local dev uses frontend/.env.development (not legacy .env.local).
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const development = join(root, ".env.development");
const production = join(root, ".env.production");
const legacy = [".env.local", ".env"];

const arg = process.argv[2];
const mode =
  arg === "production" || arg === "development"
    ? arg
    : process.env.NODE_ENV === "production"
      ? "production"
      : "development";
const expected = mode === "production" ? production : development;

if (!existsSync(expected)) {
  const template = join(root, ".env.example");
  console.error(
    `[env] Missing ${mode === "production" ? ".env.production" : ".env.development"}.\n` +
      `      Copy: cp .env.example ${mode === "production" ? ".env.production" : ".env.development"}`,
  );
  if (existsSync(template)) process.exit(1);
}

for (const name of legacy) {
  if (existsSync(join(root, name))) {
    console.warn(
      `[env] Warning: ${name} exists but is ignored by this project. Use .env.development / .env.production only.`,
    );
  }
}
