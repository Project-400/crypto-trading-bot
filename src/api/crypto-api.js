"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoApi = void 0;
const axios_1 = __importDefault(require("axios"));
const settings_1 = require("../settings");
class CryptoApi {
    static async get(path) {
        return await new Promise((resolve, reject) => {
            axios_1.default.get(`${settings_1.CryptoApiUrl}${path}`)
                .then((res) => {
                if (res.status === 200)
                    resolve(res.data);
                else
                    reject(res);
            })
                .catch((error) => {
                console.error(error);
                reject(error);
            });
        });
    }
    static async post(path, postData) {
        return await new Promise((resolve, reject) => {
            axios_1.default.post(`${settings_1.CryptoApiUrl}${path}`, postData)
                .then((res) => {
                if (res.status === 200)
                    resolve(res.data);
                else
                    reject(res);
            })
                .catch((error) => {
                console.error(error);
                reject(error);
            });
        });
    }
}
exports.CryptoApi = CryptoApi;
