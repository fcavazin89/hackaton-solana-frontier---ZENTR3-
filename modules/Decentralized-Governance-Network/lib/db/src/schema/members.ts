import { pgTable, text, serial, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { daosTable } from "./daos";

export const membersTable = pgTable("members", {
  id: serial("id").primaryKey(),
  daoId: integer("dao_id").notNull().references(() => daosTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  walletAddress: text("wallet_address").notNull(),
  role: text("role", { enum: ["admin", "council", "member"] }).notNull().default("member"),
  tokenBalance: numeric("token_balance", { precision: 20, scale: 4 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertMemberSchema = createInsertSchema(membersTable).omit({ id: true, joinedAt: true });
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof membersTable.$inferSelect;
