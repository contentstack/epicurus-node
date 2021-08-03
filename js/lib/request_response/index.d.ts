import { serverCallback } from '../../interface';
export declare function request<T>(redisClient: any, channel: string, body: any, requestValidityPeriod: number): Promise<T>;
export declare function server<T, S>(redisClient: any, channel: string, callback: serverCallback<T, S>, serverValidityPeriod: number): Promise<void>;
export declare function disableServers(): void;
export declare function enableServers(): void;
export declare function closeAllClients(): void;
