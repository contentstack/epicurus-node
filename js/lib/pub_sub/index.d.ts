import { subscribeCallback } from '../../interface';
export declare function subscribe<T>(subClient: any, channel: string, callback: subscribeCallback<T>): Promise<void>;
export declare function publish(redisClient: any, channel: string, body: any): void;
export declare function setupSubscriptionListener(subClient: any): void;
export declare function shutdownSubscribers(): void;
export declare function removeCallbacks(): void;
