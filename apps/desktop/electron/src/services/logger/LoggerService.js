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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerService = exports.LoggerService = void 0;
var path = __importStar(require("path"));
var electron_1 = require("electron");
var electron_log_1 = __importDefault(require("electron-log"));
var LoggerService = /** @class */ (function () {
    function LoggerService() {
        var userDataPath = electron_1.app.getPath('userData');
        var logPath = path.join(userDataPath, 'logs', 'app.log');
        electron_log_1.default.transports.file.resolvePathFn = function () { return logPath; };
        electron_log_1.default.transports.file.level = 'info';
        electron_log_1.default.transports.console.level = !electron_1.app.isPackaged ? 'debug' : false;
        // Catch unhandled errors
        electron_log_1.default.catchErrors({
            showDialog: false,
            onError: function (error) {
                electron_log_1.default.error('Uncaught Exception:', error);
            },
        });
        process.on('unhandledRejection', function (reason) {
            electron_log_1.default.error('Unhandled Rejection:', reason);
        });
    }
    LoggerService.prototype.init = function () {
        this.info('Logger initialized.');
    };
    LoggerService.prototype.info = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        electron_log_1.default.info.apply(electron_log_1.default, __spreadArray([message], args, false));
    };
    LoggerService.prototype.warn = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        electron_log_1.default.warn.apply(electron_log_1.default, __spreadArray([message], args, false));
    };
    LoggerService.prototype.error = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        electron_log_1.default.error.apply(electron_log_1.default, __spreadArray([message], args, false));
    };
    LoggerService.prototype.debug = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        electron_log_1.default.debug.apply(electron_log_1.default, __spreadArray([message], args, false));
    };
    return LoggerService;
}());
exports.LoggerService = LoggerService;
exports.loggerService = new LoggerService();
