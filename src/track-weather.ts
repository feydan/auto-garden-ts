import { pipe } from 'fp-ts/lib/pipeable'
import * as TE from 'fp-ts/lib/TaskEither'
import { getConfig } from './config'
import { getWeather } from './track-weather/index'
import { storeRain1hMm } from './track-weather/rain-store'
import { WeatherEnvConfig } from './track-weather/types'

const storeRain = storeRain1hMm()

pipe(
  getConfig(WeatherEnvConfig),
  TE.fromEither,
  TE.chainW(getWeather),
  TE.chainFirstW(({ rain1h }) => storeRain(rain1h)),
  TE.bimap(console.dir, console.dir)
)()
