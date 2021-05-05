"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EpicurusError extends Error {
    constructor(message, meta) {
        super(message);
        this.id = meta.id || Number((Math.random() * 100000).toFixed(0));
        this.name = meta.name || this.name;
        this.context = meta.context;
        this.stack = new Error().stack;
        this.status = meta.stack || meta.status;
        this.severity = meta.severity;
    }
    toString() {
        return this.name + ': ' + this.message;
    }
}
exports.EpicurusError = EpicurusError;
//# sourceMappingURL=error.js.map