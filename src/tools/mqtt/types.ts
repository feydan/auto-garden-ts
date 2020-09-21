import * as t from 'io-ts'

export const MqttEnvConfig = t.exact(
  t.partial({
    MQTT_URL: t.string,
    MQTT_WEATHER_TOPIC: t.string,
    MQTT_USERNAME: t.string,
    MQTT_PASSWORD: t.string,
    MQTT_CLIENT_ID: t.string,
  })
)
export type MqttEnvConfig = t.TypeOf<typeof MqttEnvConfig>
