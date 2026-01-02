import { eq } from "drizzle-orm";
import { db } from "./config";
import type { User } from "./schema";
import { users } from "./schema";

// App-level user type with invites as array and funds as number
export type AppUser = Omit<User, "invites" | "funds" | "botActiveSince"> & { 
    invites: number[];
    funds: number;
    botActiveSince: string | null; // Keep as ISO string for compatibility
};

// Helper to convert database user to app user format
function dbUserToAppUser(dbUser: User): AppUser {
    return {
        id: dbUser.id,
        walletAddress: dbUser.walletAddress,
        botActiveSince: dbUser.botActiveSince instanceof Date 
            ? dbUser.botActiveSince.toISOString() 
            : (dbUser.botActiveSince as string | null),
        invitationCode: dbUser.invitationCode,
        funds: typeof dbUser.funds === "string" ? parseFloat(dbUser.funds) : (dbUser.funds as unknown as number),
        invites: JSON.parse(dbUser.invites || "[]"),
    };
}

export async function findUserByInviteCode(invitationCode: number): Promise<AppUser | undefined> {
    const [user] = await db.select().from(users).where(eq(users.invitationCode, invitationCode));
    return user ? dbUserToAppUser(user) : undefined;
}

export async function getUser(userId: number): Promise<AppUser | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user ? dbUserToAppUser(user) : undefined;
}

export async function createUser(userId: number, data: Partial<AppUser> = {}): Promise<AppUser> {
    const existingUser = await getUser(userId);
    if (existingUser) {
        return existingUser;
    }
    
    const invitationCode = data.invitationCode || Math.floor(100000 + Math.random() * 900000);
    const invites = data.invites || [];
    
    const fundsValue = data.funds ?? 0;
    const newUser = {
        id: userId,
        walletAddress: data.walletAddress ?? null,
        funds: String(fundsValue),
        botActiveSince: data.botActiveSince ? new Date(data.botActiveSince) : null,
        invitationCode,
        invites: JSON.stringify(invites),
    };
    
    await db.insert(users).values(newUser);
    
    return {
        id: userId,
        walletAddress: data.walletAddress ?? null,
        funds: fundsValue,
        botActiveSince: data.botActiveSince ?? null,
        invitationCode,
        invites,
    };
}

export async function updateUser(userId: number, userData: Partial<AppUser>): Promise<AppUser> {
    let user = await getUser(userId);
    if (!user) {
        return createUser(userId, userData);
    }
    
    const updateData: Partial<typeof users.$inferInsert> = {};
    
    if (userData.walletAddress !== undefined) {
        updateData.walletAddress = userData.walletAddress;
    }
    if (userData.funds !== undefined) {
        updateData.funds = String(userData.funds);
    }
    if (userData.botActiveSince !== undefined) {
        updateData.botActiveSince = userData.botActiveSince ? new Date(userData.botActiveSince) : null;
    }
    if (userData.invitationCode !== undefined) {
        updateData.invitationCode = userData.invitationCode;
    }
    if (userData.invites !== undefined) {
        updateData.invites = JSON.stringify(userData.invites);
    }
    
    await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId));
    
    return (await getUser(userId))!;
}


export async function hasWallet(userId: number): Promise<boolean> {
    const user = await getUser(userId);
    return user !== undefined && user.walletAddress !== null;
}

export async function hasFunds(userId: number): Promise<boolean> {
    const user = await getUser(userId);
    return user !== undefined && user.funds > 0;
}

export async function hasActiveBot(userId: number): Promise<boolean> {
    const user = await getUser(userId);
    return user !== undefined && user.botActiveSince !== null;
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