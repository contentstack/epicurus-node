import * as bluebird from 'bluebird'
import * as redis from 'redis'
import { RedisClient } from 'redis'

import { config } from './config'
import {
  EpicurusRedisConfig,
  serverCallback,
  subscribeCallback,
} from './interface'
import {
  publish,
  removeCallbacks,
  setupSubscriptionListener,
  shutdownSubscribers,
  subscribe,
} from './lib/pub_sub'
import {
  closeAllClients,
  disableServers,
  enableServers,
  request,
  server,
} from './lib/request_response'

bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)
const REDIS_TLS_HOST = 'rediss'

function getConfig(redisConfig: EpicurusRedisConfig) {
  if (redisConfig.url && redisConfig.url.includes(REDIS_TLS_HOST)) {
    return {
      tls: {
        ...redisConfig,
        rejectUnauthorized: true
      }
    }
  } else {
    return redisConfig
  }

}

export default function Epicurus (
  redisConfig: EpicurusRedisConfig = {
    host: 'localhost',
    port: 6379
  },
  requestTimeout?: number
): EpicurusPublicInterface {
  // A separate subscription Redis client is required as once a client has
  // called SUBSCRIBE, it is put into a slave mode the does not allow any other
  // kind of action
  const redisClient = redis.createClient(getConfig(redisConfig))
  const redisSub = redis.createClient(getConfig(redisConfig))
  const requestValidityPeriod = requestTimeout || config.requestValidityPeriod

  setupSubscriptionListener(redisSub)
  enableServers()

  return {
    getRedisClient: () => redisClient,
    getRedisSubClient: () => redisSub,
    subscribe: <T = any>(channel: string, callback: subscribeCallback<T>) => subscribe(redisSub, channel, callback),
    publish: (channel: string, body: any) => publish(redisClient, channel, body),
    server: <T = any, S = any>(channel: string, callback: serverCallback<T, S>) => server(redisClient, channel, callback, requestValidityPeriod),
    request: <T = any>(channel: string, body: any) => request<T>(redisClient, channel, body, requestValidityPeriod),
    shutdown: () => {
      shutdownSubscribers()
      disableServers()
    },
    close: () => {
      redisSub.unsubscribe()
      redisSub.quit()
      redisClient.quit()
      removeCallbacks()
      closeAllClients()
    }
  }
}

export type EpicurusPublicInterface = {
  getRedisClient: () => RedisClient
  getRedisSubClient: () => RedisClient
  subscribe: <T = any>(channel: string, callback: subscribeCallback<T>) => Promise<void>
  publish: (channel: string, body: any) => void
  server: <T = any, S = any>(channel: string, callback: serverCallback<T, S>) => Promise<void>
  request: <T = any>(channel: string, body: any) => Promise<T>
  shutdown: () => void
  close: () => void
}
