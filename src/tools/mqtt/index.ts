import { pipe } from 'fp-ts/lib/function'
import * as TE from 'fp-ts/lib/TaskEither'
import * as mqtt from 'mqtt'
import { IClientPublishOptions } from 'mqtt'

export const mqttClient = (client: mqtt.Client) => ({
  publish: (
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
      >(client.publish),
      publish => publish(topic, message, opts)
    ),
})

export type MqttClient = ReturnType<typeof mqttClient>
