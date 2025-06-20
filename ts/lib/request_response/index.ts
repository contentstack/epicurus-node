import * as v4 from 'uuid/v4'

import {
  EpicurusRequest,
  EpicurusResponse,
  serverCallback,
} from '../../interface'
import { EpicurusError } from '../error'

let clients = []
let serversEnabled

export function request<T>(redisClient, channel: string, body: any, requestValidityPeriod: number): Promise<T> {
  return new Promise(async (res, rej) => {
    let responseValid = true
    const reqId = v4()
    const ttl = Date.now()
    const redisBody: EpicurusRequest = { reqId, body, ttl }
    let timeout
    let timeoutFallback
    const clientClone = redisClient.duplicate()

    timeout = setTimeout(async function () {
      const reqCheck = await redisClient.getAsync(`${reqId}-ref`)
      // If there is no request check, it is an indication that a server block
      // has started processing the request, so give it another validity period and check again
      if (!reqCheck) {
        timeoutFallback = setTimeout(async function () {
          rej(new EpicurusError('No response from server', {
            context: { originalRequest: body, channel: channel },
            severity: 2
          }))

          responseValid = false
          clientClone.quit()
        }, requestValidityPeriod)
      } else {
        rej(new EpicurusError('Server not found', {
          context: { originalRequest: body, channel: channel },
          severity: 2
        }))

        responseValid = false
        clientClone.quit()
      }
    }, requestValidityPeriod + 100)

    clientClone.brpop(reqId, 0, function (_null, popInfo) {
      clearTimeout(timeout)
      clearTimeout(timeoutFallback)
      if (!responseValid) {
        return
      }

      const redisResponse = popInfo[1]
      const response: EpicurusResponse = JSON.parse(redisResponse)

      if (response.error) {
        rej(new EpicurusError(response.error.message, {
          status: response.error.status,
          severity: response.error.severity,
          context: {
            context: { originalRequest: body, channel: channel },
            stack: response.error.stack,
            name: response.error.name
          }
        }))
      } else {
        res(response.result)
      }

      clientClone.quit()
    })

    await redisClient.setAsync(`${reqId}-ref`, JSON.stringify(redisBody))
    await redisClient.lpushAsync(channel, reqId)
  })
}

export async function server<T, S>(redisClient, channel: string, callback: serverCallback<T, S>, serverValidityPeriod: number): Promise<void> {
  const REDIS_RESPONSE_TTL_IN_SECONDS = 1
  const clientClone = redisClient.duplicate()
  clients.push(clientClone)

  function brpop() {
    clientClone.brpop(channel, 0, async function (_null, popInfo) {
      if (_null) {
        console.error('BRPOP ERROR', _null)
      }
      if (enableServers) {
        brpop()
      }

      if (!popInfo) {
        return
      }

      const reqId = popInfo[1]
      const rawRequest: string = await redisClient.getAsync(`${reqId}-ref`)
      await redisClient.delAsync(`${reqId}-ref`)
      const req: EpicurusRequest = JSON.parse(rawRequest)
      req.body.channel = channel

      callback(req.body, async function (error, result) {
        const errorRef = error
          ? { name: error.name, message: error.message, stack: error.stack, severity: error.severity || 1, status: error.status }
          : null

        let redisResponse: EpicurusResponse = {
          error: errorRef,
          result: result
        }

        redisClient.lpush(req.reqId, JSON.stringify(redisResponse))
        redisClient.expire(req.reqId, REDIS_RESPONSE_TTL_IN_SECONDS)
      })

    })
  }

  brpop()
}

export function disableServers() {
  serversEnabled = false
  closeAllClients()
}

export function enableServers() {
  serversEnabled = true
}

export function closeAllClients() {
  clients.forEach(c => c.end(false))
}
