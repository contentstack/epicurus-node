"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const epicurus = index_1.default();
epicurus.server('findAccountBalanceHistory', function (msg, done) {
    const responseBody = {
        key: 'cake',
        speed: 'slow',
        distance: 'close',
        when: 'now'
    };
    done(null, responseBody);
});
console.log('Epicurus Server booted. Listening on findAccountBalanceHistory');
//# sourceMappingURL=server.js.map