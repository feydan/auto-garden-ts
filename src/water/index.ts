import * as Rdr from "fp-ts/Reader"
import * as RTE from "fp-ts/ReaderTaskEither"
import { sequenceS } from "fp-ts/lib/Apply"
import * as D from "fp-ts/lib/Date"
import * as O from "fp-ts/lib/Option"
import * as T from "fp-ts/lib/Task"
import * as TE from "fp-ts/lib/TaskEither"
import { constVoid, pipe } from "fp-ts/lib/function"
import { info } from "../tools/logger/index"
import { Logger } from "../tools/logger/types"
import { mqttPublish } from "../tools/mqtt"
import { MqttConnectError, MqttPublishError } from "../tools/mqtt/errors"
import { MqttEnvConfig } from "../tools/mqtt/types"
import { RaspberryPiWriteError } from "../tools/raspberry-pi/errors"
import { Gpio } from "../tools/raspberry-pi/gpio"
import { didRainInPastTwoDays } from "../track-weather/index"
import { RainStore } from "../track-weather/types"
import { InvalidMonthError } from "./errors"
import { WaterEnvConfig } from "./types"

export interface WaterTheGardenParams {
  gpio: Gpio
  rainStore: RainStore
  config: MqttEnvConfig & WaterEnvConfig
  logger: Logger
}

export type WaterTheGardenError =
  | InvalidMonthError
  | RaspberryPiWriteError
  | MqttConnectError
  | MqttPublishError

export const waterTheGarden = (
  month: string,
  rainThreshold?: 5
): RTE.ReaderTaskEither<WaterTheGardenParams, WaterTheGardenError, void> =>
  pipe(
    rainThreshold,
    didRainInPastTwoDays,
    RTE.rightReader,
    RTE.chainW(didRain =>
      didRain
        ? pipe(
            info("Not watering because it rained in the past two days"),
            Rdr.map(TE.fromIO)
          )
        : pipe(
            getWateringHours(month),
            Rdr.map(
              TE.fromOption(
                () => new InvalidMonthError(`Invalid month: ${month}`)
              )
            ),
            RTE.chainFirstReaderIOKW(hours =>
              info(`Watering for ${hours} hours`)
            ),
            RTE.chainW(waterForHours),
            RTE.chainFirstReaderIOKW(({ hours }) =>
              info(`Watered for ${hours} hours`)
            ),
            RTE.chainW(publishMqtt)
          )
    )
  )

export const waterForHours = (hours: number) =>
  pipe(
    RTE.ask<{ gpio: Gpio }>(),
    RTE.chainTaskEitherK(({ gpio }) =>
      pipe(
        TE.rightIO(D.now),
        TE.chainFirst(() => gpio.write(true)),
        TE.chainFirst(() => T.delay(hours * 1000 * 60 * 60)(gpio.write(false))),
        TE.map(startTime => ({
          startTime,
          endTime: D.now(),
          hours
        })),
      )
    )
  )

const getWateringHours = (month: string) =>
  pipe(
    Rdr.ask<{ config: WaterEnvConfig }>(),
    Rdr.map(({ config }) =>
      pipe(
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
          December: config.HOURS_DECEMBER
        },
        (hoursPerWeek: Record<string, number>) =>
          O.fromNullable(hoursPerWeek[month]),
        O.map(hoursPerWeek => hoursPerWeek / config.DAYS_PER_WEEK)
      )
    )
  )

interface PublishParams {
  startTime: number
  endTime: number
  hours: number
}
const publishMqtt = ({ startTime, endTime, hours }: PublishParams) =>
  pipe(
    Rdr.ask<{ config: MqttEnvConfig }>(),
    Rdr.map(({ config }) =>
      pipe(
        sequenceS(O.Monad)({
          MQTT_URL: O.fromNullable(config.MQTT_URL),
          MQTT_WATERING_TOPIC: O.fromNullable(config.MQTT_WATERING_TOPIC)
        }),
        O.map(reqEnv =>
          pipe(
            mqttPublish(reqEnv)(
              reqEnv.MQTT_WATERING_TOPIC,
              JSON.stringify({
                time_frame: {
                  gte: startTime,
                  lte: endTime
                },
                hours
              })
            ),
            TE.map(constVoid)
          )
        ),
        O.getOrElse(() => TE.rightIO(constVoid))
      )
    )
  )
