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
import { decodeWith } from '../error-utils'
import { MqttClient } from '../tools/mqtt'
import { TrackWeatherError } from './errors'
import {
  MqttEnvConfig,
  OpenWeatherMapResponse,
  RainStore,
  WeatherEnvConfig,
} from './types'

const baseUrl = 'https://api.openweathermap.org/data/2.5/weather'

export const getWeather = (
  envConfig: WeatherEnvConfig
): TE.TaskEither<TrackWeatherError, OpenWeatherMapResponse> =>
  pipe(
    TE.tryCatch(
      () =>
        rp(
          `${baseUrl}?zip=${envConfig.ZIP_CODE},us&units=metric&APPID=${envConfig.OPEN_WEATHER_API_ID}`
        ).promise(),
      l => new TrackWeatherError('Open Weather Map Request Error', E.toError(l))
    ),
    TE.chain(
      TE.fromEitherK(decodeWith(OpenWeatherMapResponse, TrackWeatherError))
    )
  )

export const mqttPublishWeather = (
  envConfig: MqttEnvConfig,
  client: MqttClient
) => (
  weatherResponse: OpenWeatherMapResponse
): TE.TaskEither<TrackWeatherError, mqtt.Packet> =>
  pipe(
    client.publish(
      envConfig.MQTT_WEATHER_TOPIC,
      JSON.stringify(weatherResponse)
    ),
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
