import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/* =========================================================================
 * BARAKA MARKET — CORE DATABASE SCHEMA (Drizzle ORM / PostgreSQL)
 * 50+ tables covering: RBAC, users, catalog, inventory, cart, orders,
 * payments, delivery/courier, marketing, loyalty, reviews, chat,
 * notifications, and platform settings.
 * ======================================================================= */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

/* ------------------------------- 1. RBAC -------------------------------- */

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(), // customer, admin, super_admin, courier, manager
  description: text("description"),
  ...timestamps,
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(), // products.create, orders.update...
  description: text("description"),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
    permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);

/* ------------------------------- 2. USERS -------------------------------- */

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    phone: varchar("phone", { length: 20 }).unique(),
    fullName: varchar("full_name", { length: 150 }),
    email: varchar("email", { length: 150 }),
    passwordHash: varchar("password_hash", { length: 255 }),
    googleId: varchar("google_id", { length: 100 }).unique(),
    avatarUrl: text("avatar_url"),
    roleId: integer("role_id").notNull().references(() => roles.id),
    language: varchar("language", { length: 5 }).default("uz").notNull(),
    theme: varchar("theme", { length: 10 }).default("light").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isPhoneVerified: boolean("is_phone_verified").default(false).notNull(),
    birthDate: timestamp("birth_date", { withTimezone: true }),
    gender: varchar("gender", { length: 10 }),
    referralCode: varchar("referral_code", { length: 20 }).unique(),
    referredBy: integer("referred_by"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("users_role_idx").on(t.roleId)],
);

export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  purpose: varchar("purpose", { length: 30 }).default("login").notNull(), // login, register, reset
  isUsed: boolean("is_used").default(false).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  deviceId: varchar("device_id", { length: 150 }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revoked: boolean("revoked").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  pushToken: text("push_token"),
  platform: varchar("platform", { length: 20 }), // ios, android, web
  deviceModel: varchar("device_model", { length: 100 }),
  appVersion: varchar("app_version", { length: 20 }),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 60 }).notNull(), // Uy, Ish, ...
  region: varchar("region", { length: 100 }),
  city: varchar("city", { length: 100 }),
  street: text("street"),
  building: varchar("building", { length: 30 }),
  apartment: varchar("apartment", { length: 30 }),
  entrance: varchar("entrance", { length: 20 }),
  floor: varchar("floor", { length: 20 }),
  comment: text("comment"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  isDefault: boolean("is_default").default(false).notNull(),
  ...timestamps,
});

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 100 }).notNull(),
    entity: varchar("entity", { length: 100 }),
    entityId: varchar("entity_id", { length: 50 }),
    metadata: jsonb("metadata"),
    ipAddress: varchar("ip_address", { length: 60 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("activity_logs_user_idx").on(t.userId)],
);

