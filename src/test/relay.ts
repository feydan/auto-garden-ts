import { constVoid, pipe } from 'fp-ts/lib/function'
import * as T from 'fp-ts/lib/Task'
import * as TE from 'fp-ts/lib/TaskEither'
import { gpio, gpioDestroy } from '../tools/raspberry-pi/gpio'
import { observe } from '../tools/utils'

const delay = <L>(seconds: number) => () => T.delay(seconds * 1000)(TE.fromIO<L, void>(constVoid))

const testPin = (pin: number) =>
  pipe(
    console.log(`testing pin ${pin}`),
    () => gpio(pin, 'out'),

    TE.map(observe(() => console.log('on'))),
    TE.chainFirstW(g => g.write(true)),
    TE.chainFirst(delay(2)),

    TE.map(observe(() => console.log('off'))),
    TE.chainFirstW(g => g.write(false)),
    TE.chainFirst(delay(2)),
  )

pipe(
  [5, 6, 13, 26],
  TE.traverseArray(testPin),
  TE.chainW(() => gpioDestroy())
)()