import { constVoid, pipe } from 'fp-ts/lib/function'
import * as O from 'fp-ts/lib/Option'
import * as T from 'fp-ts/lib/Task'
import * as TE from 'fp-ts/lib/TaskEither'
import { MqttEnvConfig } from '../tools/mqtt/types'
import { Gpio } from '../raspberry-pi/gpio'
import { sequenceS } from 'fp-ts/lib/Apply'
import { mqttPublish } from '../tools/mqtt'
import { RainStore } from '../track-weather/types'
import { didRainInPastTwoDays } from '../track-weather/index'
import { observe } from '../tools/utils'
import { InvalidMonthError } from './errors'
import * as D from 'fp-ts/lib/Date'

export const waterTheGarden = (gpio: Gpio, rainStore: RainStore, config: MqttEnvConfig) => (month: string, rainThreshold?: 5) => pipe(
  rainThreshold,
  didRainInPastTwoDays(rainStore),
  shouldWater => !shouldWater 
    ? TE.rightIO(() => console.log('Not watering because it rained in the past two days')) 
    : pipe(
      getWateringHours(month),
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
  TE.chainFirst(() => T.delay(hours)(gpio.write(false))),
  TE.map(startTime => ({
    startTime,
    endTime: D.now(),
    hours
  }))
)

const getWateringHours = (month: string) => pipe(
  O.fromNullable(HOURS_PER_WEEK[month]),
  O.map(hoursPerWeek => hoursPerWeek / DAYS_PER_WEEK)
)

interface PublishParams {
  startTime: number
  endTime: number
  hours: number
}
const publishMqtt = (config: MqttEnvConfig) => ({startTime, endTime, hours}: PublishParams) => pipe(
  sequenceS(O.option)({
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