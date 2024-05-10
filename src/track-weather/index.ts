import axios from "axios"
import { format } from "date-fns"
import * as A from "fp-ts/lib/Array"
import * as E from "fp-ts/lib/Either"
import { constVoid, identity, pipe } from "fp-ts/lib/function"
import * as NEA from "fp-ts/lib/NonEmptyArray"
import { MonoidSum } from "fp-ts/lib/number"
import * as R from "fp-ts/lib/Record"
import * as TE from "fp-ts/lib/TaskEither"
import * as Rdr from "fp-ts/Reader"
import * as RTE from "fp-ts/ReaderTaskEither"
import * as str from "fp-ts/string"
import { MqttPublish } from "../tools/mqtt"
import { decodeWith } from "../tools/utils"
import { TrackWeatherError } from "./errors"
import {
  OpenWeatherMapResponse,
  RainStore,
  WeatherData,
  WeatherEnvConfig
} from "./types"

const baseUrl = "https://api.openweathermap.org/data/2.5/weather"

export const getWeather: RTE.ReaderTaskEither<
  WeatherEnvConfig,
  TrackWeatherError,
  WeatherData
> = envConfig =>
  pipe(
    TE.tryCatch(
      () =>
        axios.get(
          `${baseUrl}?zip=${envConfig.ZIP_CODE},us&units=metric&APPID=${envConfig.OPEN_WEATHER_APP_ID}`
        ),
      l => new TrackWeatherError("Open Weather Map Request Error", E.toError(l))
    ),
    TE.chain(res =>
      pipe(
        res.data,
        decodeWith(OpenWeatherMapResponse, TrackWeatherError),
        TE.fromEither
      )
    ),
    TE.map(res => ({
      temperature: res.main.temp,
      pressure: res.main.pressure,
      humidity: res.main.humidity,
      wind_speed: res.wind?.speed ?? 0,
      cloud_cover: res.clouds?.all ?? 0,
      rain1h: res.rain?.["1h"] ?? 0,
      rain3h: res.rain?.["3h"] ?? 0
    }))
  )

export const mqttPublishWeather = (mqttPublish: MqttPublish) => (
  topic: string,
  weatherData: WeatherData
): TE.TaskEither<TrackWeatherError, void> =>
  pipe(
    mqttPublish(topic, JSON.stringify(weatherData)),
    TE.map(constVoid),
    TE.mapLeft(e => new TrackWeatherError("MQTT Publish Error", e))
  )

export const didRainInPastTwoDays = (thresholdMm = 5) =>
  pipe(
    Rdr.ask<{ rainStore: RainStore }>(),
    Rdr.map(({ rainStore }) =>
      pipe(
        rainStore,
        // Create a key based on day and hour
        R.collect(str.Ord)((timestamp, rainMM) => ({
          dayHour: format(new Date(Number(timestamp)), "dd-hh"),
          rainMM
        })),
        // Group by dayHour key
        NEA.groupBy(r => r.dayHour),
        // Get the average of each group
        R.map(group =>
          pipe(
            group,
            A.foldMap(MonoidSum)(r => r.rainMM),
            sum => sum / group.length
          )
        ),
        // Sum all of the groups to get the total rain mm
        R.foldMap(str.Ord)(MonoidSum)(identity),
        rainSumMm => rainSumMm >= thresholdMm
      )
    )
  )
