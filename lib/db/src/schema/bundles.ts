import { boolean, integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bundlesTable = pgTable("bundles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  dataAmount: text("data_amount").notNull(),
  description: text("description").notNull().default(""),
  active: boolean("active").notNull().default(true),
});

export const insertBundleSchema = createInsertSchema(bundlesTable).omit({
  id: true,
});
export type InsertBundle = z.infer<typeof insertBundleSchema>;
export type Bundle = typeof bundlesTable.$inferSelect;
