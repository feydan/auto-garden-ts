import { flow } from 'fp-ts/lib/function'
import { pipe } from 'fp-ts/lib/pipeable'
import * as TE from 'fp-ts/lib/TaskEither'
import * as mqtt from 'mqtt'
import * as rp from 'request-promise'
import { decodeWith } from '../error-utils'
import { TrackWeatherError } from './errors'
import { MqttEnvConfig, OpenWeatherMapResponse, WeatherEnvConfig } from './types'

const baseUrl = 'https://api.openweathermap.org/data/2.5/weather'

export const getWeather = (envConfig: WeatherEnvConfig): TE.TaskEither<TrackWeatherError, OpenWeatherMapResponse> => pipe(
  TE.tryCatch(
    () => rp(`${baseUrl}?zip=${envConfig.ZIP_CODE},us&units=metric&APPID=${envConfig.OPEN_WEATHER_API_ID}`).promise(),
    l => new TrackWeatherError('Open Weather Map Request Error', l as Error)
  ),
  TE.chain(flow(
    decodeWith(OpenWeatherMapResponse, TrackWeatherError), 
    TE.fromEither
  ))
)

export const mqttPublishWeather = (envConfig: MqttEnvConfig, client: mqtt.Client) => (weatherResponse: OpenWeatherMapResponse): TE.TaskEither<TrackWeatherError, mqtt.Packet> => pipe(
  TE.taskify(client.publish),
  publish => publish(envConfig.MQTT_WEATHER_TOPIC, JSON.stringify(weatherResponse)),
  TE.mapLeft(e => new TrackWeatherError('MQTT Publish Error', e))
)