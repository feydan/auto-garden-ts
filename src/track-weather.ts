import { sequenceS } from 'fp-ts/lib/Apply'
import { constVoid } from 'fp-ts/lib/function'
import * as O from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/lib/pipeable'
import * as TE from 'fp-ts/lib/TaskEither'
import { getConfig } from './config'
import { mqttPublish } from './tools/mqtt'
import { MqttEnvConfig } from './tools/mqtt/types'
import { getWeather, mqttPublishWeather } from './track-weather/index'
import { storeRain1hMm } from './track-weather/rain-store'
import { WeatherData, WeatherEnvConfig } from './track-weather/types'

const storeRain = storeRain1hMm()

const publishWeatherData = (data: WeatherData) =>
  pipe(
    getConfig(MqttEnvConfig),
    TE.fromEither,
    TE.chainW(env =>
      pipe(
        sequenceS(O.Monad)({
          MQTT_URL: O.fromNullable(env.MQTT_URL),
          MQTT_WEATHER_TOPIC: O.fromNullable(env.MQTT_WEATHER_TOPIC),
        }),
        O.map(reqEnv => ({
          ...env,
          ...reqEnv,
        })),
        O.fold(
          () => TE.rightIO(constVoid),
          reqEnv =>
            mqttPublishWeather(mqttPublish(reqEnv))(
              reqEnv.MQTT_WEATHER_TOPIC,
              data
            )
        )
      )
    )
  )

pipe(
  getConfig(WeatherEnvConfig),
  TE.fromEither,
  TE.chainW(getWeather),
  TE.chainFirstW(({ rain1h }) => storeRain(rain1h)),
  TE.chainFirstW(publishWeatherData),
  TE.bimap(console.dir, console.dir)
)()
