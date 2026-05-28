"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/src/main.ts
var import_electron6 = require("electron");

// electron/src/ipc/handlers/dbHandlers.ts
var import_crypto2 = require("crypto");

// ../../packages/database/src/schema/system.ts
var system_exports = {};
__export(system_exports, {
  companies: () => companies,
  financial_years: () => financial_years,
  settings: () => settings,
  users: () => users
});
var import_sqlite_core = require("drizzle-orm/sqlite-core");
var companies = (0, import_sqlite_core.sqliteTable)("companies", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  name: (0, import_sqlite_core.text)("name").notNull(),
  gstin: (0, import_sqlite_core.text)("gstin"),
  address: (0, import_sqlite_core.text)("address"),
  phone: (0, import_sqlite_core.text)("phone"),
  email: (0, import_sqlite_core.text)("email"),
  createdAt: (0, import_sqlite_core.integer)("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: (0, import_sqlite_core.integer)("updated_at", { mode: "timestamp" }).notNull()
});
var users = (0, import_sqlite_core.sqliteTable)("users", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  fullName: (0, import_sqlite_core.text)("full_name").notNull(),
  username: (0, import_sqlite_core.text)("username").notNull().unique(),
  passwordHash: (0, import_sqlite_core.text)("password_hash").notNull(),
  role: (0, import_sqlite_core.text)("role").notNull(),
  createdAt: (0, import_sqlite_core.integer)("created_at", { mode: "timestamp" }).notNull()
});
var settings = (0, import_sqlite_core.sqliteTable)("settings", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  theme: (0, import_sqlite_core.text)("theme").default("dark").notNull(),
  defaultCompanyId: (0, import_sqlite_core.text)("default_company_id").references(() => companies.id),
  backupEnabled: (0, import_sqlite_core.integer)("backup_enabled", { mode: "boolean" }).default(false).notNull(),
  createdAt: (0, import_sqlite_core.integer)("created_at", { mode: "timestamp" }).notNull()
});
var financial_years = (0, import_sqlite_core.sqliteTable)("financial_years", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  label: (0, import_sqlite_core.text)("label").notNull(),
  startDate: (0, import_sqlite_core.integer)("start_date", { mode: "timestamp" }).notNull(),
  endDate: (0, import_sqlite_core.integer)("end_date", { mode: "timestamp" }).notNull(),
  isActive: (0, import_sqlite_core.integer)("is_active", { mode: "boolean" }).default(false).notNull()
});

