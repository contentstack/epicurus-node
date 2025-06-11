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
const chai_1 = require("chai");
const index_1 = require("../index");
describe('request response', () => {
    let epicurus;
    beforeEach(() => {
        epicurus = index_1.default();
    });
    afterEach(() => {
        epicurus.close();
    });
    describe('request', () => {
        it('a request returns a promise that is resolved when the server finishes its callback', () => __awaiter(this, void 0, void 0, function* () {
            epicurus.server('sampleEndpoint', function (request, callback) {
                callback(null, { msg: 'hello' });
            });
            const result = yield epicurus.request('sampleEndpoint', {});
            chai_1.expect(result).to.eql({ msg: 'hello' });
        }));
        it('a request is appropriately selective', () => __awaiter(this, void 0, void 0, function* () {
            epicurus.server('sampleEndpoint', function (request, callback) {
                callback(null, { msg: 'hello' });
            });
            epicurus.server('nonValidEndpoint', function (request, callback) {
                callback(null, { msg: 'goodbye' });
            });
            const result = yield epicurus.request('sampleEndpoint', {});
            chai_1.expect(result).to.eql({ msg: 'hello' });
        }));
        it('a request can receive multiple responses from the one server', () => __awaiter(this, void 0, void 0, function* () {
            epicurus.server('sampleEndpoint', function (request, callback) {
                callback(null, { msg: 'hello' });
            });
            const result = yield epicurus.request('sampleEndpoint', {});
            chai_1.expect(result).to.eql({ msg: 'hello' });
            const resultTwo = yield epicurus.request('sampleEndpoint', {});
            chai_1.expect(resultTwo).to.eql({ msg: 'hello' });
            const resultThree = yield epicurus.request('sampleEndpoint', {});
            chai_1.expect(resultThree).to.eql({ msg: 'hello' });
        }));
        it('a request promise will be rejected if the server callbacks with an error', (done) => {
            epicurus.server('sampleEndpoint', function (request, callback) {
                callback(new Error('Err'));
            });
            epicurus.request('sampleEndpoint', {}).catch((e) => {
                chai_1.expect(e.name).to.eql('Error');
                chai_1.expect(e.message).to.eql('Err');
                done();
            });
        });
        it('only a single server receives a request', () => __awaiter(this, void 0, void 0, function* () {
            let count = 0;
            epicurus.server('sampleEndpoint', function (request, callback) {
                count++;
                callback(null, { msg: 'hello' });
            });
            epicurus.server('sampleEndpoint', function (request, callback) {
                count++;
                callback(null, { msg: 'hello' });
            });
            const result = yield epicurus.request('sampleEndpoint', {});
            chai_1.expect(result).to.eql({ msg: 'hello' });
            chai_1.expect(count).to.eql(1);
        }));
        it('a server receives a request with the channel on it', () => __awaiter(this, void 0, void 0, function* () {
            let serverChannelName = '';
            epicurus.server('sampleEndpoint', function (request, callback) {
                serverChannelName = request.channel;
                callback(null, { msg: 'hello' });
            });
            yield epicurus.request('sampleEndpoint', {});
            chai_1.expect(serverChannelName).to.eql('sampleEndpoint');
        }));
        it('a server stops processing requests when shutdown is called', () => __awaiter(this, void 0, void 0, function* () {
            const epicurusTwo = index_1.default();
            let count = 0;
            let countTwo = 0;
            epicurus.server('sampleEndpoint', (request, callback) => {
                count++;
                callback(null, { msg: 'hello' });
            });
            yield epicurus.request('sampleEndpoint', {});
            epicurus.shutdown();
            yield Promise.all([
                epicurus.request('sampleEndpoint', {}).then(() => {
                    chai_1.expect(count).to.eql(1);
                    chai_1.expect(countTwo).to.eql(1);
                }),
                new Promise((res, rej) => {
                    setTimeout(() => {
                        res();
                        epicurusTwo.server('sampleEndpoint', (request, callback) => {
                            countTwo++;
                            callback(null, { msg: 'hello' });
                        });
                    }, 20);
                })
            ]);
        }));
    });
});
//# sourceMappingURL=request_response.spec.js.map