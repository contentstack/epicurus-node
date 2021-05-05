"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pub_sub_1 = require("./lib/pub_sub");
const request_response_1 = require("./lib/request_response");
const redis = require("redis");
const bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
function Epicurus(redisConfig = {
    host: 'localhost',
    port: 6379
}) {
    const redisClient = redis.createClient(redisConfig);
    const redisSub = redis.createClient(redisConfig);
    pub_sub_1.setupSubscriptionListener(redisSub);
    request_response_1.enableServers();
    return {
        getRedisClient: () => redisClient,
        getRedisSubClient: () => redisSub,
        subscribe: (channel, callback) => pub_sub_1.subscribe(redisSub, channel, callback),
        publish: (channel, body) => pub_sub_1.publish(redisClient, channel, body),
        server: (channel, callback) => request_response_1.server(redisClient, channel, callback),
        request: (channel, body) => request_response_1.request(redisClient, channel, body),
        shutdown: () => {
            pub_sub_1.shutdownSubscribers();
            request_response_1.disableServers();
        },
        close: () => {
            redisSub.unsubscribe();
            redisSub.quit();
            redisClient.quit();
            pub_sub_1.removeCallbacks();
            request_response_1.closeAllClients();
        }
    };
}
exports.default = Epicurus;
//# sourceMappingURL=index.js.map