import * as A from 'fp-ts/lib/Array'
import * as E from 'fp-ts/lib/Either'
import { identity } from 'fp-ts/lib/function'
import { monoidSum } from 'fp-ts/lib/Monoid'
import * as NEA from 'fp-ts/lib/NonEmptyArray'
import { pipe } from 'fp-ts/lib/pipeable'
import * as R from 'fp-ts/lib/Record'
import * as TE from 'fp-ts/lib/TaskEither'
import * as moment from 'moment'
import * as mqtt from 'mqtt'
import * as rp from 'request-promise'
import { MqttClient } from '../tools/mqtt'
import { decodeWith } from '../tools/utils'
import { TrackWeatherError } from './errors'
import {
  MqttEnvConfig,
  OpenWeatherMapResponse,
  RainStore,
  WeatherData,
  WeatherEnvConfig,
} from './types'

const baseUrl = 'https://api.openweathermap.org/data/2.5/weather'

export const getWeather = (
  envConfig: WeatherEnvConfig
): TE.TaskEither<TrackWeatherError, WeatherData> =>
  pipe(
    TE.tryCatch(
      () =>
        rp(
          `${baseUrl}?zip=${envConfig.ZIP_CODE},us&units=metric&APPID=${envConfig.OPEN_WEATHER_APP_ID}`
        ).promise(),
      l => new TrackWeatherError('Open Weather Map Request Error', E.toError(l))
    ),
    TE.chainW(
      TE.fromEitherK(res =>
        E.parseJSON(
          res,
          l => new TrackWeatherError('Json Parse Error', E.toError(l))
        )
      )
    ),
    TE.chain(
      TE.fromEitherK(decodeWith(OpenWeatherMapResponse, TrackWeatherError))
    ),
    TE.map(res => ({
      temperature: res.main.temp,
      pressure: res.main.pressure,
      humidity: res.main.humidity,
      wind_speed: res.wind?.speed ?? 0,
      cloud_cover: res.clouds?.all ?? 0,
      rain1h: res.rain?.['1h'] ?? 0,
      rain3h: res.rain?.['3h'] ?? 0,
    }))
  )

export const mqttPublishWeather = (
  envConfig: MqttEnvConfig,
  client: MqttClient
) => (
  weatherData: WeatherData
): TE.TaskEither<TrackWeatherError, mqtt.Packet> =>
  pipe(
    client.publish(envConfig.MQTT_WEATHER_TOPIC, JSON.stringify(weatherData)),
    TE.mapLeft(e => new TrackWeatherError('MQTT Publish Error', e))
  )

export const didRainInPastTwoDays = (rainStore: RainStore) => (
  thresholdMm = 5
) =>
  pipe(
    rainStore,
    // Create a key based on day and hour
    R.collect((timestamp, rainMM) => ({
      dayHour: moment.unix(Number(timestamp)).format('DD-hh'),
      rainMM,
    })),
    // Group by dayHour key
    NEA.groupBy(r => r.dayHour),
    // Get the average of each group
    R.map(group =>
      pipe(
        group,
        A.foldMap(monoidSum)(r => r.rainMM),
        sum => sum / group.length
      )
    ),
    // Sum all of the groups to get the total rain mm
    R.foldMap(monoidSum)(identity),
    rainSumMm => rainSumMm >= thresholdMm
  )
