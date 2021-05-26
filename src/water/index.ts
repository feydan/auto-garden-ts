import { sequenceS } from 'fp-ts/lib/Apply'
import * as D from 'fp-ts/lib/Date'
import { constVoid, pipe } from 'fp-ts/lib/function'
import * as O from 'fp-ts/lib/Option'
import * as T from 'fp-ts/lib/Task'
import * as TE from 'fp-ts/lib/TaskEither'
import { mqttPublish } from '../tools/mqtt'
import { MqttEnvConfig } from '../tools/mqtt/types'
import { Gpio } from '../tools/raspberry-pi/gpio'
import { observe } from '../tools/utils'
import { didRainInPastTwoDays } from '../track-weather/index'
import { RainStore } from '../track-weather/types'
import { InvalidMonthError } from './errors'
import { WaterEnvConfig } from './types'

interface WaterTheGardenParams {
  gpio: Gpio, 
  rainStore: RainStore, 
  config: MqttEnvConfig & WaterEnvConfig,
}

export const waterTheGarden = ({gpio, rainStore, config}: WaterTheGardenParams) => (month: string, rainThreshold?: 5) => pipe(
  rainThreshold,
  didRainInPastTwoDays(rainStore),
  didRain => didRain 
    ? TE.rightIO(() => console.log('Not watering because it rained in the past two days')) 
    : pipe(
      getWateringHours(month, config),
      TE.fromOption(() => new InvalidMonthError(`Invalid month: ${month}`)),
      TE.map(observe(hours => console.log(`Watering for ${hours} hours`))),
      TE.chainW(waterForHours(gpio)),
      TE.map(observe(({hours}) => console.log(`Watered for ${hours} hours`))),
      TE.chainW(publishMqtt(config))
    )
)

export const waterForHours = (gpio: Gpio) => (hours: number) => pipe(
  TE.rightIO(D.now),
  TE.chainFirst(() => gpio.write(true)),
  TE.chainFirst(() => T.delay(hours * 1000 * 60 * 60)(gpio.write(false))),
  TE.map(startTime => ({
    startTime,
    endTime: D.now(),
    hours
  }))
)

const getWateringHours = (month: string, config: WaterEnvConfig) => pipe(
  {
    January: config.HOURS_JANUARY,
    February: config.HOURS_FEBRUARY,
    March: config.HOURS_MARCH,
    April: config.HOURS_APRIL,
    May: config.HOURS_MAY,
    June: config.HOURS_JUNE,
    July: config.HOURS_JULY,
    August: config.HOURS_AUGUST,
    September: config.HOURS_SEPTEMBER,
    October: config.HOURS_OCTOBER,
    November: config.HOURS_NOVEMBER,
    December: config.HOURS_DECEMBER,
  },
  (hoursPerWeek: Record<string, number>) => O.fromNullable(hoursPerWeek[month]),
  O.map(hoursPerWeek => hoursPerWeek / config.DAYS_PER_WEEK)
)

interface PublishParams {
  startTime: number
  endTime: number
  hours: number
}
const publishMqtt = (config: MqttEnvConfig) => ({startTime, endTime, hours}: PublishParams) => pipe(
  sequenceS(O.Monad)({
    MQTT_URL: O.fromNullable(config.MQTT_URL),
    MQTT_WATERING_TOPIC: O.fromNullable(config.MQTT_WATERING_TOPIC),
  }),
  O.map(reqEnv => pipe(
    mqttPublish(reqEnv)(
      reqEnv.MQTT_WATERING_TOPIC, 
      JSON.stringify({
        time_frame: {
          gte: startTime,
          lte: endTime
        },
        hours
    })),
    TE.map(constVoid)
  )),
  O.getOrElse(() => TE.rightIO(constVoid))
)

