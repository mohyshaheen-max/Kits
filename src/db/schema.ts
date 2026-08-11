import { sql, relations } from "drizzle-orm";
import { sqliteTable, integer, text, real, uniqueIndex } from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Admin auth — one boring table, signed-cookie sessions, no KV.
// ---------------------------------------------------------------------------

export const admins = sqliteTable(
  "admins",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [uniqueIndex("admins_email_idx").on(t.email)]
);

// ---------------------------------------------------------------------------
// Schools & grades
// ---------------------------------------------------------------------------

export const schools = sqliteTable(
  "schools",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    nameAr: text("name_ar"),
    tier: text("tier", { enum: ["A", "B", "C"] })
      .notNull()
      .default("B"),
    district: text("district"),
    contactName: text("contact_name"),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    commissionRate: real("commission_rate").notNull().default(0.05),
    commissionActiveUntil: text("commission_active_until"),
    referralSlug: text("referral_slug").notNull(),
    status: text("status", { enum: ["active", "inactive"] })
      .notNull()
      .default("active"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [uniqueIndex("schools_referral_slug_idx").on(t.referralSlug)]
);

export const grades = sqliteTable("grades", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  curriculum: text("curriculum"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const schoolsRelations = relations(schools, ({ many }) => ({
  grades: many(grades),
  brandRules: many(schoolBrandRules),
  lists: many(schoolLists),
  kits: many(kits),
}));

export const gradesRelations = relations(grades, ({ one, many }) => ({
  school: one(schools, { fields: [grades.schoolId], references: [schools.id] }),
  lists: many(schoolLists),
  kits: many(kits),
}));

// ---------------------------------------------------------------------------
// SKU catalogue
// ---------------------------------------------------------------------------

export const skus = sqliteTable(
  "skus",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    nameAr: text("name_ar"),
    category: text("category").notNull(),
    spec: text("spec"),
    size: text("size"),
    colour: text("colour"),
    brand: text("brand"),
    tier: text("tier", { enum: ["GEN", "BRAND", "ANY"] })
      .notNull()
      .default("GEN"),
    unitCost: real("unit_cost").notNull().default(0),
    unitPrice: real("unit_price").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [uniqueIndex("skus_code_idx").on(t.code)]
);

// ---------------------------------------------------------------------------
// School lists — what the school published (may include things KITS
// doesn't sell; exclusions are flagged, never silently dropped).
// ---------------------------------------------------------------------------

export const schoolLists = sqliteTable("school_lists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id),
  gradeId: integer("grade_id")
    .notNull()
    .references(() => grades.id),
  academicYear: text("academic_year").notNull(),
  status: text("status", { enum: ["draft", "live", "archived"] })
    .notNull()
    .default("draft"),
  sourceFileUrl: text("source_file_url"),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const listItems = sqliteTable("list_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listId: integer("list_id")
    .notNull()
    .references(() => schoolLists.id),
  skuId: integer("sku_id").references(() => skus.id),
  rawText: text("raw_text"),
  qty: integer("qty"),
  subject: text("subject"),
  isOptional: integer("is_optional", { mode: "boolean" }).notNull().default(false),
  isExcluded: integer("is_excluded", { mode: "boolean" }).notNull().default(false),
  exclusionReason: text("exclusion_reason"),
  notes: text("notes"),
});

export const schoolListsRelations = relations(schoolLists, ({ one, many }) => ({
  school: one(schools, { fields: [schoolLists.schoolId], references: [schools.id] }),
  grade: one(grades, { fields: [schoolLists.gradeId], references: [grades.id] }),
  items: many(listItems),
  kits: many(kits),
}));

export const listItemsRelations = relations(listItems, ({ one }) => ({
  list: one(schoolLists, { fields: [listItems.listId], references: [schoolLists.id] }),
  sku: one(skus, { fields: [listItems.skuId], references: [skus.id] }),
}));

// ---------------------------------------------------------------------------
// Brand rules — REQUIRE / FORBID, per school + category, both directions.
// ---------------------------------------------------------------------------

export const schoolBrandRules = sqliteTable("school_brand_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id),
  skuCategory: text("sku_category").notNull(),
  brand: text("brand").notNull(),
  rule: text("rule", { enum: ["REQUIRE", "FORBID"] }).notNull(),
  note: text("note"),
});

export const schoolBrandRulesRelations = relations(schoolBrandRules, ({ one }) => ({
  school: one(schools, { fields: [schoolBrandRules.schoolId], references: [schools.id] }),
}));

// ---------------------------------------------------------------------------
// Kits — the sellable product. Derived from a list, edited independently.
// Regenerating from an updated list is an explicit action, never automatic.
// ---------------------------------------------------------------------------

export const kits = sqliteTable("kits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id),
  gradeId: integer("grade_id")
    .notNull()
    .references(() => grades.id),
  listId: integer("list_id")
    .notNull()
    .references(() => schoolLists.id),
  academicYear: text("academic_year").notNull(),
  name: text("name").notNull(),
  status: text("status", { enum: ["draft", "review", "live", "archived"] })
    .notNull()
    .default("draft"),
  basePrice: real("base_price").notNull().default(0),
  cogs: real("cogs").notNull().default(0),
  marginPct: real("margin_pct").notNull().default(0),
  labelingAvailable: integer("labeling_available", { mode: "boolean" }).notNull().default(true),
  version: integer("version").notNull().default(1),
  publishedAt: text("published_at"),
  createdBy: text("created_by"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const kitItems = sqliteTable("kit_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kitId: integer("kit_id")
    .notNull()
    .references(() => kits.id),
  skuId: integer("sku_id")
    .notNull()
    .references(() => skus.id),
  qty: integer("qty"),
  unitPrice: real("unit_price").notNull(),
  lineTotal: real("line_total").notNull(),
  subject: text("subject"),
  isCore: integer("is_core", { mode: "boolean" }).notNull().default(true),
  isOptional: integer("is_optional", { mode: "boolean" }).notNull().default(false),
  sourceListItemId: integer("source_list_item_id").references(() => listItems.id),
  substitutionAllowed: integer("substitution_allowed", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const kitsRelations = relations(kits, ({ one, many }) => ({
  school: one(schools, { fields: [kits.schoolId], references: [schools.id] }),
  grade: one(grades, { fields: [kits.gradeId], references: [grades.id] }),
  list: one(schoolLists, { fields: [kits.listId], references: [schoolLists.id] }),
  items: many(kitItems),
}));

export const kitItemsRelations = relations(kitItems, ({ one }) => ({
  kit: one(kits, { fields: [kitItems.kitId], references: [kits.id] }),
  sku: one(skus, { fields: [kitItems.skuId], references: [skus.id] }),
  sourceListItem: one(listItems, {
    fields: [kitItems.sourceListItemId],
    references: [listItems.id],
  }),
}));
