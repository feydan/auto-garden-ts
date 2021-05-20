import { constVoid } from 'fp-ts/lib/function'
import { pipe } from 'fp-ts/lib/pipeable'
import * as T from 'fp-ts/lib/Task'
import * as TE from 'fp-ts/lib/TaskEither'
import { gpio } from '../tools/raspberry-pi/gpio'
import { observe } from '../tools/utils'

const delay = <L>(seconds: number) => () => T.delay(seconds * 1000)(TE.fromIO<L, void>(constVoid))

pipe(
  gpio(26, 'out'),

  TE.map(observe(() => console.log('on'))),
  TE.chainFirstW(g => g.write(true)),
  TE.chainFirst(delay(2)),

  TE.map(observe(() => console.log('off'))),
  TE.chainFirstW(g => g.write(false)),
  TE.chainFirst(delay(2)),
  
  TE.map(observe(() => console.log('destroy'))),
  TE.chainW(g => g.destroy()),
  TE.bimap(console.dir, console.dir)
)()