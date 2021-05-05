import { EpicurusRedisConfig, serverCallback, subscribeCallback } from './interface';
import { RedisClient } from 'redis';
export default function Epicurus(redisConfig?: EpicurusRedisConfig): EpicurusPublicInterface;
export declare type EpicurusPublicInterface = {
    getRedisClient: () => RedisClient;
    getRedisSubClient: () => RedisClient;
    subscribe: <T = any>(channel: string, callback: subscribeCallback<T>) => Promise<void>;
    publish: (channel: string, body: any) => void;
    server: <T = any, S = any>(channel: string, callback: serverCallback<T, S>) => Promise<void>;
    request: <T = any>(channel: string, body: any) => Promise<T>;
    shutdown: () => void;
    close: () => void;
};
