"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const v4 = require("uuid/v4");
const config_1 = require("../../config");
const error_1 = require("../error");
let clients = [];
let serversEnabled;
function request(redisClient, channel, body) {
    return new Promise((res, rej) => __awaiter(this, void 0, void 0, function* () {
        let responseValid = true;
        const reqId = v4();
        const ttl = Date.now();
        const redisBody = { reqId, body, ttl };
        let timeout;
        let timeoutFallback;
        const clientClone = redisClient.duplicate();
        timeout = setTimeout(function () {
            return __awaiter(this, void 0, void 0, function* () {
                const reqCheck = yield redisClient.getAsync(`${reqId}-ref`);
                if (!reqCheck) {
                    timeoutFallback = setTimeout(function () {
                        return __awaiter(this, void 0, void 0, function* () {
                            rej(new error_1.EpicurusError('No response from server', {
                                context: { originalRequest: body, channel: channel },
                                severity: 2
                            }));
                            responseValid = false;
                            clientClone.quit();
                        });
                    }, config_1.config.requestValidityPeriod);
                }
                else {
                    rej(new error_1.EpicurusError('Server not found', {
                        context: { originalRequest: body, channel: channel },
                        severity: 2
                    }));
                    responseValid = false;
                    clientClone.quit();
                }
            });
        }, config_1.config.requestValidityPeriod + 100);
        clientClone.brpop(reqId, 0, function (_null, popInfo) {
            clearTimeout(timeout);
            clearTimeout(timeoutFallback);
            if (!responseValid) {
                return;
            }
            const redisResponse = popInfo[1];
            const response = JSON.parse(redisResponse);
            if (response.error) {
                rej(new error_1.EpicurusError(response.error.message, {
                    severity: response.error.severity,
                    context: {
                        context: { originalRequest: body, channel: channel },
                        stack: response.error.stack,
                        name: response.error.name
                    }
                }));
            }
            else {
                res(response.result);
            }
            clientClone.quit();
        });
        yield redisClient.setAsync(`${reqId}-ref`, JSON.stringify(redisBody));
        yield redisClient.lpushAsync(channel, reqId);
    }));
}
exports.request = request;
function server(redisClient, channel, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        const clientClone = redisClient.duplicate();
        clients.push(clientClone);
        function brpop() {
            clientClone.brpop(channel, 0, function (_null, popInfo) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (_null) {
                        console.error('BRPOP ERROR', _null);
                    }
                    if (enableServers) {
                        brpop();
                    }
                    if (!popInfo) {
                        return;
                    }
                    const reqId = popInfo[1];
                    const rawRequest = yield redisClient.getAsync(`${reqId}-ref`);
                    yield redisClient.delAsync(`${reqId}-ref`);
                    const req = JSON.parse(rawRequest);
                    req.body.channel = channel;
                    if (req.ttl > Date.now() - config_1.config.requestValidityPeriod) {
                        callback(req.body, function (error, result) {
                            return __awaiter(this, void 0, void 0, function* () {
                                const errorRef = error
                                    ? { name: error.name, message: error.message, stack: error.stack, severity: error.severity || 1 }
                                    : null;
                                let redisResponse = {
                                    error: errorRef,
                                    result: result
                                };
                                redisClient.lpush(req.reqId, JSON.stringify(redisResponse));
                            });
                        });
                    }
                });
            });
        }
        brpop();
    });
}
exports.server = server;
function disableServers() {
    serversEnabled = false;
    closeAllClients();
}
exports.disableServers = disableServers;
function enableServers() {
    serversEnabled = true;
}
exports.enableServers = enableServers;
function closeAllClients() {
    clients.forEach(c => c.end(false));
}
exports.closeAllClients = closeAllClients;
//# sourceMappingURL=index.js.map