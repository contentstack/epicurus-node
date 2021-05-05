import { serverCallback } from '../../interface';
export declare function request<T>(redisClient: any, channel: string, body: any): Promise<T>;
export declare function server<T, S>(redisClient: any, channel: string, callback: serverCallback<T, S>): Promise<void>;
export declare function disableServers(): void;
export declare function enableServers(): void;
export declare function closeAllClients(): void;
