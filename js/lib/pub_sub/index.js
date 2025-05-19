"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let callbackReference = {};
let enableMessageEvents;
function subscribe(subClient, channel, callback) {
    subClient.subscribe(channel);
    if (callbackReference[channel]) {
        callbackReference[channel].push(callback);
    }
    else {
        callbackReference[channel] = [callback];
    }
    return new Promise((res) => {
        subClient.on('subscribe', (channelSubscribedTo) => {
            if (channel === channelSubscribedTo) {
                res();
            }
        });
    });
}
exports.subscribe = subscribe;
function publish(redisClient, channel, body) {
    const message = JSON.stringify(body);
    redisClient.publish(channel, message);
}
exports.publish = publish;
function setupSubscriptionListener(subClient) {
    enableMessageEvents = true;
    subClient.on('message', function (channel, message) {
        if (!enableMessageEvents) {
            return;
        }
        const callbacks = callbackReference[channel];
        if (callbacks) {
            let response = JSON.parse(message);
            response.channel = channel;
            callbacks.forEach(callback => callback(response));
        }
    });
}
exports.setupSubscriptionListener = setupSubscriptionListener;
function shutdownSubscribers() {
    enableMessageEvents = false;
}
exports.shutdownSubscribers = shutdownSubscribers;
function removeCallbacks() {
    callbackReference = {};
}
exports.removeCallbacks = removeCallbacks;
//# sourceMappingURL=index.js.map