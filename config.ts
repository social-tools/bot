import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import http from "http";
import TelegramBot from "node-telegram-bot-api";
import { Pool } from "pg";
import * as schema from "./schema";

dotenv.config();

/* ────────────────────────────
   Environment validation
──────────────────────────── */
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

/* ────────────────────────────
   Database (singleton)
──────────────────────────── */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
});

export const db = drizzle(pool, { schema });

/* ────────────────────────────
   Telegram Bot
──────────────────────────── */
const BOT_MODE = process.env.BOT_MODE || "polling"; // polling | webhook

export const telegramBot = new TelegramBot(
  process.env.TELEGRAM_BOT_TOKEN,
  BOT_MODE === "polling"
    ? { polling: true }
    : { webHook: true }
);

export const DAILY_PERCENTAGE_GROWTH = 4;

/* ────────────────────────────
   WEBHOOK MODE (Production)
──────────────────────────── */
if (BOT_MODE === "webhook") {
  if (!process.env.WEBHOOK_URL) {
    throw new Error("WEBHOOK_URL is required in webhook mode");
  }

  const PORT = Number(process.env.PORT) || 3000;
  const WEBHOOK_PATH = `/telegram/${process.env.TELEGRAM_BOT_TOKEN}`;

  const server = http.createServer((req, res) => {
    if (req.method === "POST" && req.url === WEBHOOK_PATH) {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        try {
          const update = JSON.parse(body);
          telegramBot.processUpdate(update);
        } catch (err) {
          console.error("❌ Failed to process Telegram update", err);
        }

        res.writeHead(200);
        res.end("OK");
      });
    } else {
      res.writeHead(200);
      res.end("OK");
    }
  });

  server.listen(PORT, async () => {
    await telegramBot.setWebHook(
      `${process.env.WEBHOOK_URL}${WEBHOOK_PATH}`
    );
    console.log("✅ Telegram bot running in WEBHOOK mode");
  });

  /* Graceful shutdown */
  process.once("SIGTERM", async () => {
    console.log("🛑 Shutting down...");
    await telegramBot.closeWebHook();
    await pool.end();
    server.close();
  });
}

/* ────────────────────────────
   POLLING MODE (Local)
──────────────────────────── */
if (BOT_MODE === "polling") {
  console.log("🤖 Telegram bot running in POLLING mode");
}
