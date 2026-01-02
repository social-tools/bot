import dotenv from "dotenv";
import fs from "fs";
import TelegramBot from "node-telegram-bot-api";
import { Database } from "./types";

dotenv.config();

export const db: Database = JSON.parse(fs.readFileSync("db.json", "utf8"));

export const telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN as string, {
    polling: true
});
 
export const DAILY_PERCENTAGE_GROWTH = 4;