/* ------------------------------ 3. CATALOG -------------------------------- */

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    parentId: integer("parent_id"),
    nameUz: varchar("name_uz", { length: 150 }).notNull(),
    nameRu: varchar("name_ru", { length: 150 }).notNull(),
    nameEn: varchar("name_en", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    icon: text("icon"),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (t) => [index("categories_parent_idx").on(t.parentId)],
);

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  logoUrl: text("logo_url"),
  country: varchar("country", { length: 100 }),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 60 }).notNull().unique(),
});

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    sku: varchar("sku", { length: 60 }).notNull().unique(),
    barcode: varchar("barcode", { length: 60 }),
    nameUz: varchar("name_uz", { length: 220 }).notNull(),
    nameRu: varchar("name_ru", { length: 220 }).notNull(),
    nameEn: varchar("name_en", { length: 220 }).notNull(),
    slug: varchar("slug", { length: 240 }).notNull().unique(),
    descriptionUz: text("description_uz"),
    descriptionRu: text("description_ru"),
    descriptionEn: text("description_en"),
    ingredientsUz: text("ingredients_uz"),
    ingredientsRu: text("ingredients_ru"),
    ingredientsEn: text("ingredients_en"),
    categoryId: integer("category_id").notNull().references(() => categories.id),
    brandId: integer("brand_id").references(() => brands.id),
    manufacturer: varchar("manufacturer", { length: 150 }),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    oldPrice: numeric("old_price", { precision: 12, scale: 2 }),
    discountPercent: integer("discount_percent").default(0).notNull(),
    unit: varchar("unit", { length: 20 }).default("dona").notNull(), // dona, kg, litr
    weightGrams: integer("weight_grams"),
    volumeMl: integer("volume_ml"),
    calories: integer("calories"),
    proteins: doublePrecision("proteins"),
    fats: doublePrecision("fats"),
    carbs: doublePrecision("carbs"),
    expiryDays: integer("expiry_days"),
    coverImageUrl: text("cover_image_url"),
    videoUrl: text("video_url"),
    ratingAvg: doublePrecision("rating_avg").default(0).notNull(),
    ratingCount: integer("rating_count").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    viewCount: integer("view_count").default(0).notNull(),
    orderCount: integer("order_count").default(0).notNull(),
    ...timestamps,
  },
  (t) => [
    index("products_category_idx").on(t.categoryId),
    index("products_brand_idx").on(t.brandId),
    index("products_barcode_idx").on(t.barcode),
  ],
);

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const productTags = pgTable(
  "product_tags",
  {
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.tagId] })],
);

export const productSimilar = pgTable(
  "product_similar",
  {
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    similarProductId: integer("similar_product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.similarProductId] })],
);

export const productBundles = pgTable(
  "product_bundles",
  {
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    bundledProductId: integer("bundled_product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.bundledProductId] })],
);

export const productRecommendations = pgTable(
  "product_recommendations",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    score: doublePrecision("score").default(0).notNull(),
    reason: varchar("reason", { length: 60 }), // ai, trending, category-affinity
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
);

export const recentlyViewed = pgTable(
  "recently_viewed",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("recently_viewed_user_idx").on(t.userId)],
);

export const searchHistory = pgTable("search_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  query: varchar("query", { length: 255 }).notNull(),
  resultsCount: integer("results_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------ 4. INVENTORY ------------------------------ */

export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  address: text("address"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const inventory = pgTable(
  "inventory",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
    quantity: integer("quantity").default(0).notNull(),
    reserved: integer("reserved").default(0).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(10).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("inventory_product_warehouse_idx").on(t.productId, t.warehouseId)],
);

export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // in, out, adjustment, return
  quantity: integer("quantity").notNull(),
  note: text("note"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const deliveryZones = pgTable("delivery_zones", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  city: varchar("city", { length: 100 }),
  polygon: jsonb("polygon"), // array of {lat, lng}
  baseFee: numeric("base_fee", { precision: 10, scale: 2 }).default("15000").notNull(),
  freeThreshold: numeric("free_threshold", { precision: 10, scale: 2 }).default("300000").notNull(),
  estimatedMinutes: integer("estimated_minutes").default(45).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

/* -------------------------------- 5. CART -------------------------------- */

export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  ...timestamps,
});

export const cartItems = pgTable(
  "cart_items",
  {
    id: serial("id").primaryKey(),
    cartId: integer("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").default(1).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("cart_items_cart_product_idx").on(t.cartId, t.productId)],
);

export const favorites = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("favorites_user_product_idx").on(t.userId, t.productId)],
);

/* ------------------------------- 6. REVIEWS ------------------------------- */

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    orderId: integer("order_id"),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    isApproved: boolean("is_approved").default(true).notNull(),
    ...timestamps,
  },
  (t) => [index("reviews_product_idx").on(t.productId)],
);

export const reviewImages = pgTable("review_images", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
});

/* -------------------------------- 7. ORDERS -------------------------------- */

