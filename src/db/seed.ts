import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { eq, sql } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// Real, keyword-matched food/drink/product photos (via LoremFlickr, which
// pulls actual Flickr photos tagged with the given keyword). `lock` pins a
// deterministic photo per keyword+lock so re-seeding gives stable images.
function img(keyword: string, w = 600, h = 600, lock = 1) {
  const kw = keyword
    .toLowerCase()
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .join(",");
  return `https://loremflickr.com/${w}/${h}/${encodeURIComponent(kw)}?lock=${lock}`;
}
function avatar(seed: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear`;
}

// English name -> real-photo search keyword, so each product image
// actually matches what it is (milk photo for milk, bread photo for bread, etc).
const PRODUCT_IMAGE_KEYWORDS: Record<string, string> = {
  "Pasteurized Milk 2.5%": "milk,bottle",
  "Natural Yogurt": "yogurt",
  "Russian Cheese": "cheese",
  "Chicken Eggs (10 pcs)": "eggs,carton",
  "Butter 82%": "butter",
  "Beef Fillet": "beef,meat",
  "Chicken Fillet": "chicken,meat",
  "Lamb Meat": "lamb,meat",
  "Qazi Sausage": "sausage,meat",
  "White Bread": "bread,loaf",
  "Whole Grain Bread": "wholegrain,bread",
  "Chocolate Croissant": "croissant,pastry",
  "Red Apple": "apple,fruit",
  Banana: "banana,fruit",
  Tomato: "tomato,vegetable",
  Cucumber: "cucumber,vegetable",
  Potato: "potato,vegetable",
  Onion: "onion,vegetable",
  "Coca-Cola 1.5L": "cola,soda",
  "Pepsi 1.5L": "soda,cola",
  "Natural Orange Juice": "orange juice",
  "Still Mineral Water": "water,bottle",
  "Energy Drink": "energy drink,can",
  "Milk Chocolate": "chocolate,bar",
  "Wafer Cake": "wafer,cake",
  "Vanilla Ice Cream": "ice cream",
  "Butter Cookies": "cookies",
  "Instant Noodles": "instant noodles",
  "Frozen Dumplings": "dumplings",
  "Frozen Vegetable Mix": "frozen vegetables",
  "Canned Green Peas": "green peas,can",
  "Tomato Sauce": "tomato sauce",
  Mayonnaise: "mayonnaise",
  "Canned Tuna": "tuna,can",
  "Black Tea": "black tea",
  "Ground Coffee": "coffee,beans",
  "Laser Rice": "rice",
  Buckwheat: "buckwheat,grain",
  "Dish Soap": "dish soap",
  "Laundry Powder": "laundry detergent",
  "Universal Cleaner": "cleaning spray",
  "Shampoo for All Hair Types": "shampoo,bottle",
  Toothpaste: "toothpaste",
  "Liquid Soap": "liquid soap",
  "Baby Formula": "baby formula",
  "Baby Puree": "baby food,jar",
  "Baby Wet Wipes": "wet wipes",
};

// Category index -> representative food/drink keyword, used for category
// tiles, banners and promo images.
const CATEGORY_IMAGE_KEYWORDS = [
  "dairy,milk",
  "meat,butcher",
  "bakery,bread",
  "fruits,vegetables",
  "beverages,drinks",
  "sweets,dessert",
  "frozen food",
  "canned food",
  "coffee,tea",
  "cleaning supplies",
  "cosmetics,skincare",
  "baby products",
];

export async function seed() {
  console.log("🌱 Seeding Baraka Market database...");

  // --- Wipe existing data (dev-safe order respecting FKs) ---
  const tablesToTruncate = [
    "chat_messages",
    "chat_threads",
    "notifications",
    "bonus_transactions",
    "bonus_rules",
    "wallet_transactions",
    "wallets",
    "gift_card_transactions",
    "gift_cards",
    "coupon_usages",
    "coupons",
    "promotion_products",
    "promotions",
    "banners",
    "courier_ratings",
    "return_items",
    "return_requests",
    "payments",
    "order_status_history",
    "order_items",
    "orders",
    "courier_locations",
    "couriers",
    "favorites",
    "cart_items",
    "carts",
    "search_history",
    "recently_viewed",
    "product_recommendations",
    "product_bundles",
    "product_similar",
    "product_tags",
    "tags",
    "reviews",
    "review_images",
    "stock_movements",
    "inventory",
    "delivery_zones",
    "warehouses",
    "product_images",
    "products",
    "brands",
    "categories",
    "activity_logs",
    "addresses",
    "devices",
    "refresh_tokens",
    "otp_codes",
    "users",
    "role_permissions",
    "permissions",
    "roles",
    "settings",
    "translations",
  ];
  for (const t of tablesToTruncate) {
    await db.execute(sql.raw(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`));
  }

  // --- Roles & Permissions ---
  const roleNames = ["super_admin", "admin", "manager", "courier", "customer"] as const;
  const roleRows = await db
    .insert(schema.roles)
    .values(roleNames.map((name) => ({ name, description: `${name} role` })))
    .returning();
  const roleMap = Object.fromEntries(roleRows.map((r) => [r.name, r.id]));

  const permissionCodes = [
    "products.manage",
    "categories.manage",
    "brands.manage",
    "orders.manage",
    "users.manage",
    "couriers.manage",
    "banners.manage",
    "promotions.manage",
    "coupons.manage",
    "reports.view",
    "settings.manage",
    "activity.view",
  ];
  const permRows = await db
    .insert(schema.permissions)
    .values(permissionCodes.map((code) => ({ code, description: code })))
    .returning();
  await db.insert(schema.rolePermissions).values(
    permRows.flatMap((p) => [
      { roleId: roleMap["super_admin"], permissionId: p.id },
      { roleId: roleMap["admin"], permissionId: p.id },
    ]),
  );
  await db.insert(schema.rolePermissions).values(
    permRows
      .filter((p) => ["products.manage", "orders.manage", "reports.view"].includes(p.code))
      .map((p) => ({ roleId: roleMap["manager"], permissionId: p.id })),
  );

  // --- Users ---
  const adminUsers = [
    { phone: "+998901111111", fullName: "Alisher Karimov", role: "super_admin" },
    { phone: "+998901111112", fullName: "Dilnoza Yusupova", role: "admin" },
    { phone: "+998901111113", fullName: "Bekzod Rashidov", role: "manager" },
  ];
  const courierUsers = [
    { phone: "+998902222221", fullName: "Sardor Yo'ldoshev" },
    { phone: "+998902222222", fullName: "Jasur Nematov" },
    { phone: "+998902222223", fullName: "Otabek Qodirov" },
  ];
  const customerUsers = [
    { phone: "+998903333331", fullName: "Malika Azimova" },
    { phone: "+998903333332", fullName: "Farrux Tursunov" },
    { phone: "+998903333333", fullName: "Nilufar Sobirova" },
    { phone: "+998903333334", fullName: "Jahongir Ismoilov" },
    { phone: "+998903333335", fullName: "Zarina Nabieva" },
    { phone: "+998903333336", fullName: "Aziz Xolmatov" },
    { phone: "+998903333337", fullName: "Shahnoza Abdullayeva" },
    { phone: "+998903333338", fullName: "Umid Saidov" },
  ];

  const insertedAdmins = await db
    .insert(schema.users)
    .values(
      adminUsers.map((u) => ({
        phone: u.phone,
        fullName: u.fullName,
        roleId: roleMap[u.role],
        isPhoneVerified: true,
        avatarUrl: avatar(u.fullName),
        language: "uz",
      })),
    )
    .returning();

  const insertedCouriersUsers = await db
    .insert(schema.users)
    .values(
      courierUsers.map((u) => ({
        phone: u.phone,
        fullName: u.fullName,
        roleId: roleMap["courier"],
        isPhoneVerified: true,
        avatarUrl: avatar(u.fullName),
        language: "uz",
      })),
    )
    .returning();

  const insertedCustomers = await db
    .insert(schema.users)
    .values(
      customerUsers.map((u, i) => ({
        phone: u.phone,
        fullName: u.fullName,
        roleId: roleMap["customer"],
        isPhoneVerified: true,
        avatarUrl: avatar(u.fullName),
        language: (["uz", "ru", "en"] as const)[i % 3],
        referralCode: `BM${1000 + i}`,
      })),
    )
    .returning();

  const couriers = await db
    .insert(schema.couriers)
    .values(
      insertedCouriersUsers.map((u, i) => ({
        userId: u.id,
        vehicleType: ["scooter", "bike", "car"][i % 3],
        vehiclePlate: `01A${100 + i} AA`,
        isOnline: true,
        currentLat: 41.311 + i * 0.01,
        currentLng: 69.279 + i * 0.01,
        ratingAvg: 4.5 + i * 0.1,
        ratingCount: 30 + i * 5,
        totalDeliveries: 120 + i * 20,
      })),
    )
    .returning();

  // wallets + bonus for customers
  const wallets = await db
    .insert(schema.wallets)
    .values(insertedCustomers.map((c, i) => ({ userId: c.id, balance: String(50000 * (i % 4)) })))
    .returning();

  await db.insert(schema.bonusRules).values([
    { name: "Standart bonus", earnPercent: 2, minOrderAmount: "0", maxRedeemPercent: 30 },
    { name: "VIP mijozlar", earnPercent: 5, minOrderAmount: "500000", maxRedeemPercent: 50 },
  ]);

  for (const [i, c] of insertedCustomers.entries()) {
    const amount = 1000 * (i + 1);
    await db.insert(schema.bonusTransactions).values({
      userId: c.id,
      amount: String(amount),
      type: "earn",
      balanceAfter: String(amount),
    });
  }

  // addresses
  const districts = ["Chilonzor", "Yunusobod", "Mirzo Ulug'bek", "Shayxontohur", "Yakkasaroy", "Olmazor"];
  const addresses = await db
    .insert(schema.addresses)
    .values(
      insertedCustomers.flatMap((c, i) => [
        {
          userId: c.id,
          title: "Uy",
          region: "Toshkent",
          city: districts[i % districts.length],
          street: `${districts[i % districts.length]} ko'chasi`,
          building: `${10 + i}`,
          apartment: `${20 + i}`,
          lat: 41.29 + i * 0.01,
          lng: 69.24 + i * 0.01,
          isDefault: true,
        },
        {
          userId: c.id,
          title: "Ish",
          region: "Toshkent",
          city: districts[(i + 1) % districts.length],
          street: `Amir Temur shoh ko'chasi`,
          building: `${50 + i}`,
          lat: 41.31 + i * 0.008,
          lng: 69.28 + i * 0.008,
          isDefault: false,
        },
      ]),
    )
    .returning();

  // --- Warehouses & delivery zones ---
  const warehouses = await db
    .insert(schema.warehouses)
    .values([
      { name: "Baraka Market — Chilonzor filiali", address: "Chilonzor tumani, Bunyodkor shoh ko'chasi 12", lat: 41.2856, lng: 69.2034 },
      { name: "Baraka Market — Yunusobod filiali", address: "Yunusobod tumani, Amir Temur ko'chasi 45", lat: 41.3487, lng: 69.2877 },
    ])
    .returning();

  await db.insert(schema.deliveryZones).values([
    { name: "Toshkent shahri — markaz", city: "Toshkent", baseFee: "15000", freeThreshold: "300000", estimatedMinutes: 35 },
    { name: "Toshkent shahri — chekka tumanlar", city: "Toshkent", baseFee: "22000", freeThreshold: "400000", estimatedMinutes: 55 },
  ]);

  // --- Categories ---
  const categoryDefs = [
    { uz: "Sut va tuxum mahsulotlari", ru: "Молочные продукты и яйца", en: "Dairy & Eggs", icon: "🥛" },
    { uz: "Go'sht va parranda", ru: "Мясо и птица", en: "Meat & Poultry", icon: "🥩" },
    { uz: "Non va nonushta mahsulotlari", ru: "Хлеб и выпечка", en: "Bakery", icon: "🍞" },
    { uz: "Mevalar va sabzavotlar", ru: "Фрукты и овощи", en: "Fruits & Vegetables", icon: "🍎" },
    { uz: "Ichimliklar", ru: "Напитки", en: "Beverages", icon: "🥤" },
    { uz: "Shirinliklar va desertlar", ru: "Кондитерские изделия", en: "Sweets & Desserts", icon: "🍫" },
    { uz: "Yarim tayyor mahsulotlar", ru: "Полуфабрикаты", en: "Frozen & Ready meals", icon: "🧊" },
    { uz: "Konservalar va souslar", ru: "Консервы и соусы", en: "Canned & Sauces", icon: "🥫" },
    { uz: "Choy, qahva va don mahsulotlari", ru: "Чай, кофе и крупы", en: "Tea, Coffee & Grains", icon: "☕" },
    { uz: "Maishiy kimyo", ru: "Бытовая химия", en: "Household Chemicals", icon: "🧴" },
    { uz: "Kosmetika va gigiyena", ru: "Косметика и гигиена", en: "Beauty & Hygiene", icon: "🧼" },
    { uz: "Bolalar mahsulotlari", ru: "Детские товары", en: "Baby Products", icon: "🍼" },
  ];
  const categories = await db
    .insert(schema.categories)
    .values(
      categoryDefs.map((c, i) => ({
        nameUz: c.uz,
        nameRu: c.ru,
        nameEn: c.en,
        slug: `category-${i + 1}-${c.en.toLowerCase().replace(/[^a-z]+/g, "-")}`,
        icon: c.icon,
        imageUrl: img(CATEGORY_IMAGE_KEYWORDS[i] ?? "grocery", 400, 300, i + 1),
        sortOrder: i,
      })),
    )
    .returning();

  // --- Brands ---
  const brandDefs = [
    { name: "Prezident", country: "O'zbekiston" },
    { name: "Nestle", country: "Shveytsariya" },
    { name: "Coca-Cola", country: "AQSH" },
    { name: "PepsiCo", country: "AQSH" },
    { name: "Indomie", country: "Indoneziya" },
    { name: "Chimion", country: "O'zbekiston" },
    { name: "O'zbekiston Non", country: "O'zbekiston" },
    { name: "Barakat", country: "O'zbekiston" },
    { name: "Milla", country: "O'zbekiston" },
    { name: "Nestogen", country: "Shveytsariya" },
    { name: "Lotte", country: "Janubiy Koreya" },
    { name: "Olviya", country: "O'zbekiston" },
  ];
  const brands = await db
    .insert(schema.brands)
    .values(
      brandDefs.map((b) => ({
        name: b.name,
        slug: b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        logoUrl: avatar(b.name),
        country: b.country,
        description: `${b.name} — ishonchli va sifatli mahsulotlar ishlab chiqaruvchisi.`,
      })),
    )
    .returning();

  // --- Products ---
  type ProductDef = {
    nameUz: string; nameRu: string; nameEn: string;
    categoryIdx: number; brandIdx: number; price: number; oldPrice?: number;
    unit: string; weight?: number; volume?: number; calories?: number;
    proteins?: number; fats?: number; carbs?: number; expiryDays?: number; featured?: boolean;
  };
  const productDefs: ProductDef[] = [
    { nameUz: "Pasterizatsiyalangan sut 2.5%", nameRu: "Молоко пастеризованное 2.5%", nameEn: "Pasteurized Milk 2.5%", categoryIdx: 0, brandIdx: 0, price: 14000, oldPrice: 16000, unit: "litr", volume: 1000, calories: 52, proteins: 2.8, fats: 2.5, carbs: 4.7, expiryDays: 7, featured: true },
    { nameUz: "Tabiiy qatiq", nameRu: "Натуральный йогурт", nameEn: "Natural Yogurt", categoryIdx: 0, brandIdx: 0, price: 9000, unit: "dona", weight: 400, calories: 61, proteins: 3.5, fats: 3.2, carbs: 4.0, expiryDays: 14 },
    { nameUz: "Rossiya pishlog'i", nameRu: "Сыр Российский", nameEn: "Russian Cheese", categoryIdx: 0, brandIdx: 7, price: 42000, oldPrice: 48000, unit: "kg", weight: 1000, calories: 366, proteins: 24, fats: 29, carbs: 0.3, expiryDays: 30, featured: true },
    { nameUz: "Tovuq tuxumi (10 dona)", nameRu: "Куриное яйцо (10 шт)", nameEn: "Chicken Eggs (10 pcs)", categoryIdx: 0, brandIdx: 8, price: 22000, unit: "quti", weight: 600, calories: 155, proteins: 13, fats: 11, carbs: 1.1, expiryDays: 21 },
    { nameUz: "Sariyog' 82%", nameRu: "Сливочное масло 82%", nameEn: "Butter 82%", categoryIdx: 0, brandIdx: 0, price: 32000, unit: "dona", weight: 200, calories: 748, proteins: 0.5, fats: 82.5, carbs: 0.8, expiryDays: 60 },
    { nameUz: "Mol go'shti (fyle)", nameRu: "Говядина (филе)", nameEn: "Beef Fillet", categoryIdx: 1, brandIdx: 5, price: 98000, unit: "kg", weight: 1000, calories: 187, proteins: 26, fats: 9, carbs: 0, expiryDays: 3, featured: true },
    { nameUz: "Tovuq filesi", nameRu: "Куриное филе", nameEn: "Chicken Fillet", categoryIdx: 1, brandIdx: 5, price: 45000, oldPrice: 52000, unit: "kg", weight: 1000, calories: 165, proteins: 31, fats: 3.6, carbs: 0, expiryDays: 3 },
    { nameUz: "Qo'y go'shti", nameRu: "Баранина", nameEn: "Lamb Meat", categoryIdx: 1, brandIdx: 5, price: 110000, unit: "kg", weight: 1000, calories: 294, proteins: 25, fats: 21, carbs: 0, expiryDays: 3 },
    { nameUz: "Qazi (qo'y)", nameRu: "Казы (баранина)", nameEn: "Qazi Sausage", categoryIdx: 1, brandIdx: 5, price: 130000, unit: "kg", weight: 500, calories: 320, expiryDays: 10 },
    { nameUz: "Oddiy non", nameRu: "Хлеб обычный", nameEn: "White Bread", categoryIdx: 2, brandIdx: 6, price: 4000, unit: "dona", weight: 400, calories: 265, proteins: 9, fats: 3.2, carbs: 49, expiryDays: 3, featured: true },
    { nameUz: "Butun donli non", nameRu: "Цельнозерновой хлеб", nameEn: "Whole Grain Bread", categoryIdx: 2, brandIdx: 6, price: 9000, unit: "dona", weight: 350, calories: 247, expiryDays: 4 },
    { nameUz: "Kruassan shokoladli", nameRu: "Круассан с шоколадом", nameEn: "Chocolate Croissant", categoryIdx: 2, brandIdx: 6, price: 8000, unit: "dona", weight: 90, calories: 406, expiryDays: 2 },
    { nameUz: "Olma (qizil)", nameRu: "Яблоко красное", nameEn: "Red Apple", categoryIdx: 3, brandIdx: 11, price: 13000, unit: "kg", weight: 1000, calories: 52, carbs: 14, expiryDays: 20, featured: true },
    { nameUz: "Banan", nameRu: "Банан", nameEn: "Banana", categoryIdx: 3, brandIdx: 11, price: 17000, unit: "kg", weight: 1000, calories: 89, carbs: 23, expiryDays: 7 },
    { nameUz: "Pomidor", nameRu: "Помидор", nameEn: "Tomato", categoryIdx: 3, brandIdx: 11, price: 9000, unit: "kg", weight: 1000, calories: 18, carbs: 3.9, expiryDays: 7 },
    { nameUz: "Bodring", nameRu: "Огурец", nameEn: "Cucumber", categoryIdx: 3, brandIdx: 11, price: 8500, unit: "kg", weight: 1000, calories: 15, carbs: 3.6, expiryDays: 7 },
    { nameUz: "Kartoshka", nameRu: "Картофель", nameEn: "Potato", categoryIdx: 3, brandIdx: 11, price: 5000, unit: "kg", weight: 1000, calories: 77, carbs: 17, expiryDays: 30 },
    { nameUz: "Piyoz", nameRu: "Лук репчатый", nameEn: "Onion", categoryIdx: 3, brandIdx: 11, price: 4000, unit: "kg", weight: 1000, calories: 40, carbs: 9, expiryDays: 30 },
    { nameUz: "Coca-Cola 1.5L", nameRu: "Coca-Cola 1.5Л", nameEn: "Coca-Cola 1.5L", categoryIdx: 4, brandIdx: 2, price: 16000, unit: "dona", volume: 1500, calories: 42, carbs: 10.6, expiryDays: 270, featured: true },
    { nameUz: "Pepsi 1.5L", nameRu: "Pepsi 1.5Л", nameEn: "Pepsi 1.5L", categoryIdx: 4, brandIdx: 3, price: 15500, unit: "dona", volume: 1500, calories: 41, carbs: 11, expiryDays: 270 },
    { nameUz: "Tabiiy apelsin sharbati", nameRu: "Натуральный апельсиновый сок", nameEn: "Natural Orange Juice", categoryIdx: 4, brandIdx: 1, price: 21000, unit: "dona", volume: 1000, calories: 45, carbs: 10.4, expiryDays: 180 },
    { nameUz: "Gazsiz mineral suv", nameRu: "Негазированная минеральная вода", nameEn: "Still Mineral Water", categoryIdx: 4, brandIdx: 9, price: 5000, unit: "dona", volume: 1500, calories: 0, expiryDays: 365 },
    { nameUz: "Energetik ichimlik", nameRu: "Энергетический напиток", nameEn: "Energy Drink", categoryIdx: 4, brandIdx: 3, price: 14000, unit: "dona", volume: 500, calories: 45, expiryDays: 365 },
    { nameUz: "Sut shokoladi", nameRu: "Молочный шоколад", nameEn: "Milk Chocolate", categoryIdx: 5, brandIdx: 1, price: 18000, oldPrice: 22000, unit: "dona", weight: 90, calories: 534, fats: 30, carbs: 57, expiryDays: 365, featured: true },
    { nameUz: "Vafli tort", nameRu: "Вафельный торт", nameEn: "Wafer Cake", categoryIdx: 5, brandIdx: 1, price: 27000, unit: "dona", weight: 350, calories: 495, expiryDays: 180 },
    { nameUz: "Muzqaymoq (vanil)", nameRu: "Мороженое (ванильное)", nameEn: "Vanilla Ice Cream", categoryIdx: 5, brandIdx: 1, price: 19000, unit: "dona", weight: 450, calories: 207, expiryDays: 365 },
    { nameUz: "Pechenye (yog'li)", nameRu: "Печенье сдобное", nameEn: "Butter Cookies", categoryIdx: 5, brandIdx: 8, price: 12000, unit: "dona", weight: 400, calories: 480, expiryDays: 120 },
    { nameUz: "Tez pishar lag'mon (Indomie)", nameRu: "Лапша быстрого приготовления", nameEn: "Instant Noodles", categoryIdx: 6, brandIdx: 4, price: 4500, unit: "dona", weight: 80, calories: 380, expiryDays: 240, featured: true },
    { nameUz: "Muzlatilgan pельmen", nameRu: "Замороженные пельмени", nameEn: "Frozen Dumplings", categoryIdx: 6, brandIdx: 5, price: 34000, unit: "kg", weight: 1000, calories: 275, expiryDays: 180 },
    { nameUz: "Muzlatilgan sabzavotlar aralashmasi", nameRu: "Замороженные овощи ассорти", nameEn: "Frozen Vegetable Mix", categoryIdx: 6, brandIdx: 11, price: 19000, unit: "dona", weight: 400, calories: 65, expiryDays: 365 },
    { nameUz: "Konservalangan no'xat", nameRu: "Консервированный горошек", nameEn: "Canned Green Peas", categoryIdx: 7, brandIdx: 7, price: 8500, unit: "dona", weight: 400, calories: 55, expiryDays: 730 },
    { nameUz: "Tomat sousi", nameRu: "Томатный соус", nameEn: "Tomato Sauce", categoryIdx: 7, brandIdx: 7, price: 11000, unit: "dona", weight: 350, calories: 82, expiryDays: 365 },
    { nameUz: "Mayonez", nameRu: "Майонез", nameEn: "Mayonnaise", categoryIdx: 7, brandIdx: 7, price: 14500, unit: "dona", weight: 400, calories: 624, fats: 67, expiryDays: 180 },
    { nameUz: "Konservalangan tunets", nameRu: "Консервированный тунец", nameEn: "Canned Tuna", categoryIdx: 7, brandIdx: 7, price: 24000, unit: "dona", weight: 185, calories: 116, proteins: 25, expiryDays: 730 },
    { nameUz: "Qora choy", nameRu: "Черный чай", nameEn: "Black Tea", categoryIdx: 8, brandIdx: 8, price: 16000, unit: "quti", weight: 100, calories: 1, expiryDays: 730, featured: true },
    { nameUz: "Molotiy qahva", nameRu: "Молотый кофе", nameEn: "Ground Coffee", categoryIdx: 8, brandIdx: 1, price: 45000, unit: "dona", weight: 250, calories: 2, expiryDays: 540 },
    { nameUz: "Guruch (Lazer)", nameRu: "Рис Лазер", nameEn: "Laser Rice", categoryIdx: 8, brandIdx: 8, price: 21000, unit: "kg", weight: 1000, calories: 130, carbs: 28, expiryDays: 365 },
    { nameUz: "Grechka yormasi", nameRu: "Гречневая крупа", nameEn: "Buckwheat", categoryIdx: 8, brandIdx: 8, price: 17000, unit: "kg", weight: 1000, calories: 343, carbs: 71, expiryDays: 365 },
    { nameUz: "Idish yuvish suyuqligi", nameRu: "Средство для мытья посуды", nameEn: "Dish Soap", categoryIdx: 9, brandIdx: 9, price: 13000, unit: "dona", volume: 500, expiryDays: 730 },
    { nameUz: "Kir yuvish kukuni", nameRu: "Стиральный порошок", nameEn: "Laundry Powder", categoryIdx: 9, brandIdx: 9, price: 38000, oldPrice: 44000, unit: "dona", weight: 3000, expiryDays: 730, featured: true },
    { nameUz: "Universal tozalagich", nameRu: "Универсальное чистящее средство", nameEn: "Universal Cleaner", categoryIdx: 9, brandIdx: 9, price: 16000, unit: "dona", volume: 750, expiryDays: 730 },
    { nameUz: "Shampun (barcha turdagi sochlar uchun)", nameRu: "Шампунь для всех типов волос", nameEn: "Shampoo for All Hair Types", categoryIdx: 10, brandIdx: 1, price: 28000, unit: "dona", volume: 400, expiryDays: 730, featured: true },
    { nameUz: "Tish pastasi", nameRu: "Зубная паста", nameEn: "Toothpaste", categoryIdx: 10, brandIdx: 1, price: 15000, unit: "dona", weight: 100, expiryDays: 730 },
    { nameUz: "Suyuq sovun", nameRu: "Жидкое мыло", nameEn: "Liquid Soap", categoryIdx: 10, brandIdx: 1, price: 12000, unit: "dona", volume: 300, expiryDays: 730 },
    { nameUz: "Bolalar quruq sut aralashmasi", nameRu: "Детская молочная смесь", nameEn: "Baby Formula", categoryIdx: 11, brandIdx: 9, price: 89000, unit: "quti", weight: 800, calories: 66, expiryDays: 540, featured: true },
    { nameUz: "Bolalar cho'michi (pyure)", nameRu: "Детское пюре", nameEn: "Baby Puree", categoryIdx: 11, brandIdx: 9, price: 9500, unit: "dona", weight: 130, calories: 55, expiryDays: 365 },
    { nameUz: "Bolalar aravonchasi uchun salfetka", nameRu: "Детские влажные салфетки", nameEn: "Baby Wet Wipes", categoryIdx: 11, brandIdx: 9, price: 18000, unit: "quti", weight: 500, expiryDays: 730 },
  ];

  const productRows = await db
    .insert(schema.products)
    .values(
      productDefs.map((p, i) => {
        const discountPercent = p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
        const slugBase = p.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return {
          sku: `BM-${1000 + i}`,
          barcode: `290000000${(1000 + i).toString().padStart(4, "0")}`,
          nameUz: p.nameUz,
          nameRu: p.nameRu,
          nameEn: p.nameEn,
          slug: `${slugBase}-${1000 + i}`,
          descriptionUz: `${p.nameUz} — yuqori sifatli, tekshirilgan va nazoratdan o'tgan mahsulot. Har kunlik iste'mol uchun mos.`,
          descriptionRu: `${p.nameRu} — высококачественный, проверенный продукт. Подходит для ежедневного потребления.`,
          descriptionEn: `${p.nameEn} — a high quality, certified product suitable for everyday use.`,
          ingredientsUz: "Tabiiy tarkibiy qismlar, konservantlarsiz (agar boshqacha ko'rsatilmagan bo'lsa).",
          ingredientsRu: "Натуральные ингредиенты, без консервантов (если не указано иное).",
          ingredientsEn: "Natural ingredients, no preservatives unless stated otherwise.",
          categoryId: categories[p.categoryIdx].id,
          brandId: brands[p.brandIdx].id,
          manufacturer: brands[p.brandIdx].name,
          price: String(p.price),
          oldPrice: p.oldPrice ? String(p.oldPrice) : null,
          discountPercent,
          unit: p.unit,
          weightGrams: p.weight ?? null,
          volumeMl: p.volume ?? null,
          calories: p.calories ?? null,
          proteins: p.proteins ?? null,
          fats: p.fats ?? null,
          carbs: p.carbs ?? null,
          expiryDays: p.expiryDays ?? null,
          coverImageUrl: img(PRODUCT_IMAGE_KEYWORDS[p.nameEn] ?? CATEGORY_IMAGE_KEYWORDS[p.categoryIdx] ?? "grocery", 600, 600, i + 1),
          ratingAvg: 3.8 + (i % 12) / 10,
          ratingCount: 5 + (i % 40),
          isFeatured: !!p.featured,
          viewCount: 20 + i * 3,
          orderCount: 5 + i,
        };
      }),
    )
    .returning();

  // extra images per product
  await db.insert(schema.productImages).values(
    productRows.flatMap((p, i) => [
      {
        productId: p.id,
        url: img(PRODUCT_IMAGE_KEYWORDS[productDefs[i].nameEn] ?? CATEGORY_IMAGE_KEYWORDS[productDefs[i].categoryIdx] ?? "grocery", 600, 600, i + 101),
        sortOrder: 1,
      },
      {
        productId: p.id,
        url: img(PRODUCT_IMAGE_KEYWORDS[productDefs[i].nameEn] ?? CATEGORY_IMAGE_KEYWORDS[productDefs[i].categoryIdx] ?? "grocery", 600, 600, i + 201),
        sortOrder: 2,
      },
    ]),
  );

  // similar products & bundles (basic same-category linking)
  for (const [i, p] of productRows.entries()) {
    const sameCategory = productRows.filter((x, idx) => idx !== i && productDefs[idx].categoryIdx === productDefs[i].categoryIdx);
    const similar = sameCategory.slice(0, 3);
    if (similar.length) {
      await db.insert(schema.productSimilar).values(similar.map((s) => ({ productId: p.id, similarProductId: s.id })));
    }
    const bundle = sameCategory.slice(3, 5);
    if (bundle.length) {
      await db.insert(schema.productBundles).values(bundle.map((s) => ({ productId: p.id, bundledProductId: s.id })));
    }
  }

  // inventory
  await db.insert(schema.inventory).values(
    productRows.flatMap((p) =>
      warehouses.map((w) => ({
        productId: p.id,
        warehouseId: w.id,
        quantity: 50 + Math.floor(Math.random() * 200),
        reserved: Math.floor(Math.random() * 5),
        lowStockThreshold: 15,
      })),
    ),
  );

  // tags
  const tagRows = await db
    .insert(schema.tags)
    .values(["Yangi", "Aksiya", "Mashhur", "Organik", "Import", "Mahalliy"].map((name) => ({ name })))
    .returning();
  await db.insert(schema.productTags).values(
    productRows.slice(0, 20).map((p, i) => ({ productId: p.id, tagId: tagRows[i % tagRows.length].id })),
  );

  // --- Reviews ---
  const reviewComments = [
    "Juda sifatli mahsulot, tavsiya qilaman!",
    "Narxi va sifati mos, yetkazib berish tez bo'ldi.",
    "Yaxshi, lekin narxi biroz qimmatroq.",
    "Oilamiz doim shu mahsulotni sotib oladi.",
    "Yangi va sifatli yetib keldi, rahmat Baraka Market!",
  ];
  await db.insert(schema.reviews).values(
    productRows.slice(0, 25).map((p, i) => ({
      productId: p.id,
      userId: insertedCustomers[i % insertedCustomers.length].id,
      rating: 4 + (i % 2),
      comment: reviewComments[i % reviewComments.length],
    })),
  );

  // --- Carts (empty carts created for each customer) & favorites ---
  const carts = await db
    .insert(schema.carts)
    .values(insertedCustomers.map((c) => ({ userId: c.id })))
    .returning();

  await db.insert(schema.cartItems).values([
    { cartId: carts[0].id, productId: productRows[0].id, quantity: 2 },
    { cartId: carts[0].id, productId: productRows[9].id, quantity: 1 },
    { cartId: carts[1].id, productId: productRows[18].id, quantity: 3 },
  ]);

  await db.insert(schema.favorites).values(
    insertedCustomers.flatMap((c, i) => [
      { userId: c.id, productId: productRows[(i * 3) % productRows.length].id },
      { userId: c.id, productId: productRows[(i * 3 + 1) % productRows.length].id },
    ]),
  );

  await db.insert(schema.recentlyViewed).values(
    insertedCustomers.flatMap((c, i) => [
      { userId: c.id, productId: productRows[(i * 2) % productRows.length].id },
      { userId: c.id, productId: productRows[(i * 2 + 5) % productRows.length].id },
    ]),
  );

  await db.insert(schema.searchHistory).values([
    { userId: insertedCustomers[0].id, query: "sut", resultsCount: 5 },
    { userId: insertedCustomers[1].id, query: "shokolad", resultsCount: 4 },
    { userId: insertedCustomers[2].id, query: "coca cola", resultsCount: 1 },
  ]);

  // --- Banners ---
  await db.insert(schema.banners).values([
    { titleUz: "Bahorgi aksiya — 30% gacha chegirma", titleRu: "Весенняя акция — скидки до 30%", titleEn: "Spring Sale — up to 30% off", imageUrl: img("grocery,shopping", 1200, 500, 1), linkType: "promotion", sortOrder: 0 },
    { titleUz: "Yangi mahsulotlar keldi", titleRu: "Поступление новых товаров", titleEn: "New arrivals just in", imageUrl: img("fruits,vegetables", 1200, 500, 2), linkType: "category", linkValue: String(categories[3].id), sortOrder: 1 },
    { titleUz: "300 000 so'mdan yuqori — bepul yetkazib berish", titleRu: "Бесплатная доставка от 300 000 сум", titleEn: "Free delivery over 300,000 UZS", imageUrl: img("food delivery", 1200, 500, 3), linkType: "none", sortOrder: 2 },
    { titleUz: "Sut mahsulotlariga maxsus narxlar", titleRu: "Специальные цены на молочные продукты", titleEn: "Special prices on dairy", imageUrl: img("dairy,milk", 1200, 500, 4), linkType: "category", linkValue: String(categories[0].id), sortOrder: 3 },
  ]);

  // --- Promotions ---
  const now = new Date();
  const in30days = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  const promos = await db
    .insert(schema.promotions)
    .values([
      {
        titleUz: "Sut mahsulotlariga 15% chegirma",
        titleRu: "Скидка 15% на молочные продукты",
        titleEn: "15% off dairy products",
        descriptionUz: "Barcha sut mahsulotlariga 15% chegirma amal qiladi.",
        descriptionRu: "Скидка 15% на всю молочную продукцию.",
        descriptionEn: "15% discount applies to all dairy products.",
        imageUrl: img("dairy,milk", 900, 400, 5),
        discountPercent: 15,
        categoryId: categories[0].id,
        startsAt: now,
        endsAt: in30days,
      },
      {
        titleUz: "Ichimliklar hafta aksiyasi",
        titleRu: "Недельная акция на напитки",
        titleEn: "Weekly beverages promo",
        descriptionUz: "Barcha ichimliklarga 10% chegirma.",
        descriptionRu: "Скидка 10% на все напитки.",
        descriptionEn: "10% off all beverages.",
        imageUrl: img("beverages,drinks", 900, 400, 6),
        discountPercent: 10,
        categoryId: categories[4].id,
        startsAt: now,
        endsAt: in30days,
      },
    ])
    .returning();

  await db.insert(schema.promotionProducts).values(
    productRows.filter((_, i) => productDefs[i].categoryIdx === 0).map((p) => ({ promotionId: promos[0].id, productId: p.id })),
  );

  // --- Coupons ---
  await db.insert(schema.coupons).values([
    { code: "BARAKA10", type: "percent", value: "10", minOrderAmount: "100000", maxDiscountAmount: "50000", usageLimit: 500, perUserLimit: 1, startsAt: now, endsAt: in30days },
    { code: "WELCOME20000", type: "fixed", value: "20000", minOrderAmount: "150000", usageLimit: 1000, perUserLimit: 1, startsAt: now, endsAt: in30days },
    { code: "FREESHIP", type: "fixed", value: "15000", minOrderAmount: "0", usageLimit: 2000, perUserLimit: 3, startsAt: now, endsAt: in30days },
  ]);

  // --- Gift cards ---
  await db.insert(schema.giftCards).values([
    { code: "GIFT-AX92KP", initialBalance: "100000", balance: "100000", issuedToUserId: insertedCustomers[0].id },
    { code: "GIFT-BZ44LM", initialBalance: "250000", balance: "180000", issuedToUserId: insertedCustomers[1].id },
  ]);

  // --- Orders ---
  const statuses = ["delivered", "delivered", "on_the_way", "courier_assigned", "pending", "cancelled"];
  const orders = [];
  for (let i = 0; i < 8; i++) {
    const customer = insertedCustomers[i % insertedCustomers.length];
    const address = addresses.find((a) => a.userId === customer.id)!;
    const items = productRows.slice(i * 2, i * 2 + 3);
    const subtotal = items.reduce((sum, p) => sum + Number(p.price) * 2, 0);
    const deliveryFee = subtotal > 300000 ? 0 : 15000;
    const discountTotal = i % 3 === 0 ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal + deliveryFee - discountTotal;
    const status = statuses[i % statuses.length];
    const [order] = await db
      .insert(schema.orders)
      .values({
        orderNumber: `BM-${100000 + i}`,
        userId: customer.id,
        addressId: address.id,
        courierId: status === "pending" || status === "cancelled" ? null : couriers[i % couriers.length].id,
        warehouseId: warehouses[i % warehouses.length].id,
        status,
        paymentMethod: i % 2 === 0 ? "cash" : "card",
        paymentStatus: status === "delivered" ? "paid" : "unpaid",
        subtotal: String(subtotal),
        discountTotal: String(discountTotal),
        deliveryFee: String(deliveryFee),
        total: String(total),
        deliveryLat: address.lat,
        deliveryLng: address.lng,
        deliveryAddressText: `${address.city}, ${address.street} ${address.building}`,
        estimatedDeliveryAt: new Date(now.getTime() + 45 * 60000),
        deliveredAt: status === "delivered" ? new Date(now.getTime() - i * 3600000) : null,
      })
      .returning();
    orders.push(order);

    await db.insert(schema.orderItems).values(
      items.map((p) => ({
        orderId: order.id,
        productId: p.id,
        productNameSnapshot: p.nameUz,
        priceSnapshot: p.price,
        quantity: 2,
        total: String(Number(p.price) * 2),
      })),
    );

    const historySteps = ["pending", "confirmed", "packing", "courier_assigned", "on_the_way", "delivered"];
    const currentIdx = historySteps.indexOf(status) === -1 ? 0 : historySteps.indexOf(status);
    await db.insert(schema.orderStatusHistory).values(
      historySteps.slice(0, currentIdx + 1).map((s, idx) => ({
        orderId: order.id,
        status: s,
        note: `Status: ${s}`,
        createdAt: new Date(now.getTime() - (currentIdx - idx) * 15 * 60000),
      })),
    );

    await db.insert(schema.payments).values({
      orderId: order.id,
      provider: order.paymentMethod === "cash" ? "cash" : "click",
      amount: order.total,
      status: status === "delivered" ? "success" : "pending",
      paidAt: status === "delivered" ? new Date() : null,
    });

    if (status === "delivered" && order.courierId) {
      await db.insert(schema.courierRatings).values({
        courierId: order.courierId,
        orderId: order.id,
        userId: customer.id,
        rating: 5,
        comment: "Kuryer juda tez va xushmuomala edi.",
      });
    }
  }

  // --- Notifications ---
  await db.insert(schema.notifications).values(
    insertedCustomers.flatMap((c) => [
      {
        userId: c.id,
        titleUz: "Buyurtmangiz qabul qilindi",
        titleRu: "Ваш заказ принят",
        titleEn: "Your order was accepted",
        body: "Buyurtmangiz muvaffaqiyatli qabul qilindi va tez orada yetkaziladi.",
        type: "order",
      },
      {
        userId: c.id,
        titleUz: "Yangi aksiya!",
        titleRu: "Новая акция!",
        titleEn: "New promotion!",
        body: "Sut mahsulotlariga 15% chegirma boshlandi.",
        type: "promo",
      },
    ]),
  );

  // --- Chat support ---
  const [thread] = await db
    .insert(schema.chatThreads)
    .values({ userId: insertedCustomers[0].id, subject: "Buyurtma bo'yicha savol", assignedAdminId: insertedAdmins[1].id })
    .returning();
  await db.insert(schema.chatMessages).values([
    { threadId: thread.id, senderId: insertedCustomers[0].id, message: "Salom, buyurtmam qachon yetib keladi?" },
    { threadId: thread.id, senderId: insertedAdmins[1].id, message: "Assalomu alaykum! Buyurtmangiz 30-40 daqiqada yetib boradi." },
  ]);

  // --- Settings & translations sample ---
  await db.insert(schema.settings).values([
    { key: "site_name", value: "Baraka Market" },
    { key: "support_phone", value: "+998 71 200 00 00" },
    { key: "default_delivery_fee", value: "15000" },
    { key: "free_delivery_threshold", value: "300000" },
    { key: "bonus_earn_percent", value: "2" },
  ]);
  await db.insert(schema.translations).values([
    { namespace: "common", key: "welcome", uz: "Xush kelibsiz", ru: "Добро пожаловать", en: "Welcome" },
    { namespace: "common", key: "thanks", uz: "Rahmat", ru: "Спасибо", en: "Thank you" },
  ]);

  console.log("✅ Seed complete:", {
    roles: roleRows.length,
    users: insertedAdmins.length + insertedCouriersUsers.length + insertedCustomers.length,
    categories: categories.length,
    brands: brands.length,
    products: productRows.length,
    orders: orders.length,
  });

  await pool.end();
}

const isDirectRun = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  seed().catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  });
}
