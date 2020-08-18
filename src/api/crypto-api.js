"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const settings_1 = require("../settings");
const http_1 = require("./http");
class CryptoApi {
    static async get(path) {
        return await http_1.HTTP.get(`${settings_1.CryptoApiUrl}${path}`);
    }
    static async post(path, postData) {
        return await http_1.HTTP.post(`${settings_1.CryptoApiUrl}${path}`, postData);
    }
}
exports.CryptoApi = CryptoApi;
