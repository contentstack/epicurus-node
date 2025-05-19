export declare class EpicurusError extends Error {
    id: number;
    context: {};
    status: {};
    severity: number;
    constructor(message: string, meta: {
        context?: {};
        args?: any;
        requestReference?: any;
        severity: number;
        status?: number;
        id?: number;
        stack?: string;
        name?: string;
    });
    toString(): string;
}