// ../../packages/database/src/schema/master.ts
var master_exports = {};
__export(master_exports, {
  customers: () => customers,
  products: () => products,
  suppliers: () => suppliers,
  taxes: () => taxes,
  units: () => units
});
var import_sqlite_core2 = require("drizzle-orm/sqlite-core");
var taxes = (0, import_sqlite_core2.sqliteTable)("taxes", {
  id: (0, import_sqlite_core2.text)("id").primaryKey(),
  companyId: (0, import_sqlite_core2.text)("company_id").references(() => companies.id).notNull(),
  name: (0, import_sqlite_core2.text)("name").notNull(),
  rate: (0, import_sqlite_core2.real)("rate").notNull(),
  createdAt: (0, import_sqlite_core2.integer)("created_at", { mode: "timestamp" }).notNull()
});
var units = (0, import_sqlite_core2.sqliteTable)("units", {
  id: (0, import_sqlite_core2.text)("id").primaryKey(),
  companyId: (0, import_sqlite_core2.text)("company_id").references(() => companies.id).notNull(),
  name: (0, import_sqlite_core2.text)("name").notNull(),
  shortName: (0, import_sqlite_core2.text)("short_name").notNull(),
  createdAt: (0, import_sqlite_core2.integer)("created_at", { mode: "timestamp" }).notNull()
});
var customers = (0, import_sqlite_core2.sqliteTable)("customers", {
  id: (0, import_sqlite_core2.text)("id").primaryKey(),
  companyId: (0, import_sqlite_core2.text)("company_id").references(() => companies.id).notNull(),
  name: (0, import_sqlite_core2.text)("name").notNull(),
  gstin: (0, import_sqlite_core2.text)("gstin"),
  mobile: (0, import_sqlite_core2.text)("mobile"),
  email: (0, import_sqlite_core2.text)("email"),
  city: (0, import_sqlite_core2.text)("city"),
  state: (0, import_sqlite_core2.text)("state"),
  balance: (0, import_sqlite_core2.real)("balance").default(0).notNull(),
  createdAt: (0, import_sqlite_core2.integer)("created_at", { mode: "timestamp" }).notNull()
});
var suppliers = (0, import_sqlite_core2.sqliteTable)("suppliers", {
  id: (0, import_sqlite_core2.text)("id").primaryKey(),
  companyId: (0, import_sqlite_core2.text)("company_id").references(() => companies.id).notNull(),
  name: (0, import_sqlite_core2.text)("name").notNull(),
  gstin: (0, import_sqlite_core2.text)("gstin"),
  mobile: (0, import_sqlite_core2.text)("mobile"),
  email: (0, import_sqlite_core2.text)("email"),
  city: (0, import_sqlite_core2.text)("city"),
  state: (0, import_sqlite_core2.text)("state"),
  balance: (0, import_sqlite_core2.real)("balance").default(0).notNull(),
  createdAt: (0, import_sqlite_core2.integer)("created_at", { mode: "timestamp" }).notNull()
});
var products = (0, import_sqlite_core2.sqliteTable)("products", {
  id: (0, import_sqlite_core2.text)("id").primaryKey(),
  companyId: (0, import_sqlite_core2.text)("company_id").references(() => companies.id).notNull(),
  name: (0, import_sqlite_core2.text)("name").notNull(),
  sku: (0, import_sqlite_core2.text)("sku"),
  hsnCode: (0, import_sqlite_core2.text)("hsn_code"),
  unitId: (0, import_sqlite_core2.text)("unit_id").references(() => units.id),
  taxId: (0, import_sqlite_core2.text)("tax_id").references(() => taxes.id),
  salePrice: (0, import_sqlite_core2.real)("sale_price").default(0).notNull(),
  purchasePrice: (0, import_sqlite_core2.real)("purchase_price").default(0).notNull(),
  stock: (0, import_sqlite_core2.real)("stock").default(0).notNull(),
  createdAt: (0, import_sqlite_core2.integer)("created_at", { mode: "timestamp" }).notNull()
});

// ../../packages/database/src/client/db.ts
var import_better_sqlite3 = __toESM(require("better-sqlite3"));
var import_better_sqlite32 = require("drizzle-orm/better-sqlite3");
var initializeDatabase = (dbPath) => {
  const sqlite = new import_better_sqlite3.default(dbPath);
  sqlite.pragma("journal_mode = WAL");
  const db = (0, import_better_sqlite32.drizzle)(sqlite, {
    schema: {
      ...system_exports,
      ...master_exports
    }
  });
  return { db, sqlite };
};

// ../../packages/database/src/utils/password.ts
var bcrypt = __toESM(require("bcryptjs"));
var hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// ../../packages/database/src/seed/index.ts
var import_crypto = require("crypto");
var import_drizzle_orm = require("drizzle-orm");
var seedDatabase = async (db) => {
  const existingAdmin = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.username, "admin")).get();
  if (existingAdmin) {
    console.log("Database already seeded.");
    return;
  }
  console.log("Seeding initial data...");
  const companyId = (0, import_crypto.randomUUID)();
  const now = /* @__PURE__ */ new Date();
  await db.insert(companies).values({
    id: companyId,
    name: "My Business",
    createdAt: now,
    updatedAt: now
  });
  const hashedPassword = await hashPassword("admin123");
  await db.insert(users).values({
    id: (0, import_crypto.randomUUID)(),
    fullName: "System Admin",
    username: "admin",
    passwordHash: hashedPassword,
    role: "admin",
    createdAt: now
  });
  await db.insert(settings).values({
    id: (0, import_crypto.randomUUID)(),
    theme: "dark",
    defaultCompanyId: companyId,
    backupEnabled: false,
    createdAt: now
  });
  console.log("Database seeded successfully.");
};

// electron/src/ipc/handlers/dbHandlers.ts
var import_drizzle_orm2 = require("drizzle-orm");
var import_electron3 = require("electron");

