import * as D from 'fp-ts/lib/Date'
import { pipe } from 'fp-ts/lib/function'
import * as TE from 'fp-ts/lib/TaskEither'
import * as t from 'io-ts'
import { getConfig } from './config'
import { MqttEnvConfig } from './tools/mqtt/types'
import { gpio, gpioDestroy } from './tools/raspberry-pi/gpio'
import { getRainStore } from './track-weather/rain-store'
import { waterTheGarden } from './water/index'
import { WaterEnvConfig } from './water/types'

process.on('exit', async () => await gpioDestroy()())
process.on('SIGTERM', async () => await gpioDestroy()())

const doWaterTheGarden = (month: string, rainThreshold?: 5 | undefined) => pipe(
  getRainStore(),
  TE.bindTo('rainStore'),
  TE.bindW('config', () => pipe(
    t.intersection([MqttEnvConfig, WaterEnvConfig]),
    getConfig, 
    TE.fromEither
  )),
  TE.chainW(context => pipe(
    context.config.GPIO_PINS,
    TE.traverseSeqArray(pin => pipe(
      gpio(pin, context.config.GPIO_DIRECTION),
      TE.chainW(g => waterTheGarden({
        ...context,
        gpio: g
      })(month, rainThreshold))
    )
  ))),
  TE.chainW(() => gpioDestroy())
)

pipe(
  D.create().toLocaleString('default', { month: 'long' }),
  doWaterTheGarden,
  TE.bimap(console.dir, console.dir)
)()