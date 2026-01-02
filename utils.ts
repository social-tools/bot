import fs from "fs";
import { db } from "./config";
import { User } from "./types";

export function findUserByInviteCode(invitationCode: number) {
    const user = db.users.find((user: User) => user.invitationCode === invitationCode);
    return user;
}

export function getUser(userId: number) {
    const user = db.users.find((user: User) => user.id === userId);
    return user;
}

export function createUser(userId: number, data: Partial<User> = {}) {
    const user = getUser(userId);
    if (user) {
        return user;
    }
    
    const newUser: User = {
        id: userId,
        walletAddress: null,
        funds: 0,
        botActiveSince: null,
        invitationCode: Math.floor(100000 + Math.random() * 900000),
        invites: [],
        ...data
    };
    
    db.users.push(newUser);
    fs.writeFileSync("db.json", JSON.stringify(db, null, 2));
    return newUser;
}

export function updateUser(userId: number, userData: Partial<User>) {
    let user = getUser(userId);
    if (!user) {
        return createUser(userId, userData);
    }
    Object.assign(user, userData);
    fs.writeFileSync("db.json", JSON.stringify(db, null, 2));
    return user;
}


export function hasWallet(userId: number) {
    const user = getUser(userId);
    return user && user.walletAddress !== null;
}

export function hasFunds(userId: number) {
    const user = getUser(userId);
    return user && user.funds && user.funds > 0;
}

export function hasActiveBot(userId: number) {
    const user = getUser(userId);
    return user && user.botActiveSince !== null;
}

export function calculateInvestmentGrowth(
  startDateTime: string,
  currentDateTime: string,
  percentageGrowthPerDay: number,
  initialBalance: number,
  fuzzFactor: number = 0.2 // 10% fuzz by default
): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const startMs = new Date(startDateTime).getTime();
  const currentMs = new Date(currentDateTime).getTime();

  const elapsedMs = currentMs - startMs;
  const elapsedDays = elapsedMs / MS_PER_DAY;

  // Base daily growth rate (e.g. 1% → 0.01)
  const baseDailyRate = percentageGrowthPerDay / 100;

  // Random multiplier between (1 - fuzzFactor) and (1 + fuzzFactor)
  const randomMultiplier =
    1 + (Math.random() * 2 - 1) * fuzzFactor;

  const fuzzedDailyRate = baseDailyRate * randomMultiplier;

  const currentBalance =
    initialBalance * Math.pow(1 + fuzzedDailyRate, elapsedDays);

  return currentBalance;
}

export function calculatePercentageGrowth(oldValue: number, newValue: number): number {
    if (oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
}

export function calculateDays(iso1: string, iso2: string): number {
    const d1 = new Date(iso1);
    const d2 = new Date(iso2);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
        throw new Error("Invalid ISO date string");
    }

    // Normalize both dates to UTC midnight
    const utc1 = Date.UTC(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate());
    const utc2 = Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate());

    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.abs((utc2 - utc1) / msPerDay);
}

export function formatAmount(
    value: number,
    decimals: number = 2,
    locale: string = "en-US"
): string {
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

export function getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}