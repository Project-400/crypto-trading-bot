"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class HTTP {
    static async get(url) {
        return await new Promise((resolve, reject) => {
            axios_1.default.get(`${url}`)
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
    static async post(url, postData) {
        return await new Promise((resolve, reject) => {
            axios_1.default.post(`${url}`, postData)
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
exports.HTTP = HTTP;
