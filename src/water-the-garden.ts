import * as D from "fp-ts/lib/Date"
import { constVoid, flow, pipe } from "fp-ts/lib/function"
import * as TE from "fp-ts/lib/TaskEither"
import * as RTE from "fp-ts/ReaderTaskEither"
import * as t from "io-ts"
import { getConfig } from "./config"
import { MqttEnvConfig } from "./tools/mqtt/types"
import { RaspberryPiSetupError } from "./tools/raspberry-pi/errors"
import { gpio, gpioDestroy } from "./tools/raspberry-pi/gpio"
import { getRainStore } from "./track-weather/rain-store"
import {
  waterTheGarden,
  WaterTheGardenError,
  WaterTheGardenParams
} from "./water/index"
import { WaterEnvConfig } from "./water/types"

process.on("exit", async () => await gpioDestroy()())
process.on("SIGTERM", async () => await gpioDestroy()())
process.on("SIGINT", async () => await gpioDestroy()())

const config = t.intersection([MqttEnvConfig, WaterEnvConfig])

const waterMultiplePinsSequentially = (
  pins: number[],
  month: string,
  rainThreshold?: 5 | undefined
): RTE.ReaderTaskEither<
  Omit<WaterTheGardenParams, "gpio">,
  WaterTheGardenError | RaspberryPiSetupError,
  void
> =>
  pipe(
    pins,
    RTE.traverseSeqArray(pin =>
      pipe(
        RTE.ask<Omit<WaterTheGardenParams, "gpio">>(),
        RTE.bindW(
          "gpio",
          RTE.fromTaskEitherK(c => gpio(pin, c.config.GPIO_DIRECTION))
        ),
        RTE.chainW(
          flow(waterTheGarden(month, rainThreshold), RTE.fromTaskEither)
        )
      )
    ),
    RTE.map(constVoid)
  )

const doWaterTheGarden = (month: string, rainThreshold?: 5 | undefined) =>
  pipe(
    getRainStore(),
    TE.bindTo("rainStore"),
    TE.bindW("config", () => TE.fromEither(getConfig(config))),
    TE.chainW(context =>
      pipe(
        context.config.GPIO_PINS,
        // Waters all specified pins sequentially in order
        TE.traverseSeqArray(pin =>
          pipe(
            gpio(pin, context.config.GPIO_DIRECTION),
            TE.chainW(g =>
              waterTheGarden(
                month,
                rainThreshold
              )({
                ...context,
                gpio: g
              })
            )
          )
        )
      )
    ),
    TE.chainW(() => gpioDestroy())
  )

pipe(
  D.create().toLocaleString("default", { month: "long" }),
  doWaterTheGarden,
  TE.bimap(console.dir, console.dir)
)()
