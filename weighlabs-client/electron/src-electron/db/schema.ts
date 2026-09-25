import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const testsTable = sqliteTable("tests", {
  id: text("id").primaryKey(),
  fileName: text("fileName").notNull(),
  status: text("status").notNull().default("INC"),
  manufacturerId: text("manufacturerId").notNull().default(""),
  createdAt: text("createdAt").notNull(),
  completedAt: text("completedAt"),
  payload: text("payload"),
});