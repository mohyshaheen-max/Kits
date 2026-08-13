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

// ---------------------------------------------------------------------------
// Orders — payments deferred to a developer (see src/lib/payments), but the
// order/order-item/payment shape is built out now so that seam is a drop-in.
// order_items snapshot qty/price at purchase time independent of what the
// live kit_items look like later — that's what keeps an old order's price
// intact when a school revises its list mid-season.
// ---------------------------------------------------------------------------

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNumber: text("order_number").notNull(),
  mode: text("mode", { enum: ["SCHOOL_INTEGRATED", "GENERAL_STORE"] })
    .notNull()
    .default("SCHOOL_INTEGRATED"),
  // schoolId/gradeId/kitId/kitVersion only apply to SCHOOL_INTEGRATED orders
  // — a General Store order isn't tied to any school's kit.
  schoolId: integer("school_id").references(() => schools.id),
  gradeId: integer("grade_id").references(() => grades.id),
  kitId: integer("kit_id").references(() => kits.id),
  kitVersion: integer("kit_version"),
  // Set server-side from the session at checkout, never from client input —
  // null means a guest order (no self-service cancel/return for those).
  customerId: integer("customer_id").references(() => customers.id),
  parentName: text("parent_name").notNull(),
  parentPhone: text("parent_phone").notNull(),
  parentEmail: text("parent_email"),
  childName: text("child_name").notNull(),
  childClass: text("child_class").notNull(),
  subtotal: real("subtotal").notNull(),
  labelingFee: real("labeling_fee").notNull().default(0),
  deliveryFee: real("delivery_fee").notNull(),
  total: real("total").notNull(),
  deliveryMethod: text("delivery_method", { enum: ["HOME", "SCHOOL_BATCH"] }).notNull(),
  deliveryAddress: text("delivery_address"),
  paymentMethod: text("payment_method", { enum: ["CARD", "COD"] }).notNull(),
  paymentStatus: text("payment_status", {
    enum: ["pending", "paid", "pending_reconciliation", "failed", "refunded"],
  })
    .notNull()
    .default("pending"),
  fulfilmentStatus: text("fulfilment_status", {
    enum: ["pending", "picking", "packed", "delivered", "cancelled"],
  })
    .notNull()
    .default("pending"),
  referralSchoolId: integer("referral_school_id").references(() => schools.id),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  skuId: integer("sku_id")
    .notNull()
    .references(() => skus.id),
  qty: integer("qty").notNull(),
  unitPrice: real("unit_price").notNull(),
  lineTotal: real("line_total").notNull(),
  pickedQty: integer("picked_qty"),
  substitutedSkuId: integer("substituted_sku_id").references(() => skus.id),
  substitutionNote: text("substitution_note"),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  method: text("method", { enum: ["CARD", "COD"] }).notNull(),
  amount: real("amount").notNull(),
  status: text("status", {
    enum: ["pending", "paid", "pending_reconciliation", "reconciled", "failed", "refunded"],
  })
    .notNull()
    .default("pending"),
  providerRef: text("provider_ref"),
  collectedAt: text("collected_at"),
  reconciledAt: text("reconciled_at"),
  reconciledBy: text("reconciled_by"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  school: one(schools, { fields: [orders.schoolId], references: [schools.id] }),
  grade: one(grades, { fields: [orders.gradeId], references: [grades.id] }),
  kit: one(kits, { fields: [orders.kitId], references: [kits.id] }),
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  sku: one(skus, { fields: [orderItems.skuId], references: [skus.id] }),
  substitutedSku: one(skus, { fields: [orderItems.substitutedSkuId], references: [skus.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

// ---------------------------------------------------------------------------
// Inventory — on_hand/reserved are caches. Non-negotiable: never
// `UPDATE inventory SET on_hand`. Every change goes through
// applyStockMovement (src/lib/wms/stock.ts), which inserts the movement row
// and adjusts the cached balance in the same breath. When something goes
// wrong mid-season, stock_movements is how you find out what happened.
// ---------------------------------------------------------------------------

export const inventory = sqliteTable("inventory", {
  skuId: integer("sku_id")
    .primaryKey()
    .references(() => skus.id),
  onHand: integer("on_hand").notNull().default(0),
  reserved: integer("reserved").notNull().default(0),
  reorderPoint: integer("reorder_point").notNull().default(0),
  lastCountedAt: text("last_counted_at"),
});

export const stockMovements = sqliteTable("stock_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skuId: integer("sku_id")
    .notNull()
    .references(() => skus.id),
  delta: integer("delta").notNull(),
  reason: text("reason", {
    enum: ["PURCHASE", "RESERVE", "RELEASE", "PICK", "ADJUSTMENT", "RETURN"],
  }).notNull(),
  orderId: integer("order_id").references(() => orders.id),
  note: text("note"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdBy: text("created_by"),
});

export const inventoryRelations = relations(inventory, ({ one }) => ({
  sku: one(skus, { fields: [inventory.skuId], references: [skus.id] }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  sku: one(skus, { fields: [stockMovements.skuId], references: [skus.id] }),
  order: one(orders, { fields: [stockMovements.orderId], references: [orders.id] }),
}));

// ---------------------------------------------------------------------------
// School Portal — a second, separate login for school staff. They can see
// their own referral tools, orders and commission, but never prices, cost,
// inventory, or other schools' data (kept out at the query layer, same as
// the old spec's restricted-portal rule).
// ---------------------------------------------------------------------------

export const schoolAdmins = sqliteTable(
  "school_admins",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    schoolId: integer("school_id")
      .notNull()
      .references(() => schools.id),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [uniqueIndex("school_admins_email_idx").on(t.email)]
);

export const schoolAdminsRelations = relations(schoolAdmins, ({ one }) => ({
  school: one(schools, { fields: [schoolAdmins.schoolId], references: [schools.id] }),
}));

export const listUpdateRequests = sqliteTable("list_update_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id),
  gradeId: integer("grade_id").references(() => grades.id),
  note: text("note").notNull(),
  status: text("status", { enum: ["open", "acknowledged", "done"] })
    .notNull()
    .default("open"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const listUpdateRequestsRelations = relations(listUpdateRequests, ({ one }) => ({
  school: one(schools, { fields: [listUpdateRequests.schoolId], references: [schools.id] }),
  grade: one(grades, { fields: [listUpdateRequests.gradeId], references: [grades.id] }),
}));

// ---------------------------------------------------------------------------
// Customer accounts — optional at checkout (guest checkout still works).
// Logging in saves children/addresses for reuse and unlocks order history,
// self-service cancellation, and returns. Orders always snapshot
// parent/child name/class as text regardless of account state — an account
// is a convenience layer on top of that, not a dependency of it.
// ---------------------------------------------------------------------------

export const customers = sqliteTable(
  "customers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [uniqueIndex("customers_email_idx").on(t.email)]
);

export const children = sqliteTable("children", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  fullName: text("full_name").notNull(),
  schoolId: integer("school_id").references(() => schools.id),
  gradeId: integer("grade_id").references(() => grades.id),
  classSection: text("class_section"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const addresses = sqliteTable("addresses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  label: text("label"),
  line: text("line").notNull(),
  phone: text("phone"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const customersRelations = relations(customers, ({ many }) => ({
  children: many(children),
  addresses: many(addresses),
  orders: many(orders),
}));

export const childrenRelations = relations(children, ({ one }) => ({
  customer: one(customers, { fields: [children.customerId], references: [customers.id] }),
  school: one(schools, { fields: [children.schoolId], references: [schools.id] }),
  grade: one(grades, { fields: [children.gradeId], references: [grades.id] }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  customer: one(customers, { fields: [addresses.customerId], references: [customers.id] }),
}));
