import * as t from 'io-ts'

export const WeatherEnvConfig = t.strict({
  OPEN_WEATHER_APP_ID: t.string,
  ZIP_CODE: t.string,
})
export type WeatherEnvConfig = t.TypeOf<typeof WeatherEnvConfig>

export const OpenWeatherMapResponse = t.exact(
  t.intersection([
    t.type({
      main: t.strict({
        temp: t.number,
        pressure: t.number,
        humidity: t.number,
      }),
    }),
    t.partial({
      wind: t.strict({
        speed: t.number,
      }),
      clouds: t.strict({
        all: t.number,
      }),
      rain: t.strict({
        '1h': t.number,
        '3h': t.number,
      }),
    }),
  ])
)
export type OpenWeatherMapResponse = t.TypeOf<typeof OpenWeatherMapResponse>

export const WeatherData = t.strict({
  temperature: t.number,
  pressure: t.number,
  humidity: t.number,
  wind_speed: t.number,
  cloud_cover: t.number,
  rain1h: t.number,
  rain3h: t.number,
})
export type WeatherData = t.TypeOf<typeof WeatherData>

export const RainStore = t.record(t.string, t.number)
export type RainStore = t.TypeOf<typeof RainStore>
