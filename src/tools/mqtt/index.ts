import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'
import * as TE from 'fp-ts/lib/TaskEither'
import * as mqtt from 'mqtt'
import { IClientPublishOptions } from 'mqtt'
import { MqttConnectError, MqttPublishError } from './errors'
import { MqttEnvConfig } from './types'

type EnvRequired = MqttEnvConfig & {
  MQTT_URL: string
}

const getClient = (
  env: EnvRequired
): TE.TaskEither<MqttConnectError, mqtt.Client> => () =>
  new Promise(resolve => {
    try {
      const client = mqtt.connect(env.MQTT_URL, {
        username: env.MQTT_USERNAME,
        password: env.MQTT_PASSWORD,
        clientId: env.MQTT_CLIENT_ID,
      })
      client.on('connect', () => resolve(E.right(client)))
      client.on('error', e =>
        resolve(E.left(new MqttConnectError('Mqtt connect error', e)))
      )
    } catch (e) {
      resolve(E.left(new MqttConnectError('Mqtt connect error', E.toError(e))))
    }
  })

const publishFn = (client: mqtt.Client) => (
  topic: string,
  message: string | Buffer,
  opts: IClientPublishOptions = { qos: 0 }
) =>
  pipe(
    TE.taskify<
      string,
      string | Buffer,
      IClientPublishOptions,
      Error,
      mqtt.Packet
    >(client.publish.bind(client)),
    p => p(topic, message, opts),
    TE.mapLeft(e => new MqttPublishError('Mqtt publish error', e))
  )

// Connects to mqtt with a TaskEither and then provides a
// publish function so the same connection can be re-used multiple times
export const mqttClient = (env: EnvRequired) =>
  pipe(getClient(env), TE.map(publishFn))

// Connects to mqtt, publishes once, and then severs the connection
export type MqttError = MqttConnectError | MqttPublishError
export const mqttPublish = (env: EnvRequired) => (
  topic: string,
  message: string | Buffer,
  opts: IClientPublishOptions = { qos: 0 }
) =>
  pipe(
    getClient(env),
    TE.chainFirstW(client => publishFn(client)(topic, message, opts)),
    TE.map(client => client.end())
  )

export type MqttPublish = ReturnType<typeof mqttPublish>
