import { boolean, integer, jsonb, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

const accountRoleEnum = pgEnum("role", [
    "OPERATOR",
    "SUPERVISOR",
    "LABORATORY",
    "MANUFACTURER",
])
const account = pgTable("account", {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: varchar(),
    role: accountRoleEnum().notNull().default("OPERATOR"),
    contactNumber: integer("contact_number"),
    email: varchar().notNull(),
    details: jsonb("details"),
})

const session = pgTable("session", {
    id: uuid().defaultRandom().primaryKey().notNull(),
    accountId: uuid().notNull().references(() => account.id),
    createdAt: timestamp().defaultNow().notNull(),
    expiresAt: timestamp().notNull(),
})

const testResultEnum = pgEnum("testResult", [
    "PASS",
    "FAIL"
])
const test = pgTable("test", {
    id: uuid().defaultRandom().primaryKey().notNull(),
    result: testResultEnum().default("FAIL"),
    operatorId: uuid("operator_id").notNull().references(() => account.id),
    creationDate: timestamp().defaultNow().notNull(),
    completionDate: timestamp(),
    manufacturerId: uuid("manufacturer_id").notNull().references(() => account.id),
    labId: uuid("lab_id").notNull().references(() => account.id),
})