export const couriers = pgTable("couriers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  vehicleType: varchar("vehicle_type", { length: 30 }).default("scooter").notNull(), // foot, bike, scooter, car
  vehiclePlate: varchar("vehicle_plate", { length: 30 }),
  isOnline: boolean("is_online").default(false).notNull(),
  currentLat: doublePrecision("current_lat"),
  currentLng: doublePrecision("current_lng"),
  ratingAvg: doublePrecision("rating_avg").default(0).notNull(),
  ratingCount: integer("rating_count").default(0).notNull(),
  totalDeliveries: integer("total_deliveries").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const courierLocations = pgTable("courier_locations", {
  id: serial("id").primaryKey(),
  courierId: integer("courier_id").notNull().references(() => couriers.id, { onDelete: "cascade" }),
  orderId: integer("order_id"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    orderNumber: varchar("order_number", { length: 30 }).notNull().unique(),
    userId: integer("user_id").notNull().references(() => users.id),
    addressId: integer("address_id").references(() => addresses.id),
    courierId: integer("courier_id").references(() => couriers.id),
    warehouseId: integer("warehouse_id").references(() => warehouses.id),
    status: varchar("status", { length: 30 }).default("pending").notNull(),
    // pending, confirmed, packing, courier_assigned, on_the_way, delivered, cancelled, returned
    paymentMethod: varchar("payment_method", { length: 20 }).default("cash").notNull(), // cash, card, wallet
    paymentStatus: varchar("payment_status", { length: 20 }).default("unpaid").notNull(),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    discountTotal: numeric("discount_total", { precision: 12, scale: 2 }).default("0").notNull(),
    deliveryFee: numeric("delivery_fee", { precision: 12, scale: 2 }).default("0").notNull(),
    bonusUsed: numeric("bonus_used", { precision: 12, scale: 2 }).default("0").notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    couponId: integer("coupon_id"),
    deliveryLat: doublePrecision("delivery_lat"),
    deliveryLng: doublePrecision("delivery_lng"),
    deliveryAddressText: text("delivery_address_text"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    estimatedDeliveryAt: timestamp("estimated_delivery_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelReason: text("cancel_reason"),
    customerComment: text("customer_comment"),
    ...timestamps,
  },
  (t) => [index("orders_user_idx").on(t.userId), index("orders_status_idx").on(t.status)],
);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  productNameSnapshot: varchar("product_name_snapshot", { length: 220 }).notNull(),
  priceSnapshot: numeric("price_snapshot", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
});

export const orderStatusHistory = pgTable("order_status_history", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 30 }).notNull(),
  note: text("note"),
  changedBy: integer("changed_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 30 }).notNull(), // click, payme, uzum, cash, wallet
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, success, failed, refunded
  transactionRef: varchar("transaction_ref", { length: 150 }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const returnRequests = pgTable("return_requests", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, approved, rejected, refunded
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const returnItems = pgTable("return_items", {
  id: serial("id").primaryKey(),
  returnRequestId: integer("return_request_id").notNull().references(() => returnRequests.id, { onDelete: "cascade" }),
  orderItemId: integer("order_item_id").notNull().references(() => orderItems.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
});

export const courierRatings = pgTable("courier_ratings", {
  id: serial("id").primaryKey(),
  courierId: integer("courier_id").notNull().references(() => couriers.id, { onDelete: "cascade" }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------ 8. MARKETING ------------------------------- */

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  titleUz: varchar("title_uz", { length: 200 }),
  titleRu: varchar("title_ru", { length: 200 }),
  titleEn: varchar("title_en", { length: 200 }),
  imageUrl: text("image_url").notNull(),
  linkType: varchar("link_type", { length: 20 }).default("none").notNull(), // category, product, promotion, url
  linkValue: varchar("link_value", { length: 255 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  ...timestamps,
});

export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  titleUz: varchar("title_uz", { length: 200 }).notNull(),
  titleRu: varchar("title_ru", { length: 200 }).notNull(),
  titleEn: varchar("title_en", { length: 200 }).notNull(),
  descriptionUz: text("description_uz"),
  descriptionRu: text("description_ru"),
  descriptionEn: text("description_en"),
  imageUrl: text("image_url"),
  discountPercent: integer("discount_percent").default(0).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const promotionProducts = pgTable(
  "promotion_products",
  {
    promotionId: integer("promotion_id").notNull().references(() => promotions.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.promotionId, t.productId] })],
);

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  type: varchar("type", { length: 20 }).default("percent").notNull(), // percent, fixed
  value: numeric("value", { precision: 12, scale: 2 }).notNull(),
  minOrderAmount: numeric("min_order_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  maxDiscountAmount: numeric("max_discount_amount", { precision: 12, scale: 2 }),
  usageLimit: integer("usage_limit").default(100).notNull(),
  usedCount: integer("used_count").default(0).notNull(),
  perUserLimit: integer("per_user_limit").default(1).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const couponUsages = pgTable("coupon_usages", {
  id: serial("id").primaryKey(),
  couponId: integer("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const giftCards = pgTable("gift_cards", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  initialBalance: numeric("initial_balance", { precision: 12, scale: 2 }).notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull(),
  issuedToUserId: integer("issued_to_user_id").references(() => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const giftCardTransactions = pgTable("gift_card_transactions", {
  id: serial("id").primaryKey(),
  giftCardId: integer("gift_card_id").notNull().references(() => giftCards.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // redeem, refund
  orderId: integer("order_id").references(() => orders.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* -------------------------------- 9. LOYALTY -------------------------------- */

export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  balance: numeric("balance", { precision: 12, scale: 2 }).default("0").notNull(),
  ...timestamps,
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull().references(() => wallets.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // topup, payment, refund, cashback
  orderId: integer("order_id").references(() => orders.id),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const bonusRules = pgTable("bonus_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  earnPercent: doublePrecision("earn_percent").default(1).notNull(), // % of order value earned as bonus
  minOrderAmount: numeric("min_order_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  maxRedeemPercent: doublePrecision("max_redeem_percent").default(30).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const bonusTransactions = pgTable("bonus_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // earn, redeem, expire, admin_adjust
  orderId: integer("order_id").references(() => orders.id),
  balanceAfter: numeric("balance_after", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------ 10. NOTIFICATIONS / CHAT --------------------- */

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    titleUz: varchar("title_uz", { length: 200 }),
    titleRu: varchar("title_ru", { length: 200 }),
    titleEn: varchar("title_en", { length: 200 }),
    body: text("body"),
    type: varchar("type", { length: 30 }).default("system").notNull(), // order, promo, system, chat
    isRead: boolean("is_read").default(false).notNull(),
    relatedEntity: varchar("related_entity", { length: 60 }),
    relatedId: integer("related_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("notifications_user_idx").on(t.userId)],
);

export const chatThreads = pgTable("chat_threads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 200 }).default("Yordam so'rovi").notNull(),
  status: varchar("status", { length: 20 }).default("open").notNull(), // open, closed
  assignedAdminId: integer("assigned_admin_id").references(() => users.id),
  ...timestamps,
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => chatThreads.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------ 11. PLATFORM -------------------------------- */

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  ...timestamps,
});

export const translations = pgTable(
  "translations",
  {
    id: serial("id").primaryKey(),
    namespace: varchar("namespace", { length: 60 }).notNull(),
    key: varchar("key", { length: 150 }).notNull(),
    uz: text("uz"),
    ru: text("ru"),
    en: text("en"),
  },
  (t) => [uniqueIndex("translations_ns_key_idx").on(t.namespace, t.key)],
);

/* --------------------------------- RELATIONS -------------------------------- */

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  addresses: many(addresses),
  cart: one(carts, { fields: [users.id], references: [carts.userId] }),
  wallet: one(wallets, { fields: [users.id], references: [wallets.userId] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  images: many(productImages),
  reviews: many(reviews),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  address: one(addresses, { fields: [orders.addressId], references: [addresses.id] }),
  courier: one(couriers, { fields: [orders.courierId], references: [couriers.id] }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
  payments: many(payments),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, { fields: [carts.userId], references: [users.id] }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  images: many(reviewImages),
}));

export const couriersRelations = relations(couriers, ({ one, many }) => ({
  user: one(users, { fields: [couriers.userId], references: [users.id] }),
  orders: many(orders),
}));

export { sql };
