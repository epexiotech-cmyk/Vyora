"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.directoryManagerDatabaseService = exports.DirectoryManagerDatabaseService = void 0;
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var database_1 = require("@vyora/database");
var better_sqlite3_1 = __importDefault(require("better-sqlite3"));
var drizzle_orm_1 = require("drizzle-orm");
var better_sqlite3_2 = require("drizzle-orm/better-sqlite3");
var electron_1 = require("electron");
var LoggerService_1 = require("../logger/LoggerService");
var DirectoryManagerDatabaseService = /** @class */ (function () {
    function DirectoryManagerDatabaseService() {
        this.EXPECTED_REGISTRY = [
            'pincode',
            'country',
            'currency',
            'state',
            'uqc',
            'hsn',
            'sac',
        ];
        this.TARGET_VERSION = 5;
        this.dbInstance = null;
        this.sqliteInstance = null;
        var isDev = !electron_1.app.isPackaged;
        if (isDev) {
            this.dbPath = path.join(__dirname, '../../resources/directory-manager.db');
        }
        else {
            this.dbPath = path.join(process.resourcesPath, 'resources/directory-manager.db');
        }
    }
    DirectoryManagerDatabaseService.prototype.init = function () {
        if (this.dbInstance)
            return;
        LoggerService_1.loggerService.info("[DirectoryManagerDatabaseService] Initializing at ".concat(this.dbPath));
        try {
            var dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }
            this.sqliteInstance = new better_sqlite3_1.default(this.dbPath);
            // Initialize schema natively
            this.sqliteInstance.exec("\n        CREATE TABLE IF NOT EXISTS directory_registry (\n          id INTEGER PRIMARY KEY AUTOINCREMENT,\n          directory_name TEXT NOT NULL,\n          current_version TEXT NOT NULL,\n          record_count INTEGER NOT NULL,\n          checksum TEXT NOT NULL,\n          active_database TEXT NOT NULL,\n          last_updated_at TEXT DEFAULT CURRENT_TIMESTAMP\n        );\n        CREATE TABLE IF NOT EXISTS directory_update_log (\n          id INTEGER PRIMARY KEY AUTOINCREMENT,\n          directory_name TEXT NOT NULL,\n          old_version TEXT,\n          new_version TEXT NOT NULL,\n          status TEXT NOT NULL,\n          error_message TEXT,\n          updated_at TEXT DEFAULT CURRENT_TIMESTAMP\n        );\n        CREATE TABLE IF NOT EXISTS directory_settings (\n          key TEXT PRIMARY KEY,\n          value TEXT NOT NULL\n        );\n      ");
            this.dbInstance = (0, better_sqlite3_2.drizzle)(this.sqliteInstance);
            this.seedInitialMetadata();
            LoggerService_1.loggerService.info("[DirectoryManagerDatabaseService] Initialization complete.");
        }
        catch (error) {
            LoggerService_1.loggerService.error('[DirectoryManagerDatabaseService] Initialization failed:', error);
            throw error;
        }
    };
    DirectoryManagerDatabaseService.prototype.seedInitialMetadata = function () {
        if (!this.sqliteInstance)
            return;
        // Seed directories_v2.db as active if not set or if it's currently v1
        var activeSetting = this.sqliteInstance
            .prepare('SELECT value FROM directory_settings WHERE key = ?')
            .get('active_directory_database');
        // Transition to highest available version
        var activeVal = activeSetting === null || activeSetting === void 0 ? void 0 : activeSetting.value;
        var v5Path = path.join(path.dirname(this.dbPath), 'directories_v5.db');
        var v4Path = path.join(path.dirname(this.dbPath), 'directories_v4.db');
        var v3Path = path.join(path.dirname(this.dbPath), 'directories_v3.db');
        var v2Path = path.join(path.dirname(this.dbPath), 'directories_v2.db');
        if (activeVal !== 'directories_v5.db' && fs.existsSync(v5Path)) {
            LoggerService_1.loggerService.info('[DirectoryManagerDatabaseService] Transitioning to directories_v5.db');
            if (activeVal) {
                this.sqliteInstance
                    .prepare('INSERT OR REPLACE INTO directory_settings (key, value) VALUES (?, ?)')
                    .run('last_known_good_database', activeVal);
            }
            this.sqliteInstance
                .prepare('INSERT OR REPLACE INTO directory_settings (key, value) VALUES (?, ?)')
                .run('active_directory_database', 'directories_v5.db');
        }
        else if (activeVal !== 'directories_v5.db' &&
            activeVal !== 'directories_v4.db' &&
            fs.existsSync(v4Path)) {
            LoggerService_1.loggerService.info('[DirectoryManagerDatabaseService] Transitioning to directories_v4.db');
            if (activeVal) {
                this.sqliteInstance
                    .prepare('INSERT OR REPLACE INTO directory_settings (key, value) VALUES (?, ?)')
                    .run('last_known_good_database', activeVal);
            }
            this.sqliteInstance
                .prepare('INSERT OR REPLACE INTO directory_settings (key, value) VALUES (?, ?)')
                .run('active_directory_database', 'directories_v4.db');
        }
        else if (activeVal !== 'directories_v5.db' &&
            activeVal !== 'directories_v4.db' &&
            activeVal !== 'directories_v3.db' &&
            fs.existsSync(v3Path)) {
            LoggerService_1.loggerService.info('[DirectoryManagerDatabaseService] Transitioning to directories_v3.db');
            if (activeVal) {
                this.sqliteInstance
                    .prepare('INSERT OR REPLACE INTO directory_settings (key, value) VALUES (?, ?)')
                    .run('last_known_good_database', activeVal);
            }
            this.sqliteInstance
                .prepare('INSERT OR REPLACE INTO directory_settings (key, value) VALUES (?, ?)')
                .run('active_directory_database', 'directories_v3.db');
        }
        else if (activeVal !== 'directories_v5.db' &&
            activeVal !== 'directories_v4.db' &&
            activeVal !== 'directories_v3.db' &&
            activeVal !== 'directories_v2.db' &&
            fs.existsSync(v2Path)) {
            LoggerService_1.loggerService.info('[DirectoryManagerDatabaseService] Transitioning to directories_v2.db');
            if (activeVal) {
                this.sqliteInstance
                    .prepare('INSERT OR REPLACE INTO directory_settings (key, value) VALUES (?, ?)')
                    .run('last_known_good_database', activeVal);
            }
            this.sqliteInstance
                .prepare('INSERT OR REPLACE INTO directory_settings (key, value) VALUES (?, ?)')
                .run('active_directory_database', 'directories_v2.db');
        }
        else if (!activeSetting) {
            this.sqliteInstance
                .prepare('INSERT OR REPLACE INTO directory_settings (key, value) VALUES (?, ?)')
                .run('active_directory_database', 'directories_v1.db');
        }
        // Seed registry for pincode
        this.sqliteInstance
            .prepare("UPDATE directory_registry SET current_version = 'v2', record_count = 165627, checksum = 'chk_pincode_v2', active_database = 'directories_v2.db', last_updated_at = CURRENT_TIMESTAMP WHERE directory_name = 'pincode'")
            .run();
        this.sqliteInstance
            .prepare("\n      INSERT INTO directory_registry (directory_name, current_version, record_count, checksum, active_database)\n      SELECT 'pincode', 'v2', 165627, 'chk_pincode_v2', 'directories_v2.db'\n      WHERE NOT EXISTS (SELECT 1 FROM directory_registry WHERE directory_name = 'pincode')\n    ")
            .run();
        // Seed registry for country
        this.sqliteInstance
            .prepare("UPDATE directory_registry SET current_version = 'v1', record_count = 250, checksum = 'chk_country_v1', active_database = 'directories_v2.db', last_updated_at = CURRENT_TIMESTAMP WHERE directory_name = 'country'")
            .run();
        this.sqliteInstance
            .prepare("\n      INSERT INTO directory_registry (directory_name, current_version, record_count, checksum, active_database)\n      SELECT 'country', 'v1', 250, 'chk_country_v1', 'directories_v2.db'\n      WHERE NOT EXISTS (SELECT 1 FROM directory_registry WHERE directory_name = 'country')\n    ")
            .run();
        // Seed registry for currency
        this.sqliteInstance
            .prepare("UPDATE directory_registry SET current_version = 'v1', record_count = 154, checksum = 'chk_currency_v1', active_database = 'directories_v3.db', last_updated_at = CURRENT_TIMESTAMP WHERE directory_name = 'currency'")
            .run();
        this.sqliteInstance
            .prepare("\n      INSERT INTO directory_registry (directory_name, current_version, record_count, checksum, active_database)\n      SELECT 'currency', 'v1', 154, 'chk_currency_v1', 'directories_v3.db'\n      WHERE NOT EXISTS (SELECT 1 FROM directory_registry WHERE directory_name = 'currency')\n    ")
            .run();
        // Seed registry for state
        this.sqliteInstance
            .prepare("UPDATE directory_registry SET current_version = 'v1', record_count = 36, checksum = 'chk_state_v1', active_database = 'directories_v3.db', last_updated_at = CURRENT_TIMESTAMP WHERE directory_name = 'state'")
            .run();
        this.sqliteInstance
            .prepare("\n      INSERT INTO directory_registry (directory_name, current_version, record_count, checksum, active_database)\n      SELECT 'state', 'v1', 36, 'chk_state_v1', 'directories_v3.db'\n      WHERE NOT EXISTS (SELECT 1 FROM directory_registry WHERE directory_name = 'state')\n    ")
            .run();
        // Seed registry for uqc
        this.sqliteInstance
            .prepare("UPDATE directory_registry SET current_version = 'v1', record_count = 53, checksum = 'chk_uqc_v1', active_database = 'directories_v4.db', last_updated_at = CURRENT_TIMESTAMP WHERE directory_name = 'uqc'")
            .run();
        this.sqliteInstance
            .prepare("\n      INSERT INTO directory_registry (directory_name, current_version, record_count, checksum, active_database)\n      SELECT 'uqc', 'v1', 53, 'chk_uqc_v1', 'directories_v4.db'\n      WHERE NOT EXISTS (SELECT 1 FROM directory_registry WHERE directory_name = 'uqc')\n    ")
            .run();
        // Seed registry for hsn
        this.sqliteInstance
            .prepare("UPDATE directory_registry SET current_version = 'v1', record_count = 21927, checksum = 'chk_hsn_v1', active_database = 'directories_v5.db', last_updated_at = CURRENT_TIMESTAMP WHERE directory_name = 'hsn'")
            .run();
        this.sqliteInstance
            .prepare("\n      INSERT INTO directory_registry (directory_name, current_version, record_count, checksum, active_database)\n      SELECT 'hsn', 'v1', 21927, 'chk_hsn_v1', 'directories_v5.db'\n      WHERE NOT EXISTS (SELECT 1 FROM directory_registry WHERE directory_name = 'hsn')\n    ")
            .run();
        // Seed registry for sac
        this.sqliteInstance
            .prepare("UPDATE directory_registry SET current_version = 'v1', record_count = 681, checksum = 'chk_sac_v1', active_database = 'directories_v5.db', last_updated_at = CURRENT_TIMESTAMP WHERE directory_name = 'sac'")
            .run();
        this.sqliteInstance
            .prepare("\n      INSERT INTO directory_registry (directory_name, current_version, record_count, checksum, active_database)\n      SELECT 'sac', 'v1', 681, 'chk_sac_v1', 'directories_v5.db'\n      WHERE NOT EXISTS (SELECT 1 FROM directory_registry WHERE directory_name = 'sac')\n    ")
            .run();
    };
    DirectoryManagerDatabaseService.prototype.getDb = function () {
        if (!this.dbInstance) {
            this.init();
        }
        return this.dbInstance;
    };
    DirectoryManagerDatabaseService.prototype.close = function () {
        if (this.sqliteInstance) {
            this.sqliteInstance.close();
            this.sqliteInstance = null;
            this.dbInstance = null;
        }
    };
    DirectoryManagerDatabaseService.prototype.getActiveDirectoryDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db, setting;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        db = this.getDb();
                        return [4 /*yield*/, db
                                .select()
                                .from(database_1.directorySettings)
                                .where((0, drizzle_orm_1.eq)(database_1.directorySettings.key, 'active_directory_database'))
                                .get()];
                    case 1:
                        setting = _a.sent();
                        return [2 /*return*/, (setting === null || setting === void 0 ? void 0 : setting.value) || null];
                }
            });
        });
    };
    DirectoryManagerDatabaseService.prototype.setActiveDirectoryDatabase = function (fileName) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        db = this.getDb();
                        return [4 /*yield*/, db
                                .insert(database_1.directorySettings)
                                .values({ key: 'active_directory_database', value: fileName })
                                .onConflictDoUpdate({ target: database_1.directorySettings.key, set: { value: fileName } })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DirectoryManagerDatabaseService.prototype.getLastKnownGoodDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db, setting;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        db = this.getDb();
                        return [4 /*yield*/, db
                                .select()
                                .from(database_1.directorySettings)
                                .where((0, drizzle_orm_1.eq)(database_1.directorySettings.key, 'last_known_good_database'))
                                .get()];
                    case 1:
                        setting = _a.sent();
                        return [2 /*return*/, (setting === null || setting === void 0 ? void 0 : setting.value) || null];
                }
            });
        });
    };
    DirectoryManagerDatabaseService.prototype.setLastKnownGoodDatabase = function (fileName) {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        db = this.getDb();
                        return [4 /*yield*/, db
                                .insert(database_1.directorySettings)
                                .values({ key: 'last_known_good_database', value: fileName })
                                .onConflictDoUpdate({ target: database_1.directorySettings.key, set: { value: fileName } })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return DirectoryManagerDatabaseService;
}());
exports.DirectoryManagerDatabaseService = DirectoryManagerDatabaseService;
exports.directoryManagerDatabaseService = new DirectoryManagerDatabaseService();
