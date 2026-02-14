/**
 * Ensures the database schema is in sync by running `prisma db push`
 * with exponential backoff retries. Used as a startup script before
 * the Next.js server starts.
 *
 * Exits 0 even on failure so the server can still start (important for
 * health-check based orchestrators like Railway).
 */
import { execSync } from "child_process";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureDb() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `[ensure-db] Attempt ${attempt}/${MAX_RETRIES}: prisma db push...`
      );
      execSync("npx prisma db push --skip-generate", {
        stdio: "inherit",
        timeout: 30_000,
      });
      console.log("[ensure-db] Schema push succeeded.");
      process.exit(0);
    } catch (error) {
      console.error(
        `[ensure-db] Attempt ${attempt} failed: ${error.message ?? error}`
      );
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`[ensure-db] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  console.error(
    "[ensure-db] All attempts failed. Server will start without schema push."
  );
  console.error("[ensure-db] Hit GET /api/setup to diagnose & recover.");
  process.exit(0);
}

ensureDb();
