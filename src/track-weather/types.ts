import * as t from 'io-ts'

export const WeatherEnvConfig = t.strict({
  OPEN_WEATHER_API_ID: t.string,
  ZIP_CODE: t.string
})
export type WeatherEnvConfig = t.TypeOf<typeof WeatherEnvConfig>

export const MqttEnvConfig = t.strict({
  MQTT_HOST: t.string,
  MQTT_WEATHER_TOPIC: t.string
})
export type MqttEnvConfig = t.TypeOf<typeof MqttEnvConfig>

export const OpenWeatherMapResponse = t.intersection([
  t.strict({
    main: t.strict({
      temp: t.number,
      pressure: t.number,
      humidity: t.number,
    })
  }),
  t.partial({
    wind: t.strict({
      speed: t.number,
    }),
    clouds: t.strict({
      all: t.number
    }),
    rain: t.strict({
      '1h': t.number,
      '3h': t.number
    })
  })
])
export type OpenWeatherMapResponse = t.TypeOf<typeof OpenWeatherMapResponse>