// electron/src/services/database/DatabaseService.ts
var fs = __toESM(require("fs"));
var path2 = __toESM(require("path"));
var import_migrator = require("drizzle-orm/better-sqlite3/migrator");
var import_electron2 = require("electron");

// electron/src/services/logger/LoggerService.ts
var path = __toESM(require("path"));
var import_electron = require("electron");
var import_electron_log = __toESM(require("electron-log"));
var LoggerService = class {
  constructor() {
    const userDataPath = import_electron.app.getPath("userData");
    const logPath = path.join(userDataPath, "logs", "app.log");
    import_electron_log.default.transports.file.resolvePathFn = () => logPath;
    import_electron_log.default.transports.file.level = "info";
    import_electron_log.default.transports.console.level = !import_electron.app.isPackaged ? "debug" : false;
    import_electron_log.default.catchErrors({
      showDialog: false,
      onError(error) {
        import_electron_log.default.error("Uncaught Exception:", error);
      }
    });
    process.on("unhandledRejection", (reason) => {
      import_electron_log.default.error("Unhandled Rejection:", reason);
    });
  }
  init() {
    this.info("Logger initialized.");
  }
  info(message, ...args) {
    import_electron_log.default.info(message, ...args);
  }
  warn(message, ...args) {
    import_electron_log.default.warn(message, ...args);
  }
  error(message, ...args) {
    import_electron_log.default.error(message, ...args);
  }
  debug(message, ...args) {
    import_electron_log.default.debug(message, ...args);
  }
};
var loggerService = new LoggerService();

// electron/src/services/database/DatabaseService.ts
var DatabaseService = class {
  db = null;
  dbPath;
  migrationsFolder;
  constructor() {
    const userDataPath = import_electron2.app.getPath("userData");
    const dbDir = path2.join(userDataPath, "database");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    this.dbPath = path2.join(dbDir, "vyora.db");
    const isDev2 = !import_electron2.app.isPackaged;
    if (isDev2) {
      this.migrationsFolder = path2.join(__dirname, "../../../packages/database/drizzle");
    } else {
      this.migrationsFolder = path2.join(process.resourcesPath, "assets/drizzle");
    }
  }
  async init() {
    loggerService.info(`[DatabaseService] Initializing at ${this.dbPath}`);
    try {
      const { db } = initializeDatabase(this.dbPath);
      this.db = db;
      if (fs.existsSync(this.migrationsFolder)) {
        loggerService.info(`[DatabaseService] Running migrations from ${this.migrationsFolder}...`);
        (0, import_migrator.migrate)(this.db, { migrationsFolder: this.migrationsFolder });
        loggerService.info(`[DatabaseService] Migrations applied successfully.`);
      } else {
        loggerService.warn(
          `[DatabaseService] Migrations folder not found at ${this.migrationsFolder}`
        );
      }
      await seedDatabase(this.db);
      loggerService.info(`[DatabaseService] Initialization complete.`);
    } catch (error) {
      loggerService.error("[DatabaseService] Initialization failed:", error);
      throw error;
    }
  }
  getDb() {
    if (!this.db) {
      throw new Error("Database is not initialized. Call init() first.");
    }
    return this.db;
  }
};
var dbService = new DatabaseService();

