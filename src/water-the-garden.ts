import * as D from "fp-ts/lib/Date"
import * as TE from "fp-ts/lib/TaskEither"
import { pipe } from "fp-ts/lib/function"
import * as t from "io-ts"
import { getConfig } from "./config"
import { debug, error } from "./tools/logger"
import { getDefaultConsoleLogger } from "./tools/logger/console"
import { LoggerConfig } from "./tools/logger/types"
import { MqttEnvConfig } from "./tools/mqtt/types"
import { gpio, gpioDestroy } from "./tools/raspberry-pi/gpio"
import { getRainStore } from "./track-weather/rain-store"
import { waterTheGarden } from "./water/index"
import { WaterEnvConfig } from "./water/types"

process.on("exit", async () => await gpioDestroy()())
process.on("SIGTERM", async () => await gpioDestroy()())
process.on("SIGINT", async () => await gpioDestroy()())

const config = t.intersection([MqttEnvConfig, WaterEnvConfig, LoggerConfig])

const doWaterTheGarden = (month: string, rainThreshold?: 5 | undefined) =>
  pipe(
    TE.fromEither(getConfig(config)),
    TE.bindTo("config"),
    TE.bindW("logger", ({ config }) =>
      TE.right(getDefaultConsoleLogger({ config, time: D.now }))
    ),
    TE.bindW("rainStore", () => getRainStore()),
    TE.chainFirstW(context =>
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
        ),
        TE.chainIOK(() => debug("Done Watering")(context)),
        TE.orElse(e =>
          TE.fromIO(error("Error watering the garden", e)(context))
        )
      )
    ),
    TE.chainFirstW(() => gpioDestroy())
  )

pipe(
  D.create().toLocaleString("default", { month: "long" }),
  doWaterTheGarden
)()
