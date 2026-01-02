import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import TelegramBot from "node-telegram-bot-api";
import { Pool } from "pg";
import * as schema from "./schema";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export const telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN as string, {
    polling: true
});
 
export const DAILY_PERCENTAGE_GROWTH = 4;