// electron/src/ipc/handlers/dbHandlers.ts
function registerCustomerHandlers() {
  import_electron3.ipcMain.handle(
    "db:customers:getAll",
    async (_event, _args) => {
      try {
        const db = dbService.getDb();
        const result = await db.select().from(customers).orderBy((0, import_drizzle_orm2.desc)(customers.createdAt));
        return { success: true, data: result };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  import_electron3.ipcMain.handle(
    "db:customers:create",
    async (_event, data) => {
      try {
        const db = dbService.getDb();
        const id = (0, import_crypto2.randomUUID)();
        const now = /* @__PURE__ */ new Date();
        const newCustomer = {
          ...data,
          id,
          createdAt: now
        };
        await db.insert(customers).values(newCustomer);
        const created = await db.select().from(customers).where((0, import_drizzle_orm2.eq)(customers.id, id)).get();
        return { success: true, data: created };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
}
function registerProductHandlers() {
  import_electron3.ipcMain.handle(
    "db:products:getAll",
    async (_event, _args) => {
      try {
        const db = dbService.getDb();
        const result = await db.select().from(products).orderBy((0, import_drizzle_orm2.desc)(products.createdAt));
        return { success: true, data: result };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
  import_electron3.ipcMain.handle(
    "db:products:create",
    async (_event, data) => {
      try {
        const db = dbService.getDb();
        const id = (0, import_crypto2.randomUUID)();
        const now = /* @__PURE__ */ new Date();
        const newProduct = {
          ...data,
          id,
          createdAt: now
        };
        await db.insert(products).values(newProduct);
        const created = await db.select().from(products).where((0, import_drizzle_orm2.eq)(products.id, id)).get();
        return { success: true, data: created };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );
}

// electron/src/services/filesystem/FileSystemService.ts
var fs2 = __toESM(require("fs"));
var path3 = __toESM(require("path"));
var import_electron4 = require("electron");
var FileSystemService = class {
  baseDir;
  dirs = {
    backups: "",
    exports: "",
    attachments: "",
    templates: ""
  };
  constructor() {
    this.baseDir = import_electron4.app.getPath("userData");
    this.dirs = {
      backups: path3.join(this.baseDir, "backups"),
      exports: path3.join(this.baseDir, "exports"),
      attachments: path3.join(this.baseDir, "attachments"),
      templates: path3.join(this.baseDir, "templates")
    };
  }
  init() {
    loggerService.info("[FileSystem] Initializing directories...");
    for (const dirPath of Object.values(this.dirs)) {
      if (!fs2.existsSync(dirPath)) {
        fs2.mkdirSync(dirPath, { recursive: true });
        loggerService.debug(`[FileSystem] Created directory: ${dirPath}`);
      }
    }
    loggerService.info("[FileSystem] Initialization complete.");
  }
  getPath(type) {
    return this.dirs[type];
  }
};
var fileSystemService = new FileSystemService();

// electron/src/windows/MainWindow.ts
var path4 = __toESM(require("path"));
var import_electron5 = require("electron");
var MainWindow = class {
  window = null;
  splash = null;
  isDev;
  constructor(isDev2) {
    this.isDev = isDev2;
  }
  async create() {
    this.splash = new import_electron5.BrowserWindow({
      width: 500,
      height: 300,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      icon: path4.join(__dirname, "../assets/icons/icon.png")
    });
    await this.splash.loadFile(path4.join(__dirname, "../assets/splash.html"));
    this.window = new import_electron5.BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 900,
      minHeight: 600,
      title: "Vyora",
      icon: path4.join(__dirname, "../assets/icons/icon.png"),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path4.join(__dirname, "preload.js"),
        sandbox: true
      },
      show: false
      // Show when ready to prevent flickering
    });
    if (!this.isDev) {
      this.window.setMenuBarVisibility(false);
    }
    this.window.on("ready-to-show", () => {
      this.splash?.destroy();
      this.window?.show();
      if (this.isDev) {
      }
    });
    if (this.isDev) {
      const rendererUrl = process.env.RENDERER_URL || "http://localhost:3000";
      await this.window.loadURL(rendererUrl);
    } else {
      const appPath = path4.join(__dirname, "../renderer/out/index.html");
      await this.window.loadFile(appPath);
    }
    this.window.on("closed", () => {
      this.window = null;
    });
  }
};

// electron/src/main.ts
var mainWindow = null;
var isDev = process.env.NODE_ENV === "development";
async function bootstrap() {
  await import_electron6.app.whenReady();
  loggerService.init();
  fileSystemService.init();
  import_electron6.ipcMain.handle("system:ping", () => {
    return "Electron Connected";
  });
  try {
    await dbService.init();
    registerCustomerHandlers();
    registerProductHandlers();
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }
  mainWindow = new MainWindow(isDev);
  await mainWindow.create();
  import_electron6.app.on("activate", async () => {
    if (import_electron6.BrowserWindow.getAllWindows().length === 0) {
      mainWindow = new MainWindow(isDev);
      await mainWindow.create();
    }
  });
}
bootstrap();
import_electron6.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron6.app.quit();
  }
});
