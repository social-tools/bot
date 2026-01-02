import { integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: integer("id").primaryKey(),
  walletAddress: text("wallet_address"),
  funds: numeric("funds", { precision: 20, scale: 8 }).notNull().default("0"),
  botActiveSince: timestamp("bot_active_since", { withTimezone: true }), // Stores as timestamp with timezone (timestamptz)
  invitationCode: integer("invitation_code").notNull(),
  invites: text("invites").notNull().default("[]"), // Stored as JSON string
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

