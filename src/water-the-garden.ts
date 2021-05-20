import * as D from 'fp-ts/lib/Date'
import { pipe } from 'fp-ts/lib/pipeable'
import * as TE from 'fp-ts/lib/TaskEither'
import * as t from 'io-ts'
import { getConfig } from './config'
import { MqttEnvConfig } from './tools/mqtt/types'
import { gpio } from './tools/raspberry-pi/gpio'
import { getRainStore } from './track-weather/rain-store'
import { waterTheGarden } from './water/index'
import { WaterEnvConfig } from './water/types'

const initWaterTheGarden = pipe(
  getRainStore(),
  TE.bindTo('rainStore'),
  TE.bindW('config', () => pipe(
    t.intersection([MqttEnvConfig, WaterEnvConfig]),
    getConfig, 
    TE.fromEither
  )),
  TE.bindW('gpio', ({config}) => gpio(config.GPIO_PIN, config.GPIO_DIRECTION)),
  TE.map(waterTheGarden)
)

pipe(
  initWaterTheGarden,
  TE.chainW(waterFn => pipe(
    D.create().toLocaleString('default', { month: 'long' }),
    waterFn
  )),
  TE.bimap(console.dir, console.dir)
)()